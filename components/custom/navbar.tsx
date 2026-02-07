import Link from "next/link";

import { auth, signOut } from "@/app/(auth)/auth";

import { History } from "./history";
import { MobileMenuButton } from "./mobile-menu-button";
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

  return (
    <>
      <div className="bg-card fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-30 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Mobile menu button - only show when user is logged in */}
          {session && (
            <MobileMenuButton>
              <History user={session.user} inSheet={true} />
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
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              prefetch={false}
            >
              Pricing
            </Link>
          </div>

          {!session && <ThemeToggle />}

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
