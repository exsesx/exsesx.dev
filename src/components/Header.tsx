"use client";

import { BriefcaseBusiness, Home } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";
import { shouldScrollToTopForNavClick } from "@/lib/nav-scroll";
import { cn } from "@/lib/utils";
import { GithubIcon } from "./icons/lucide-github";
import LogoMark from "./LogoMark";
import ThemeSwitcher from "./ThemeSwitcher";
import { buttonVariants } from "./ui/button-variants";

const navigation: Array<{ href: Route; label: string; icon: typeof Home }> = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
];

const navActionBaseClassName =
  "relative z-10 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-0 text-sm font-bold whitespace-nowrap text-foreground outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.97] sm:px-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const navActionPillHomeTransform = "translate3d(0, 0, 0) scaleX(1) scaleY(1)";
const navActionPillProjectsTransform = "translate3d(calc(100% + 0.25rem), 0, 0) scaleX(1) scaleY(1)";

function getActiveNavHref(pathname: string): Route {
  return pathname === "/projects" || pathname.startsWith("/project/") ? "/projects" : "/";
}

function scrollToPageTop() {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  window.scrollTo({ behavior, top: 0 });
}

export default function Header() {
  const pathname = usePathname();
  // Detail → index is hierarchical (slide back); every other tab hop is
  // lateral, so it cross-fades instead of implying depth.
  const projectIndexTransitionTypes = pathname.startsWith("/project/") ? ["nav-back"] : ["nav-fade"];
  const activeNavHref = getActiveNavHref(pathname);
  // selectedNavHref is optimistic (set on pointer-down so the pill moves
  // instantly); reconcile it with the real route during render instead of in
  // an effect — https://react.dev/learn/you-might-not-need-an-effect
  const [selectedNavHref, setSelectedNavHref] = useState<Route>(activeNavHref);
  const [prevActiveNavHref, setPrevActiveNavHref] = useState<Route>(activeNavHref);

  if (prevActiveNavHref !== activeNavHref) {
    setPrevActiveNavHref(activeNavHref);
    setSelectedNavHref(activeNavHref);
  }

  const navActionPillTransform =
    selectedNavHref === "/projects" ? navActionPillProjectsTransform : navActionPillHomeTransform;

  function handleNavLinkClick(event: MouseEvent<HTMLAnchorElement>, href: Route) {
    setSelectedNavHref(href);

    if (shouldScrollToTopForNavClick({ pathname, href, scrollY: window.scrollY })) {
      event.preventDefault();
      scrollToPageTop();
    }
  }

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50" data-safari-chrome-sample>
      <div className="site-header-nav-frame" style={{ viewTransitionName: "persistent-nav" }}>
        <nav className="liquid-glass site-nav-glass mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full px-3 py-2 transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)] sm:flex sm:justify-between">
          <Link
            href="/"
            transitionTypes={["nav-fade"]}
            data-suppress-entry-motion=""
            className="site-nav-brand-link group flex min-w-0 items-center rounded-full px-2 py-1 text-foreground transition-[color,transform] duration-200 ease-[var(--ease-out)] hover:text-accent active:scale-[0.98]"
            aria-label="Oleh Vanin home"
            onClick={event => handleNavLinkClick(event, "/")}
          >
            <span className="logo-tile grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/15 transition-transform duration-150 ease-[var(--ease-out)] group-active:scale-[0.96]">
              <LogoMark className="size-8" />
            </span>
            <span className="site-nav-brand-copy hidden min-w-0 flex-col leading-none sm:flex">
              <span className="text-sm font-black tracking-tight">Oleh Vanin</span>
              <span className="mt-1 text-[11px] font-bold tracking-normal text-muted-foreground">exsesx.dev</span>
            </span>
          </Link>

          <div className="relative grid grid-cols-[3rem_3rem] items-center gap-1 rounded-full bg-muted p-1 sm:grid-cols-2">
            <span
              aria-hidden="true"
              className="site-nav-active-pill absolute inset-y-1 left-1 z-0 rounded-full"
              style={{ transform: navActionPillTransform }}
            />
            {navigation.map(item => {
              const Icon = item.icon;
              const isProjectDetailToIndex = item.href === "/projects" && pathname.startsWith("/project/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  transitionTypes={isProjectDetailToIndex ? projectIndexTransitionTypes : ["nav-fade"]}
                  data-suppress-entry-motion=""
                  aria-label={item.label}
                  className={navActionBaseClassName}
                  onClick={event => handleNavLinkClick(event, item.href)}
                  onPointerDown={() => setSelectedNavHref(item.href)}
                >
                  <Icon data-icon="inline-start" strokeWidth={2.3} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
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
      </div>
    </header>
  );
}
