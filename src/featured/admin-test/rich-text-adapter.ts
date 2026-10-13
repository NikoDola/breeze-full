import type { JSONContent } from "@tiptap/core";
import { validateRichText, type RichText, type RichTextNode, type RichTextRun } from "../../../cms/shared/rich-text";

export function toTiptap(value: RichText): JSONContent {
  const document = validateRichText(value, "Heading", false);
  return { type: "doc", content: [{ type: "paragraph", content: document.content.map(node => {
    if (node.type === "break") return { type: "hardBreak" };
    const marks = [];
    if (node.bold) marks.push({ type: "bold" });
    if (node.italic) marks.push({ type: "italic" });
    if (node.color === "accent") marks.push({ type: "breezeAccent" });
    return { type: "text", text: node.text, ...(marks.length ? { marks } : {}) };
  }) }] };
}

export function fromTiptap(doc: JSONContent): RichText {
  if (doc.type !== "doc" || doc.content?.length !== 1 || doc.content[0].type !== "paragraph") throw new Error("A heading must be one text field.");
  const content: RichTextNode[] = (doc.content[0].content ?? []).map(node => {
    if (node.type === "hardBreak") return { type: "break" };
    if (node.type !== "text" || typeof node.text !== "string") throw new Error("Unsupported heading content.");
    const run: RichTextRun = { type: "text", text: node.text };
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") run.bold = true;
      else if (mark.type === "italic") run.italic = true;
      else if (mark.type === "breezeAccent") run.color = "accent";
      else throw new Error("Unsupported heading formatting.");
    }
    return run;
  });
  return validateRichText({ version: 1, content }, "Heading", false);
}
