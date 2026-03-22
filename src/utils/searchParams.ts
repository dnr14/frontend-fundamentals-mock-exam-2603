export interface FieldConfig<T> {
  urlKey: string;
  defaultValue: T;
  parse: (value: string) => T;
  serialize: (value: T) => string | null;
}

export type ParamsConfig<T> = { [K in keyof T]: FieldConfig<T[K]> };

export function parseFromParams<T>(searchParams: URLSearchParams, config: ParamsConfig<T>): Partial<T> {
  const entries = Object.entries(config) as [keyof T, FieldConfig<unknown>][];
  const result = {} as T;

  for (const [key, fieldConfig] of entries) {
    const raw = searchParams.get(fieldConfig.urlKey);
    if (raw != null) {
      (result as unknown as Record<string, unknown>)[key as string] = fieldConfig.parse(raw);
    }
  }

  return result;
}

export function toSearchParams<T>(filter: T, config: ParamsConfig<T>): URLSearchParams {
  const params = new URLSearchParams();
  const entries = Object.entries(config) as [keyof T, FieldConfig<unknown>][];

  for (const [key, fieldConfig] of entries) {
    const serialized = (fieldConfig.serialize as (v: unknown) => string | null)(filter[key]);
    if (serialized != null) {
      params.set(fieldConfig.urlKey, serialized);
    }
  }

  return params;
}
