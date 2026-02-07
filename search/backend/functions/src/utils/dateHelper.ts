/**
 * Date helper functions
 */
export class DateHelper {
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get current timestamp
   */
  static getCurrentTimestamp(): number {
    return Date.now();
  }

  /**
   * Format date to readable string
   */
  static formatDate(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Check if date is valid
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
}
