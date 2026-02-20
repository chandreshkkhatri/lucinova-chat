#!/usr/bin/env node

/**
 * Gift Pro Plan to Friends
 *
 * Usage:
 *   node scripts/gift-pro.mjs <email> [days]
 *   node scripts/gift-pro.mjs friend@example.com          # 30 days
 *   node scripts/gift-pro.mjs friend@example.com 90       # 90 days
 *   node scripts/gift-pro.mjs a@b.com,c@d.com 60          # bulk, 60 days
 *
 * Requires:
 *   ADMIN_SECRET  — set in .env (same one used by /api/admin/*)
 *   BASE_URL      — optional, defaults to http://localhost:3000
 */

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
  console.log(`
  Gift Pro Plan — give friends free Pro access

  Usage:
    node scripts/gift-pro.mjs <email(s)> [days]

  Examples:
    node scripts/gift-pro.mjs friend@example.com            # 30 days
    node scripts/gift-pro.mjs friend@example.com 90          # 90 days
    node scripts/gift-pro.mjs a@b.com,c@d.com 60             # bulk, 60 days

  Environment:
    ADMIN_SECRET  — required (from .env)
    BASE_URL      — optional, defaults to http://localhost:3000
  `);
  process.exit(0);
}

// --- Load .env if dotenv is available ---
try {
  const { config } = await import("dotenv");
  config();
} catch {
  // dotenv not installed — rely on env vars being set
}

const emailsArg = args[0];
const periodInDays = parseInt(args[1] || "30", 10);
const adminSecret = process.env.ADMIN_SECRET;
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

if (!adminSecret) {
  console.error("❌ ADMIN_SECRET not set. Add it to .env or export it.");
  process.exit(1);
}

const emails = emailsArg.split(",").map((e) => e.trim()).filter(Boolean);

console.log(`\n🎁 Gifting Pro (${periodInDays} days) to: ${emails.join(", ")}\n`);

try {
  const res = await fetch(`${baseUrl}/api/admin/gift-pro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emails,
      periodInDays,
      adminSecret,
      reason: "CLI gift-pro script",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ ${res.status}: ${data.error || data.message}`);
    process.exit(1);
  }

  console.log(data.message);
  console.log();

  for (const r of data.results) {
    if (r.success) {
      console.log(`  ✅ ${r.email} — Pro until ${new Date(r.currentPeriodEnd).toLocaleDateString()}`);
    } else {
      console.log(`  ❌ ${r.email} — ${r.error}`);
    }
  }

  console.log();
} catch (err) {
  console.error("❌ Failed to reach server:", err.message);
  console.error("   Make sure the dev/production server is running.");
  process.exit(1);
}
