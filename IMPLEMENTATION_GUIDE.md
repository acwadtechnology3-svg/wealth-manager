# FIS Wealth Manager - Production Readiness Implementation Guide

This document contains all remaining implementation tasks with ready-to-use prompts for AI-assisted development. Each section is self-contained and can be executed independently.

---

## Table of Contents

1. [Sprint 2: Task Management - Backend](#sprint-2-task-management---backend)
2. [Sprint 3: Task Management - Frontend](#sprint-3-task-management---frontend)
3. [Sprint 4: Chat Attachments & Commissions](#sprint-4-chat-attachments--commissions)
4. [Sprint 5: Performance Optimization](#sprint-5-performance-optimization)
5. [Sprint 6: Production Hardening](#sprint-6-production-hardening)
6. [Scalability Considerations](#scalability-considerations)
7. [Verification Checklist](#verification-checklist)

---

## Sprint 2: Task Management - Backend

### Overview
Extend the existing phone_numbers system to support task management with calendar views, random/targeted assignment, and task tracking.

### Task 2.1: Database Migration

**Files to Create:**
- `supabase/migrations/20260126100000_add_task_management.sql`

**Prompt for AI:**
```
Create a Supabase migration file at supabase/migrations/20260126100000_add_task_management.sql that:

1. Adds these columns to the phone_numbers table:
   - task_type TEXT DEFAULT 'call' with CHECK constraint for ('call', 'follow_up', 'meeting', 'other')
   - priority TEXT DEFAULT 'medium' with CHECK constraint for ('low', 'medium', 'high', 'urgent')
   - due_date TIMESTAMP WITH TIME ZONE (nullable)
   - completed_at TIMESTAMP WITH TIME ZONE (nullable)

2. Updates the call_status CHECK constraint to include these values:
   ('pending', 'in_progress', 'called', 'interested', 'not_interested', 'callback', 'converted', 'completed', 'cancelled')

3. Creates these performance indexes:
   - idx_phone_numbers_due_date on due_date WHERE due_date IS NOT NULL
   - idx_phone_numbers_assigned_to_due_date on (assigned_to, due_date)
   - idx_phone_numbers_status_assigned on (call_status, assigned_to)

4. Adds RLS policies for:
   - Employees can view their own assigned tasks
   - Employees can update status/notes on their assigned tasks
   - Admins can manage all tasks

Use IF NOT EXISTS and DROP CONSTRAINT IF EXISTS for idempotency.
```

**Apply Migration Prompt:**
```
Apply this migration to the Supabase database using the mcp__supabase__apply_migration tool with name "add_task_management".
```

---

### Task 2.2: API Layer Updates

**Files to Modify:**
- `src/api/phoneNumbers.ts`

**Prompt for AI:**
```
Read src/api/phoneNumbers.ts and add these new functions to the phoneNumbersApi object:

1. assignPhoneNumbersRandom(batchId: string, employeeIds: string[], options?: { dueDays?: number, priority?: string })
   - Fetches all unassigned phone numbers from the batch
   - Distributes them evenly across employees using round-robin
   - Sets due_date to options.dueDays days from now (default 7)
   - Sets priority (default 'medium')
   - Updates phone_numbers in chunks of 100 for performance
   - Returns { assigned: number, perEmployee: Record<string, number> }

2. assignPhoneNumbersTargeted(batchId: string, assignments: Array<{ phoneNumberId: string, employeeId: string }>, options?: { dueDays?: number, priority?: string })
   - Assigns specific phone numbers to specific employees
   - Sets due_date and priority
   - Uses batch update for performance
   - Returns { assigned: number }

3. getEmployeeTaskCalendar(employeeId: string, startDate: string, endDate: string)
   - Fetches all tasks for an employee within date range
   - Groups by due_date
   - Returns array of { date: string, tasks: PhoneNumber[], counts: { pending: number, completed: number } }

4. getUpcomingTasks(employeeId: string, limit: number = 10)
   - Fetches next N tasks ordered by due_date ASC
   - Only pending/in_progress status
   - Returns PhoneNumber[]

5. getTaskStats(employeeId?: string)
   - If employeeId provided, stats for that employee
   - Otherwise, aggregate stats
   - Returns { total: number, pending: number, inProgress: number, completed: number, overdue: number, completedToday: number }

6. updateTaskStatus(id: string, updates: { call_status?: string, notes?: string, completed_at?: string })
   - Updates the task
   - If status is 'completed', sets completed_at to now
   - Returns updated PhoneNumber

Use proper TypeScript types and error handling with ApiError class.
```

---

### Task 2.3: React Query Hooks

**Files to Modify:**
- `src/hooks/queries/usePhoneNumbers.ts`

**Prompt for AI:**
```
Read src/hooks/queries/usePhoneNumbers.ts and add these new hooks:

1. useEmployeeCalendarTasks(employeeId: string | undefined, startDate: string, endDate: string)
   - Uses phoneNumbersApi.getEmployeeTaskCalendar
   - Query key: ['phone-numbers', 'calendar', employeeId, startDate, endDate]
   - Enabled only when employeeId is defined
   - staleTime: 2 minutes

2. useUpcomingTasks(employeeId: string | undefined, limit?: number)
   - Uses phoneNumbersApi.getUpcomingTasks
   - Query key: ['phone-numbers', 'upcoming', employeeId, limit]
   - Enabled only when employeeId is defined
   - staleTime: 1 minute

3. useTaskStats(employeeId?: string)
   - Uses phoneNumbersApi.getTaskStats
   - Query key: ['phone-numbers', 'stats', employeeId]
   - staleTime: 30 seconds

4. useAssignPhoneNumbersRandom()
   - Mutation using phoneNumbersApi.assignPhoneNumbersRandom
   - Invalidates ['phone-numbers'] queries on success
   - Shows success/error toast

5. useAssignPhoneNumbersTargeted()
   - Mutation using phoneNumbersApi.assignPhoneNumbersTargeted
   - Invalidates ['phone-numbers'] queries on success
   - Shows success/error toast

6. useUpdateTaskStatus()
   - Mutation using phoneNumbersApi.updateTaskStatus
   - Invalidates ['phone-numbers'] queries on success
   - Shows success toast

Follow existing patterns in the file for consistency.
```

---

### Task 2.4: TypeScript Types

**Files to Modify:**
- `src/types/database.ts`

**Prompt for AI:**
```
Read src/types/database.ts and add/update these types:

1. Add TaskType:
   export type TaskType = 'call' | 'follow_up' | 'meeting' | 'other';

2. Add TaskPriority:
   export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

3. Add TaskStatus (extend existing CallStatus if present):
   export type TaskStatus = 'pending' | 'in_progress' | 'called' | 'interested' | 'not_interested' | 'callback' | 'converted' | 'completed' | 'cancelled';

4. Update PhoneNumber interface to include:
   - task_type: TaskType;
   - priority: TaskPriority;
   - due_date: string | null;
   - completed_at: string | null;

5. Add TaskCalendarDay:
   export interface TaskCalendarDay {
     date: string;
     tasks: PhoneNumber[];
     counts: {
       pending: number;
       inProgress: number;
       completed: number;
     };
   }

6. Add TaskStats:
   export interface TaskStats {
     total: number;
     pending: number;
     inProgress: number;
     completed: number;
     overdue: number;
     completedToday: number;
   }

7. Add AssignmentResult:
   export interface AssignmentResult {
     assigned: number;
     perEmployee?: Record<string, number>;
   }
```

---

## Sprint 3: Task Management - Frontend

### Overview
Create UI components for task calendar, task list, bulk assignment, and employee task dashboard.

### Task 3.1: Task Calendar Component

**Files to Create:**
- `src/components/phone-numbers/TaskCalendar.tsx`

**Prompt for AI:**
```
Create src/components/phone-numbers/TaskCalendar.tsx - a monthly calendar component for viewing tasks:

Requirements:
1. Props interface:
   - employeeId: string
   - onDateSelect?: (date: Date) => void
   - onTaskClick?: (task: PhoneNumber) => void

2. Use the existing react-day-picker library (already installed) for calendar
3. Use useEmployeeCalendarTasks hook to fetch tasks for displayed month
4. Display task counts on each day using colored badges:
   - Blue badge: pending count
   - Yellow badge: in_progress count
   - Green badge: completed count
5. When clicking a day, show a popover/dialog with task list for that day
6. Include quick actions: mark as complete, view details
7. Support RTL layout (Arabic)
8. Add loading skeleton while fetching
9. Style using existing Tailwind classes and shadcn/ui components

Use these existing components from shadcn/ui:
- Card, CardContent, CardHeader, CardTitle
- Button
- Badge
- Popover, PopoverContent, PopoverTrigger
- ScrollArea

Example calendar day render:
<div className="relative">
  {day}
  <div className="absolute bottom-0 left-0 right-0 flex gap-1 justify-center">
    {pendingCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
    {completedCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
  </div>
</div>
```

---

### Task 3.2: Task List Component

**Files to Create:**
- `src/components/phone-numbers/TaskList.tsx`

**Prompt for AI:**
```
Create src/components/phone-numbers/TaskList.tsx - a filterable list of tasks:

Requirements:
1. Props interface:
   - tasks: PhoneNumber[]
   - loading?: boolean
   - onTaskUpdate?: (taskId: string, updates: Partial<PhoneNumber>) => void
   - onTaskClick?: (task: PhoneNumber) => void
   - showFilters?: boolean
   - emptyMessage?: string

2. Features:
   - Filter by status (all, pending, in_progress, completed)
   - Filter by priority (all, low, medium, high, urgent)
   - Sort by due_date or priority
   - Search by phone number
   - Pagination (10 items per page)

3. Each task row shows:
   - Phone number
   - Assigned employee name
   - Status badge (color-coded)
   - Priority badge
   - Due date with overdue indicator (red if past)
   - Quick actions: Complete, Add Notes, View

4. Use existing Table components from shadcn/ui
5. Support RTL layout
6. Loading skeleton when loading=true
7. Empty state with emptyMessage

Color coding:
- Status: pending=blue, in_progress=yellow, completed=green, cancelled=gray
- Priority: low=gray, medium=blue, high=orange, urgent=red
- Overdue: red text/background for past due dates
```

---

### Task 3.3: Bulk Assignment Component

**Files to Create:**
- `src/components/phone-numbers/BulkAssignment.tsx`

**Prompt for AI:**
```
Create src/components/phone-numbers/BulkAssignment.tsx - a dialog for assigning phone numbers to employees:

Requirements:
1. Props interface:
   - batchId: string
   - phoneNumbers: PhoneNumber[] (unassigned numbers from batch)
   - open: boolean
   - onOpenChange: (open: boolean) => void
   - onAssignmentComplete?: () => void

2. Two assignment modes (tabs):

   A. Random Assignment Mode:
   - Multi-select dropdown for employees (fetch from profiles table)
   - Algorithm selection: "round-robin" (equal distribution)
   - Due date picker (default: 7 days from now)
   - Priority selector (default: medium)
   - Preview showing: X numbers will be assigned to Y employees (~Z each)
   - Assign button triggers useAssignPhoneNumbersRandom mutation

   B. Targeted Assignment Mode:
   - Table showing phone numbers with employee name from file
   - Auto-match: button to match names to profiles.full_name
   - Manual mapping: dropdown per row to select employee
   - Show unmatched names in red
   - Due date and priority pickers
   - Assign button triggers useAssignPhoneNumbersTargeted mutation

3. Use Dialog from shadcn/ui
4. Show loading state during assignment
5. Show success message with counts after assignment
6. Error handling with toast notifications

Use existing hooks:
- useAssignPhoneNumbersRandom
- useAssignPhoneNumbersTargeted
- Query profiles table for employee list
```

---

### Task 3.4: My Tasks Page (Employee Dashboard)

**Files to Create:**
- `src/pages/MyTasks.tsx`

**Prompt for AI:**
```
Create src/pages/MyTasks.tsx - employee task dashboard page:

Requirements:
1. Use MainLayout wrapper
2. Page title: "مهامي" (My Tasks)

3. Layout (grid):
   - Left column (2/3): TaskCalendar component
   - Right column (1/3):
     - Stats cards (pending, completed today, overdue)
     - Upcoming tasks list (next 7 days)

4. Stats cards showing:
   - Total pending tasks (blue)
   - Completed today (green)
   - Overdue tasks (red)
   - Use useTaskStats hook

5. Upcoming tasks section:
   - Use useUpcomingTasks hook
   - Show next 10 tasks
   - Quick complete button
   - Click to view details

6. When clicking a calendar day:
   - Show dialog with tasks for that day
   - TaskList component filtered by date
   - Allow status updates

7. Task detail dialog:
   - Phone number, notes, status, priority
   - Status update dropdown
   - Notes textarea
   - Save/Cancel buttons

8. Use useAuth to get current user ID
9. Loading states for all sections
10. Empty states with helpful messages

Route: /my-tasks
Permission: All authenticated users
```

---

### Task 3.5: Admin Task Management Page

**Files to Create:**
- `src/pages/admin/TaskManagement.tsx`

**Prompt for AI:**
```
Create src/pages/admin/TaskManagement.tsx - admin overview of all tasks:

Requirements:
1. Use MainLayout wrapper
2. Page title: "إدارة المهام" (Task Management)

3. Stats row at top:
   - Total tasks
   - Pending tasks
   - In progress
   - Completed today
   - Overdue (highlighted red)

4. Tabs:
   A. All Tasks Tab:
      - Full TaskList with all filters
      - Filter by employee
      - Bulk actions (assign, update status)

   B. By Employee Tab:
      - Table showing employees with task counts
      - Columns: Employee name, Total, Pending, In Progress, Completed, Completion Rate
      - Click to view employee's tasks

   C. Workload Tab:
      - Bar chart showing tasks per employee
      - Identify overloaded/underloaded employees
      - Rebalance button (future feature)

5. Use useTaskStats with no employeeId for aggregate stats
6. Fetch all phone_numbers with assigned_to populated
7. Admin-only access

Route: /admin/tasks
Permission: requireAdmin
```

---

### Task 3.6: Update Navigation

**Files to Modify:**
- `src/App.tsx`
- `src/components/layout/Sidebar.tsx`

**Prompt for AI:**
```
1. Read src/App.tsx and add these routes:
   - /my-tasks -> MyTasks component (ProtectedRoute, all users)
   - /admin/tasks -> TaskManagement component (ProtectedRoute requireAdmin)

   Import the new pages:
   import MyTasks from "./pages/MyTasks";
   import TaskManagement from "./pages/admin/TaskManagement";

2. Read src/components/layout/Sidebar.tsx and add navigation items:

   In the main navigation section, add after calendar:
   {
     icon: CheckSquare,
     label: "مهامي",
     path: "/my-tasks",
   }

   In the admin section, add:
   {
     icon: ListTodo,
     label: "إدارة المهام",
     path: "/admin/tasks",
     requireAdmin: true,
   }

   Import icons: CheckSquare, ListTodo from lucide-react
```

---

### Task 3.7: Enhance Phone Numbers Page

**Files to Modify:**
- `src/pages/admin/PhoneNumbers.tsx`

**Prompt for AI:**
```
Read src/pages/admin/PhoneNumbers.tsx and enhance the upload flow:

1. After successful Word file upload and parsing, show the BulkAssignment dialog
   - Pass the parsed phone numbers to BulkAssignment
   - Pass the batchId after batch creation

2. Add a new "Assign" button in the batch table actions
   - When clicked, opens BulkAssignment dialog for that batch
   - Only shows for batches with unassigned numbers

3. Add columns to the batch table:
   - Assigned count / Total count
   - "View Tasks" button that links to /admin/tasks filtered by batch

4. Update the batch card to show assignment progress bar

5. Import and use the BulkAssignment component
```

---

## Sprint 4: Chat Attachments & Commissions

### Task 4.1: Chat Attachments Migration

**Files to Create:**
- `supabase/migrations/20260126200000_add_chat_attachments.sql`

**Prompt for AI:**
```
Create a Supabase migration for chat attachments:

1. Add columns to chat_messages table:
   - attachment_url TEXT (nullable)
   - attachment_name TEXT (nullable)
   - attachment_type TEXT (nullable) - mime type
   - attachment_size INTEGER (nullable) - bytes

2. Create Supabase Storage bucket 'chat-attachments' if not exists

3. Add storage policies:
   - Authenticated users can upload to chat-attachments
   - Users can read attachments from conversations they're part of

4. Add index on attachment_url for faster queries

Apply using mcp__supabase__apply_migration.
```

---

### Task 4.2: Chat API Updates

**Files to Modify:**
- `src/api/chat.ts` (create if not exists)

**Prompt for AI:**
```
Create or update src/api/chat.ts with file attachment support:

1. Add uploadAttachment(file: File, conversationId: string) function:
   - Validates file type (images, documents, PDFs)
   - Validates file size (max 10MB)
   - Uploads to chat-attachments bucket with path: {conversationId}/{timestamp}-{filename}
   - Returns { url: string, name: string, type: string, size: number }

2. Add getAttachmentUrl(path: string) function:
   - Creates signed URL for attachment (1 hour expiry)
   - Returns signed URL string

3. Add deleteAttachment(path: string) function:
   - Removes file from storage
   - Used when message is deleted

4. Update sendMessage function (if exists) to include attachment fields

Use proper error handling with ApiError class.
```

---

### Task 4.3: Update Chat Page

**Files to Modify:**
- `src/pages/Chat.tsx`

**Prompt for AI:**
```
Read src/pages/Chat.tsx and update it to support file attachments:

1. Remove disabled phone and video call buttons completely

2. Enable the file attachment button (Paperclip icon):
   - Add hidden file input
   - On click, trigger file input
   - Accept: image/*, .pdf, .doc, .docx, .xls, .xlsx

3. When file selected:
   - Show file preview (image thumbnail or file icon)
   - Show file name and size
   - Add remove button
   - Store in local state

4. When sending message with attachment:
   - First upload file using uploadAttachment
   - Then send message with attachment fields
   - Show upload progress

5. Display attachments in messages:
   - Images: thumbnail with lightbox on click
   - Documents: icon + filename, click to download
   - Use getAttachmentUrl for signed URLs

6. Add loading state during upload
7. Error handling for upload failures
8. Max file size warning (10MB)

Keep emoji button disabled for now.
```

---

### Task 4.4: Commission Stats API

**Files to Create/Modify:**
- `src/api/commissions.ts`

**Prompt for AI:**
```
Read src/api/commissions.ts (create if not exists) and add:

1. getCommissionStats() function:
   - Query commissions table
   - Calculate total commissions (sum of amount)
   - Group by status if applicable
   - Return { total: number, pending: number, paid: number, thisMonth: number }

2. getEmployeeCommissionStats(employeeId: string) function:
   - Same as above but filtered by employee
   - Return { total: number, pending: number, paid: number, thisMonth: number }

3. getCommissionTotals() function:
   - Simple aggregate of all commissions
   - Return single number for total

Handle case where commissions table might not exist or be empty.
Use proper error handling.
```

---

### Task 4.5: Commission Stats Hook

**Files to Modify:**
- `src/hooks/queries/useCommissions.ts`

**Prompt for AI:**
```
Read src/hooks/queries/useCommissions.ts (create if not exists) and add:

1. useCommissionStats(employeeId?: string) hook:
   - Uses getCommissionStats or getEmployeeCommissionStats based on employeeId
   - Query key: ['commissions', 'stats', employeeId]
   - staleTime: 5 minutes
   - Returns query result with stats data

2. useCommissionTotals() hook:
   - Uses getCommissionTotals
   - Query key: ['commissions', 'totals']
   - staleTime: 5 minutes
   - Returns total commission amount

Follow existing hook patterns in the codebase.
```

---

### Task 4.6: Update Employees Page

**Files to Modify:**
- `src/pages/Employees.tsx`

**Prompt for AI:**
```
Read src/pages/Employees.tsx and update the commissions stats card:

Find the section showing "0K" with "قريباً" (around line 468) and replace it:

1. Import useCommissionTotals hook
2. Call the hook to get total commissions
3. Replace the hardcoded "0K" with:
   - Loading skeleton while fetching
   - Formatted number when loaded (e.g., "125,000 ج.م")
   - Error state if query fails

4. Remove the "قريباً" text
5. Format large numbers with Arabic locale (toLocaleString('ar-EG'))
6. Add thousand separator and currency suffix

Example:
{isLoading ? (
  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
) : (
  <p className="text-2xl font-bold">
    {(totals || 0).toLocaleString('ar-EG')} ج.م
  </p>
)}
```

---

## Sprint 5: Performance Optimization

### Task 5.1: Lazy Loading Routes

**Files to Modify:**
- `src/App.tsx`

**Prompt for AI:**
```
Read src/App.tsx and implement lazy loading for all page components:

1. Replace all static imports with lazy imports:

   const Index = lazy(() => import("./pages/Index"));
   const Employees = lazy(() => import("./pages/Employees"));
   const Clients = lazy(() => import("./pages/Clients"));
   // ... all other pages

2. Create a LoadingSpinner component inline or import from components:
   const LoadingSpinner = () => (
     <div className="flex min-h-screen items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
     </div>
   );

3. Wrap the Routes in Suspense:
   <Suspense fallback={<LoadingSpinner />}>
     <Routes>
       {/* all routes */}
     </Routes>
   </Suspense>

4. Import lazy and Suspense from React:
   import { lazy, Suspense } from "react";

5. Import Loader2 from lucide-react

This will split the bundle and load pages on demand.
```

---

### Task 5.2: Loading Spinner Component

**Files to Create:**
- `src/components/LoadingSpinner.tsx`

**Prompt for AI:**
```
Create src/components/LoadingSpinner.tsx:

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

Features:
1. Configurable size (sm=4, md=8, lg=12 for icon size)
2. fullScreen mode: centers in viewport with min-h-screen
3. Optional loading message below spinner
4. Use Loader2 icon from lucide-react with animate-spin
5. Use primary color for spinner

Export as default and named export.
```

---

### Task 5.3: Vite Build Optimization

**Files to Modify:**
- `vite.config.ts`

**Prompt for AI:**
```
Read vite.config.ts and add build optimizations:

1. Add rollupOptions for manual chunks:
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'react-vendor': ['react', 'react-dom', 'react-router-dom'],
           'query-vendor': ['@tanstack/react-query'],
           'supabase-vendor': ['@supabase/supabase-js'],
           'ui-vendor': [
             '@radix-ui/react-dialog',
             '@radix-ui/react-dropdown-menu',
             '@radix-ui/react-select',
             '@radix-ui/react-tabs',
             '@radix-ui/react-tooltip',
           ],
         },
       },
     },
     chunkSizeWarningLimit: 1000,
   },

2. Add terser minification (if not present):
   build: {
     minify: 'terser',
     terserOptions: {
       compress: {
         drop_console: true,
         drop_debugger: true,
       },
     },
   },

3. Add source map for production debugging:
   build: {
     sourcemap: 'hidden', // or true for debugging
   }

Merge these with existing build config.
```

---

### Task 5.4: React Query Persistence

**Files to Create:**
- `src/lib/queryPersistence.ts`

**Files to Modify:**
- `src/App.tsx`

**Prompt for AI:**
```
1. First, check if @tanstack/query-sync-storage-persister is installed. If not, note that it needs to be installed:
   npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client

2. Create src/lib/queryPersistence.ts:

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'fis-query-cache',
});

// Queries to persist (user settings, profile, etc.)
export const persistedQueryKeys = [
  'user-settings',
  'app-settings',
  'profile',
];

// Check if query should be persisted
export const shouldPersistQuery = (queryKey: unknown) => {
  if (Array.isArray(queryKey)) {
    return persistedQueryKeys.some(key => queryKey[0] === key);
  }
  return false;
};

3. Update src/App.tsx to use PersistQueryClientProvider:

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister } from '@/lib/queryPersistence';

// Replace QueryClientProvider with:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: queryPersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Only persist specific queries
        return query.state.status === 'success' &&
               shouldPersistQuery(query.queryKey);
      },
    },
  }}
>
  {/* rest of app */}
</PersistQueryClientProvider>
```

---

### Task 5.5: Optimize Large Lists with Memoization

**Files to Modify:**
- `src/pages/Employees.tsx`
- `src/pages/Clients.tsx`

**Prompt for AI:**
```
Read src/pages/Employees.tsx and src/pages/Clients.tsx and add memoization:

1. Wrap table row components with React.memo():
   const EmployeeRow = memo(({ employee, onEdit, onDelete }) => {
     // existing row JSX
   });

2. Memoize filtered/sorted data with useMemo:
   const filteredEmployees = useMemo(() => {
     return employees
       .filter(e => /* filter logic */)
       .sort((a, b) => /* sort logic */);
   }, [employees, searchQuery, sortField, sortDirection]);

3. Memoize callbacks with useCallback:
   const handleEdit = useCallback((id: string) => {
     // edit logic
   }, [/* dependencies */]);

4. Add key props to all list items (should already exist)

5. For pagination, only render visible items:
   const paginatedData = useMemo(() => {
     const start = (page - 1) * pageSize;
     return filteredData.slice(start, start + pageSize);
   }, [filteredData, page, pageSize]);

Import memo, useMemo, useCallback from React.
```

---

### Task 5.6: API Query Optimization

**Files to Modify:**
- `src/api/clients.ts`
- `src/api/employees.ts` (if exists)

**Prompt for AI:**
```
Read the API files and optimize queries:

1. Use .select() with specific columns instead of '*':

   // Before:
   .select('*')

   // After:
   .select('id, full_name, email, phone, status, created_at')

2. Add pagination to list queries:

   async list(params?: { page?: number, pageSize?: number, ... }) {
     const page = params?.page ?? 1;
     const pageSize = params?.pageSize ?? 20;
     const start = (page - 1) * pageSize;
     const end = start + pageSize - 1;

     const { data, error, count } = await supabase
       .from('table')
       .select('columns', { count: 'exact' })
       .range(start, end);

     return { data, total: count, page, pageSize };
   }

3. Add index hints for common queries (via order/filter):
   - Order by indexed columns
   - Filter by indexed columns first

4. For joined queries, only select needed fields from related tables:
   .select(`
     id, name, status,
     assigned_to:profiles!assigned_to(id, full_name)
   `)
```

---

## Sprint 6: Production Hardening

### Task 6.1: Input Validation with Zod

**Files to Create:**
- `src/lib/validation.ts`

**Prompt for AI:**
```
Create src/lib/validation.ts with Zod schemas for common validations:

import { z } from 'zod';

// User input schemas
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح');

export const phoneSchema = z.string()
  .regex(/^01[0-9]{9}$/, 'رقم الهاتف غير صالح');

export const egyptianNationalIdSchema = z.string()
  .regex(/^[0-9]{14}$/, 'الرقم القومي يجب أن يكون 14 رقم');

export const passwordSchema = z.string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم');

export const nameSchema = z.string()
  .min(2, 'الاسم قصير جداً')
  .max(100, 'الاسم طويل جداً');

// File upload schemas
export const imageFileSchema = z.object({
  type: z.string().refine(
    type => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
    'نوع الملف غير مدعوم'
  ),
  size: z.number().max(5 * 1024 * 1024, 'حجم الملف يجب أن يكون أقل من 5 ميجا'),
});

export const documentFileSchema = z.object({
  type: z.string().refine(
    type => [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(type),
    'نوع الملف غير مدعوم'
  ),
  size: z.number().max(10 * 1024 * 1024, 'حجم الملف يجب أن يكون أقل من 10 ميجا'),
});

// Form schemas
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const clientFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  national_id: egyptianNationalIdSchema.optional().or(z.literal('')),
});

// Validation helper
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return result.data;
}
```

---

### Task 6.2: Performance Monitoring

**Files to Create:**
- `src/lib/performance.ts`

**Files to Modify:**
- `src/main.tsx`

**Prompt for AI:**
```
1. Create src/lib/performance.ts:

import { onCLS, onFID, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';
import { isProduction } from '@/lib/env';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

async function sendMetric(metric: Metric) {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  };

  // Only log to database in production
  if (isProduction) {
    try {
      await supabase.from('performance_metrics').insert({
        metric_name: metric.name,
        metric_value: metric.value,
        rating: metric.rating,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      // Silently fail - don't impact user experience
    }
  } else {
    console.log('[Performance]', performanceMetric);
  }
}

export function initPerformanceMonitoring() {
  onCLS(sendMetric);
  onFID(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}

2. Note: web-vitals needs to be installed:
   npm install web-vitals

3. Create migration for performance_metrics table:

   CREATE TABLE IF NOT EXISTS public.performance_metrics (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     metric_name TEXT NOT NULL,
     metric_value DOUBLE PRECISION NOT NULL,
     rating TEXT,
     page_url TEXT,
     user_agent TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE INDEX idx_performance_metrics_name_created
     ON performance_metrics(metric_name, created_at DESC);

4. Update src/main.tsx to initialize performance monitoring:

   import { initPerformanceMonitoring } from '@/lib/performance';

   // After createRoot().render()
   initPerformanceMonitoring();
```

---

### Task 6.3: Security Headers

**Files to Create:**
- `public/_headers` (for Netlify/Cloudflare)
- Or configure in hosting platform

**Prompt for AI:**
```
Create security headers configuration:

1. For Netlify, create public/_headers:

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;

2. For Vercel, create vercel.json:

{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}

3. Update vite.config.ts for dev server headers:

server: {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
  },
},
```

---

### Task 6.4: Rate Limiting for File Uploads

**Files to Modify:**
- `src/api/documents.ts`
- `src/api/posters.ts`

**Prompt for AI:**
```
Add client-side rate limiting to file upload functions:

1. Create a simple rate limiter utility in src/lib/rateLimiter.ts:

interface RateLimitState {
  count: number;
  resetTime: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const state = rateLimitStates.get(key);

  if (!state || now > state.resetTime) {
    rateLimitStates.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (state.count >= limit) {
    return false;
  }

  state.count++;
  return true;
}

export function getRateLimitError(windowMs: number): string {
  const seconds = Math.ceil(windowMs / 1000);
  return `تم تجاوز الحد المسموح. يرجى الانتظار ${seconds} ثانية.`;
}

2. Apply to upload functions in documents.ts and posters.ts:

import { checkRateLimit, getRateLimitError } from '@/lib/rateLimiter';

async uploadFile(file: File, ...args) {
  // Rate limit: 5 uploads per minute per user
  if (!checkRateLimit('upload', 5, 60000)) {
    throw new ApiError(getRateLimitError(60000), 'RATE_LIMITED');
  }

  // ... existing upload logic
}
```

---

## Scalability Considerations

### Database Indexes

**Prompt for AI:**
```
Create a migration to add performance indexes for scalability:

supabase/migrations/20260126300000_add_performance_indexes.sql

-- Phone numbers / Tasks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_batch_status
  ON phone_numbers(batch_id, call_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_assigned_status
  ON phone_numbers(assigned_to, call_status) WHERE assigned_to IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_due_date_status
  ON phone_numbers(due_date, call_status) WHERE due_date IS NOT NULL;

-- Clients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_assigned_status
  ON clients(assigned_to, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_at
  ON clients(created_at DESC);

-- Chat messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conversation_created
  ON chat_messages(conversation_id, created_at DESC);

-- Profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_department_active
  ON profiles(department, is_active) WHERE is_active = true;

-- Audit logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
  ON audit_log(user_id, created_at DESC);

-- Application logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_logs_level_created
  ON application_logs(level, created_at DESC);
```

---

### Connection Pooling

**Prompt for AI:**
```
For high concurrency, ensure Supabase connection pooling is configured:

1. In Supabase dashboard, go to Settings > Database
2. Enable connection pooling (PgBouncer)
3. Use the pooler connection string for the application

4. Update src/integrations/supabase/client.ts to handle reconnection:

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'fis-wealth-manager',
    },
  },
  db: {
    schema: 'public',
  },
  // Realtime configuration for scalability
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

### Caching Strategy

**Prompt for AI:**
```
Document the caching strategy for the team:

## Caching Layers

### 1. React Query Cache (Client-Side)
- Default staleTime: 5 minutes
- gcTime: 30 minutes
- Persistent cache for user settings (24 hours)

### 2. Supabase Edge Cache
- Static data cached at edge
- Use .select() with specific columns
- Avoid SELECT * queries

### 3. Browser Cache
- Static assets cached via Vite
- Service worker for offline support (future)

### 4. Database Query Cache
- PostgreSQL query plan caching
- Prepared statements via Supabase

## Query Optimization Rules
1. Always use pagination for lists (max 50 items)
2. Use specific column selection
3. Add appropriate indexes for filters
4. Use optimistic updates for better UX
5. Prefetch predictable navigation
```

---

## Verification Checklist

### Functionality
- [ ] No mock data present in any file
- [ ] System settings load from database
- [ ] Commissions show real calculated values
- [ ] Chat file attachments work
- [ ] Admin can upload Word documents
- [ ] Phone numbers assign randomly across employees
- [ ] Phone numbers assign to specific employees by name
- [ ] Employees see tasks in calendar view
- [ ] Task completion updates correctly
- [ ] All navigation items work

### Performance
- [ ] Initial bundle < 800KB gzipped
- [ ] Code splitting active (check Network tab)
- [ ] Lazy loading works for routes
- [ ] React Query cache persists
- [ ] No unnecessary re-renders
- [ ] Large lists paginated
- [ ] Lighthouse score > 85

### Production Readiness
- [ ] Error boundary catches errors
- [ ] Internal logging active
- [ ] No console.log in production
- [ ] Security headers present
- [ ] Input validation on all forms
- [ ] File upload validation works
- [ ] Performance metrics tracked
- [ ] Environment configs correct
- [ ] RLS policies enforced

### Scalability
- [ ] Database indexes created
- [ ] Connection pooling enabled
- [ ] Pagination implemented
- [ ] Query optimization done
- [ ] Rate limiting in place

---

## Quick Reference: Package Installation

```bash
# Required packages (if not installed)
npm install web-vitals
npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client

# Development tools
npm install -D terser
```

---

## Deployment Checklist

1. [ ] All migrations applied to production database
2. [ ] Environment variables set in hosting platform
3. [ ] Storage buckets created with proper policies
4. [ ] Security headers configured
5. [ ] Performance monitoring enabled
6. [ ] Error tracking connected
7. [ ] Backup strategy in place
8. [ ] SSL/TLS configured
9. [ ] Domain and DNS configured
10. [ ] CDN configured (if needed)

---

*Document generated for FIS Wealth Manager production readiness implementation.*
*Last updated: 2026-01-25*
