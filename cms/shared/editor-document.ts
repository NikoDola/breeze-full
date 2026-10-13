import type { Document } from "./contract";
import { editableHome } from "./home";

// Compare the editable representation so conversion/opening/undo isn't a content edit.
// Empty temporary headings remain comparable even though Save requires valid content.
export function sameEditorDocument(left: Document, right: Document) {
  const comparable = (value: Document) => value.schemaVersion === 2 ? editableHome(value) : value;
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
}
