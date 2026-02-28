# Sprint 6: Production Hardening

## Overview
Implement input validation, security headers, performance monitoring, rate limiting, and scalability improvements.

**Estimated Tasks:** 7 prompts
**Dependencies:** Sprint 1 completed (for logging)

---

## Prompt 6.1: Input Validation Schemas

### Context
Create Zod validation schemas for all user inputs with Arabic error messages.

### Prompt
```
Create src/lib/validation.ts with comprehensive Zod schemas:

```typescript
import { z } from 'zod';

// ============================================
// Basic Field Validators
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'البريد الإلكتروني مطلوب')
  .email('البريد الإلكتروني غير صالح');

export const phoneSchema = z
  .string()
  .min(1, 'رقم الهاتف مطلوب')
  .regex(/^01[0-9]{9}$/, 'رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم');

export const egyptianNationalIdSchema = z
  .string()
  .regex(/^[0-9]{14}$/, 'الرقم القومي يجب أن يتكون من 14 رقم');

export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل');

export const nameSchema = z
  .string()
  .min(2, 'الاسم قصير جداً')
  .max(100, 'الاسم طويل جداً')
  .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط');

export const arabicNameSchema = z
  .string()
  .min(2, 'الاسم قصير جداً')
  .max(100, 'الاسم طويل جداً')
  .regex(/^[\u0600-\u06FF\s]+$/, 'الاسم يجب أن يكون بالعربية');

export const amountSchema = z
  .number()
  .min(0, 'المبلغ يجب أن يكون صفر أو أكثر')
  .max(100000000, 'المبلغ كبير جداً');

export const percentageSchema = z
  .number()
  .min(0, 'النسبة يجب أن تكون صفر أو أكثر')
  .max(100, 'النسبة يجب أن تكون 100 أو أقل');

// ============================================
// File Upload Validators
// ============================================

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const imageFileSchema = z.object({
  type: z.string().refine(
    (type) => IMAGE_TYPES.includes(type),
    'نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, GIF, WebP'
  ),
  size: z.number().max(
    5 * 1024 * 1024,
    'حجم الصورة يجب أن يكون أقل من 5 ميجابايت'
  ),
  name: z.string(),
});

export const documentFileSchema = z.object({
  type: z.string().refine(
    (type) => DOCUMENT_TYPES.includes(type),
    'نوع الملف غير مدعوم. الأنواع المدعومة: PDF, Word, Excel'
  ),
  size: z.number().max(
    10 * 1024 * 1024,
    'حجم الملف يجب أن يكون أقل من 10 ميجابايت'
  ),
  name: z.string(),
});

export const anyFileSchema = z.object({
  type: z.string().refine(
    (type) => [...IMAGE_TYPES, ...DOCUMENT_TYPES].includes(type),
    'نوع الملف غير مدعوم'
  ),
  size: z.number().max(
    10 * 1024 * 1024,
    'حجم الملف يجب أن يكون أقل من 10 ميجابايت'
  ),
  name: z.string(),
});

// ============================================
// Form Schemas
// ============================================

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

export const clientFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  national_id: egyptianNationalIdSchema.optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended', 'late']).optional(),
});

export const employeeFormSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  department: z.string().min(1, 'القسم مطلوب'),
  employee_code: z.string().optional(),
});

export const depositFormSchema = z.object({
  amount: amountSchema,
  deposit_date: z.string().min(1, 'تاريخ الإيداع مطلوب'),
  profit_rate: percentageSchema,
  client_id: z.string().uuid('معرف العميل غير صالح'),
});

// ============================================
// Utility Functions
// ============================================

/**
 * Validate data against a schema and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return result.data;
}

/**
 * Validate data and return result with success/error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return {
    success: false,
    error: result.error.errors[0].message,
    errors,
  };
}

/**
 * Validate a file object
 */
export function validateFile(
  file: File,
  options?: { maxSize?: number; allowedTypes?: string[] }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize ?? 10 * 1024 * 1024;
  const allowedTypes = options?.allowedTypes ?? [...IMAGE_TYPES, ...DOCUMENT_TYPES];

  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `حجم الملف يجب أن يكون أقل من ${sizeMB} ميجابايت` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم' };
  }

  return { valid: true };
}
```

This provides comprehensive validation with Arabic error messages for all form inputs.
```

---

## Prompt 6.2: Performance Monitoring with Web Vitals

### Context
Track Core Web Vitals and log performance metrics.

### Prompt
```
First, install web-vitals if not already installed:
npm install web-vitals

Then create src/lib/performance.ts:

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';
import { isDevelopment, isProduction } from '@/lib/env';

interface PerformanceMetricData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Send metric to analytics/database
 */
async function sendMetric(metric: Metric): Promise<void> {
  const metricData: PerformanceMetricData = {
    name: metric.name,
    value: Math.round(metric.value * 100) / 100,
    rating: metric.rating,
    delta: Math.round(metric.delta * 100) / 100,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // In development, log to console
  if (isDevelopment) {
    const color =
      metric.rating === 'good' ? 'color: green' :
      metric.rating === 'needs-improvement' ? 'color: orange' :
      'color: red';

    console.log(
      `%c[Performance] ${metric.name}: ${metricData.value} (${metric.rating})`,
      color
    );
    return;
  }

  // In production, store in database
  if (isProduction) {
    try {
      await supabase.from('performance_metrics').insert({
        metric_name: metricData.name,
        metric_value: metricData.value,
        rating: metricData.rating,
        delta: metricData.delta,
        metric_id: metricData.id,
        navigation_type: metricData.navigationType,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent.substring(0, 500),
      });
    } catch (error) {
      // Silently fail - don't impact user experience
      console.warn('[Performance] Failed to log metric:', error);
    }
  }
}

/**
 * Initialize performance monitoring
 * Call this once in main.tsx
 */
export function initPerformanceMonitoring(): void {
  // Core Web Vitals
  onCLS(sendMetric);  // Cumulative Layout Shift
  onFID(sendMetric);  // First Input Delay
  onLCP(sendMetric);  // Largest Contentful Paint

  // Other useful metrics
  onFCP(sendMetric);  // First Contentful Paint
  onTTFB(sendMetric); // Time to First Byte
  onINP(sendMetric);  // Interaction to Next Paint
}

/**
 * Manually report a custom metric
 */
export function reportCustomMetric(
  name: string,
  value: number,
  rating?: 'good' | 'needs-improvement' | 'poor'
): void {
  const metric: Metric = {
    name,
    value,
    rating: rating || (value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor'),
    delta: value,
    id: `custom-${Date.now()}`,
    navigationType: 'custom',
    entries: [],
  };
  sendMetric(metric);
}
```

Now create the migration for the performance_metrics table.

Create supabase/migrations/20260126300000_add_performance_metrics.sql:

```sql
-- Performance metrics table for Web Vitals
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  rating TEXT CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta DOUBLE PRECISION,
  metric_id TEXT,
  navigation_type TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_created
  ON performance_metrics(metric_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_rating
  ON performance_metrics(rating, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_page
  ON performance_metrics(page_url, created_at DESC);

-- RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated users
CREATE POLICY "Allow insert metrics"
  ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can read metrics
CREATE POLICY "Admins can view metrics"
  ON public.performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Comment
COMMENT ON TABLE public.performance_metrics IS 'Stores Web Vitals and custom performance metrics';
```

Apply the migration using mcp__supabase__apply_migration.

Finally, update src/main.tsx to initialize monitoring:

```typescript
import { initPerformanceMonitoring } from '@/lib/performance';

// After createRoot().render()
initPerformanceMonitoring();
```
```

---

## Prompt 6.3: Security Headers Configuration

### Context
Add security headers for production deployment.

### Prompt
```
Create security header configurations for common hosting platforms:

1. For Netlify, create public/_headers:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

2. For Vercel, create vercel.json (or update if exists):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

3. Update vite.config.ts to add headers for dev server:

```typescript
server: {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
  },
},
```

These headers provide:
- X-Frame-Options: Prevents clickjacking
- X-Content-Type-Options: Prevents MIME sniffing
- X-XSS-Protection: Enables browser XSS filter
- Referrer-Policy: Controls referrer information
- Permissions-Policy: Disables unnecessary browser features
- Cache-Control: Long-term caching for static assets
```

---

## Prompt 6.4: Rate Limiting Utility

### Context
Add client-side rate limiting to prevent abuse.

### Prompt
```
Create src/lib/rateLimiter.ts:

```typescript
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit state in memory
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Check if an action is rate limited
 * @param key Unique identifier for the action (e.g., 'upload', 'login')
 * @param limit Maximum number of actions allowed
 * @param windowMs Time window in milliseconds
 * @returns true if action is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No existing entry or window expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return false;
  }

  // Increment counter
  entry.count++;
  return true;
}

/**
 * Get time remaining until rate limit resets
 * @param key Unique identifier for the action
 * @returns Milliseconds until reset, or 0 if not limited
 */
export function getRateLimitResetTime(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry) return 0;

  const remaining = entry.resetTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Get a user-friendly rate limit error message in Arabic
 * @param windowMs Time window in milliseconds
 * @returns Error message
 */
export function getRateLimitError(windowMs: number): string {
  const seconds = Math.ceil(windowMs / 1000);
  if (seconds < 60) {
    return `تم تجاوز الحد المسموح. يرجى الانتظار ${seconds} ثانية.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `تم تجاوز الحد المسموح. يرجى الانتظار ${minutes} دقيقة.`;
}

/**
 * Create a rate-limited version of a function
 * @param fn Function to rate limit
 * @param key Unique identifier
 * @param limit Maximum calls allowed
 * @param windowMs Time window
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  limit: number,
  windowMs: number
): T {
  return (async (...args: Parameters<T>) => {
    if (!checkRateLimit(key, limit, windowMs)) {
      throw new Error(getRateLimitError(windowMs));
    }
    return fn(...args);
  }) as T;
}
```

Now apply rate limiting to sensitive operations.

Update src/api/documents.ts and src/api/posters.ts:

```typescript
import { checkRateLimit, getRateLimitError } from '@/lib/rateLimiter';
import { ApiError } from '@/lib/errors';

// In the uploadFile function, add at the beginning:
async uploadFile(file: File, ...args) {
  // Rate limit: 10 uploads per minute
  if (!checkRateLimit('upload-document', 10, 60000)) {
    throw new ApiError(getRateLimitError(60000), 'RATE_LIMITED');
  }

  // ... rest of existing code
}
```

Update src/api/chat.ts for attachment uploads:

```typescript
// Rate limit: 5 chat attachments per minute
if (!checkRateLimit('chat-attachment', 5, 60000)) {
  throw new ApiError(getRateLimitError(60000), 'RATE_LIMITED');
}
```
```

---

## Prompt 6.5: Database Performance Indexes

### Context
Add database indexes for better query performance at scale.

### Prompt
```
Create supabase/migrations/20260126400000_add_performance_indexes.sql:

```sql
-- ============================================
-- Performance Indexes for Scalability
-- ============================================

-- Use CONCURRENTLY to avoid locking tables during index creation
-- Note: CONCURRENTLY cannot be used inside a transaction block

-- Phone Numbers / Tasks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_batch_status
  ON public.phone_numbers(batch_id, call_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_assigned_status
  ON public.phone_numbers(assigned_to, call_status)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_due_date_status
  ON public.phone_numbers(due_date, call_status)
  WHERE due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_phone_numbers_created_at
  ON public.phone_numbers(created_at DESC);

-- Clients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_assigned_status
  ON public.clients(assigned_to, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_at
  ON public.clients(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_status
  ON public.clients(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search
  ON public.clients USING gin(to_tsvector('arabic', coalesce(name, '')));

-- Chat Messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conversation_created
  ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_sender
  ON public.chat_messages(sender_id, created_at DESC);

-- Profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_department_active
  ON public.profiles(department, is_active)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id
  ON public.profiles(user_id);

-- User Roles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles(user_id, role);

-- Audit Logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_created
  ON public.audit_log(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action_created
  ON public.audit_log(action, created_at DESC);

-- Commissions (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions') THEN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commissions_employee_created ON public.commissions(employee_id, created_at DESC)';
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commissions_status ON public.commissions(status)';
  END IF;
END $$;

-- Employee Targets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_targets_employee_month
  ON public.employee_targets(employee_id, month DESC);

-- Client Deposits
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_deposits_client
  ON public.client_deposits(client_id, deposit_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_deposits_status
  ON public.client_deposits(status);

-- ============================================
-- Analyze tables to update statistics
-- ============================================
ANALYZE public.phone_numbers;
ANALYZE public.clients;
ANALYZE public.chat_messages;
ANALYZE public.profiles;
ANALYZE public.user_roles;
```

Apply using mcp__supabase__apply_migration with name "add_performance_indexes".

Note: If CONCURRENTLY fails in the migration (due to transaction context), remove the CONCURRENTLY keyword and the indexes will still be created, just with brief table locks.
```

---

## Prompt 6.6: Environment Configuration Files

### Context
Create environment configuration files for different deployment stages.

### Prompt
```
1. Update .gitignore to ensure sensitive files are not committed:

Add these lines if not present:
```
# Environment files
.env
.env.local
.env.production
.env.staging

# Keep example file
!.env.example
```

2. Update .env.example with all required variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Environment (development | staging | production)
VITE_ENV=development

# Feature Flags (Optional)
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_LOGGING=true
```

3. Create a .env.development.example file:

```env
# Development Environment
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-dev-anon-key
VITE_ENV=development
VITE_ENABLE_PERFORMANCE_MONITORING=false
VITE_ENABLE_ERROR_LOGGING=true
```

4. Update src/lib/env.ts to include feature flags:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),
  VITE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Feature flags with defaults
  VITE_ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .transform(v => v === 'true')
    .default('true'),
  VITE_ENABLE_ERROR_LOGGING: z
    .string()
    .transform(v => v === 'true')
    .default('true'),

  // Vite built-in env
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
  MODE: z.string().default('development'),
});

export const env = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_ENV: import.meta.env.VITE_ENV || import.meta.env.MODE,
  VITE_ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING,
  VITE_ENABLE_ERROR_LOGGING: import.meta.env.VITE_ENABLE_ERROR_LOGGING,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
});

// Environment checks
export const isDevelopment = env.VITE_ENV === 'development' || env.DEV;
export const isProduction = env.VITE_ENV === 'production' || env.PROD;
export const isStaging = env.VITE_ENV === 'staging';

// Feature flags
export const features = {
  performanceMonitoring: env.VITE_ENABLE_PERFORMANCE_MONITORING,
  errorLogging: env.VITE_ENABLE_ERROR_LOGGING,
};
```

5. Update performance.ts to use feature flag:

```typescript
import { features } from '@/lib/env';

export function initPerformanceMonitoring(): void {
  if (!features.performanceMonitoring) {
    console.log('[Performance] Monitoring disabled');
    return;
  }

  // ... rest of the code
}
```
```

---

## Prompt 6.7: Final Production Checklist Migration

### Context
Create a final migration that adds any missing constraints and validates the database state.

### Prompt
```
Create supabase/migrations/20260126500000_production_hardening.sql:

```sql
-- ============================================
-- Production Hardening - Final Checks
-- ============================================

-- Ensure all critical tables have updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers if not exists
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'updated_at'
        AND table_name NOT IN (
            SELECT event_object_table
            FROM information_schema.triggers
            WHERE trigger_name LIKE '%updated_at%'
        )
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
        ', t, t);
        RAISE NOTICE 'Created updated_at trigger for table: %', t;
    END LOOP;
END $$;

-- Ensure RLS is enabled on all public tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Add NOT NULL constraints where missing but required
ALTER TABLE public.profiles
    ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.clients
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.phone_numbers
    ALTER COLUMN phone_number SET NOT NULL,
    ALTER COLUMN batch_id SET NOT NULL;

-- Add default values for status fields
ALTER TABLE public.clients
    ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.phone_numbers
    ALTER COLUMN call_status SET DEFAULT 'pending',
    ALTER COLUMN priority SET DEFAULT 'medium',
    ALTER COLUMN task_type SET DEFAULT 'call';

-- Create a function to clean up old logs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete application logs older than 30 days
    DELETE FROM public.application_logs
    WHERE created_at < NOW() - INTERVAL '30 days';

    -- Delete performance metrics older than 7 days
    DELETE FROM public.performance_metrics
    WHERE created_at < NOW() - INTERVAL '7 days';

    RAISE NOTICE 'Log cleanup completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs() TO service_role;

-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Add comments for documentation
COMMENT ON TABLE public.phone_numbers IS 'Phone numbers for task/call management with assignment tracking';
COMMENT ON TABLE public.clients IS 'Client information and status tracking';
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.application_logs IS 'Application error and event logs';
COMMENT ON TABLE public.performance_metrics IS 'Web Vitals and performance metrics';
```

Apply using mcp__supabase__apply_migration with name "production_hardening".
```

---

## Verification Steps

After completing all prompts:

1. [ ] Validation schemas work with Arabic error messages
2. [ ] Performance monitoring logs metrics (check console in dev)
3. [ ] Security headers present (check browser DevTools)
4. [ ] Rate limiting works (test rapid uploads)
5. [ ] Database indexes created (check Supabase dashboard)
6. [ ] Environment configuration loads correctly
7. [ ] Feature flags can enable/disable features
8. [ ] Run `npm run build` successfully
9. [ ] No TypeScript errors
10. [ ] Test the full application flow

---

## Deployment Checklist

Before going to production:

- [ ] All migrations applied
- [ ] Environment variables set in hosting platform
- [ ] Storage buckets created with policies
- [ ] Security headers configured
- [ ] SSL/TLS enabled
- [ ] Domain configured
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Rate limiting tested
- [ ] Load testing completed (optional)

---

## Post-Deployment Verification

After deploying:

1. [ ] App loads without errors
2. [ ] Login/logout works
3. [ ] All CRUD operations work
4. [ ] File uploads work
5. [ ] Performance metrics appearing in database
6. [ ] Error logs appearing (test by triggering an error)
7. [ ] Security headers visible in browser
8. [ ] No CORS errors
9. [ ] Mobile responsive
10. [ ] Arabic text displays correctly

---

*End of Sprint 6 - Production Hardening*
