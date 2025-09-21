"use client";

import { useState } from "react";
import { MenuIcon } from "./icons";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

export function MobileMenuButton({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        {children}
      </SheetContent>
    </Sheet>
  );
}