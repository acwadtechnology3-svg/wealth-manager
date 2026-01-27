# Sprint 2: Task Management - Backend

## Overview
Extend the existing phone_numbers system to support task management with calendar views, random/targeted assignment, and task tracking.

**Estimated Tasks:** 4 prompts
**Dependencies:** Sprint 1 completed

---

## Prompt 2.1: Database Migration

### Context
We need to add task management columns to the phone_numbers table and create proper indexes for performance.

### Prompt
```
Create a Supabase migration file at supabase/migrations/20260126100000_add_task_management.sql with the following:

1. Add these columns to the public.phone_numbers table:
   - task_type TEXT DEFAULT 'call' with CHECK constraint for values: 'call', 'follow_up', 'meeting', 'other'
   - priority TEXT DEFAULT 'medium' with CHECK constraint for values: 'low', 'medium', 'high', 'urgent'
   - due_date TIMESTAMP WITH TIME ZONE (nullable)
   - completed_at TIMESTAMP WITH TIME ZONE (nullable)

2. Drop the existing call_status CHECK constraint if it exists, then add a new one with these values:
   'pending', 'in_progress', 'called', 'interested', 'not_interested', 'callback', 'converted', 'completed', 'cancelled'

3. Create these performance indexes:
   - idx_phone_numbers_due_date on phone_numbers(due_date) WHERE due_date IS NOT NULL
   - idx_phone_numbers_assigned_to_due_date on phone_numbers(assigned_to, due_date)
   - idx_phone_numbers_status_assigned on phone_numbers(call_status, assigned_to)
   - idx_phone_numbers_batch_status on phone_numbers(batch_id, call_status)

4. Use IF NOT EXISTS for all CREATE statements and DROP CONSTRAINT IF EXISTS for constraint updates to make the migration idempotent.

5. Add comments explaining each section.

After creating the file, apply it to the database using mcp__supabase__apply_migration with name "add_task_management".
```

---

## Prompt 2.2: API Layer - Task Functions

### Context
We need to add new API functions for task assignment and management to the existing phoneNumbers API.

### Prompt
```
Read the file src/api/phoneNumbers.ts and add the following new functions to handle task management:

1. **assignPhoneNumbersRandom** function:
   ```typescript
   async function assignPhoneNumbersRandom(
     batchId: string,
     employeeIds: string[],
     options?: { dueDays?: number; priority?: string }
   ): Promise<{ assigned: number; perEmployee: Record<string, number> }>
   ```
   - Fetch all phone numbers from the batch where assigned_to IS NULL
   - Distribute them evenly across employeeIds using round-robin algorithm
   - Set due_date to (current date + options.dueDays) days, default 7 days
   - Set priority to options.priority or 'medium'
   - Update in chunks of 100 for better performance
   - Return count of assigned numbers and breakdown per employee

2. **assignPhoneNumbersTargeted** function:
   ```typescript
   async function assignPhoneNumbersTargeted(
     batchId: string,
     assignments: Array<{ phoneNumberId: string; employeeId: string }>,
     options?: { dueDays?: number; priority?: string }
   ): Promise<{ assigned: number }>
   ```
   - Assign specific phone numbers to specific employees based on the assignments array
   - Set due_date and priority from options
   - Use batch update for performance
   - Return count of assigned numbers

3. **getEmployeeTaskCalendar** function:
   ```typescript
   async function getEmployeeTaskCalendar(
     employeeId: string,
     startDate: string,
     endDate: string
   ): Promise<Array<{ date: string; tasks: PhoneNumber[]; counts: { pending: number; inProgress: number; completed: number } }>>
   ```
   - Fetch all tasks for the employee within the date range (based on due_date)
   - Group tasks by due_date (YYYY-MM-DD format)
   - Calculate counts for each status type per day
   - Order by date ascending

4. **getUpcomingTasks** function:
   ```typescript
   async function getUpcomingTasks(
     employeeId: string,
     limit: number = 10
   ): Promise<PhoneNumber[]>
   ```
   - Fetch tasks assigned to employee with status 'pending' or 'in_progress'
   - Order by due_date ASC (soonest first)
   - Limit results
   - Include tasks with null due_date at the end

5. **getTaskStats** function:
   ```typescript
   async function getTaskStats(employeeId?: string): Promise<{
     total: number;
     pending: number;
     inProgress: number;
     completed: number;
     overdue: number;
     completedToday: number;
   }>
   ```
   - If employeeId provided, filter by assigned_to
   - Otherwise return aggregate stats for all tasks
   - Count overdue as: status not completed AND due_date < today
   - Count completedToday as: status = completed AND completed_at is today

6. **updateTaskStatus** function:
   ```typescript
   async function updateTaskStatus(
     id: string,
     updates: { call_status?: string; notes?: string; completed_at?: string }
   ): Promise<PhoneNumber>
   ```
   - Update the specified phone number/task
   - If call_status is 'completed' and completed_at not provided, set completed_at to now
   - Return the updated record

Use the existing ApiError class for error handling. Follow the existing patterns in the file for Supabase queries.
```

---

## Prompt 2.3: React Query Hooks

### Context
We need React Query hooks to consume the new API functions with proper caching and invalidation.

### Prompt
```
Read the file src/hooks/queries/usePhoneNumbers.ts and add the following new hooks:

1. **useEmployeeCalendarTasks** hook:
   ```typescript
   export function useEmployeeCalendarTasks(
     employeeId: string | undefined,
     startDate: string,
     endDate: string
   )
   ```
   - Call phoneNumbersApi.getEmployeeTaskCalendar
   - Query key: ['phone-numbers', 'calendar', employeeId, startDate, endDate]
   - Only enabled when employeeId is defined
   - staleTime: 2 minutes (1000 * 60 * 2)

2. **useUpcomingTasks** hook:
   ```typescript
   export function useUpcomingTasks(
     employeeId: string | undefined,
     limit?: number
   )
   ```
   - Call phoneNumbersApi.getUpcomingTasks
   - Query key: ['phone-numbers', 'upcoming', employeeId, limit]
   - Only enabled when employeeId is defined
   - staleTime: 1 minute

3. **useTaskStats** hook:
   ```typescript
   export function useTaskStats(employeeId?: string)
   ```
   - Call phoneNumbersApi.getTaskStats
   - Query key: ['phone-numbers', 'stats', employeeId]
   - staleTime: 30 seconds

4. **useAssignPhoneNumbersRandom** mutation hook:
   ```typescript
   export function useAssignPhoneNumbersRandom()
   ```
   - Call phoneNumbersApi.assignPhoneNumbersRandom
   - On success: invalidate all ['phone-numbers'] queries
   - Show success toast: "تم توزيع الأرقام بنجاح"
   - Show error toast on failure

5. **useAssignPhoneNumbersTargeted** mutation hook:
   ```typescript
   export function useAssignPhoneNumbersTargeted()
   ```
   - Call phoneNumbersApi.assignPhoneNumbersTargeted
   - On success: invalidate all ['phone-numbers'] queries
   - Show success toast: "تم تعيين الأرقام بنجاح"
   - Show error toast on failure

6. **useUpdateTaskStatus** mutation hook:
   ```typescript
   export function useUpdateTaskStatus()
   ```
   - Call phoneNumbersApi.updateTaskStatus
   - On success: invalidate ['phone-numbers'] queries
   - Show success toast: "تم تحديث حالة المهمة"
   - Show error toast on failure

Follow the existing patterns in the file. Use useToast for notifications. Import the API functions from '@/api/phoneNumbers'.
```

---

## Prompt 2.4: TypeScript Types

### Context
We need to add TypeScript types for the new task management features.

### Prompt
```
Read the file src/types/database.ts and add or update the following types:

1. Add TaskType:
   ```typescript
   export type TaskType = 'call' | 'follow_up' | 'meeting' | 'other';
   ```

2. Add TaskPriority:
   ```typescript
   export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
   ```

3. Add or update TaskStatus (may already exist as CallStatus):
   ```typescript
   export type TaskStatus =
     | 'pending'
     | 'in_progress'
     | 'called'
     | 'interested'
     | 'not_interested'
     | 'callback'
     | 'converted'
     | 'completed'
     | 'cancelled';
   ```

4. Update the PhoneNumber interface to include the new fields:
   ```typescript
   export interface PhoneNumber {
     // ... existing fields
     task_type: TaskType;
     priority: TaskPriority;
     due_date: string | null;
     completed_at: string | null;
   }
   ```

5. Add TaskCalendarDay interface:
   ```typescript
   export interface TaskCalendarDay {
     date: string;
     tasks: PhoneNumber[];
     counts: {
       pending: number;
       inProgress: number;
       completed: number;
     };
   }
   ```

6. Add TaskStats interface:
   ```typescript
   export interface TaskStats {
     total: number;
     pending: number;
     inProgress: number;
     completed: number;
     overdue: number;
     completedToday: number;
   }
   ```

7. Add AssignmentResult interface:
   ```typescript
   export interface AssignmentResult {
     assigned: number;
     perEmployee?: Record<string, number>;
   }
   ```

8. Add AssignmentOptions interface:
   ```typescript
   export interface AssignmentOptions {
     dueDays?: number;
     priority?: TaskPriority;
   }
   ```

Make sure to export all types. Keep existing types unchanged unless they need updating for compatibility.
```

---

## Verification Steps

After completing all prompts:

1. [ ] Migration file created and applied successfully
2. [ ] All new API functions work (test with Supabase dashboard)
3. [ ] React Query hooks compile without errors
4. [ ] TypeScript types are properly exported
5. [ ] No circular dependency issues
6. [ ] Run `npm run build` to verify no build errors

---

## Next Sprint
Continue to **SPRINT_3_TASK_MANAGEMENT_FRONTEND.md** for UI components.
