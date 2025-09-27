import Image from "next/image";
import Link from "next/link";

import { auth, signOut } from "@/app/(auth)/auth";

import { History } from "./history";
import { MobileMenuButton } from "./mobile-menu-button";
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
      <div className="bg-white dark:bg-gray-950 fixed top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-30 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {/* Mobile menu button - only show when user is logged in */}
          {session && (
            <MobileMenuButton>
              <History user={session.user} inSheet={true} />
            </MobileMenuButton>
          )}

          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            prefetch={false}
          >
            <div className="size-12 rounded-xl bg-white border border-gray-200 dark:border-gray-700 flex items-center justify-center p-2">
              <Image
                src="/images/delibration-logo.png"
                height={100}
                width={100}
                alt="Delibration logo"
                className="size-full object-contain"
              />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">
              Delibration
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              prefetch={false}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              prefetch={false}
            >
              Contact Us
            </Link>
            <Link
              href="/legal"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              prefetch={false}
            >
              Legal
            </Link>
          </div>

          {!session && <ThemeToggle />}

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="p-2 h-fit bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg"
                  variant="secondary"
                >
                  <div className="size-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {session.user?.email?.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800"
              >
                <DropdownMenuItem disabled className="text-sm">
                  {session.user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-100 dark:focus:bg-gray-800 p-0">
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
              className="px-4 py-2 h-fit font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
