"use client";

import { ChevronDown, FileDown, FileText, RotateCcw, Share2 } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SITE_PROFILE } from "@/lib/site-profile";
import { cn } from "@/lib/utils";
import { type CvSecondaryAction, getCvSecondaryAction } from "./cv-actions";

const RESUME_PDF_URL = SITE_PROFILE.resume.path;
const RESUME_PDF_DOWNLOAD_URL = `${RESUME_PDF_URL}?download=1`;
const RESUME_PDF_FILENAME = SITE_PROFILE.resume.filename;
const RESUME_PREPARATION_TIMEOUT_MS = 12_000;

type CvShareStatus = "idle" | "preparing" | "ready" | "sharing" | "error";

function canShareResumePdf() {
  if (
    typeof navigator === "undefined" ||
    typeof File === "undefined" ||
    typeof navigator.canShare !== "function" ||
    typeof navigator.share !== "function"
  ) {
    return false;
  }

  const file = new File([""], RESUME_PDF_FILENAME, { type: "application/pdf" });

  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
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

async function prepareResumeFile() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), RESUME_PREPARATION_TIMEOUT_MS);

  try {
    const response = await fetch(RESUME_PDF_URL, { signal: controller.signal });

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new Error("Unable to prepare the CV");
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("The prepared CV is empty");
    }

    const file = new File([blob], RESUME_PDF_FILENAME, { type: blob.type || "application/pdf" });

    if (navigator.canShare?.({ files: [file] }) === false) {
      throw new Error("This browser cannot share the prepared CV");
    }

    return file;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function CvMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<CvShareStatus>("idle");
  const preparedResumeFileRef = useRef<File | null>(null);
  const preparationPromiseRef = useRef<Promise<File> | null>(null);
  const secondaryAction = useSyncExternalStore(
    subscribeToCvCapabilities,
    getClientSecondaryAction,
    getServerSecondaryAction,
  );
  const hasSecondaryAction = secondaryAction !== "none";
  const isShareBusy = shareStatus === "idle" || shareStatus === "preparing" || shareStatus === "sharing";
  const shareActionLabel =
    shareStatus === "error"
      ? "Retry share"
      : shareStatus === "sharing"
        ? "Opening share sheet"
        : shareStatus === "ready"
          ? "Share CV"
          : "Preparing CV";

  function prepareShareFile() {
    if (preparedResumeFileRef.current) {
      setShareStatus("ready");
      return;
    }

    if (preparationPromiseRef.current) {
      return;
    }

    setShareStatus("preparing");

    const preparation = prepareResumeFile();
    preparationPromiseRef.current = preparation;

    void preparation.then(
      file => {
        preparedResumeFileRef.current = file;
        preparationPromiseRef.current = null;
        setShareStatus("ready");
      },
      () => {
        preparationPromiseRef.current = null;
        setShareStatus("error");
      },
    );
  }

  function handleMenuOpenChange(open: boolean) {
    setIsOpen(open);

    if (open && secondaryAction === "share" && shareStatus !== "sharing") {
      prepareShareFile();
    }
  }

  function handleShareCv() {
    if (shareStatus === "error") {
      prepareShareFile();
      return;
    }

    const file = preparedResumeFileRef.current;

    if (shareStatus !== "ready" || !file || typeof navigator.share !== "function") {
      return;
    }

    let sharePromise: Promise<void>;

    try {
      sharePromise = navigator.share({
        files: [file],
        title: `${SITE_PROFILE.name} CV`,
      });
    } catch {
      setShareStatus("error");
      return;
    }

    setShareStatus("sharing");
    setIsOpen(false);

    void sharePromise.then(
      () => setShareStatus("ready"),
      error => setShareStatus(error instanceof DOMException && error.name === "AbortError" ? "ready" : "error"),
    );
  }

  return (
    <DropdownMenu onOpenChange={handleMenuOpenChange} open={isOpen}>
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
        >
          <FileText data-icon="inline-start" strokeWidth={2.4} />
          Open CV
        </a>
        {hasSecondaryAction ? (
          <>
            <span
              aria-hidden="true"
              className="h-7 w-px shrink-0 bg-border/80 transition-colors duration-200 ease-[var(--ease-weight)] group-hover/button:bg-ring/35"
            />
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="glass"
                  size="icon"
                  aria-label="Show CV actions"
                  className="h-full w-12 rounded-none border-0 bg-transparent text-inherit shadow-none backdrop-blur-none hover:border-transparent hover:bg-transparent hover:text-inherit focus-visible:z-10 sm:w-12"
                />
              }
            >
              <ChevronDown
                strokeWidth={2.5}
                className={cn("transition-transform duration-200 ease-[var(--ease-weight)]", isOpen && "rotate-180")}
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-2rem)] sm:w-52">
              <DropdownMenuGroup>
                <DropdownMenuLinkItem href={RESUME_PDF_URL} rel="noopener noreferrer" target="_blank">
                  <FileText size={16} strokeWidth={2.3} />
                  Open CV
                </DropdownMenuLinkItem>
                {secondaryAction === "share" ? (
                  <DropdownMenuItem closeOnClick={false} disabled={isShareBusy} onClick={handleShareCv}>
                    <span className="cv-share-state relative grid min-w-0 flex-1" aria-live="polite">
                      <span
                        aria-hidden="true"
                        className="cv-share-state-layer col-start-1 row-start-1 flex items-center gap-2"
                        data-state="idle"
                        data-visible={!isShareBusy}
                      >
                        {shareStatus === "error" ? (
                          <RotateCcw size={16} strokeWidth={2.3} />
                        ) : (
                          <Share2 size={16} strokeWidth={2.3} />
                        )}
                        {shareActionLabel}
                      </span>
                      <span
                        aria-hidden="true"
                        className="cv-share-state-layer col-start-1 row-start-1 flex items-center gap-2"
                        data-state="preparing"
                        data-visible={isShareBusy}
                      >
                        <Share2 size={16} strokeWidth={2.3} />
                        {shareActionLabel}
                      </span>
                      <span className="sr-only">{shareActionLabel}</span>
                    </span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuLinkItem href={RESUME_PDF_DOWNLOAD_URL}>
                    <FileDown size={16} strokeWidth={2.3} />
                    Download CV
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
