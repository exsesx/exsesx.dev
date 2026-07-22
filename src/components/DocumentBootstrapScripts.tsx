"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";
import { BLOG_ARTICLE_START_OFFSET } from "@/lib/blog-focus";
import { createBlogFocusBootstrapScript } from "@/lib/blog-focus-bootstrap";
import { createNoFlashScript } from "@/lib/no-flash-script";
import { THEME_CHROME_COLORS } from "@/lib/theme";

const noFlashScript = createNoFlashScript(THEME_CHROME_COLORS.dark, THEME_CHROME_COLORS.light);
const blogFocusBootstrapScript = createBlogFocusBootstrapScript(BLOG_ARTICLE_START_OFFSET);

export default function DocumentBootstrapScripts() {
  const hasInsertedScripts = useRef(false);

  useServerInsertedHTML(() => {
    if (hasInsertedScripts.current) {
      return null;
    }

    hasInsertedScripts.current = true;

    return (
      <>
        <script
          id="noflash"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This static local bootstrap must run before the page paints.
          dangerouslySetInnerHTML={{ __html: noFlashScript }}
        />
        <script
          id="blog-focus-bootstrap"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This static local bootstrap restores reading focus before paint.
          dangerouslySetInnerHTML={{ __html: blogFocusBootstrapScript }}
        />
      </>
    );
  });

  return null;
}
