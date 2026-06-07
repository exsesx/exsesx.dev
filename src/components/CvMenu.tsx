"use client";

import { ChevronDown, FileDown, FileText, LoaderCircle, Share2 } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { type CvSecondaryAction, getCvSecondaryAction } from "./cv-actions";

const RESUME_PDF_URL = "/api/resume/pdf";
const RESUME_PDF_DOWNLOAD_URL = `${RESUME_PDF_URL}?download=1`;
const RESUME_PDF_FILENAME = "Oleh Vanin CV.pdf";

function canShareResumePdf() {
  if (typeof navigator === "undefined" || typeof File === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }

  const file = new File([""], RESUME_PDF_FILENAME, { type: "application/pdf" });

  return navigator.canShare({ files: [file] });
}

function getClientSecondaryAction() {
  return getCvSecondaryAction({
    canShareFiles: canShareResumePdf(),
    maxTouchPoints: navigator.maxTouchPoints,
    userAgent: navigator.userAgent,
  });
}

function getServerSecondaryAction(): CvSecondaryAction {
  return "download";
}

function subscribeToCvCapabilities() {
  return () => {};
}

function openResumePdf() {
  window.open(RESUME_PDF_URL, "_blank", "noopener,noreferrer");
}

function clearPendingTimeout(ref: { current: number | null }) {
  if (ref.current !== null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

function CvMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const openingTimeoutRef = useRef<number | null>(null);
  const downloadingTimeoutRef = useRef<number | null>(null);
  const secondaryAction = useSyncExternalStore(
    subscribeToCvCapabilities,
    getClientSecondaryAction,
    getServerSecondaryAction,
  );
  const hasSecondaryAction = secondaryAction !== "none";

  function showOpeningState() {
    clearPendingTimeout(openingTimeoutRef);
    setIsOpening(true);
    openingTimeoutRef.current = window.setTimeout(() => {
      setIsOpening(false);
      openingTimeoutRef.current = null;
    }, 900);
  }

  function showDownloadingState() {
    clearPendingTimeout(downloadingTimeoutRef);
    setIsDownloading(true);
    downloadingTimeoutRef.current = window.setTimeout(() => {
      setIsDownloading(false);
      downloadingTimeoutRef.current = null;
    }, 1200);
  }

  function handleOpenCv(event: MouseEvent<HTMLAnchorElement>) {
    if (isOpening) {
      event.preventDefault();
      return;
    }

    triggerHaptic("tap");
    showOpeningState();
  }

  function handleDownloadCv(event: MouseEvent<HTMLAnchorElement>) {
    if (isDownloading) {
      event.preventDefault();
      return;
    }

    showDownloadingState();
  }

  async function handleShareCv() {
    if (typeof navigator.share !== "function" || typeof File === "undefined") {
      return;
    }

    triggerHaptic("selection");
    setIsSharing(true);

    try {
      const response = await fetch(RESUME_PDF_URL);

      if (!response.ok) {
        openResumePdf();
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], RESUME_PDF_FILENAME, { type: blob.type || "application/pdf" });

      if (navigator.canShare?.({ files: [file] }) === false) {
        openResumePdf();
        return;
      }

      await navigator.share({
        files: [file],
        title: "Oleh Vanin CV",
      });
      triggerHaptic("success");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        openResumePdf();
      }
    } finally {
      setIsSharing(false);
    }
  }

  useEffect(() => {
    return () => {
      clearPendingTimeout(openingTimeoutRef);
      clearPendingTimeout(downloadingTimeoutRef);
    };
  }, []);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <div
        className={cn(
          buttonVariants({ variant: "glass", size: "lg" }),
          "gap-0 overflow-hidden !p-0 active:scale-100 hover:!bg-secondary",
          isOpen && "border-ring/50 text-accent",
        )}
      >
        <a
          href={RESUME_PDF_URL}
          className="inline-flex h-full min-w-0 flex-none items-center justify-center gap-2 rounded-none px-4 pr-5 outline-none transition-transform duration-200 ease-[var(--ease-weight)] focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.97]"
          rel="noopener noreferrer"
          target="_blank"
          aria-busy={isOpening}
          onClick={handleOpenCv}
        >
          {isOpening ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" strokeWidth={2.4} />
          ) : (
            <FileText data-icon="inline-start" strokeWidth={2.4} />
          )}
          {isOpening ? "Opening CV" : "Open CV"}
        </a>
        {hasSecondaryAction ? (
          <>
            <span
              aria-hidden="true"
              className="h-7 w-px shrink-0 bg-border/80 transition-colors duration-200 ease-[var(--ease-weight)] group-hover/button:bg-ring/35"
            />
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Show CV actions"
                  className="inline-flex h-full w-12 items-center justify-center rounded-none bg-transparent outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/40 sm:w-12"
                />
              }
            >
              <ChevronDown
                strokeWidth={2.5}
                className={cn("transition-transform duration-200 ease-[var(--ease-weight)]", isOpen && "rotate-180")}
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-2rem)] origin-top-right sm:w-52">
              <DropdownMenuGroup>
                <DropdownMenuLinkItem
                  href={RESUME_PDF_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-busy={isOpening}
                  onClick={handleOpenCv}
                >
                  {isOpening ? (
                    <LoaderCircle size={16} className="animate-spin" strokeWidth={2.3} />
                  ) : (
                    <FileText size={16} strokeWidth={2.3} />
                  )}
                  {isOpening ? "Opening CV" : "Open CV"}
                </DropdownMenuLinkItem>
                {secondaryAction === "share" ? (
                  <DropdownMenuItem disabled={isSharing} aria-busy={isSharing} onClick={handleShareCv}>
                    {isSharing ? (
                      <LoaderCircle size={16} className="animate-spin" strokeWidth={2.3} />
                    ) : (
                      <Share2 size={16} strokeWidth={2.3} />
                    )}
                    {isSharing ? "Preparing CV" : "Share CV"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuLinkItem
                    href={RESUME_PDF_DOWNLOAD_URL}
                    aria-busy={isDownloading}
                    onClick={handleDownloadCv}
                  >
                    {isDownloading ? (
                      <LoaderCircle size={16} className="animate-spin" strokeWidth={2.3} />
                    ) : (
                      <FileDown size={16} strokeWidth={2.3} />
                    )}
                    {isDownloading ? "Downloading CV" : "Download CV"}
                  </DropdownMenuLinkItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </>
        ) : null}
      </div>
    </DropdownMenu>
  );
}

export default CvMenu;
