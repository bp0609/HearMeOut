/**
 * Date Utilities for Indian Standard Time (IST, UTC+5:30)
 * 
 * All date operations in the application should use these utilities
 * to ensure consistent handling of dates in IST timezone.
 */

// IST offset: +5 hours 30 minutes = 330 minutes
const IST_OFFSET_MINUTES = 330;

/**
 * Get current date in IST timezone (date-only, no time)
 * Returns a Date object set to midnight UTC representing the IST date
 * 
 * Example: If IST time is 2025-11-13 14:30:00 IST
 *          Returns: 2025-11-13 00:00:00 UTC
 */
export function getTodayIST(): Date {
  const now = new Date();

  // Get current UTC time in milliseconds
  const utcTime = now.getTime();

  // Add IST offset to get IST time
  const istTime = new Date(utcTime + IST_OFFSET_MINUTES * 60 * 1000);

  // Extract date components in IST
  const year = istTime.getUTCFullYear();
  const month = istTime.getUTCMonth();
  const day = istTime.getUTCDate();

  // Return midnight UTC representing this IST date
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Parse a date string (YYYY-MM-DD) and return Date object
 * Returns midnight UTC for the given date
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object set to midnight UTC for the given date
 */
export function parseDateString(dateString: string): Date {
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
  }

  const [year, month, day] = dateString.split('-').map(Number);

  // Validate ranges
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12`);
  }

  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}. Must be between 1 and 31`);
  }

  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  // Check if date is valid (handles invalid dates like Feb 30)
  if (date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateToString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start of month in IST
 * 
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Date object for first day of month at midnight UTC
 */
export function getMonthStartIST(year: number, month: number): Date {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12`);
  }
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

/**
 * Get end of month in IST
 * 
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Date object for last day of month at 23:59:59.999 UTC
 */
export function getMonthEndIST(year: number, month: number): Date {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12`);
  }
  // Get first day of next month, then subtract 1ms
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

/**
 * Get date N days ago from today (IST)
 * 
 * @param daysAgo - Number of days to go back
 * @returns Date object for N days ago at midnight UTC
 */
export function getDaysAgoIST(daysAgo: number): Date {
  const today = getTodayIST();
  const targetDate = new Date(today);
  targetDate.setUTCDate(targetDate.getUTCDate() - daysAgo);
  return targetDate;
}

/**
 * Check if a date is today (in IST)
 * 
 * @param date - Date to check
 * @returns true if the date is today in IST timezone
 */
export function isToday(date: Date): boolean {
  const today = getTodayIST();
  return date.getTime() === today.getTime();
}

/**
 * Check if a date is in the future (in IST)
 * 
 * @param date - Date to check
 * @returns true if the date is after today in IST timezone
 */
export function isFuture(date: Date): boolean {
  const today = getTodayIST();
  return date.getTime() > today.getTime();
}

/**
 * Check if a date is in the past (in IST)
 * 
 * @param date - Date to check
 * @returns true if the date is before today in IST timezone
 */
export function isPast(date: Date): boolean {
  const today = getTodayIST();
  return date.getTime() < today.getTime();
}

/**
 * Get current IST time as a formatted string for logging
 * 
 * @returns Current IST time in ISO format with IST suffix
 */
export function getCurrentISTString(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istTime.toISOString().replace('Z', '+05:30');
}

/**
 * Validate that a date string is not in the future (IST)
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @throws Error if date is in the future
 */
export function validateNotFuture(dateString: string): void {
  const date = parseDateString(dateString);
  if (isFuture(date)) {
    throw new Error(`Date ${dateString} is in the future. Cannot create entries for future dates.`);
  }
}

/**
 * Validate that a date string is within a reasonable range
 * (not more than 1 year in the past, not in the future)
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @throws Error if date is out of range
 */
export function validateReasonableRange(dateString: string): void {
  const date = parseDateString(dateString);
  const oneYearAgo = getDaysAgoIST(365);

  if (isFuture(date)) {
    throw new Error(`Date ${dateString} is in the future. Cannot create entries for future dates.`);
  }

  if (date.getTime() < oneYearAgo.getTime()) {
    throw new Error(`Date ${dateString} is more than 1 year in the past.`);
  }
}

/**
 * Get day of week from a date
 * 
 * @param date - Date object
 * @returns Day of week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
 */
export function getDayOfWeek(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getUTCDay()];
}
