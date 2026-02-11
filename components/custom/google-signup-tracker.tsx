"use client";

import { useEffect } from "react";
import { trackSignUpConversion } from "@/lib/gtag";

interface GoogleSignupTrackerProps {
  userId: string;
  createdAt: string;
  oauthProvider: string | null;
}

/**
 * Tracks sign-up conversions for Google OAuth users.
 * This component fires a conversion event for new users who signed up via Google.
 * It uses localStorage to ensure the conversion is only tracked once per user.
 */
export function GoogleSignupTracker({
  userId,
  createdAt,
  oauthProvider,
}: GoogleSignupTrackerProps) {
  useEffect(() => {
    // Only track for Google OAuth users
    if (oauthProvider !== "google") return;

    // Check if we've already tracked this user's sign-up
    const trackedKey = `google_signup_tracked_${userId}`;
    if (localStorage.getItem(trackedKey)) return;

    // Check if the account was created recently (within last 5 minutes)
    const createdAtDate = new Date(createdAt);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (createdAtDate > fiveMinutesAgo) {
      // This is a new Google sign-up, track the conversion
      trackSignUpConversion("google");
      // Mark as tracked to prevent duplicate conversions
      localStorage.setItem(trackedKey, "true");
    }
  }, [userId, createdAt, oauthProvider]);

  // This component doesn't render anything
  return null;
}
