"use client";

import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BADGE_DEFINITIONS } from "@/lib/badges";

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

export function BadgeCard({ badge }: BadgeCardProps) {
  const badgeDefinition = BADGE_DEFINITIONS[badge.badgeId as keyof typeof BADGE_DEFINITIONS];

  if (!badgeDefinition) {
    return null;
  }

  const userRank = badge.metadata?.userRank;
  const benefitUsedMonths = badge.metadata?.benefitUsedMonths ?? 0;
  const durationMonths = badgeDefinition.benefit?.durationMonths ?? 0;
  const earnedDate = new Date(badge.earnedAt);
  const earnedDateFormatted = earnedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const progressPercentage = (benefitUsedMonths / durationMonths) * 100;

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
                {badgeDefinition.benefit.discount && `${Math.round(badgeDefinition.benefit.discount * 100)}% off`}
                {badgeDefinition.benefit.appliesTo && ` on ${badgeDefinition.benefit.appliesTo.replace("-", " ")}`}
              </span>
            </div>
            {badgeDefinition.benefit.durationMonths && (
              <div className="text-xs text-muted-foreground">
                Valid for {badgeDefinition.benefit.durationMonths} months
              </div>
            )}
          </div>
        )}

        {/* Benefit Usage Progress */}
        {badgeDefinition.benefit?.durationMonths && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Benefit Usage</span>
              <span className="font-semibold">
                {benefitUsedMonths} / {durationMonths} months
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
