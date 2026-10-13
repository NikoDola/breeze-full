import { InputError, exactKeys, record, text } from "./validation";

// A bounded, editor-independent inline format. Never contains HTML or CSS.
export type RichTextRun = { type: "text"; text: string; bold?: true; italic?: true; color?: "accent" };
export type RichTextNode = RichTextRun | { type: "break" };
export type RichText = { version: 1; content: RichTextNode[] };
export const HEADING_MAX_LENGTH = 600;
export const HEADING_MAX_NODES = 256;
export const HEADING_MAX_BREAKS = 8;

export function richTextPlainText(value: RichText): string {
  return value.content.map(node => node.type === "break" ? "\n" : node.text).join("");
}

export function validateRichText(value: unknown, name = "Heading", required = true): RichText {
  const source = record(value);
  exactKeys(source, ["version", "content"], name);
  if (source.version !== 1 || !Array.isArray(source.content) || source.content.length > HEADING_MAX_NODES) {
    throw new InputError(`${name} has an unsupported format or too many formatting changes.`);
  }
  const content: RichTextNode[] = [];
  let length = 0, breaks = 0;
  for (const item of source.content) {
    const node = record(item);
    if (node.type === "break") {
      exactKeys(node, ["type"], name);
      content.push({ type: "break" }); breaks++; length++;
    } else if (node.type === "text") {
      exactKeys(node, ["type", "text", "bold", "italic", "color"], name);
      const run: RichTextRun = { type: "text", text: text(node.text, name, HEADING_MAX_LENGTH) };
      for (const mark of ["bold", "italic"] as const) {
        if (Object.hasOwn(node, mark)) {
          if (node[mark] !== true) throw new InputError(`Unsupported formatting in ${name}.`);
          run[mark] = true;
        }
      }
      if (Object.hasOwn(node, "color")) {
        if (node.color !== "accent") throw new InputError(`Unsupported color in ${name}.`);
        run.color = "accent";
      }
      length += run.text.length;
      const last = content.at(-1);
      if (!run.text) continue;
      if (last?.type === "text" && last.bold === run.bold && last.italic === run.italic && last.color === run.color) last.text += run.text;
      else content.push(run);
    } else throw new InputError(`Unsupported content in ${name}.`);
  }
  if (length > HEADING_MAX_LENGTH || breaks > HEADING_MAX_BREAKS) {
    throw new InputError(`${name} allows at most ${HEADING_MAX_LENGTH} characters and ${HEADING_MAX_BREAKS} line breaks.`);
  }
  const result: RichText = { version: 1, content };
  if (required && !richTextPlainText(result).trim()) throw new InputError(`${name} is required.`);
  return result;
}
