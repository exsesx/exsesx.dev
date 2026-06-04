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
      <div className="relative inline-flex w-full shrink-0 sm:w-auto">
        <a
          href="/api/resume/pdf"
          className={cn(
            buttonVariants({ variant: "glass", size: "lg" }),
            "min-w-0 flex-1 rounded-r-none border-r-0 pr-4 sm:flex-none",
          )}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FileText data-icon="inline-start" strokeWidth={2.4} />
          Open CV
        </a>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Show CV actions"
              className={cn(
                buttonVariants({ variant: "glass", size: "icon-lg" }),
                "rounded-l-none px-3 transition data-popup-open:border-ring/50 data-popup-open:bg-muted data-popup-open:text-accent sm:px-3",
              )}
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
