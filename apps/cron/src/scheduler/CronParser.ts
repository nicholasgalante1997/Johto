import type { CronSchedule } from './types';
import { CronParseError } from '../utils/errors';

/**
 * Field ranges for cron expressions.
 */
const FIELD_RANGES = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 } // Sunday = 0
} as const;

type FieldName = keyof typeof FIELD_RANGES;

/**
 * Parses standard 5-field cron expressions.
 *
 * Format: minute hour day-of-month month day-of-week
 *
 * Supports:
 * - Wildcards (asterisk)
 * - Ranges (1-5)
 * - Steps (asterisk/15, 1-10/2)
 * - Lists (1,3,5)
 */
export class CronParser {
  /**
   * Parse a cron expression string into a CronSchedule object.
   *
   * @throws CronParseError if the expression is invalid
   */
  static parse(expression: string): CronSchedule {
    const parts = expression.trim().split(/\s+/);

    if (parts.length !== 5) {
      throw new CronParseError(
        expression,
        `expected 5 fields, got ${parts.length}`
      );
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    return {
      minute: this.parseField(minute, 'minute', expression),
      hour: this.parseField(hour, 'hour', expression),
      dayOfMonth: this.parseField(dayOfMonth, 'dayOfMonth', expression),
      month: this.parseField(month, 'month', expression),
      dayOfWeek: this.parseField(dayOfWeek, 'dayOfWeek', expression)
    };
  }

  /**
   * Parse a single cron field into an array of valid values.
   */
  private static parseField(
    field: string,
    fieldName: FieldName,
    expression: string
  ): number[] {
    const { min, max } = FIELD_RANGES[fieldName];
    const values = new Set<number>();

    // Handle comma-separated lists
    const parts = field.split(',');

    for (const part of parts) {
      // Handle step values (*/15 or 1-10/2)
      const stepMatch = part.match(/^(.+)\/(\d+)$/);
      const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
      const range = stepMatch ? stepMatch[1] : part;

      if (step <= 0) {
        throw new CronParseError(expression, `invalid step value: ${step}`);
      }

      let start: number;
      let end: number;

      if (range === '*') {
        start = min;
        end = max;
      } else if (range.includes('-')) {
        const [rangeStart, rangeEnd] = range.split('-').map(Number);
        if (isNaN(rangeStart) || isNaN(rangeEnd)) {
          throw new CronParseError(
            expression,
            `invalid range "${range}" for field ${fieldName}`
          );
        }
        start = rangeStart;
        end = rangeEnd;
      } else {
        const value = parseInt(range, 10);
        if (isNaN(value)) {
          throw new CronParseError(
            expression,
            `invalid value "${range}" for field ${fieldName}`
          );
        }
        start = value;
        end = value;
      }

      // Validate range
      if (start < min || end > max) {
        throw new CronParseError(
          expression,
          `value out of range for ${fieldName}: ${start}-${end} (valid: ${min}-${max})`
        );
      }

      if (start > end) {
        throw new CronParseError(
          expression,
          `invalid range ${start}-${end}: start > end`
        );
      }

      // Generate values with step
      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
    }

    return Array.from(values).sort((a, b) => a - b);
  }

  /**
   * Check if a date matches a cron schedule.
   */
  static matches(schedule: CronSchedule, date: Date): boolean {
    return (
      schedule.minute.includes(date.getMinutes()) &&
      schedule.hour.includes(date.getHours()) &&
      schedule.dayOfMonth.includes(date.getDate()) &&
      schedule.month.includes(date.getMonth() + 1) &&
      schedule.dayOfWeek.includes(date.getDay())
    );
  }

  /**
   * Calculate the next run time for a schedule from a given date.
   *
   * @param schedule - The parsed cron schedule
   * @param from - The starting date (defaults to now)
   * @returns The next date that matches the schedule
   * @throws Error if no match is found within 1 year
   */
  static getNextRunTime(schedule: CronSchedule, from: Date = new Date()): Date {
    const next = new Date(from);
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);

    // Search up to 1 year ahead (366 days * 24 hours * 60 minutes)
    const maxIterations = 366 * 24 * 60;

    for (let i = 0; i < maxIterations; i++) {
      if (this.matches(schedule, next)) {
        return next;
      }
      next.setMinutes(next.getMinutes() + 1);
    }

    throw new Error('Could not find next run time within 1 year');
  }

  /**
   * Validate a cron expression string.
   *
   * @returns Object with valid boolean and optional error message
   */
  static validate(expression: string): { valid: boolean; error?: string } {
    try {
      this.parse(expression);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a human-readable description of a cron expression.
   */
  static describe(expression: string): string {
    try {
      const schedule = this.parse(expression);
      const parts: string[] = [];

      // Minute
      if (schedule.minute.length === 60) {
        parts.push('every minute');
      } else if (schedule.minute.length === 1) {
        parts.push(`at minute ${schedule.minute[0]}`);
      } else {
        parts.push(`at minutes ${schedule.minute.join(', ')}`);
      }

      // Hour
      if (schedule.hour.length === 24) {
        parts.push('of every hour');
      } else if (schedule.hour.length === 1) {
        parts.push(`of hour ${schedule.hour[0]}`);
      } else {
        parts.push(`of hours ${schedule.hour.join(', ')}`);
      }

      // Day of month
      if (schedule.dayOfMonth.length < 31) {
        parts.push(`on day ${schedule.dayOfMonth.join(', ')}`);
      }

      // Month
      if (schedule.month.length < 12) {
        const monthNames = [
          '',
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ];
        parts.push(`in ${schedule.month.map((m) => monthNames[m]).join(', ')}`);
      }

      // Day of week
      if (schedule.dayOfWeek.length < 7) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        parts.push(
          `on ${schedule.dayOfWeek.map((d) => dayNames[d]).join(', ')}`
        );
      }

      return parts.join(' ');
    } catch {
      return 'Invalid cron expression';
    }
  }
}
