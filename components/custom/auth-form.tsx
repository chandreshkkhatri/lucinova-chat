import Link from "next/link";

import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  showTermsCheckbox = false,
}: {
  action: any;
  children: React.ReactNode;
  defaultEmail?: string;
  showTermsCheckbox?: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm border-none"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
        />

        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm border-none"
          type="password"
          required
        />
      </div>

      {showTermsCheckbox && (
        <div className="flex items-start gap-2">
          <Checkbox
            id="acceptTerms"
            name="acceptTerms"
            value="true"
            required
            className="mt-0.5"
          />
          <Label
            htmlFor="acceptTerms"
            className="text-xs text-muted-foreground font-normal leading-relaxed cursor-pointer"
          >
            I agree to the{" "}
            <Link
              href="/legal/terms-and-conditions"
              target="_blank"
              className="text-primary hover:underline"
            >
              Terms & Conditions
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              href="/legal/privacy-policy"
              target="_blank"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </Link>
          </Label>
        </div>
      )}

      {children}
    </form>
  );
}
