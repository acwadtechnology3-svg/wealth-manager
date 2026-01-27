# Sprint 5: Performance Optimization

## Overview
Implement lazy loading, code splitting, query optimization, and caching to improve application performance.

**Estimated Tasks:** 6 prompts
**Dependencies:** None (can run in parallel with other sprints)

---

## Prompt 5.1: Lazy Loading Routes

### Context
Split the application bundle by lazy loading page components.

### Prompt
```
Read src/App.tsx and implement lazy loading for all page components:

1. Add imports at the top:
   ```typescript
   import { lazy, Suspense } from "react";
   import { Loader2 } from "lucide-react";
   ```

2. Create a LoadingFallback component inside App.tsx or import from components:
   ```typescript
   const LoadingFallback = () => (
     <div className="flex min-h-screen items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
     </div>
   );
   ```

3. Replace ALL static page imports with lazy imports. For example:

   Before:
   ```typescript
   import Index from "./pages/Index";
   import Employees from "./pages/Employees";
   import Clients from "./pages/Clients";
   // ... etc
   ```

   After:
   ```typescript
   const Index = lazy(() => import("./pages/Index"));
   const Employees = lazy(() => import("./pages/Employees"));
   const Clients = lazy(() => import("./pages/Clients"));
   const Commissions = lazy(() => import("./pages/Commissions"));
   const FinancialCalendar = lazy(() => import("./pages/FinancialCalendar"));
   const Chat = lazy(() => import("./pages/Chat"));
   const Reports = lazy(() => import("./pages/Reports"));
   const Settings = lazy(() => import("./pages/Settings"));
   const NotFound = lazy(() => import("./pages/NotFound"));

   // Auth pages
   const Login = lazy(() => import("./pages/auth/Login"));
   const Register = lazy(() => import("./pages/auth/Register"));
   const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
   const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
   const Unauthorized = lazy(() => import("./pages/Unauthorized"));

   // HR pages
   const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
   const HREmployees = lazy(() => import("./pages/hr/HREmployees"));
   const Attendance = lazy(() => import("./pages/hr/Attendance"));
   const Leaves = lazy(() => import("./pages/hr/Leaves"));
   const Payroll = lazy(() => import("./pages/hr/Payroll"));
   const Penalties = lazy(() => import("./pages/hr/Penalties"));
   const Documents = lazy(() => import("./pages/hr/Documents"));

   // Admin pages
   const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
   const ClientProfile = lazy(() => import("./pages/admin/ClientProfile"));
   const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
   const PermissionManagement = lazy(() => import("./pages/admin/PermissionManagement"));
   const ClientCalls = lazy(() => import("./pages/admin/ClientCalls"));
   const EmployeeTargets = lazy(() => import("./pages/admin/EmployeeTargets"));
   const TeamChat = lazy(() => import("./pages/admin/TeamChat"));
   const WorkSchedules = lazy(() => import("./pages/admin/WorkSchedules"));
   const PhoneNumbers = lazy(() => import("./pages/admin/PhoneNumbers"));
   const PaymentMethods = lazy(() => import("./pages/admin/PaymentMethods"));

   // New task pages (if created in Sprint 3)
   const MyTasks = lazy(() => import("./pages/MyTasks"));
   const TaskManagement = lazy(() => import("./pages/admin/TaskManagement"));
   ```

4. Wrap the Routes component with Suspense:
   ```tsx
   <BrowserRouter>
     <Suspense fallback={<LoadingFallback />}>
       <Routes>
         {/* all routes stay the same */}
       </Routes>
     </Suspense>
   </BrowserRouter>
   ```

5. Keep non-page imports as static (components, hooks, etc.)

This will split the bundle so each page is loaded on demand.
```

---

## Prompt 5.2: Create Loading Spinner Component

### Context
Create a reusable loading spinner component for use throughout the application.

### Prompt
```
Create src/components/LoadingSpinner.tsx:

```typescript
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  fullScreen = false,
  message,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
```

Export both as named and default export for flexibility.
```

---

## Prompt 5.3: Vite Build Optimization

### Context
Configure Vite for optimal production builds with code splitting and minification.

### Prompt
```
Read vite.config.ts and add/update the build configuration:

1. Add terser for minification (check if it needs to be installed: npm install -D terser)

2. Update the config to include:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable minification with terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
      },
    },

    // Generate source maps for error tracking (hidden from browser)
    sourcemap: 'hidden',

    // Increase chunk size warning limit (we're optimizing with manual chunks)
    chunkSizeWarningLimit: 1000,

    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - changes rarely
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Data fetching - changes rarely
          'query-vendor': ['@tanstack/react-query'],

          // Supabase - changes rarely
          'supabase-vendor': ['@supabase/supabase-js'],

          // UI components - group Radix primitives
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
          ],

          // Date utilities
          'date-vendor': ['date-fns', 'react-day-picker'],

          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },

  // Dev server configuration
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
});
```

3. Keep any existing configuration that isn't related to build optimization.

4. After updating, run `npm run build` to verify the chunks are created correctly.

Expected output should show multiple chunks like:
- react-vendor.js
- query-vendor.js
- supabase-vendor.js
- ui-radix.js
- date-vendor.js
- form-vendor.js
- Plus individual page chunks
```

---

## Prompt 5.4: React Query Persistence

### Context
Persist React Query cache to localStorage for faster subsequent loads.

### Prompt
```
First, check if these packages are installed. If not, install them:
npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client

Then:

1. Create src/lib/queryPersistence.ts:

```typescript
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Query } from '@tanstack/react-query';

// Create persister using localStorage
export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'fis-wm-query-cache',
  // Serialize with error handling
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

// Queries that should be persisted (stable data)
const PERSISTED_QUERY_PREFIXES = [
  'user-settings',
  'app-settings',
  'profile',
  'profiles', // Employee list
];

// Check if a query should be persisted
export function shouldPersistQuery(query: Query): boolean {
  const queryKey = query.queryKey;

  // Only persist successful queries
  if (query.state.status !== 'success') {
    return false;
  }

  // Check if query key starts with any of the persisted prefixes
  if (Array.isArray(queryKey) && typeof queryKey[0] === 'string') {
    return PERSISTED_QUERY_PREFIXES.some(prefix =>
      queryKey[0].startsWith(prefix)
    );
  }

  return false;
}

// Max age for persisted cache (24 hours)
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24;
```

2. Update src/App.tsx to use PersistQueryClientProvider:

Add imports:
```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister, shouldPersistQuery, PERSIST_MAX_AGE } from '@/lib/queryPersistence';
```

Replace QueryClientProvider with PersistQueryClientProvider:
```tsx
// Before:
<QueryClientProvider client={queryClient}>

// After:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: queryPersister,
    maxAge: PERSIST_MAX_AGE,
    dehydrateOptions: {
      shouldDehydrateQuery: shouldPersistQuery,
    },
  }}
>
```

And update the closing tag accordingly.

This will persist selected queries to localStorage and restore them on page load.
```

---

## Prompt 5.5: Memoization for Large Lists

### Context
Add memoization to prevent unnecessary re-renders in list components.

### Prompt
```
Read and update src/pages/Employees.tsx and src/pages/Clients.tsx to add memoization:

1. Import memoization hooks at the top:
   ```typescript
   import { memo, useMemo, useCallback } from 'react';
   ```

2. Memoize the filtered and sorted data:
   ```typescript
   const filteredData = useMemo(() => {
     let result = data || [];

     // Apply search filter
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       result = result.filter(item =>
         item.name?.toLowerCase().includes(query) ||
         item.email?.toLowerCase().includes(query) ||
         item.phone?.includes(query) ||
         item.code?.toLowerCase().includes(query)
       );
     }

     // Apply status filter
     if (statusFilter && statusFilter !== 'all') {
       result = result.filter(item => item.status === statusFilter);
     }

     // Apply sorting
     if (sortField) {
       result = [...result].sort((a, b) => {
         const aVal = a[sortField] || '';
         const bVal = b[sortField] || '';
         const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
         return sortDirection === 'asc' ? comparison : -comparison;
       });
     }

     return result;
   }, [data, searchQuery, statusFilter, sortField, sortDirection]);
   ```

3. Memoize paginated data:
   ```typescript
   const paginatedData = useMemo(() => {
     const start = (currentPage - 1) * pageSize;
     return filteredData.slice(start, start + pageSize);
   }, [filteredData, currentPage, pageSize]);
   ```

4. Memoize callbacks:
   ```typescript
   const handleEdit = useCallback((id: string) => {
     setEditingId(id);
     setIsDialogOpen(true);
   }, []);

   const handleDelete = useCallback((id: string) => {
     setDeletingId(id);
     setShowDeleteConfirm(true);
   }, []);

   const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
     setSearchQuery(e.target.value);
     setCurrentPage(1); // Reset to first page
   }, []);
   ```

5. Create a memoized row component if there's a complex table row:
   ```typescript
   const TableRowMemo = memo(function TableRowMemo({
     item,
     onEdit,
     onDelete
   }: {
     item: Employee;
     onEdit: (id: string) => void;
     onDelete: (id: string) => void;
   }) {
     return (
       <TableRow>
         {/* row content */}
       </TableRow>
     );
   });
   ```

6. Use the memoized components:
   ```tsx
   {paginatedData.map(item => (
     <TableRowMemo
       key={item.id}
       item={item}
       onEdit={handleEdit}
       onDelete={handleDelete}
     />
   ))}
   ```

Apply similar patterns to both Employees.tsx and Clients.tsx files.
```

---

## Prompt 5.6: API Query Optimization

### Context
Optimize Supabase queries by selecting only needed columns and adding pagination.

### Prompt
```
Read and update the API files to optimize queries:

1. Update src/api/clients.ts:

   In the list function, use specific column selection:
   ```typescript
   async list(params?: {
     page?: number;
     pageSize?: number;
     status?: string;
     search?: string;
   }) {
     const page = params?.page ?? 1;
     const pageSize = params?.pageSize ?? 20;
     const start = (page - 1) * pageSize;
     const end = start + pageSize - 1;

     let query = supabase
       .from('clients')
       .select(`
         id,
         code,
         name,
         phone,
         email,
         status,
         created_at,
         assigned_to,
         assigned_profile:profiles!assigned_to(id, full_name)
       `, { count: 'exact' });

     if (params?.status && params.status !== 'all') {
       query = query.eq('status', params.status);
     }

     if (params?.search) {
       query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,code.ilike.%${params.search}%`);
     }

     const { data, error, count } = await query
       .order('created_at', { ascending: false })
       .range(start, end);

     if (error) throw new ApiError(error.message, error.code);

     return {
       data: data || [],
       total: count || 0,
       page,
       pageSize,
       totalPages: Math.ceil((count || 0) / pageSize),
     };
   }
   ```

2. Update src/api/phoneNumbers.ts similarly:
   - Use specific column selection instead of '*'
   - Add pagination support to list functions
   - Only fetch columns needed for the UI

3. General optimization rules to apply:
   - Replace `.select('*')` with specific columns
   - Add `{ count: 'exact' }` for paginated queries
   - Use `.range(start, end)` for pagination
   - Use `.order()` on indexed columns
   - Use `.or()` for multiple search conditions
   - Use `.eq()` filters before `.range()` for efficiency

4. Update the corresponding React Query hooks to handle paginated responses:
   ```typescript
   interface PaginatedResponse<T> {
     data: T[];
     total: number;
     page: number;
     pageSize: number;
     totalPages: number;
   }

   export function useClients(params?: { page?: number; status?: string; search?: string }) {
     return useQuery({
       queryKey: ['clients', params],
       queryFn: () => clientsApi.list(params),
       keepPreviousData: true, // Keep old data while fetching new page
     });
   }
   ```
```

---

## Verification Steps

After completing all prompts:

1. [ ] Run `npm run build` - verify it completes without errors
2. [ ] Check build output - should show multiple chunk files
3. [ ] Verify chunk sizes are reasonable (< 500KB each)
4. [ ] Open browser DevTools Network tab
5. [ ] Load app - verify only needed chunks load initially
6. [ ] Navigate to different pages - verify chunks load on demand
7. [ ] Refresh page - verify cached data loads instantly
8. [ ] Check localStorage - should see 'fis-wm-query-cache' key
9. [ ] Test filtering/sorting - should feel snappy
10. [ ] No duplicate fetches in Network tab

## Performance Metrics to Verify

Run Lighthouse or WebPageTest and target:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Initial bundle size: < 500KB (gzipped)
- Lighthouse Performance score: > 85

---

## Next Sprint
Continue to **SPRINT_6_PRODUCTION.md** for production hardening.
