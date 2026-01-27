# Implementation Prompts

This folder contains ready-to-use prompts for implementing the remaining features of the FIS Wealth Manager application.

## Overview

Each sprint file contains:
- **Context**: Background information for the AI
- **Prompts**: Copy-paste ready prompts for implementation
- **Verification Steps**: Checklist to confirm completion

## Sprint Order

| Sprint | File | Description | Dependencies |
|--------|------|-------------|--------------|
| 2 | `SPRINT_2_TASK_MANAGEMENT_BACKEND.md` | Database, API, hooks for tasks | Sprint 1 |
| 3 | `SPRINT_3_TASK_MANAGEMENT_FRONTEND.md` | UI components and pages | Sprint 2 |
| 4 | `SPRINT_4_CHAT_COMMISSIONS.md` | File attachments, real stats | Sprint 1 |
| 5 | `SPRINT_5_PERFORMANCE.md` | Lazy loading, optimization | None |
| 6 | `SPRINT_6_PRODUCTION.md` | Security, monitoring, hardening | Sprint 1 |

## How to Use

### With Claude Code / Codex

1. Open the sprint file you want to work on
2. Copy the entire **Prompt** section (including the ``` code blocks)
3. Paste it into your AI assistant
4. Wait for implementation
5. Review the changes
6. Run verification steps
7. Move to next prompt in the file

### Example Usage

```
1. Open SPRINT_2_TASK_MANAGEMENT_BACKEND.md
2. Copy "Prompt 2.1: Database Migration"
3. Paste into Claude/Codex
4. AI creates the migration file
5. AI applies migration to Supabase
6. Verify in Supabase dashboard
7. Move to "Prompt 2.2: API Layer"
```

## Prompt Structure

Each prompt follows this format:

```markdown
## Prompt X.X: Title

### Context
Background information about what this prompt does and why.

### Prompt
\`\`\`
The actual prompt to copy and paste.
This is what you give to the AI.
\`\`\`
```

## Sprint Details

### Sprint 2: Task Management - Backend (4 prompts)
- 2.1: Database migration for task columns
- 2.2: API functions for assignment and tracking
- 2.3: React Query hooks
- 2.4: TypeScript types

### Sprint 3: Task Management - Frontend (8 prompts)
- 3.1: TaskCalendar component
- 3.2: TaskList component
- 3.3: BulkAssignment dialog
- 3.4: MyTasks employee page
- 3.5: TaskManagement admin page
- 3.6: App routes update
- 3.7: Sidebar navigation
- 3.8: Phone numbers page enhancement

### Sprint 4: Chat Attachments & Commissions (6 prompts)
- 4.1: Chat attachments migration
- 4.2: Attachment API functions
- 4.3: Chat page file upload
- 4.4: Commission stats API
- 4.5: Commission hooks
- 4.6: Employees page real data

### Sprint 5: Performance Optimization (6 prompts)
- 5.1: Lazy loading routes
- 5.2: Loading spinner component
- 5.3: Vite build configuration
- 5.4: React Query persistence
- 5.5: List memoization
- 5.6: API query optimization

### Sprint 6: Production Hardening (7 prompts)
- 6.1: Zod validation schemas
- 6.2: Performance monitoring (Web Vitals)
- 6.3: Security headers
- 6.4: Rate limiting utility
- 6.5: Database indexes
- 6.6: Environment configuration
- 6.7: Final production migration

## Tips for Best Results

1. **One prompt at a time**: Complete each prompt fully before moving to the next
2. **Verify after each**: Use the verification steps to confirm success
3. **Keep context**: If the AI loses context, re-paste the prompt with additional context
4. **Handle errors**: If a prompt fails, check the error and adjust
5. **Test locally**: Run `npm run dev` after each major change

## Common Issues

### Migration fails
- Check Supabase connection
- Verify table/column doesn't already exist
- Check RLS policies

### TypeScript errors
- Run `npm run build` to see all errors
- Check imports are correct
- Verify types match database schema

### Component not rendering
- Check route is added to App.tsx
- Verify import path is correct
- Check for console errors

## Dependencies to Install

Some sprints require additional packages:

```bash
# Sprint 5: Performance
npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client

# Sprint 6: Production
npm install web-vitals
npm install -D terser
```

## Completed Work (Sprint 1)

Sprint 1 has already been completed:
- ✅ Deleted example test file
- ✅ Created internal logging system
- ✅ Applied application_logs migration
- ✅ Replaced console statements with logger
- ✅ Created ErrorBoundary components
- ✅ Added error boundaries to App.tsx
- ✅ Created environment configuration
- ✅ Fixed Settings.tsx mock data

## Questions?

If you encounter issues:
1. Check the verification steps in each sprint file
2. Review the IMPLEMENTATION_GUIDE.md for more details
3. Ensure dependencies are installed
4. Check Supabase dashboard for database issues

---

*Generated for FIS Wealth Manager production implementation*
