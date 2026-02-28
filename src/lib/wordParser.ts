/**
 * Word file parser for extracting phone numbers and employee assignments
 * Uses mammoth.js to extract text from .docx files
 */

import mammoth from 'mammoth';

export interface ParsedPhoneData {
  assignmentMode: 'cold_calling' | 'targeted';
  assignments: Array<{
    employeeName: string;
    phoneNumbers: string[];
  }>;
}

/**
 * Parse a Word document to extract phone numbers and assignments
 *
 * Expected format:
 * - Cold calling: "Random Data(employee_name)" followed by phone numbers
 * - Targeted: "Data From Page(employee_name)" followed by phone numbers
 */
export async function parseWordFile(file: File): Promise<ParsedPhoneData> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text from Word document
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    // Detect assignment mode
    const isColdCalling = /Random Data/i.test(text);
    const isTargeted = /Data Frome? Page/i.test(text);

    if (!isColdCalling && !isTargeted) {
      throw new Error('تنسيق الملف غير صحيح. يجب أن يحتوي على "Random Data" أو "Data From Page"');
    }

    const assignmentMode: 'cold_calling' | 'targeted' = isColdCalling ? 'cold_calling' : 'targeted';
    const assignments: Array<{ employeeName: string; phoneNumbers: string[] }> = [];

    // Split text into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentEmployee: string | null = null;
    let currentNumbers: string[] = [];

    for (const line of lines) {
      // Check if line is a header with employee name
      const randomDataMatch = line.match(/Random Data\s*\((.+?)\)/i);
      const targetedDataMatch = line.match(/Data Frome? Page\s*\((.+?)\)/i);

      if (randomDataMatch || targetedDataMatch) {
        // Save previous employee's data
        if (currentEmployee && currentNumbers.length > 0) {
          assignments.push({
            employeeName: currentEmployee,
            phoneNumbers: [...currentNumbers],
          });
        }

        // Start new employee
        currentEmployee = (randomDataMatch || targetedDataMatch)![1].trim();
        currentNumbers = [];
      } else {
        // Check if line is a phone number (10-11 digits)
        const phoneMatch = line.match(/^(\d{10,11})$/);
        if (phoneMatch && currentEmployee) {
          currentNumbers.push(phoneMatch[1]);
        }
      }
    }

    // Save last employee's data
    if (currentEmployee && currentNumbers.length > 0) {
      assignments.push({
        employeeName: currentEmployee,
        phoneNumbers: [...currentNumbers],
      });
    }

    if (assignments.length === 0) {
      throw new Error('لم يتم العثور على أرقام هواتف في الملف');
    }

    return {
      assignmentMode,
      assignments,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('فشل في قراءة الملف');
  }
}

/**
 * Validate phone number format (Egyptian mobile numbers)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Egyptian mobile: 10 or 11 digits starting with 01
  return /^01\d{8,9}$/.test(phone);
}
