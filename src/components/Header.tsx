"use client";

import { BookOpenText, BriefcaseBusiness, Home } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { MOTION_ATTRIBUTES, suppressEntryMotionProps } from "@/lib/motion-contract";
import { attachNavCondense } from "@/lib/nav-condense";
import { shouldScrollToTopForNavClick } from "@/lib/nav-scroll";
import { getPrimaryNavHref, isBlogPostPath, isProjectDetailPath, type PrimaryNavHref } from "@/lib/routes";
import { SITE_PROFILE } from "@/lib/site-profile";
import { cn } from "@/lib/utils";
import { useBlogFocus } from "./blog/BlogFocusProvider";
import { GithubIcon } from "./icons/lucide-github";
import LogoMark from "./LogoMark";
import NavBackButton from "./NavBackButton";
import ThemeSwitcher from "./ThemeSwitcher";
import { buttonVariants } from "./ui/button-variants";

const navigation: Array<{ href: PrimaryNavHref; label: string; icon: typeof Home }> = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/blog/en", label: "Blog", icon: BookOpenText },
];

const navActionBaseClassName =
  "relative z-10 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-0 text-sm font-bold whitespace-nowrap text-foreground outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.97] sm:px-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function scrollToPageTop() {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  window.scrollTo({ behavior, top: 0 });
}

function shouldPreviewNavChange(event: MouseEvent<HTMLAnchorElement> | PointerEvent<HTMLAnchorElement>) {
  return event.button === 0 && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export default function Header() {
  const pathname = usePathname();
  const { isFocusMode, isPassiveHeaderHidden, revealHeader } = useBlogFocus();
  const activeNavHref = getPrimaryNavHref(pathname);
  const [visualActiveNavHref, setVisualActiveNavHref] = useState<PrimaryNavHref>(activeNavHref);
  const navFrameRef = useRef<HTMLDivElement | null>(null);
  const visualActiveNav =
    visualActiveNavHref === "/projects" ? "projects" : visualActiveNavHref === "/blog/en" ? "blog" : "home";
  const isReadingHeaderHidden = isFocusMode || isPassiveHeaderHidden;
  const isBackButtonActive = isProjectDetailPath(pathname) || isBlogPostPath(pathname);

  useEffect(() => {
    setVisualActiveNavHref(activeNavHref);
  }, [activeNavHref]);

  useEffect(() => {
    const frame = navFrameRef.current;

    if (!frame) {
      return;
    }

    return attachNavCondense(frame);
  }, []);

  function handleNavLinkClick(event: MouseEvent<HTMLAnchorElement>, href: PrimaryNavHref) {
    if (shouldPreviewNavChange(event)) {
      setVisualActiveNavHref(href);
    }

    if (shouldScrollToTopForNavClick({ pathname, href, scrollY: window.scrollY })) {
      event.preventDefault();
      scrollToPageTop();
    }
  }

  return (
    <header lang="en" className="site-header fixed inset-x-0 top-0 z-50" data-safari-chrome-sample>
      <div aria-hidden="true" className="site-header-fade" style={{ viewTransitionName: "persistent-nav-fade" }} />
      <div
        ref={navFrameRef}
        aria-hidden={isReadingHeaderHidden ? "true" : undefined}
        className="site-header-nav-frame"
        inert={isReadingHeaderHidden ? true : undefined}
        onFocusCapture={revealHeader}
        style={{ viewTransitionName: "persistent-nav" }}
      >
        <nav className="liquid-glass site-nav-glass mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 rounded-full px-2 py-2 transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)] sm:flex sm:justify-between sm:gap-3 sm:px-3">
          <div
            className={`site-nav-leading flex min-w-0 items-center transition-[column-gap] duration-200 ease-[var(--ease-snap)] motion-reduce:transition-none ${isBackButtonActive ? "gap-x-1.5 sm:gap-x-0" : "gap-x-0"}`}
          >
            <NavBackButton active={isBackButtonActive} />
            <Link
              href="/"
              {...suppressEntryMotionProps}
              className="site-nav-brand-link flex min-w-0 items-center rounded-full px-0 py-1 text-foreground transition-colors duration-200 ease-[var(--ease-out)] hover:text-accent sm:px-2"
              aria-label="Oleh Vanin home"
              onClick={event => handleNavLinkClick(event, "/")}
              onPointerDown={event => {
                if (shouldPreviewNavChange(event)) {
                  setVisualActiveNavHref("/");
                }
              }}
            >
              <span className="logo-tile grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/15">
                <LogoMark className="size-8" />
              </span>
              <span className="site-nav-brand-copy hidden min-w-0 flex-col leading-none sm:flex">
                <span className="text-sm font-black tracking-tight">Oleh Vanin</span>
                <span className="mt-1 text-[11px] font-bold tracking-normal text-muted-foreground">exsesx.dev</span>
              </span>
            </Link>
          </div>

          <div
            className="site-nav-switcher relative grid grid-cols-[2.5rem_2.5rem_2.5rem] items-center gap-1 rounded-full bg-muted p-1 sm:grid-cols-3"
            {...{ [MOTION_ATTRIBUTES.activeNav]: visualActiveNav }}
          >
            <span
              aria-hidden="true"
              className="site-nav-active-pill absolute inset-y-1 left-1 z-0 rounded-full"
              {...{ [MOTION_ATTRIBUTES.activeNav]: visualActiveNav }}
            />
            {navigation.map(item => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  {...suppressEntryMotionProps}
                  aria-label={item.label}
                  aria-current={activeNavHref === item.href ? "page" : undefined}
                  className={navActionBaseClassName}
                  onClick={event => handleNavLinkClick(event, item.href)}
                  onPointerDown={event => {
                    if (shouldPreviewNavChange(event)) {
                      setVisualActiveNavHref(item.href);
                    }
                  }}
                >
                  <Icon data-icon="inline-start" strokeWidth={2.3} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="site-nav-actions flex items-center justify-end gap-1 sm:gap-2">
            <a
              href={SITE_PROFILE.links.github}
              className={cn(buttonVariants({ variant: "glass", size: "icon" }), "md:w-auto md:gap-2 md:px-4 md:pl-3")}
            >
              <GithubIcon data-icon="inline-start" strokeWidth={2.2} />
              <span className="sr-only md:not-sr-only">GitHub</span>
            </a>
            <span className="site-nav-theme inline-flex">
              <ThemeSwitcher />
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
