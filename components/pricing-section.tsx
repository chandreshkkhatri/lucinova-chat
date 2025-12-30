import { Check } from "lucide-react";
import Link from "next/link";

import { PaymentButton } from "@/components/payment-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appConfig } from "@/lib/config";

interface PricingSectionProps {
  isUserPro?: boolean;
}

export function PricingSection({ isUserPro = false }: PricingSectionProps) {
  const priceRupees = appConfig.pricing.proMonthlyRupees;
  const pricePaise = Math.round(priceRupees * 100);
  const currency = appConfig.pricing.currency;
  const symbol = appConfig.getCurrencySymbol(currency);
  return (
    <section className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-balance mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-muted-foreground text-pretty">
          Start for free, upgrade when you need more power
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* Basic Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-2xl">Basic</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Free</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Free access to notebook chat</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Basic AI assistance</span>
            </div>
            {/* Removed: Community support */}
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-transparent" variant="outline" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-primary">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-semibold">
              Coming Soon
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <CardDescription>For power users and professionals</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                {symbol}
                {priceRupees.toLocaleString(
                  currency === "INR" ? "en-IN" : undefined
                )}
              </span>
              <span className="text-muted-foreground ml-2">per month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Everything in Basic</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Access to premium models</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Priority support</span>
            </div>
            {/* Removed: Advanced features */}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {isUserPro ? (
              <Button disabled className="w-full bg-green-600 text-white opacity-80 cursor-not-allowed">
                ✓ Current Plan
              </Button>
            ) : (
              <Button
                disabled
                className="w-full bg-muted text-muted-foreground border border-dashed border-border cursor-not-allowed"
              >
                Coming Soon
              </Button>
            )}
            {!isUserPro && (
              <p className="text-xs text-center text-muted-foreground">
                The Pro subscription is still rolling out. Register to be notified
                when we launch.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
