"use client";

import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import type { BadgeBenefit } from "@/lib/badges";

interface BadgeCardProps {
  badge: {
    badgeId: string;
    earnedAt: Date | string;
    metadata?: {
      userRank?: number;
      benefitUsedMonths?: number;
    };
  };
}

function getBenefitLabel(benefit: BadgeBenefit): string {
  if (benefit.type === "discount") {
    return `${Math.round(benefit.discount * 100)}% off on ${benefit.appliesTo.replace("-", " ")}`;
  }
  if (benefit.type === "free-pro") {
    return `${benefit.freeMonths} free Pro month${benefit.freeMonths > 1 ? "s" : ""}`;
  }
  return "";
}

function getBenefitDuration(benefit: BadgeBenefit): number {
  if (benefit.type === "discount") return benefit.durationMonths;
  if (benefit.type === "free-pro") return benefit.freeMonths;
  return 0;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const badgeDefinition = BADGE_DEFINITIONS[badge.badgeId];

  if (!badgeDefinition) {
    return null;
  }

  const userRank = badge.metadata?.userRank;
  const benefitUsedMonths = badge.metadata?.benefitUsedMonths ?? 0;
  const durationMonths = badgeDefinition.benefit ? getBenefitDuration(badgeDefinition.benefit) : 0;
  const earnedDate = new Date(badge.earnedAt);
  const earnedDateFormatted = earnedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const progressPercentage = durationMonths > 0 ? (benefitUsedMonths / durationMonths) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-4xl">{badgeDefinition.icon}</div>
            <div>
              <CardTitle className="text-xl">{badgeDefinition.name}</CardTitle>
              <CardDescription className="mt-1">{badgeDefinition.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Badge Benefit */}
        {badgeDefinition.benefit && (
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">
                {getBenefitLabel(badgeDefinition.benefit)}
              </span>
            </div>
            {durationMonths > 0 && (
              <div className="text-xs text-muted-foreground">
                Valid for {durationMonths} month{durationMonths > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {/* Benefit Usage Progress */}
        {durationMonths > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Benefit Usage</span>
              <span className="font-semibold">
                {benefitUsedMonths} / {durationMonths} month{durationMonths > 1 ? "s" : ""}
              </span>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          </div>
        )}

        {/* User Rank */}
        {userRank && (
          <div className="text-xs text-muted-foreground">
            User #{userRank} of 500
          </div>
        )}

        {/* Earned Date */}
        <div className="text-xs text-muted-foreground">
          Earned on {earnedDateFormatted}
        </div>
      </CardContent>
    </Card>
  );
}
