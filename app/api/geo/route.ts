import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_COUNTRY_CODE, getCountryByCode } from "@/lib/country-codes";

/**
 * Detect user's country from IP address.
 * Uses multiple fallback methods:
 * 1. Cloudflare CF-IPCountry header (if behind Cloudflare)
 * 2. Vercel x-vercel-ip-country header (if on Vercel)
 * 3. Free IP geolocation API as fallback
 */
export async function GET(request: NextRequest) {
  try {
    // Try Cloudflare header first
    const cfCountry = request.headers.get("cf-ipcountry");
    if (cfCountry && cfCountry !== "XX" && getCountryByCode(cfCountry)) {
      return NextResponse.json({ countryCode: cfCountry });
    }

    // Try Vercel header
    const vercelCountry = request.headers.get("x-vercel-ip-country");
    if (vercelCountry && getCountryByCode(vercelCountry)) {
      return NextResponse.json({ countryCode: vercelCountry });
    }

    // Get client IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || null;

    // Skip IP lookup for localhost/private IPs
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return NextResponse.json({ countryCode: DEFAULT_COUNTRY_CODE });
    }

    // Use free IP geolocation API
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (geoRes.ok) {
      const data = await geoRes.json();
      if (data.countryCode && getCountryByCode(data.countryCode)) {
        return NextResponse.json({ countryCode: data.countryCode });
      }
    }

    // Default fallback
    return NextResponse.json({ countryCode: DEFAULT_COUNTRY_CODE });
  } catch (error) {
    console.error("Geo detection error:", error);
    return NextResponse.json({ countryCode: DEFAULT_COUNTRY_CODE });
  }
}
