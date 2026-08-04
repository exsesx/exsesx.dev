import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

type CalloutVariant = "note" | "warning";

type CalloutProps = {
  children: ReactNode;
  title?: string;
  variant?: CalloutVariant;
};

export default function Callout({ children, title, variant = "note" }: CalloutProps) {
  const Icon = variant === "warning" ? CircleAlert : Info;

  return (
    <aside className="blog-callout" data-variant={variant} role="note">
      <Icon aria-hidden="true" className="blog-callout-icon" size={19} strokeWidth={2.35} />
      {title ? <p className="blog-callout-title">{title}</p> : null}
      <div className="blog-callout-content">{children}</div>
    </aside>
  );
}
