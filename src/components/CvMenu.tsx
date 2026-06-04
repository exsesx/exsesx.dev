"use client";

import { ChevronDown, FileDown, FileText } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function CvMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <div
        className={cn(
          buttonVariants({ variant: "glass", size: "lg" }),
          "w-full gap-0 overflow-hidden !p-0 active:scale-100 hover:!bg-secondary sm:w-auto",
          isOpen && "border-ring/50 text-accent",
        )}
      >
        <a
          href="/api/resume/pdf"
          className="inline-flex h-full min-w-0 flex-1 items-center justify-center gap-2 rounded-none px-4 pr-5 outline-none transition-transform duration-200 ease-[var(--ease-weight)] focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.97] sm:flex-none"
          rel="noopener noreferrer"
          target="_blank"
        >
          <FileText data-icon="inline-start" strokeWidth={2.4} />
          Open CV
        </a>
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

        <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] origin-top-right sm:w-52">
          <DropdownMenuGroup>
            <DropdownMenuLinkItem href="/api/resume/pdf" rel="noopener noreferrer" target="_blank">
              <FileText size={16} strokeWidth={2.3} />
              Open CV
            </DropdownMenuLinkItem>
            <DropdownMenuLinkItem href="/api/resume/pdf?download=1">
              <FileDown size={16} strokeWidth={2.3} />
              Download CV
            </DropdownMenuLinkItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

export default CvMenu;
