export function value<T>(items: { [k: string]: T }[], k: string): T {
  return items.find(w => w[k])[k];
}
