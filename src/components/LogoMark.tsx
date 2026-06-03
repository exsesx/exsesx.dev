import type { SVGProps } from "react";

const logoPath = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";

export default function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="logo-pride-stripes" x1="0" y1="84" x2="0" y2="446" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF1F2D" />
          <stop offset="16.666%" stopColor="#FF1F2D" />
          <stop offset="16.666%" stopColor="#FF8A00" />
          <stop offset="33.333%" stopColor="#FF8A00" />
          <stop offset="33.333%" stopColor="#FFE500" />
          <stop offset="50%" stopColor="#FFE500" />
          <stop offset="50%" stopColor="#34C759" />
          <stop offset="66.666%" stopColor="#34C759" />
          <stop offset="66.666%" stopColor="#0A84FF" />
          <stop offset="83.333%" stopColor="#0A84FF" />
          <stop offset="83.333%" stopColor="#8E44FF" />
          <stop offset="100%" stopColor="#8E44FF" />
        </linearGradient>
        <linearGradient id="logo-pride-shine" x1="-180" y1="42" x2="-40" y2="188" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity=".62" />
          <stop offset="58%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          <animate
            attributeName="x1"
            values="-180;-180;500;500"
            keyTimes="0;.28;.72;1"
            dur="5.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="-40;-40;640;640"
            keyTimes="0;.28;.72;1"
            dur="5.6s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <linearGradient id="logo-pride-shadow-shine" x1="-200" y1="42" x2="-60" y2="188" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#101111" stopOpacity="0" />
          <stop offset="41%" stopColor="#101111" stopOpacity="0" />
          <stop offset="50%" stopColor="#101111" stopOpacity=".36" />
          <stop offset="59%" stopColor="#101111" stopOpacity="0" />
          <stop offset="100%" stopColor="#101111" stopOpacity="0" />
          <animate
            attributeName="x1"
            values="-200;-200;480;480"
            keyTimes="0;.28;.72;1"
            dur="5.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="-60;-60;620;620"
            keyTimes="0;.28;.72;1"
            dur="5.6s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <path className="logo-mark-main" d={logoPath} fill="var(--logo-foreground, currentColor)" />
      <path className="logo-mark-pride" d={logoPath} fill="url(#logo-pride-stripes)" />
      <path className="logo-mark-shine" d={logoPath} fill="url(#logo-pride-shine)" />
      <path className="logo-mark-shadow-shine" d={logoPath} fill="url(#logo-pride-shadow-shine)" />
    </svg>
  );
}
