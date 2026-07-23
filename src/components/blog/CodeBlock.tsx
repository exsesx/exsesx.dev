"use client";

import { Check, Copy, WrapText, X } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BLOG_UI } from "@/lib/blog";
import { useBlogLocale } from "./BlogLocaleContext";

const COPY_FEEDBACK_DURATION = 1800;

type CopyState = "idle" | "copied" | "error";

type CodeActionButtonProps = {
  action: "copy" | "wrap";
  ariaLabel: string;
  children: ReactNode;
  copyState?: CopyState;
  onClick: () => void;
  pressed?: boolean;
  tooltip: string;
};

function CodeActionButton({
  action,
  ariaLabel,
  children,
  copyState,
  onClick,
  pressed,
  tooltip,
}: CodeActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="glass"
            size="icon"
            className="blog-code-action"
            data-code-action={action}
            data-copy-state={copyState}
            aria-label={ariaLabel}
            aria-pressed={pressed}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent align={action === "copy" ? "end" : "center"} side="bottom" sideOffset={8}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export default function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const locale = useBlogLocale();
  const ui = BLOG_UI[locale].codeBlock;
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedScrollLeftRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [wrapped, setWrapped] = useState(false);

  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    if (!wrapped && shouldRestoreScrollRef.current && preRef.current) {
      preRef.current.scrollLeft = savedScrollLeftRef.current;
      shouldRestoreScrollRef.current = false;
    }
  }, [wrapped]);

  function showCopyFeedback(state: Exclude<CopyState, "idle">) {
    setCopyState(state);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_DURATION);
  }

  async function copyCode() {
    const value = preRef.current?.innerText;

    if (!value || !navigator.clipboard?.writeText) {
      showCopyFeedback("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      showCopyFeedback("error");
      return;
    }

    showCopyFeedback("copied");
  }

  function toggleWrap() {
    if (!wrapped) {
      savedScrollLeftRef.current = preRef.current?.scrollLeft ?? 0;
      setWrapped(true);
      return;
    }

    shouldRestoreScrollRef.current = true;
    setWrapped(false);
  }

  const copyLabel = copyState === "copied" ? ui.copied : copyState === "error" ? ui.copyFailed : ui.copy;

  return (
    <div className="blog-code-block" data-wrap={wrapped ? "true" : "false"}>
      <pre ref={preRef} {...props}>
        {children}
      </pre>

      <fieldset className="blog-code-toolbar" aria-label={ui.toolbar} lang={locale}>
        <CodeActionButton
          action="wrap"
          ariaLabel={ui.wrap}
          onClick={toggleWrap}
          pressed={wrapped}
          tooltip={wrapped ? ui.unwrap : ui.wrap}
        >
          <WrapText aria-hidden="true" size={15} strokeWidth={2.35} />
        </CodeActionButton>

        <CodeActionButton
          action="copy"
          ariaLabel={copyLabel}
          copyState={copyState}
          onClick={copyCode}
          tooltip={copyLabel}
        >
          {copyState === "copied" ? (
            <Check key="copied" className="blog-code-state-icon" aria-hidden="true" size={15} strokeWidth={2.5} />
          ) : copyState === "error" ? (
            <X key="error" className="blog-code-state-icon" aria-hidden="true" size={15} strokeWidth={2.5} />
          ) : (
            <Copy key="idle" className="blog-code-state-icon" aria-hidden="true" size={15} strokeWidth={2.35} />
          )}
        </CodeActionButton>
      </fieldset>

      <span className="sr-only" lang={locale} role="status">
        {copyState === "idle" ? "" : copyLabel}
      </span>
    </div>
  );
}
