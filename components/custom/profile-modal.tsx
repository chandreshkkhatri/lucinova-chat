"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_COUNTRY_CODE, getCountryByCode, validatePhone } from "@/lib/country-codes";

import { CountryCodeSelect } from "./country-code-select";

export function ProfileModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: (user: { name: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCountryChange = useCallback((code: string) => {
    setCountryCode(code);
  }, []);

  useEffect(() => {
    if (open) {
      // Prefill existing profile if any
      fetch("/api/user/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            setName(data.user.name || "");
            setPhone(data.user.phone || "");
            // Map dial code to country code if available
            if (data.user.countryCode) {
              const country = getCountryByCode(data.user.countryCode);
              if (country) {
                setCountryCode(data.user.countryCode);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Only validate phone if provided
    const digits = phone.replace(/\D/g, "");
    if (digits) {
      const selectedCountry = getCountryByCode(countryCode || DEFAULT_COUNTRY_CODE);
      if (!validatePhone(digits, countryCode || DEFAULT_COUNTRY_CODE)) {
        toast.error(`Enter a valid phone number for ${selectedCountry?.name || "your country"}`);
        return;
      }
    }

    if (!acceptTerms) {
      toast.error("You must accept the Terms & Conditions to continue");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        acceptTerms: true
      };
      // Only include phone if provided
      if (digits) {
        payload.phone = digits;
        payload.countryCode = countryCode || DEFAULT_COUNTRY_CODE;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save profile");
      }
      const data = await res.json();
      toast.success("Profile updated");
      onSaved?.({ name: data.user.name, phone: data.user.phone });
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            Please add your name. Phone number is optional but helps us provide
            support and prefill payment details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={countryCode}
                onChange={handleCountryChange}
                autoDetect={!countryCode}
              />
              <Input
                id="phone"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v.length <= 15) setPhone(v);
                }}
                placeholder={getCountryByCode(countryCode || DEFAULT_COUNTRY_CODE)?.placeholder || "Phone number"}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter your mobile number without country code
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
