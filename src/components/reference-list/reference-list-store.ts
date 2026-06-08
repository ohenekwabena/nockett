import type { ReferenceEntity } from "./descriptor";

/**
 * Pure list transitions and helpers shared by the reference-list hook. Kept free
 * of React and any service so create/edit/delete/revert behavior is unit-testable
 * directly (the test env is node — no DOM).
 */
export type ReferenceAction =
  | { type: "loaded"; items: ReferenceEntity[] }
  | { type: "created"; item: ReferenceEntity }
  | { type: "updated"; id: number; name: string }
  | { type: "removed"; id: number };

export function referenceReducer(items: ReferenceEntity[], action: ReferenceAction): ReferenceEntity[] {
  switch (action.type) {
    case "loaded":
      return action.items;
    case "created":
      return [...items, action.item];
    case "updated":
      return items.map((item) => (item.id === action.id ? { ...item, name: action.name } : item));
    case "removed":
      return items.filter((item) => item.id !== action.id);
  }
}

/** Trim a raw input; returns the cleaned name, or null when it is blank. */
export function validateName(raw: string): string | null {
  const name = raw.trim();
  return name.length > 0 ? name : null;
}

/** Title-case each word: "service type" -> "Service Type". */
export function titleCase(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}
