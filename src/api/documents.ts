/**
 * API functions for employee documents operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const DOCUMENTS_BUCKET = 'employee-documents';
const SIGNED_URL_TTL_SECONDS = 60 * 10;

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');

export type DocumentType = 'contract' | 'id_card' | 'certificate' | 'resume' | 'other';

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: DocumentType;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  uploaded_by: string;
  expiry_date: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithProfile extends EmployeeDocument {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: string | null;
  };
  uploaded_by_profile?: {
    full_name: string | null;
    email: string;
  };
}

export interface DocumentInsert {
  employee_id: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  uploaded_by: string;
  expiry_date?: string;
}

export interface DocumentUpdate {
  document_type?: DocumentType;
  title?: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  expiry_date?: string;
  is_verified?: boolean;
  verified_by?: string;
  verified_at?: string;
}

export interface DocumentUploadResult {
  path: string;
  fileName: string;
  fileSize: number;
}

export const documentsApi = {
  async uploadFile(file: File, employeeId: string): Promise<DocumentUploadResult> {
    try {
      const safeName = sanitizeFilename(file.name || 'document');
      const path = `${employeeId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });

      if (error) throw new ApiError(error.message, error.code, error.details);

      return {
        path,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل رفع الملف', 'UPLOAD_FAILED');
    }
  },

  async createSignedUrl(fileUrlOrPath: string, expiresInSeconds = SIGNED_URL_TTL_SECONDS): Promise<string> {
    try {
      if (isHttpUrl(fileUrlOrPath)) return fileUrlOrPath;

      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(fileUrlOrPath, expiresInSeconds);

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data?.signedUrl) throw new ApiError('تعذر إنشاء رابط التحميل', 'SIGNED_URL_FAILED');

      return data.signedUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('تعذر إنشاء رابط التحميل', 'SIGNED_URL_FAILED');
    }
  },

  async removeFile(path: string): Promise<void> {
    if (!path || isHttpUrl(path)) return;
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    if (error) {
      logger.warn('Failed to remove document file from storage', { error: error.message, path });
    }
  },

  async list(filters?: {
    employeeId?: string;
    documentType?: DocumentType;
    isVerified?: boolean;
  }): Promise<DocumentWithProfile[]> {
    try {
      let query = supabase
        .from('employee_documents')
        .select(`
          *,
          profiles!employee_documents_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.documentType) {
        query = query.eq('document_type', filters.documentType);
      }
      if (filters?.isVerified !== undefined) {
        query = query.eq('is_verified', filters.isVerified);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as DocumentWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل المستندات', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<DocumentWithProfile> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          *,
          profiles!employee_documents_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('المستند غير موجود', 'NOT_FOUND');
      return data as DocumentWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل المستند', 'UNKNOWN_ERROR');
    }
  },

  async create(document: DocumentInsert): Promise<EmployeeDocument> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .insert(document)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء المستند', 'CREATE_FAILED');
      return data as EmployeeDocument;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إنشاء المستند', 'UNKNOWN_ERROR');
    }
  },

  async update(id: string, updates: DocumentUpdate): Promise<EmployeeDocument> {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('المستند غير موجود', 'NOT_FOUND');
      return data as EmployeeDocument;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث المستند', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('employee_documents')
        .select('file_url')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        logger.warn('Failed to fetch document before delete', { error: fetchError.message, documentId: id });
      }

      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);

      if (existing?.file_url) {
        await documentsApi.removeFile(existing.file_url);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف المستند', 'UNKNOWN_ERROR');
    }
  },

  async verify(id: string, verifiedBy: string): Promise<EmployeeDocument> {
    return this.update(id, {
      is_verified: true,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    });
  },
};
