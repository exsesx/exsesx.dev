"use client";

import { BriefcaseBusiness, Home } from "lucide-react";
import type { MotionStyle } from "motion/react";
import { domAnimation, LazyMotion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";
import type { Route } from "next";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
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
  "relative z-10 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-0 text-sm font-bold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.97] sm:px-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const navActionActiveClassName = "text-foreground";
const navActionInactiveClassName = "text-foreground";
const navActionPillHomeTransform = "translate3d(0, 0, 0) scaleX(1) scaleY(1)";
const navActionPillProjectsTransform = "translate3d(calc(100% + 0.25rem), 0, 0) scaleX(1) scaleY(1)";
const navActionPillToProjectsTransforms = [
  navActionPillHomeTransform,
  "translate3d(calc(54% + 0.135rem), 0, 0) scaleX(1.075) scaleY(0.975)",
  navActionPillProjectsTransform,
];
const navActionPillToHomeTransforms = [
  navActionPillProjectsTransform,
  "translate3d(calc(46% + 0.115rem), 0, 0) scaleX(1.075) scaleY(0.975)",
  navActionPillHomeTransform,
];
const navActionPillTransition = {
  duration: 0.26,
  ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
  times: [0, 0.58, 1],
};

const HEADER_SCROLL_RANGE = 108;

function clampHeaderScrollProgress(progress: number) {
  return Math.min(Math.max(progress, 0), 1);
}

function formatScrollProgress(progress: number) {
  return clampHeaderScrollProgress(progress).toFixed(4);
}

function getActiveNavHref(pathname: string): Route {
  return pathname === "/projects" || pathname.startsWith("/project/") ? "/projects" : "/";
}

function getNavActionPillTransforms(selectedNavHref: Route) {
  if (selectedNavHref === "/projects") {
    return navActionPillToProjectsTransforms;
  }

  return navActionPillToHomeTransforms;
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getBrowserPathname() {
  return window.location.pathname;
}

export default function Header() {
  const [pathname, setPathname] = useState("/");
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const rawScrollProgress = useTransform(scrollY, scrollYValue =>
    clampHeaderScrollProgress(scrollYValue / HEADER_SCROLL_RANGE),
  );
  const springScrollProgress = useSpring(rawScrollProgress, {
    stiffness: 820,
    damping: 31,
    mass: 0.38,
    restDelta: 0.001,
    skipInitialAnimation: true,
  });
  const navScrollProgress = useTransform(
    prefersReducedMotion ? rawScrollProgress : springScrollProgress,
    formatScrollProgress,
  );
  const navStyle = {
    "--nav-scroll-progress": navScrollProgress,
  } as MotionStyle;
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

  useEffect(() => {
    function syncPathname() {
      setPathname(getBrowserPathname());
    }

    function schedulePathnameSync() {
      window.requestAnimationFrame(syncPathname);
    }

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    syncPathname();
    window.history.pushState = function pushStateWithPathnameSync(...args) {
      const result = originalPushState.apply(this, args);
      schedulePathnameSync();
      return result;
    };
    window.history.replaceState = function replaceStateWithPathnameSync(...args) {
      const result = originalReplaceState.apply(this, args);
      schedulePathnameSync();
      return result;
    };
    window.addEventListener("popstate", syncPathname);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", syncPathname);
    };
  }, []);

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
        <LazyMotion features={domAnimation}>
          <m.nav
            className="liquid-glass site-nav-glass mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full px-3 py-2 transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-out)] sm:flex sm:justify-between"
            style={navStyle}
          >
            <Link
              href="/"
              transitionTypes={["nav-fade"]}
              data-suppress-entry-motion=""
              className="site-nav-brand-link group flex min-w-0 items-center rounded-full px-2 py-1 text-foreground transition-[color,transform] duration-200 ease-[var(--ease-out)] hover:text-accent active:scale-[0.98]"
              aria-label="Oleh Vanin home"
              onClick={event => handleNavLinkClick(event, "/")}
            >
              <span className="logo-tile grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/15 transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-[1.04] group-active:scale-[0.96]">
                <LogoMark className="size-8" />
              </span>
              <span className="site-nav-brand-copy hidden min-w-0 flex-col leading-none sm:flex">
                <span className="text-sm font-black tracking-tight">Oleh Vanin</span>
                <span className="mt-1 text-[11px] font-bold tracking-normal text-muted-foreground">exsesx.dev</span>
              </span>
            </Link>

            <div className="relative grid grid-cols-[3rem_3rem] items-center gap-1 rounded-full bg-muted p-1 sm:grid-cols-2">
              <m.span
                aria-hidden="true"
                animate={{
                  transform: prefersReducedMotion
                    ? navActionPillTransform
                    : getNavActionPillTransforms(selectedNavHref),
                }}
                className="site-nav-active-pill absolute inset-y-1 left-1 z-0 rounded-full"
                initial={false}
                transition={prefersReducedMotion ? { duration: 0 } : navActionPillTransition}
              />
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = item.href === selectedNavHref;
                const isProjectDetailToIndex = item.href === "/projects" && pathname.startsWith("/project/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    transitionTypes={isProjectDetailToIndex ? projectIndexTransitionTypes : ["nav-fade"]}
                    data-suppress-entry-motion=""
                    aria-label={item.label}
                    className={cn(
                      navActionBaseClassName,
                      isActive ? navActionActiveClassName : navActionInactiveClassName,
                    )}
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
          </m.nav>
        </LazyMotion>
      </div>
    </header>
  );
}
