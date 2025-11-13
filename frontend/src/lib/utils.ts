// Utility functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * IST timezone offset in minutes (UTC+5:30)
 */
const IST_OFFSET_MINUTES = 330;

/**
 * Get current date in IST timezone (YYYY-MM-DD format)
 * This ensures we're working with the correct "today" according to Indian time
 */
export function getTodayIST(): string {
  const now = new Date();
  
  // Get current UTC time and add IST offset
  const istTime = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  
  // Extract date components in IST
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM-DD
 * @deprecated Use getTodayIST() for current date in IST
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  // Guard against negative values (edge case protection)
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get first day of month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Check if a date string (YYYY-MM-DD) is today in IST
 */
export function isTodayIST(dateString: string): boolean {
  return dateString === getTodayIST();
}

/**
 * Check if date is today
 * @deprecated Use isTodayIST() with date string for IST-aware checking
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert audio blob to File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  console.log('[blobToFile] Input:', {
    blobSize: blob.size,
    blobType: blob.type,
    filename,
  });

  const file = new File([blob], filename, { type: blob.type });

  console.log('[blobToFile] Output:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    lastModified: file.lastModified,
  });

  return file;
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateFormat(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

/**
 * Check if a date string is in the future (IST)
 */
export function isFutureIST(dateString: string): boolean {
  if (!isValidDateFormat(dateString)) {
    return false;
  }
  const today = getTodayIST();
  return dateString > today;
}

/**
 * Check if a date string is in the past (IST)
 */
export function isPastIST(dateString: string): boolean {
  if (!isValidDateFormat(dateString)) {
    return false;
  }
  const today = getTodayIST();
  return dateString < today;
}

/**
 * Get current IST time as a readable string for display
 */
export function getCurrentISTString(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istTime.toISOString().replace('Z', '+05:30');
}
