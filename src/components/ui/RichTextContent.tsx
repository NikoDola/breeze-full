import { Fragment, type ReactNode } from "react";
import type { RichText } from "../../../cms/shared/rich-text";
import styles from "./rich-text.module.css";

// Public/preview renderer deliberately has no editor dependency or HTML parser.
export default function RichTextContent({ value }: { value: RichText }) {
  return value.content.map((node, index) => {
    if (node.type === "break") return <br key={index} />;
    let child: ReactNode = node.text;
    if (node.bold) child = <strong className={styles.bold}>{child}</strong>;
    if (node.italic) child = <i className={styles.italic}>{child}</i>;
    // Keep Breeze's existing accent element/CSS for byte-identical converted copy.
    // Italic is a separate mark and never uses this legacy color hook.
    if (node.color === "accent") child = <em>{child}</em>;
    return <Fragment key={index}>{child}</Fragment>;
  });
}
