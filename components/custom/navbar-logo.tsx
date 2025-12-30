"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function NavbarLogo() {
  const pathname = usePathname();
  const isBetaRoute = pathname?.startsWith("/beta") ?? false;

  return (
    <div className="flex items-center gap-3">
      {/* Logo - always links to landing page */}
      <Link
        href="/"
        className="hover:opacity-80 transition-opacity"
        prefetch={false}
      >
        <div className="size-12 rounded-xl flex items-center justify-center">
          <Image
            src="/images/lucidity-logo.png"
            height={100}
            width={100}
            alt="Lucidity logo"
            quality={90}
            className="size-full object-contain"
          />
        </div>
      </Link>

      {/* Text - links to /beta on beta routes, / elsewhere */}
      <Link
        href={isBetaRoute ? "/beta" : "/"}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        prefetch={false}
      >
        <span className="font-bold text-lg text-foreground hidden sm:inline">
          Lucidity
        </span>
        {isBetaRoute && (
          <Badge
            variant="secondary"
            className="ml-2 font-medium bg-accent/20 text-accent-foreground border-none hidden sm:inline-flex"
          >
            Beta
          </Badge>
        )}
      </Link>
    </div>
  );
}
