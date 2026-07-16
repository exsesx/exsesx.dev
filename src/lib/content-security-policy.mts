type ContentSecurityPolicyEnvironment = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

export function buildContentSecurityPolicy(environment: ContentSecurityPolicyEnvironment) {
  const isVercelPreview = environment.VERCEL_ENV === "preview";
  const isVercelDeployment = Boolean(environment.VERCEL_ENV);
  const isProductionBuild = environment.NODE_ENV === "production";
  const imgSrc = ["'self'", "data:", "blob:"];
  const connectSrc = ["'self'"];
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const frameSrc: string[] = [];

  if (isVercelPreview) {
    imgSrc.push("https://vercel.live", "https://vercel.com");
    connectSrc.push("https://vercel.live", "wss://ws-us3.pusher.com");
    scriptSrc.push("https://vercel.live");
    styleSrc.push("https://vercel.live");
    frameSrc.push("https://vercel.live");
  }

  if (environment.VERCEL_ENV === "production") {
    const umamiOrigin = "https://cloud.umami.is";
    connectSrc.push(umamiOrigin);
    scriptSrc.push(umamiOrigin);
  }

  if (!isProductionBuild) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    frameSrc.length > 0 ? `frame-src ${frameSrc.join(" ")}` : null,
    "object-src 'none'",
    `img-src ${imgSrc.join(" ")}`,
    "media-src 'self'",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    isVercelDeployment ? "upgrade-insecure-requests" : null,
  ];

  return directives.filter(Boolean).join("; ");
}
