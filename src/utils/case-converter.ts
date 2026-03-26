type Primitive = string | number | boolean | null | undefined;
type JsonValue = Primitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter, index) => `${index > 0 ? "_" : ""}${letter.toLowerCase()}`);
}

export function objectToSnakeCase<T extends JsonObject = JsonObject>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => objectToSnakeCase(item)) as unknown as T;
  }

  if (typeof obj !== "object") {
    return obj as unknown as T;
  }

  if (obj instanceof Date) {
    return obj as unknown as T;
  }

  const result: JsonObject = {};
  const record = obj as Record<string, unknown>;

  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const snakeKey = camelToSnake(key);
      const value = record[key];

      if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        result[snakeKey] = objectToSnakeCase(value);
      } else if (Array.isArray(value)) {
        result[snakeKey] = value.map((item) =>
          typeof item === "object" && item !== null ? objectToSnakeCase(item) : item
        ) as JsonArray;
      } else {
        result[snakeKey] = value as JsonValue;
      }
    }
  }

  return result as T;
}
