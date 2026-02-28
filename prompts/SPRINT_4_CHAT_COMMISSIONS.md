# Sprint 4: Chat Attachments & Commissions

## Overview
Implement file attachments in chat and display real commission statistics instead of mock data.

**Estimated Tasks:** 6 prompts
**Dependencies:** Sprint 1 completed (for logging)

---

## Prompt 4.1: Chat Attachments Database Migration

### Context
Add support for file attachments in chat messages with a storage bucket.

### Prompt
```
Create a Supabase migration for chat attachments at supabase/migrations/20260126200000_add_chat_attachments.sql:

1. Add columns to the chat_messages table:
   ```sql
   ALTER TABLE public.chat_messages
     ADD COLUMN IF NOT EXISTS attachment_url TEXT,
     ADD COLUMN IF NOT EXISTS attachment_name TEXT,
     ADD COLUMN IF NOT EXISTS attachment_type TEXT,
     ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
   ```

2. Add a comment on the columns:
   ```sql
   COMMENT ON COLUMN public.chat_messages.attachment_url IS 'Storage path for the attachment file';
   COMMENT ON COLUMN public.chat_messages.attachment_type IS 'MIME type of the attachment';
   COMMENT ON COLUMN public.chat_messages.attachment_size IS 'File size in bytes';
   ```

3. Create an index for messages with attachments:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_chat_messages_has_attachment
     ON public.chat_messages(conversation_id)
     WHERE attachment_url IS NOT NULL;
   ```

After creating the file, apply it using mcp__supabase__apply_migration with name "add_chat_attachments".

Then, use mcp__supabase__execute_sql to check if the 'chat-attachments' storage bucket exists, and create it if not:

```sql
-- Check bucket exists (this is informational, bucket creation is done via dashboard or API)
SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
```

Note: The storage bucket 'chat-attachments' should be created via Supabase dashboard with the following settings:
- Public: No
- File size limit: 10MB
- Allowed MIME types: image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*
```

---

## Prompt 4.2: Chat Attachments API

### Context
Create API functions for uploading, retrieving, and deleting chat attachments.

### Prompt
```
Create or update src/api/chat.ts with file attachment support:

1. Add constants:
   ```typescript
   const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments';
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   const ALLOWED_TYPES = [
     'image/jpeg',
     'image/png',
     'image/gif',
     'image/webp',
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   ];
   ```

2. Add interface:
   ```typescript
   export interface AttachmentData {
     url: string;
     name: string;
     type: string;
     size: number;
   }
   ```

3. Add uploadAttachment function:
   ```typescript
   export async function uploadAttachment(
     file: File,
     conversationId: string
   ): Promise<AttachmentData>
   ```
   - Validate file type against ALLOWED_TYPES
   - Validate file size against MAX_FILE_SIZE
   - Throw ApiError with Arabic message if validation fails:
     - "نوع الملف غير مدعوم" for invalid type
     - "حجم الملف كبير جداً (الحد الأقصى 10 ميجا)" for size
   - Generate storage path: `{conversationId}/{timestamp}-{sanitizedFilename}`
   - Upload to CHAT_ATTACHMENTS_BUCKET
   - Return { url: storagePath, name: file.name, type: file.type, size: file.size }

4. Add getAttachmentUrl function:
   ```typescript
   export async function getAttachmentUrl(path: string): Promise<string>
   ```
   - Create signed URL with 1 hour expiry
   - Return the signed URL
   - Handle errors gracefully

5. Add deleteAttachment function:
   ```typescript
   export async function deleteAttachment(path: string): Promise<void>
   ```
   - Remove file from storage
   - Log warning if deletion fails (using logger)
   - Don't throw on failure (best effort)

6. Helper function to sanitize filename:
   ```typescript
   function sanitizeFilename(name: string): string {
     return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
   }
   ```

7. Helper function to check if file is an image:
   ```typescript
   export function isImageFile(type: string): boolean {
     return type.startsWith('image/');
   }
   ```

Use the existing ApiError class for error handling. Import logger from '@/lib/logger'.
```

---

## Prompt 4.3: Update Chat Page with Attachments

### Context
Update the Chat page to support sending and displaying file attachments.

### Prompt
```
Read src/pages/Chat.tsx and make the following changes:

1. Remove the disabled phone and video call buttons completely (find the buttons with Phone and Video icons and remove them).

2. Add state for file attachment:
   ```typescript
   const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
   const [uploadProgress, setUploadProgress] = useState(0);
   const [isUploading, setIsUploading] = useState(false);
   ```

3. Add a hidden file input:
   ```tsx
   <input
     type="file"
     ref={fileInputRef}
     className="hidden"
     accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
     onChange={handleFileSelect}
   />
   ```

4. Enable the Paperclip button and wire it up:
   ```tsx
   <Button
     variant="ghost"
     size="icon"
     onClick={() => fileInputRef.current?.click()}
     disabled={isUploading}
   >
     <Paperclip className="h-5 w-5" />
   </Button>
   ```

5. Add handleFileSelect function:
   ```typescript
   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     // Validate size
     if (file.size > 10 * 1024 * 1024) {
       toast({
         title: "خطأ",
         description: "حجم الملف كبير جداً (الحد الأقصى 10 ميجا)",
         variant: "destructive",
       });
       return;
     }

     setPendingAttachment(file);
     e.target.value = ''; // Reset input
   };
   ```

6. Add pending attachment preview above the input:
   ```tsx
   {pendingAttachment && (
     <div className="flex items-center gap-2 p-2 bg-muted rounded-lg mb-2">
       {isImageFile(pendingAttachment.type) ? (
         <img
           src={URL.createObjectURL(pendingAttachment)}
           alt="Preview"
           className="h-12 w-12 object-cover rounded"
         />
       ) : (
         <FileIcon className="h-12 w-12 text-muted-foreground" />
       )}
       <div className="flex-1 min-w-0">
         <p className="text-sm font-medium truncate">{pendingAttachment.name}</p>
         <p className="text-xs text-muted-foreground">
           {(pendingAttachment.size / 1024).toFixed(1)} KB
         </p>
       </div>
       <Button
         variant="ghost"
         size="icon"
         onClick={() => setPendingAttachment(null)}
       >
         <X className="h-4 w-4" />
       </Button>
     </div>
   )}
   ```

7. Update the send message function to handle attachments:
   ```typescript
   const handleSendMessage = async () => {
     if (!message.trim() && !pendingAttachment) return;

     let attachmentData = null;

     if (pendingAttachment) {
       setIsUploading(true);
       try {
         attachmentData = await uploadAttachment(pendingAttachment, conversationId);
       } catch (error) {
         toast({
           title: "خطأ",
           description: error.message || "فشل رفع الملف",
           variant: "destructive",
         });
         setIsUploading(false);
         return;
       }
       setIsUploading(false);
     }

     // Send message with attachment data
     await sendMessageMutation.mutateAsync({
       content: message,
       attachment_url: attachmentData?.url,
       attachment_name: attachmentData?.name,
       attachment_type: attachmentData?.type,
       attachment_size: attachmentData?.size,
     });

     setMessage('');
     setPendingAttachment(null);
   };
   ```

8. Update message display to show attachments:
   ```tsx
   {msg.attachment_url && (
     <div className="mt-2">
       {isImageFile(msg.attachment_type) ? (
         <img
           src={attachmentUrls[msg.id] || ''}
           alt={msg.attachment_name}
           className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
           onClick={() => window.open(attachmentUrls[msg.id], '_blank')}
         />
       ) : (
         <a
           href={attachmentUrls[msg.id]}
           target="_blank"
           rel="noopener noreferrer"
           className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80"
         >
           <FileIcon className="h-8 w-8" />
           <div>
             <p className="text-sm font-medium">{msg.attachment_name}</p>
             <p className="text-xs text-muted-foreground">
               {(msg.attachment_size / 1024).toFixed(1)} KB
             </p>
           </div>
           <Download className="h-4 w-4 mr-auto" />
         </a>
       )}
     </div>
   )}
   ```

9. Fetch signed URLs for attachments when messages load:
   ```typescript
   const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});

   useEffect(() => {
     const fetchAttachmentUrls = async () => {
       const urls: Record<string, string> = {};
       for (const msg of messages || []) {
         if (msg.attachment_url && !attachmentUrls[msg.id]) {
           urls[msg.id] = await getAttachmentUrl(msg.attachment_url);
         }
       }
       if (Object.keys(urls).length > 0) {
         setAttachmentUrls(prev => ({ ...prev, ...urls }));
       }
     };
     fetchAttachmentUrls();
   }, [messages]);
   ```

10. Import required functions and icons:
    ```typescript
    import { uploadAttachment, getAttachmentUrl, isImageFile } from '@/api/chat';
    import { FileIcon, Download, X } from 'lucide-react';
    ```

Keep the emoji button disabled for now.
```

---

## Prompt 4.4: Commission Stats API

### Context
Create API functions to fetch real commission statistics from the database.

### Prompt
```
Create or update src/api/commissions.ts with the following:

1. Import dependencies:
   ```typescript
   import { supabase } from '@/integrations/supabase/client';
   import { ApiError } from '@/lib/errors';
   ```

2. Add interfaces:
   ```typescript
   export interface CommissionStats {
     total: number;
     pending: number;
     paid: number;
     thisMonth: number;
   }
   ```

3. Add getCommissionStats function:
   ```typescript
   export async function getCommissionStats(): Promise<CommissionStats>
   ```
   - Query the commissions table
   - Calculate:
     - total: SUM of all commission amounts
     - pending: SUM where status = 'pending' (or however status is tracked)
     - paid: SUM where status = 'paid'
     - thisMonth: SUM where created_at is in current month
   - Handle case where table is empty (return zeros)
   - Use try/catch with proper error handling

4. Add getEmployeeCommissionStats function:
   ```typescript
   export async function getEmployeeCommissionStats(
     employeeId: string
   ): Promise<CommissionStats>
   ```
   - Same as above but filtered by employee_id or user_id

5. Add getCommissionTotals function (simple version):
   ```typescript
   export async function getCommissionTotals(): Promise<number>
   ```
   - Return just the total sum of all commissions
   - This is for the Employees page stats card

Example implementation:
```typescript
export async function getCommissionTotals(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('amount');

    if (error) {
      // Table might not exist or be empty
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return 0;
      }
      throw new ApiError(error.message, error.code);
    }

    const total = (data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
    return total;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Return 0 if any error (table doesn't exist, etc.)
    return 0;
  }
}
```

Note: First check the actual commissions table structure using mcp__supabase__list_tables to see the column names. Adjust the queries accordingly.
```

---

## Prompt 4.5: Commission Stats Hook

### Context
Create React Query hooks to consume the commission stats API.

### Prompt
```
Create or update src/hooks/queries/useCommissions.ts with the following:

1. Import dependencies:
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { getCommissionStats, getEmployeeCommissionStats, getCommissionTotals } from '@/api/commissions';
   ```

2. Add useCommissionStats hook:
   ```typescript
   export function useCommissionStats(employeeId?: string) {
     return useQuery({
       queryKey: ['commissions', 'stats', employeeId],
       queryFn: () => employeeId
         ? getEmployeeCommissionStats(employeeId)
         : getCommissionStats(),
       staleTime: 1000 * 60 * 5, // 5 minutes
     });
   }
   ```

3. Add useCommissionTotals hook:
   ```typescript
   export function useCommissionTotals() {
     return useQuery({
       queryKey: ['commissions', 'totals'],
       queryFn: getCommissionTotals,
       staleTime: 1000 * 60 * 5, // 5 minutes
       // Return 0 on error instead of failing
       retry: false,
       placeholderData: 0,
     });
   }
   ```

4. Export all hooks.

Follow the existing patterns in other hook files.
```

---

## Prompt 4.6: Update Employees Page with Real Commissions

### Context
Replace the mock "0K" commission value with real data from the database.

### Prompt
```
Read src/pages/Employees.tsx and make the following changes:

1. Import the commission totals hook:
   ```typescript
   import { useCommissionTotals } from '@/hooks/queries/useCommissions';
   ```

2. Call the hook inside the component:
   ```typescript
   const { data: commissionTotal, isLoading: loadingCommissions } = useCommissionTotals();
   ```

3. Find the stats card that shows "0K" with "قريباً" (around line 468, in the stats grid).

4. Replace the hardcoded content with:
   ```tsx
   <div className="rounded-xl border bg-card p-4 shadow-card">
     <div className="flex items-center gap-3">
       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
         <Wallet className="h-5 w-5" />
       </div>
       <div>
         <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
         {loadingCommissions ? (
           <div className="h-8 w-24 animate-pulse rounded bg-muted" />
         ) : (
           <p className="text-2xl font-bold">
             {(commissionTotal || 0).toLocaleString('ar-EG')} ج.م
           </p>
         )}
       </div>
     </div>
   </div>
   ```

5. Remove the "قريباً" text entirely.

6. The formatted number should:
   - Use Arabic locale for number formatting
   - Include thousand separators
   - Show "ج.م" (Egyptian Pound) suffix
   - Show 0 if no commissions

Example output: "125,000 ج.م" or "٠ ج.م"
```

---

## Verification Steps

After completing all prompts:

1. [ ] Chat attachments migration applied
2. [ ] Storage bucket 'chat-attachments' exists in Supabase
3. [ ] Can upload images in chat
4. [ ] Can upload documents (PDF, Word, Excel) in chat
5. [ ] Attachments display correctly in messages
6. [ ] Image attachments show preview/thumbnail
7. [ ] Document attachments show download link
8. [ ] File size validation works (rejects > 10MB)
9. [ ] File type validation works (rejects unsupported types)
10. [ ] Commission totals display real numbers
11. [ ] Loading skeleton shows while fetching commissions
12. [ ] Phone/video buttons removed from chat
13. [ ] No console errors
14. [ ] Run `npm run build` successfully

---

## Next Sprint
Continue to **SPRINT_5_PERFORMANCE.md** for performance optimizations.
