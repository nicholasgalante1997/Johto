export default class Primitives {
  public static coerceToString(value: unknown, defaultValue = ''): string {
    if (value === null || value === undefined) {
      return defaultValue;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    if (typeof value === 'object') {
      if ('toString' in value) {
        return value.toString();
      }

      try {
        return JSON.stringify(value);
      } catch (e) {
        return (value as Object).toString();
      }
    }

    if (typeof value === 'function') {
      return value.name || value.toString();
    }

    if (typeof value === 'symbol') {
      return value.description || value.toString();
    }

    if (
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean'
    ) {
      return value.toString();
    }

    if (value) return value.toString();

    return defaultValue;
  }

  public static coerceToArray(value: unknown): unknown[] {
    if (value === null || value === undefined) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (value instanceof Set) {
      return Array.from(value);
    }

    if (value instanceof Map) {
      return Array.from(value);
    }

    if (typeof value === 'object') {
      return Object.entries(value);
    }

    return [value];
  }
}
