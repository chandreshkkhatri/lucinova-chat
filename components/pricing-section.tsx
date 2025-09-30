import { Check } from "lucide-react";

import { CashfreePaymentButton } from "@/components/cashfree-payment-button";
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
  isPro?: boolean;
}

export function PricingSection({ isPro = false }: PricingSectionProps) {
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
            <Button className="w-full bg-transparent" variant="outline">
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-primary">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              Most Popular
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
          <CardFooter>
            {isPro ? (
              <Button disabled className="w-full">
                Current Plan
              </Button>
            ) : (
              <CashfreePaymentButton
                amount={pricePaise}
                planName="Pro Plan - Monthly"
                buttonText={`Subscribe for ${symbol}${priceRupees.toLocaleString(
                  currency === "INR" ? "en-IN" : undefined
                )}/month`}
                className="w-full"
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
