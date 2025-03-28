import type { MouseEventHandler, ReactNode } from "react";
import { useState } from "react";

import styles from "./CodeBlock.module.css";

// export const links = () => [
//     { rel: "stylesheet", href: styles },
// ];
type CodeBlockProps = {
  text?: string;
  inline?: boolean;
  children?: ReactNode;
};
/**
 *
 * @param param0
 * @returns
 */
export const CodeBlock = ({ text, inline, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const copyText: MouseEventHandler<HTMLButtonElement> | undefined = async e => {
    e.stopPropagation();
    const textToCopy = text ? text : children;
    await navigator.clipboard.writeText(textToCopy ? textToCopy.toString() : "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  const CopyButton = ({ small }: { small?: boolean } = {}) => (
    <button
      name="copy"
      disabled={copied}
      data-text={text}
      onClick={copyText}
      className={`${styles.copyButton} ${small && styles.small} ${copied ? styles.disabled : ""}`}
    >
      {copied ? (
        "✓"
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512">
          {/*Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
          <path
            fill={"grey"}
            d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"
          />
        </svg>
      )}
    </button>
  );
  if (inline) {
    return (
      <span className={`${styles.codeBlock} ${styles.codeContainer}`}>
        <code className={styles.codeBlockText}>{text ? text : children}</code>
        <CopyButton small />
      </span>
    );
  }
  return (
    <div>
      <pre className={`${styles.codeBlock} ${styles.codeContainer}`}>
        <code className={styles.codeBlockText}>{text ? text : children}</code>
        <CopyButton />
      </pre>
    </div>
  );
};
