# Sprint 3: Task Management - Frontend

## Overview
Create UI components for task calendar, task list, bulk assignment, and employee/admin task dashboards.

**Estimated Tasks:** 7 prompts
**Dependencies:** Sprint 2 completed

---

## Prompt 3.1: Task Calendar Component

### Context
Create a monthly calendar component that displays tasks for employees with color-coded indicators.

### Prompt
```
Create a new file src/components/phone-numbers/TaskCalendar.tsx with the following:

1. Interface:
   ```typescript
   interface TaskCalendarProps {
     employeeId: string;
     onDateSelect?: (date: Date) => void;
     onTaskClick?: (task: PhoneNumber) => void;
   }
   ```

2. Features:
   - Use react-day-picker (already installed) for the calendar
   - Use useEmployeeCalendarTasks hook to fetch tasks for the displayed month
   - Pass startDate as first day of month, endDate as last day of month
   - When month changes, update the date range

3. Visual indicators on each day:
   - Small colored dots below the date number
   - Blue dot if there are pending tasks
   - Yellow dot if there are in_progress tasks
   - Green dot if there are completed tasks
   - Show count tooltip on hover

4. Day click behavior:
   - When clicking a day with tasks, show a Popover with task list
   - Use Popover from shadcn/ui
   - Show task phone number, status badge, and quick complete button
   - Call onDateSelect callback

5. Styling:
   - RTL support (direction: rtl)
   - Use Arabic day/month names
   - Highlight today
   - Highlight days with overdue tasks in red

6. Loading state:
   - Show skeleton calendar while loading
   - Use animate-pulse for skeleton

7. Use these shadcn/ui components:
   - Card, CardContent, CardHeader, CardTitle
   - Popover, PopoverContent, PopoverTrigger
   - Badge
   - Button
   - ScrollArea (for task list in popover)

8. Export as default and named export.

Example day content renderer:
```tsx
const renderDayContent = (day: Date) => {
  const dateStr = format(day, 'yyyy-MM-dd');
  const dayData = calendarData?.find(d => d.date === dateStr);

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <span>{format(day, 'd')}</span>
      {dayData && (
        <div className="flex gap-0.5 mt-1">
          {dayData.counts.pending > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          )}
          {dayData.counts.inProgress > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          )}
          {dayData.counts.completed > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          )}
        </div>
      )}
    </div>
  );
};
```
```

---

## Prompt 3.2: Task List Component

### Context
Create a reusable task list component with filtering, sorting, and quick actions.

### Prompt
```
Create a new file src/components/phone-numbers/TaskList.tsx with the following:

1. Interface:
   ```typescript
   interface TaskListProps {
     tasks: PhoneNumber[];
     loading?: boolean;
     onTaskUpdate?: (taskId: string, updates: Partial<PhoneNumber>) => void;
     onTaskClick?: (task: PhoneNumber) => void;
     showFilters?: boolean;
     showPagination?: boolean;
     pageSize?: number;
     emptyMessage?: string;
   }
   ```

2. Filter controls (when showFilters=true):
   - Status filter: All, Pending, In Progress, Completed, Cancelled
   - Priority filter: All, Low, Medium, High, Urgent
   - Search input for phone number
   - Use Select components from shadcn/ui

3. Sorting:
   - Sort by due_date (default, ascending)
   - Sort by priority
   - Sort by status
   - Click column header to toggle sort direction

4. Table columns:
   - Phone number (with copy button)
   - Status (color-coded Badge)
   - Priority (color-coded Badge)
   - Due date (formatted, red if overdue)
   - Assigned to (employee name)
   - Actions (Complete, Notes, View)

5. Status badge colors:
   - pending: blue
   - in_progress: yellow
   - called: cyan
   - interested: green
   - not_interested: gray
   - callback: orange
   - converted: emerald
   - completed: green with checkmark
   - cancelled: red with strikethrough

6. Priority badge colors:
   - low: gray/slate
   - medium: blue
   - high: orange
   - urgent: red with pulse animation

7. Overdue indicator:
   - If due_date < today AND status not completed, show red background on row
   - Show "متأخر" badge next to due date

8. Pagination (when showPagination=true):
   - Use pageSize prop (default 10)
   - Show page numbers
   - Previous/Next buttons

9. Quick actions:
   - Complete button: calls onTaskUpdate with status='completed'
   - Notes button: opens small dialog to add notes
   - View button: calls onTaskClick

10. Loading state:
    - Show table skeleton with 5 rows
    - Shimmer animation

11. Empty state:
    - Show emptyMessage or default "لا توجد مهام"
    - Icon: ClipboardList from lucide-react

12. Use Table components from shadcn/ui.

13. RTL support throughout.
```

---

## Prompt 3.3: Bulk Assignment Component

### Context
Create a dialog component for assigning phone numbers to employees with random or targeted assignment modes.

### Prompt
```
Create a new file src/components/phone-numbers/BulkAssignment.tsx with the following:

1. Interface:
   ```typescript
   interface BulkAssignmentProps {
     batchId: string;
     unassignedCount: number;
     open: boolean;
     onOpenChange: (open: boolean) => void;
     onAssignmentComplete?: () => void;
   }
   ```

2. Use Dialog from shadcn/ui as the container.

3. Two tabs using Tabs component:

   **Tab 1: Random Assignment (التوزيع العشوائي)**
   - Multi-select for employees (fetch from profiles table where is_active=true)
   - Use a custom multi-select or Popover with checkboxes
   - Show selected count: "تم اختيار X موظف"
   - Due date picker using Calendar component (default: 7 days from now)
   - Priority selector (default: medium)
   - Preview section showing:
     - "سيتم توزيع {unassignedCount} رقم على {selectedCount} موظف"
     - "~{Math.ceil(unassignedCount/selectedCount)} رقم لكل موظف"
   - Assign button: calls useAssignPhoneNumbersRandom mutation
   - Disable button if no employees selected

   **Tab 2: Targeted Assignment (التعيين المحدد)**
   - Fetch phone numbers for the batch with assigned_employee_name field
   - Show table with columns:
     - Phone number
     - Name from file (assigned_employee_name)
     - Employee dropdown (select from profiles)
   - "Auto-match" button:
     - Match assigned_employee_name to profiles.full_name (case-insensitive, partial match)
     - Highlight matched rows in green
     - Highlight unmatched rows in yellow
   - Due date and priority pickers (same as random tab)
   - Assign button: calls useAssignPhoneNumbersTargeted mutation
   - Show count: "X من Y سيتم تعيينهم"

4. Loading states:
   - Show spinner on Assign button while mutation is pending
   - Disable all inputs during assignment

5. Success state:
   - Show success message with counts
   - Auto-close dialog after 2 seconds OR
   - Show "Done" button to close

6. Error handling:
   - Show error toast on failure
   - Keep dialog open for retry

7. Fetch employees using:
   ```typescript
   const { data: employees } = useQuery({
     queryKey: ['profiles', 'active'],
     queryFn: async () => {
       const { data } = await supabase
         .from('profiles')
         .select('user_id, full_name, department')
         .eq('is_active', true)
         .order('full_name');
       return data;
     }
   });
   ```

8. Arabic labels throughout. RTL layout.
```

---

## Prompt 3.4: My Tasks Page (Employee Dashboard)

### Context
Create the main task dashboard page for employees to view and manage their assigned tasks.

### Prompt
```
Create a new file src/pages/MyTasks.tsx with the following:

1. Use MainLayout wrapper.

2. Page header:
   - Title: "مهامي" (My Tasks)
   - Subtitle: "إدارة المهام والمكالمات المخصصة لك"

3. Layout using CSS Grid:
   ```tsx
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="lg:col-span-2">
       {/* Calendar */}
     </div>
     <div className="space-y-6">
       {/* Stats and Upcoming */}
     </div>
   </div>
   ```

4. Left section (2/3 width on large screens):
   - TaskCalendar component
   - Pass current user's ID from useAuth()
   - Handle onDateSelect to show task dialog

5. Right section (1/3 width):

   **Stats Cards Row:**
   - Use useTaskStats(userId) hook
   - Card 1: Pending tasks (blue icon, Phone)
   - Card 2: Completed today (green icon, CheckCircle)
   - Card 3: Overdue tasks (red icon, AlertCircle)
   - Show loading skeleton while fetching

   **Upcoming Tasks Section:**
   - Title: "المهام القادمة"
   - Use useUpcomingTasks(userId, 10) hook
   - List showing:
     - Phone number
     - Due date (relative: اليوم, غداً, or date)
     - Priority badge
     - Quick complete button
   - "View All" link to filtered task list
   - Empty state: "لا توجد مهام قادمة"

6. Task Detail Dialog (when clicking a task):
   - Dialog showing full task details
   - Phone number (large, copyable)
   - Current status with dropdown to change
   - Priority badge
   - Due date
   - Notes textarea
   - Call history (if available)
   - Save and Cancel buttons
   - Use useUpdateTaskStatus mutation on save

7. Day Tasks Dialog (when clicking calendar day):
   - Dialog with date as title
   - TaskList component filtered by that date
   - Close button

8. Get current user:
   ```typescript
   const { user } = useAuth();
   const userId = user?.id;
   ```

9. Loading state for entire page while user loads.

10. Route will be: /my-tasks
```

---

## Prompt 3.5: Admin Task Management Page

### Context
Create an admin overview page for managing all tasks across employees.

### Prompt
```
Create a new file src/pages/admin/TaskManagement.tsx with the following:

1. Use MainLayout wrapper.

2. Page header:
   - Title: "إدارة المهام"
   - Subtitle: "نظرة عامة على جميع المهام والتوزيع"

3. Stats row at top (4 cards):
   - Use useTaskStats() with no employeeId for aggregate stats
   - Card 1: Total tasks (blue)
   - Card 2: Pending + In Progress (yellow)
   - Card 3: Completed today (green)
   - Card 4: Overdue (red, highlighted)
   - Each card shows count and icon

4. Tabs component with 3 tabs:

   **Tab 1: All Tasks (جميع المهام)**
   - Full TaskList component with all tasks
   - Additional filter: Employee dropdown
   - Fetch all phone_numbers where assigned_to is not null
   - Include employee profile info in fetch
   - Bulk actions row:
     - Select all checkbox
     - "Mark as Completed" button
     - "Reassign" button (opens employee selector)

   **Tab 2: By Employee (حسب الموظف)**
   - Table showing employees with their task metrics
   - Columns:
     - Employee name
     - Department
     - Total tasks
     - Pending
     - In Progress
     - Completed
     - Completion Rate (percentage)
   - Sort by any column
   - Click row to filter All Tasks tab by that employee
   - Highlight employees with high overdue count

   **Tab 3: Workload (توزيع العمل)**
   - Simple bar chart showing tasks per employee
   - Use colored bars (can use div widths, no chart library needed)
   - Show employee name and count
   - Visual indicator for overloaded (> average * 1.5)
   - Visual indicator for underloaded (< average * 0.5)
   - "Rebalance" button (future feature - disabled with tooltip)

5. Fetch all tasks:
   ```typescript
   const { data: allTasks } = useQuery({
     queryKey: ['phone-numbers', 'all-tasks'],
     queryFn: async () => {
       const { data } = await supabase
         .from('phone_numbers')
         .select(`
           *,
           assigned_profile:profiles!assigned_to(full_name, department)
         `)
         .not('assigned_to', 'is', null)
         .order('due_date', { ascending: true });
       return data;
     }
   });
   ```

6. Loading states for each section.

7. Route: /admin/tasks
8. Requires admin access.
```

---

## Prompt 3.6: Update App Routes

### Context
Add the new pages to the application routes.

### Prompt
```
Read src/App.tsx and make the following changes:

1. Add imports for the new pages at the top with other page imports:
   ```typescript
   import MyTasks from "./pages/MyTasks";
   import TaskManagement from "./pages/admin/TaskManagement";
   ```

2. Add routes in the Protected Routes section (after /settings route):
   ```tsx
   <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
   ```

3. Add route in the Admin Routes section:
   ```tsx
   <Route path="/admin/tasks" element={<ProtectedRoute requireAdmin><TaskManagement /></ProtectedRoute>} />
   ```

Make sure the routes are properly indented and follow the existing pattern.
```

---

## Prompt 3.7: Update Sidebar Navigation

### Context
Add navigation items for the new task management pages.

### Prompt
```
Read src/components/layout/Sidebar.tsx and make the following changes:

1. Add imports for new icons at the top:
   ```typescript
   import { CheckSquare, ListTodo } from "lucide-react";
   ```
   (Add to existing lucide-react import)

2. Find the navigation items array (mainNavItems or similar) and add this item after the calendar/التقويم item:
   ```typescript
   {
     icon: CheckSquare,
     label: "مهامي",
     path: "/my-tasks",
   },
   ```

3. Find the admin navigation items array and add this item:
   ```typescript
   {
     icon: ListTodo,
     label: "إدارة المهام",
     path: "/admin/tasks",
     requireAdmin: true,
   },
   ```

4. Make sure the new items follow the same interface/structure as existing items.

The sidebar should now show:
- "مهامي" (My Tasks) for all users in the main section
- "إدارة المهام" (Task Management) for admins in the admin section
```

---

## Prompt 3.8: Enhance Phone Numbers Page

### Context
Integrate the bulk assignment component into the existing phone numbers management page.

### Prompt
```
Read src/pages/admin/PhoneNumbers.tsx and make the following changes:

1. Import the BulkAssignment component:
   ```typescript
   import { BulkAssignment } from "@/components/phone-numbers/BulkAssignment";
   ```

2. Add state for the assignment dialog:
   ```typescript
   const [assignDialogOpen, setAssignDialogOpen] = useState(false);
   const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
   const [selectedBatchUnassigned, setSelectedBatchUnassigned] = useState(0);
   ```

3. Add a function to open the assignment dialog:
   ```typescript
   const openAssignDialog = (batchId: string, unassignedCount: number) => {
     setSelectedBatchId(batchId);
     setSelectedBatchUnassigned(unassignedCount);
     setAssignDialogOpen(true);
   };
   ```

4. In the batch table/list, add an "Assign" button for each batch:
   - Show button only if batch has unassigned numbers
   - Button text: "توزيع"
   - Icon: Users from lucide-react
   - onClick: openAssignDialog(batch.id, unassignedCount)

5. Update the batch display to show assignment progress:
   - Add a column or badge showing: "X / Y معين" (X of Y assigned)
   - Or a progress bar showing assignment percentage

6. Add a "View Tasks" link/button for each batch:
   - Links to /admin/tasks with batch filter (or use query param)
   - Icon: ExternalLink from lucide-react

7. Add the BulkAssignment dialog at the end of the component:
   ```tsx
   {selectedBatchId && (
     <BulkAssignment
       batchId={selectedBatchId}
       unassignedCount={selectedBatchUnassigned}
       open={assignDialogOpen}
       onOpenChange={setAssignDialogOpen}
       onAssignmentComplete={() => {
         // Refetch batches
         queryClient.invalidateQueries(['phone-numbers']);
       }}
     />
   )}
   ```

8. After successful Word file upload, automatically open the assignment dialog:
   - In the upload success handler, call openAssignDialog with the new batch ID
```

---

## Verification Steps

After completing all prompts:

1. [ ] TaskCalendar displays correctly with task indicators
2. [ ] TaskList filters, sorts, and paginates correctly
3. [ ] BulkAssignment random mode works
4. [ ] BulkAssignment targeted mode works with auto-match
5. [ ] MyTasks page loads for regular users
6. [ ] TaskManagement page loads for admins only
7. [ ] Navigation items appear correctly based on role
8. [ ] Phone numbers page shows assignment button
9. [ ] All Arabic text displays correctly (RTL)
10. [ ] No console errors
11. [ ] Run `npm run build` successfully

---

## Next Sprint
Continue to **SPRINT_4_CHAT_COMMISSIONS.md** for chat attachments and commission stats.
