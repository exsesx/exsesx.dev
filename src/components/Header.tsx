"use client";

import { BriefcaseBusiness, Home } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { GithubIcon } from "./icons/lucide-github";
import LogoMark from "./LogoMark";
import ThemeSwitcher from "./ThemeSwitcher";
import { buttonVariants } from "./ui/button-variants";

const navigation: Array<{ href: Route; label: string; icon: typeof Home }> = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
];

const HEADER_SCROLL_RANGE = 96;
const EXPANDED_MAX_WIDTH_REM = 80;
const COMPACT_MAX_WIDTH_REM = 64;
const EXPANDED_PADDING_Y_REM = 0.5;
const COMPACT_PADDING_Y_REM = 0.375;

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });

  return () => window.removeEventListener("scroll", callback);
}

function getScrollProgressSnapshot() {
  return Math.min(Math.max(window.scrollY, 0), HEADER_SCROLL_RANGE) / HEADER_SCROLL_RANGE;
}

function getServerScrollProgressSnapshot() {
  return 0;
}

export default function Header() {
  const pathname = usePathname();
  const isProjectRoute = pathname === "/projects" || pathname.startsWith("/project/");
  const projectIndexTransitionTypes = pathname.startsWith("/project/") ? ["nav-back"] : undefined;
  const scrollProgress = useSyncExternalStore(
    subscribeToScroll,
    getScrollProgressSnapshot,
    getServerScrollProgressSnapshot,
  );
  const maxWidthRem = EXPANDED_MAX_WIDTH_REM - (EXPANDED_MAX_WIDTH_REM - COMPACT_MAX_WIDTH_REM) * scrollProgress;
  const paddingYRem = EXPANDED_PADDING_Y_REM - (EXPANDED_PADDING_Y_REM - COMPACT_PADDING_Y_REM) * scrollProgress;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-3 sm:px-6" style={{ viewTransitionName: "persistent-nav" }}>
      <nav
        className="liquid-glass site-nav-glass mx-auto flex items-center justify-between gap-3 rounded-full px-3 transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)]"
        style={{
          maxWidth: `${maxWidthRem}rem`,
          paddingTop: `${paddingYRem}rem`,
          paddingBottom: `${paddingYRem}rem`,
        }}
      >
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2 rounded-full px-2 py-1 text-foreground transition-[color,transform] duration-200 ease-[var(--ease-out)] hover:text-accent active:scale-[0.98]"
          aria-label="Oleh Vanin home"
        >
          <span className="logo-tile grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/15 transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-[1.04] group-active:scale-[0.96]">
            <LogoMark className="size-8" />
          </span>
          <span className="hidden min-w-0 flex-col leading-none sm:flex">
            <span className="text-sm font-black tracking-tight">Oleh Vanin</span>
            <span className="mt-1 text-[11px] font-bold tracking-normal text-muted-foreground">exsesx.dev</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = item.href === "/projects" ? isProjectRoute : pathname === item.href;
            const isProjectDetailToIndex = item.href === "/projects" && pathname.startsWith("/project/");

            return (
              <Link
                key={item.href}
                href={item.href}
                transitionTypes={isProjectDetailToIndex ? projectIndexTransitionTypes : undefined}
                data-suppress-entry-motion={isProjectDetailToIndex ? "" : undefined}
                aria-label={item.label}
                className={cn(
                  buttonVariants({ variant: isActive ? "default" : "ghost", size: "default" }),
                  "shadow-none sm:px-4",
                )}
              >
                <Icon data-icon="inline-start" strokeWidth={2.3} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/exsesx"
            className={cn(buttonVariants({ variant: "glass", size: "default" }), "hidden md:inline-flex")}
          >
            <GithubIcon data-icon="inline-start" strokeWidth={2.4} />
            GitHub
          </a>
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
}
