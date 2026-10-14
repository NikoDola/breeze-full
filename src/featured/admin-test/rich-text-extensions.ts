import { Extension, Mark } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import HardBreak from "@tiptap/extension-hard-break";
import { UndoRedo } from "@tiptap/extensions/undo-redo";
import { Plugin } from "@tiptap/pm/state";
import { Fragment, Slice, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { fromTiptap } from "./rich-text-adapter";
import { MAX_BODY_BYTES } from "../../../cms/shared/contract";

function oversizedPaste(...values: string[]) {
  // Bound the strings before allocating UTF-8 buffers for multibyte text.
  return values.reduce((size, value) => size + value.length, 0) > MAX_BODY_BYTES ||
    values.reduce((size, value) => size + new TextEncoder().encode(value).length, 0) > MAX_BODY_BYTES;
}

// Fixed semantic mark: no user-provided style, color string or attributes.
const Accent = Mark.create({
  name: "breezeAccent",
  parseHTML: () => [
    { tag: 'span[data-breeze-color="accent"]' },
    { style: "color", getAttrs: value => ["#f58237", "rgb(245, 130, 55)"].includes(value.toLowerCase()) ? {} : false },
  ],
  renderHTML: () => ["span", { "data-breeze-color": "accent" }, 0],
});

export function headingExtensions(onRejected: (message: string) => void = () => {}) {
  return [
    Document.extend({ content: "paragraph" }), Paragraph, Text, Bold, Italic, Accent,
    HardBreak.extend({
      addKeyboardShortcuts() {
        return { ...this.parent?.(), Enter: () => this.editor.view.composing ? false : this.editor.commands.setHardBreak() };
      },
    }),
    UndoRedo,
    Extension.create({
      name: "headingLimits",
      addProseMirrorPlugins: () => [new Plugin({
        filterTransaction(transaction) {
          if (!transaction.docChanged) return true;
          try { fromTiptap(transaction.doc.toJSON()); return true; }
          catch (error) { queueMicrotask(() => onRejected(error instanceof Error ? error.message : "This heading is too long.")); return false; }
        },
        props: {
          handleDOMEvents: {
            paste(_view, event) {
              const clipboard = event.clipboardData;
              const message = clipboard?.files.length ? "Paste text into a heading; images are managed separately."
                : oversizedPaste(clipboard?.getData("text/html") ?? "", clipboard?.getData("text/plain") ?? "")
                  ? "The pasted content is too large for a heading." : null;
              if (!message) return false;
              event.preventDefault(); onRejected(message); return true;
            },
            drop(_view, event) { event.preventDefault(); return true; },
          },
          // Also guard programmatic paste and the browser's clipboard fallback before parsing.
          transformPastedHTML(html) {
            if (!oversizedPaste(html)) return html;
            onRejected("The pasted content is too large for a heading."); return "";
          },
          transformPastedText(text) {
            if (!oversizedPaste(text)) return text;
            onRejected("The pasted content is too large for a heading."); return "";
          },
          // ProseMirror parses clipboard HTML through the allowlisted schema first.
          // Flatten pasted paragraphs into inline runs with explicit line breaks.
          transformPasted(slice, view) {
            const nodes: ProseMirrorNode[] = [];
            function flatten(fragment: Fragment) {
              fragment.forEach(node => {
                if (node.isInline) nodes.push(node);
                else {
                  if (nodes.length) nodes.push(view.state.schema.nodes.hardBreak.create());
                  flatten(node.content);
                }
              });
            }
            flatten(slice.content);
            return new Slice(Fragment.fromArray(nodes), 0, 0);
          },
          handleDrop: () => true, // Headings accept pasted text, never file uploads or embeds.
          handlePaste(_view, event) {
            const clipboard = event.clipboardData;
            if (clipboard?.files.length) { onRejected("Paste text into a heading; images are managed separately."); return true; }
            if (oversizedPaste(clipboard?.getData("text/html") ?? "", clipboard?.getData("text/plain") ?? "")) { onRejected("The pasted content is too large for a heading."); return true; }
            return false;
          },
        },
      })],
    }),
  ];
}
