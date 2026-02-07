"use client";

import Image from "next/image";
import Link from "next/link";

export function NavbarLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Logo - always links to home */}
      <Link
        href="/"
        className="hover:opacity-80 transition-opacity"
        prefetch={false}
      >
        <div className="size-12 rounded-xl flex items-center justify-center">
          <Image
            src="/images/lucidity-logo.svg"
            height={100}
            width={100}
            alt="Lucidity logo"
            quality={90}
            className="size-full object-contain"
          />
        </div>
      </Link>

      {/* Text - links to home */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        prefetch={false}
      >
        <span className="font-bold text-lg text-foreground hidden sm:inline">
          Lucidity
        </span>
      </Link>
    </div>
  );
}
