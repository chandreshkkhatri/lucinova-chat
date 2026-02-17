import { Award, Check } from "lucide-react";
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
  isAuthenticated?: boolean;
  subscriptionStatus?: string | null;
  userBadges?: Array<{
    badgeId: string;
    metadata?: {
      benefitUsedMonths?: number;
    };
  }>;
}

export function PricingSection({
  isUserPro = false,
  isAuthenticated = false,
  subscriptionStatus = null,
  userBadges = [],
}: PricingSectionProps) {
  const price = appConfig.pricing.proMonthlyPrice;
  const priceInCents = Math.round(price * 100); // Razorpay expects amount in smallest currency unit
  const currency = appConfig.pricing.currency;
  const symbol = appConfig.getCurrencySymbol(currency);

  // Check for Early Bird badge with active discount
  const earlyBirdBadge = userBadges?.find((b) => b.badgeId === "early-bird");
  const hasActiveEarlyBirdDiscount =
    earlyBirdBadge &&
    earlyBirdBadge.metadata?.benefitUsedMonths !== undefined &&
    earlyBirdBadge.metadata.benefitUsedMonths < 3;

  const discountedPriceInCents = hasActiveEarlyBirdDiscount
    ? Math.round(price * 100 * 0.75) // 25% off means 75% of price
    : Math.round(price * 100);

  const discountedPrice = discountedPriceInCents / 100;

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
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>1,000 units/month</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-transparent" variant="outline" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-primary">
          {hasActiveEarlyBirdDiscount ? (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <Award className="size-4" />
                Early Bird Discount
              </span>
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Popular
              </span>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <CardDescription>For power users and professionals</CardDescription>
            {hasActiveEarlyBirdDiscount ? (
              <div className="mt-4 space-y-2">
                <div className="inline-block">
                  <p className="text-xs font-medium text-muted-foreground line-through">
                    {symbol}
                    {price.toLocaleString()}/month
                  </p>
                </div>
                <div>
                  <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {symbol}
                    {discountedPrice}
                  </span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  75% off for first 3 months (
                  {3 - (earlyBirdBadge.metadata?.benefitUsedMonths || 0)} month
                  {3 - (earlyBirdBadge.metadata?.benefitUsedMonths || 0) === 1
                    ? ""
                    : "s"}{" "}
                  remaining)
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {symbol}
                  {price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Plus applicable taxes
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Everything in Basic</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>5,000 units/month (5x more)</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Access to premium models</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green-600" />
              <span>Priority support</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {isUserPro && subscriptionStatus !== "canceled" ? (
              <Button
                disabled
                className="w-full bg-green-600 text-white opacity-80 cursor-not-allowed"
              >
                ✓ Current Plan
              </Button>
            ) : hasActiveEarlyBirdDiscount ? (
              <PaymentButton
                amount={discountedPriceInCents}
                planName="Pro Monthly Subscription"
                buttonText={
                  subscriptionStatus === "canceled"
                    ? "Resubscribe with Early Bird Discount"
                    : "Subscribe with Early Bird Discount"
                }
              />
            ) : (isUserPro && subscriptionStatus === "canceled") ||
              isAuthenticated ? (
              <PaymentButton
                amount={priceInCents}
                planName="Lucidity Pro Monthly"
                className="w-full"
                buttonText={
                  subscriptionStatus === "canceled"
                    ? "Resubscribe Now"
                    : "Subscribe Now"
                }
              />
            ) : (
              <Button className="w-full" asChild>
                <Link href="/login">Log in to upgrade</Link>
              </Button>
            )}
            {!isUserPro && !hasActiveEarlyBirdDiscount && (
              <p className="text-xs text-center text-muted-foreground">
                Secure monthly billing via Razorpay. See our refund policy for
                cancellation terms.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
