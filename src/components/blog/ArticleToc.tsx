"use client";

import { ListTree, X } from "lucide-react";
import { type MouseEvent, useRef, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { ArticleHeading } from "@/content/blog/reading";
import { BLOG_UI, type BlogLocale } from "@/lib/blog";

type ArticleTocProps = {
  activeHeadingId?: string | null;
  headings: readonly ArticleHeading[];
  locale: BlogLocale;
  mode: "desktop" | "mobile";
};

export default function ArticleToc({ activeHeadingId, headings, locale, mode }: ArticleTocProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingHeadingIdRef = useRef<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const copy = BLOG_UI[locale];
  const activeHeading = headings.find(heading => heading.id === activeHeadingId);

  function navigateToHeading(headingId: string) {
    const heading = document.getElementById(headingId);

    if (!heading) {
      return;
    }

    const url = new URL(window.location.href);
    url.hash = headingId;
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;

    if (window.location.hash === url.hash) {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }

    const trigger = triggerRef.current;
    const isNavigatingUp = heading.getBoundingClientRect().top < 0;
    const reserveVisibleHeader = isNavigatingUp && !trigger?.closest('[data-blog-focus="true"]');
    const topOffset = getHeadingOffset(trigger, reserveVisibleHeader);
    const top = Math.max(0, window.scrollY + heading.getBoundingClientRect().top - topOffset);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    const settleHeading = () => {
      const triggerBottom = trigger?.getBoundingClientRect().bottom ?? 60;
      const chromeRemainsHidden = Boolean(
        trigger?.closest('[data-blog-passive-hidden="true"], [data-blog-focus="true"]'),
      );
      const reserveSettledHeader = reserveVisibleHeader && !chromeRemainsHidden;
      const settledOffset = Math.max(triggerBottom + 16, reserveSettledHeader ? getHeadingOffset(trigger, true) : 76);
      const correction = heading.getBoundingClientRect().top - settledOffset;

      if (Math.abs(correction) > 1) {
        window.scrollBy({ behavior: "auto", top: correction });
      }

      focusHeading(heading);
    };

    if (behavior === "auto") {
      window.scrollTo({ behavior, top });
      requestAnimationFrame(settleHeading);
      return;
    }

    let fallbackTimer: number | null = null;
    const finishNavigation = once(() => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }

      window.removeEventListener("scrollend", finishNavigation);
      settleHeading();
    });

    window.addEventListener("scrollend", finishNavigation, { once: true });
    fallbackTimer = window.setTimeout(finishNavigation, 1200);
    window.scrollTo({ behavior, top });
  }

  function handleMobileLinkClick(event: MouseEvent<HTMLAnchorElement>, headingId: string) {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return;
    }

    event.preventDefault();
    pendingHeadingIdRef.current = headingId;
    setMobileOpen(false);
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      pendingHeadingIdRef.current = null;
    }

    setMobileOpen(open);
  }

  function handleOpenChangeComplete(open: boolean) {
    if (open) {
      activeLinkRef.current?.scrollIntoView({ block: "nearest" });
      return;
    }

    const headingId = pendingHeadingIdRef.current;
    pendingHeadingIdRef.current = null;

    if (headingId) {
      navigateToHeading(headingId);
    }
  }

  const list = (
    <ol className="blog-toc-list">
      {headings.map(heading => {
        const isActive = heading.id === activeHeadingId;

        return (
          <li key={heading.id} data-depth={heading.depth}>
            <a
              ref={mode === "mobile" && isActive ? activeLinkRef : undefined}
              href={`#${heading.id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={mode === "mobile" ? event => handleMobileLinkClick(event, heading.id) : undefined}
            >
              <span aria-hidden="true" className="blog-toc-tick" />
              <span className="blog-toc-label">{heading.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (mode === "mobile") {
    return (
      <Drawer
        open={mobileOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        showSwipeHandle
      >
        <DrawerTrigger ref={triggerRef} className="blog-toc-mobile-trigger" data-testid="mobile-toc-trigger">
          <span className="blog-toc-mobile-kicker">{copy.onThisPage}</span>
          {activeHeading ? <span className="blog-toc-current">{activeHeading.text}</span> : null}
          <ListTree aria-hidden="true" className="blog-toc-mobile-icon" size={18} strokeWidth={2.2} />
        </DrawerTrigger>

        <DrawerContent
          className="blog-toc-drawer"
          data-testid="mobile-toc-drawer"
          initialFocus={() => activeLinkRef.current ?? closeButtonRef.current}
        >
          <DrawerHeader className="blog-toc-drawer-header">
            <div className="blog-toc-drawer-heading">
              <DrawerTitle>{copy.onThisPage}</DrawerTitle>
              <DrawerDescription className="sr-only">{copy.onThisPageDescription}</DrawerDescription>
            </div>
            <DrawerClose ref={closeButtonRef} aria-label={copy.closeTableOfContents} className="blog-toc-drawer-close">
              <X aria-hidden="true" size={20} strokeWidth={2.2} />
            </DrawerClose>
          </DrawerHeader>

          <nav className="blog-toc-drawer-scroll" aria-label={copy.onThisPage} data-testid="mobile-toc-scroll">
            {list}
          </nav>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <nav className="blog-toc-desktop" aria-label={copy.onThisPage}>
      <p>{copy.onThisPage}</p>
      {list}
    </nav>
  );
}

function focusHeading(heading: HTMLElement) {
  const hadTabIndex = heading.hasAttribute("tabindex");

  if (!hadTabIndex) {
    heading.setAttribute("tabindex", "-1");
  }

  heading.focus({ preventScroll: true });

  if (!hadTabIndex) {
    heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
  }
}

function getHeadingOffset(trigger: HTMLButtonElement | null, reserveVisibleHeader: boolean) {
  if (!trigger) {
    return 76;
  }

  const shell = trigger.closest<HTMLElement>(".blog-toc-mobile-shell");
  const shellStyle = shell ? window.getComputedStyle(shell) : null;
  const stickyTop = shellStyle ? Number.parseFloat(shellStyle.top) : 0;
  const visibleTop = shellStyle
    ? cssLengthToPixels(shellStyle.getPropertyValue("--blog-toc-visible-top"), document.documentElement)
    : 0;
  const triggerHeight = trigger.getBoundingClientRect().height;
  const reservedTop = reserveVisibleHeader ? Math.max(stickyTop, visibleTop) : stickyTop;

  return Math.max((Number.isFinite(reservedTop) ? reservedTop : 0) + triggerHeight + 16, 76);
}

function cssLengthToPixels(value: string, root: HTMLElement) {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return value.trim().endsWith("rem") ? parsed * Number.parseFloat(window.getComputedStyle(root).fontSize) : parsed;
}

function once(callback: () => void) {
  let called = false;

  return () => {
    if (called) {
      return;
    }

    called = true;
    callback();
  };
}
