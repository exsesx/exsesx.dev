type NavScrollClick = {
  pathname: string;
  href: string;
  scrollY: number;
};

export function shouldScrollToTopForNavClick({ pathname, href, scrollY }: NavScrollClick) {
  return pathname === href && Number.isFinite(scrollY) && scrollY > 0;
}
