import Link, { LinkProps } from "next/link";
import classNames from "classnames";
import { useRouter } from "next/router";
import React from "react";

type NavLinkProps = LinkProps & { children: JSX.Element; activeClassName?: string };

export default function NavLink({ href, children, activeClassName, ...linkProps }: NavLinkProps) {
  const { pathname } = useRouter();

  let className = children.props.className || "";

  if (pathname === href) {
    className = classNames(className, activeClassName);
  }

  return (
    <Link passHref legacyBehavior href={href} {...linkProps}>
      {React.cloneElement(children, { className })}
    </Link>
  );
}
