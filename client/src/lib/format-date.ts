/**
 * Formats a date into a user-friendly string
 * @param date The date to format, can be Date object, string or number
 * @param options Optional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number, 
  options: { longFormat?: boolean } = {}
): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is invalid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Format options
  const { longFormat } = options;
  
  if (longFormat) {
    // Long format: "October 12, 2023 at 2:30 PM"
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Default format: "Oct 12, 2023"
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a date to show relative time (e.g. "2 days ago")
 * @param date The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is invalid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Default to standard date format
  return formatDate(dateObj);
}
