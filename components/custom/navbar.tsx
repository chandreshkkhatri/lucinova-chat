import Link from "next/link";

import { auth, signOut } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";

import { MobileMenuButton } from "./mobile-menu-button";
import { MobileSidebarContent } from "./mobile-sidebar-content";
import { NavbarLogo } from "./navbar-logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = async () => {
  let session = await auth();

  // Check if user is Pro
  let isUserPro = false;
  if (session?.user?.email) {
    try {
      await ensureConnection();
      const dbUser = await User.findOne({ email: session.user.email }).select("isPro").lean();
      isUserPro = !!(dbUser as any)?.isPro;
    } catch (e) {
      // Silently fail — show Pricing as fallback
    }
  }

  return (
    <>
      <div className="bg-card fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-30 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Mobile menu button - only show when user is logged in */}
          {session && (
            <MobileMenuButton>
              <MobileSidebarContent user={session.user} />
            </MobileMenuButton>
          )}

          <NavbarLogo />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              prefetch={false}
            >
              About
            </Link>
            {isUserPro ? (
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold text-sm hover:from-purple-500/20 hover:to-violet-500/20 transition-all"
                prefetch={false}
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                Pro
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                prefetch={false}
              >
                Pricing
              </Link>
            )}
          </div>

          {!session && <ThemeToggle />}

          {session && (
            <Link
              href="/"
              title="New Chat"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
                <path d="m15 5 3 3" />
              </svg>
            </Link>
          )}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="p-2 h-fit bg-muted hover:bg-muted/80 rounded-lg"
                  variant="secondary"
                >
                  <div className="size-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-semibold">
                    {session.user?.email?.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-card border border-border"
              >
                <DropdownMenuItem disabled className="text-sm">
                  {session.user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem className="p-1">
                  <Link
                    href="/account"
                    className="w-full text-left px-3 py-2 text-muted-foreground hover:bg-muted rounded-md transition-colors block"
                  >
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-muted p-0">
                  <ThemeToggle inDropdown={true} />
                </DropdownMenuItem>
                <DropdownMenuItem className="p-1 z-50">
                  <form
                    className="w-full"
                    action={async () => {
                      "use server";

                      await signOut({
                        redirectTo: "/",
                      });
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                    >
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="px-4 py-2 h-fit font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
