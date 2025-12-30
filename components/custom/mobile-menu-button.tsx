"use client";

import { useState } from "react";
import { MenuIcon } from "./icons";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "../ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileMenuButton({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Access site navigation and features</SheetDescription>
        </VisuallyHidden>
        {children}
      </SheetContent>
    </Sheet>
  );
}