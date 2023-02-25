type Value<T> = { [k: string]: T };

export function value<T>(items: Value<T>[] | Value<T>, k: string): T {
  return Array.isArray(items) ? items.find(w => w[k])[k] : items[k] as T;
}
