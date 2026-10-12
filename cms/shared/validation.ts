export class InputError extends Error { status = 400; }

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Expected an object.");
  return value as Record<string, unknown>;
}

export function text(value: unknown, name: string, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim()) || /\u0000/.test(value)) {
    throw new InputError(`Invalid ${name} (maximum ${max} characters).`);
  }
  return value;
}

export function exactKeys(value: Record<string, unknown>, keys: readonly string[], name: string) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new InputError(`Unsupported field in ${name}.`);
}
