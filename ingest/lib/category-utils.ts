function normalizeCategoryArray(values: unknown[]): unknown[] {
  return values.map((value) =>
    typeof value === "string" ? value.trim() : value,
  );
}

function tryParseJsonArray(value: string): unknown[] | null {
  if (!value.startsWith("[") || !value.endsWith("]")) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return normalizeCategoryArray(parsed);
  } catch {
    return null;
  }
}

export function normalizeCategoriesInput(value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return normalizeCategoryArray(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    const parsedJson = tryParseJsonArray(trimmed);
    if (parsedJson) {
      return parsedJson;
    }

    if (trimmed.includes(",")) {
      return normalizeCategoryArray(trimmed.split(","));
    }

    return [trimmed];
  }

  return value;
}
