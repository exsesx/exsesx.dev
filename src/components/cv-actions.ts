type CvSecondaryAction = "download" | "share" | "none";

type CvActionCapabilities = {
  canShareFiles: boolean;
  maxTouchPoints: number;
  userAgent: string;
};

function isIOSUserAgent({ maxTouchPoints, userAgent }: Pick<CvActionCapabilities, "maxTouchPoints" | "userAgent">) {
  return /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

function getCvSecondaryAction(capabilities: CvActionCapabilities): CvSecondaryAction {
  if (!isIOSUserAgent(capabilities)) {
    return "download";
  }

  return capabilities.canShareFiles ? "share" : "none";
}

export type { CvActionCapabilities, CvSecondaryAction };
export { getCvSecondaryAction, isIOSUserAgent };
