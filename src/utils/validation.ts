export interface ValidationRule<T> {
  check: (value: T) => boolean;
  message: string;
}

export function validate<T>(value: T, rules: ValidationRule<T>[]): string | null {
  return rules.find(rule => rule.check(value))?.message ?? null;
}
