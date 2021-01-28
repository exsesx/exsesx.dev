import Link, { LinkProps } from "next/link";
import { useRouter } from "next/router";
import React from "react";

type NavLinkProps = LinkProps & { children: JSX.Element; activeClassName?: string };

export default function NavLink({ href, children, activeClassName, ...linkProps }: NavLinkProps) {
  const { pathname } = useRouter();

  let className = children.props.className || "";

  if (pathname === href) {
    className = `${className} ${activeClassName}`;
  }

  return (
    <Link href={href} {...linkProps}>
      {React.cloneElement(children, { className })}
    </Link>
  );
}
