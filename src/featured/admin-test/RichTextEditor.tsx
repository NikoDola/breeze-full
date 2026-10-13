"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { HEADING_MAX_LENGTH, richTextPlainText, type RichText } from "../../../cms/shared/rich-text";
import { fromTiptap, toTiptap } from "./rich-text-adapter";
import { headingExtensions } from "./rich-text-extensions";
import css from "./rich-text-editor.module.css";

export default function RichTextEditor({ value, onChange, disabled, label, help }: {
  value: RichText; onChange: (value: RichText) => void; disabled: boolean; label: string; help?: string;
}) {
  const id = useId(), [error, setError] = useState("");
  const change = useRef(onChange); change.current = onChange;
  const locked = useRef(disabled); locked.current = disabled;
  const extensions = useMemo(() => headingExtensions(setError), []);
  const blockWhenLocked = (_view: unknown, event: Event) => { if (!locked.current) return false; event.preventDefault(); return true; };
  const editor = useEditor({
    extensions,
    content: toTiptap(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    enableContentCheck: true,
    enableInputRules: false,
    enablePasteRules: false,
    editable: !disabled,
    editorProps: { attributes: {
      role: "textbox", "aria-multiline": "true", "aria-labelledby": `${id}-label`,
      "aria-describedby": `${id}-help`, spellcheck: "true", class: css.input,
    }, handleDOMEvents: {
      beforeinput: blockWhenLocked,
      paste: blockWhenLocked,
      drop: blockWhenLocked,
    } },
    onUpdate: ({ editor: current }) => {
      if (locked.current) return;
      setError(""); change.current(fromTiptap(current.getJSON()));
    },
    onContentError: () => setError("This heading could not be loaded. Refresh the saved draft before editing."),
  });
  const state = useEditorState({ editor, selector: ({ editor: current }) => current ? {
    bold: current.isActive("bold"), italic: current.isActive("italic"), accent: current.isActive("breezeAccent"),
    undo: current.can().undo(), redo: current.can().redo(),
  } : null });

  useEffect(() => { editor?.setEditable(!disabled, false); }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    // Parent echoes never replace editor state: preserve cursor, composition and undo.
    if (JSON.stringify(fromTiptap(editor.getJSON())) !== JSON.stringify(value)) {
      editor.commands.setContent(toTiptap(value), { emitUpdate: false, errorOnInvalidContent: true });
    }
  }, [editor, value]);

  const unavailable = disabled || !editor;
  return <div className={css.field}>
    <span id={`${id}-label`} className={css.label}>{label}</span>
    <div className={css.frame} data-disabled={unavailable || undefined}>
      <div className={css.toolbar} role="group" aria-label={`${label} formatting`}>
        <button type="button" title="Bold (Ctrl+B)" aria-label="Bold" aria-pressed={state?.bold ?? false} disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" title="Italic (Ctrl+I)" aria-label="Italic" aria-pressed={state?.italic ?? false} disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
        <span className={css.divider} aria-hidden="true" />
        <button type="button" title="Default text color" aria-label="Default text color" aria-pressed={!state?.accent} disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().unsetMark("breezeAccent").run()}><span className={css.defaultSwatch} aria-hidden="true" />Default</button>
        <button type="button" title="Breeze orange" aria-label="Breeze orange" aria-pressed={state?.accent ?? false} disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().setMark("breezeAccent").run()}><span className={css.orangeSwatch} aria-hidden="true" />Orange</button>
        <span className={css.divider} aria-hidden="true" />
        <button type="button" title="Clear selected formatting" disabled={unavailable} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().unsetAllMarks().run()}>Clear</button>
        <button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={unavailable || !state?.undo} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().undo().run()}>↶</button>
        <button type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={unavailable || !state?.redo} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().redo().run()}>↷</button>
      </div>
      <EditorContent editor={editor} />
    </div>
    <div className={css.help}><small id={`${id}-help`}>{help}</small><small>{richTextPlainText(value).length}/{HEADING_MAX_LENGTH}</small></div>
    {error && <p className={css.error} role="alert">{error}</p>}
  </div>;
}
