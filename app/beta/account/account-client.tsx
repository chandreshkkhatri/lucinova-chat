"use client";

import { User, CreditCard, Trash2, Receipt, Lock, BarChart3, Crown, Pencil, Loader2, X, Check, Award } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { CountryCodeSelect } from "@/components/custom/country-code-select";
import { BadgeCard } from "@/components/custom/badge-card";
import { DEFAULT_COUNTRY_CODE, getCountryByCode, validatePhone } from "@/lib/country-codes";

interface AccountClientProps {
  user: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    countryCode?: string | null;
    plan?: "free" | "pro";
    isPro?: boolean;
    currentPeriodEnd?: string | Date | null;
    badges?: Array<{
      badgeId: string;
      earnedAt: Date | string;
      metadata?: {
        userRank?: number;
        benefitUsedMonths?: number;
      };
    }>;
  };
}

export default function AccountClient({ user }: AccountClientProps) {
  const [activeSection, setActiveSection] = useState("account");
  const router = useRouter();
  const [payments, setPayments] = useState<any[] | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [editCountryCode, setEditCountryCode] = useState(user.countryCode || DEFAULT_COUNTRY_CODE);
  const [savingPhone, setSavingPhone] = useState(false);
  const [currentPhone, setCurrentPhone] = useState(user.phone || "");
  const [currentCountryCode, setCurrentCountryCode] = useState(user.countryCode || DEFAULT_COUNTRY_CODE);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [savingName, setSavingName] = useState(false);
  const [currentName, setCurrentName] = useState(user.name || "");

  const formatPhoneNumber = (
    value?: string | null,
    isoCountryCode?: string | null
  ) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    const country = getCountryByCode(isoCountryCode || DEFAULT_COUNTRY_CODE);
    const dialCode = country?.dialCode || "+91";
    return `${dialCode} ${digits}`;
  };

  const handleSavePhone = async () => {
    const digits = editPhone.replace(/\D/g, "");
    const selectedCountry = getCountryByCode(editCountryCode);

    if (!validatePhone(digits, editCountryCode)) {
      toast.error(`Enter a valid phone number for ${selectedCountry?.name || "your country"}`);
      return;
    }

    setSavingPhone(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentName,
          phone: digits,
          countryCode: editCountryCode
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update phone");
      }
      const data = await res.json();
      setCurrentPhone(data.user.phone);
      setEditPhone(data.user.phone);
      setCurrentCountryCode(data.user.countryCode);
      setEditCountryCode(data.user.countryCode);
      setIsEditingPhone(false);
      toast.success("Phone number updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update phone");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleCancelEditPhone = () => {
    setEditPhone(currentPhone);
    setEditCountryCode(currentCountryCode);
    setIsEditingPhone(false);
  };

  const handleDeletePhone = async () => {
    if (!confirm("Are you sure you want to delete your phone number?")) {
      return;
    }

    setSavingPhone(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentName,
          deletePhone: true
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete phone");
      }
      setCurrentPhone("");
      setEditPhone("");
      setCurrentCountryCode(DEFAULT_COUNTRY_CODE);
      setEditCountryCode(DEFAULT_COUNTRY_CODE);
      toast.success("Phone number deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete phone");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveName = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: currentPhone, countryCode: currentCountryCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update name");
      }
      const data = await res.json();
      setCurrentName(data.user.name);
      setEditName(data.user.name);
      setIsEditingName(false);
      toast.success("Name updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditName(currentName);
    setIsEditingName(false);
  };

  async function fetchBilling() {
    try {
      setLoadingPayments(true);
      const res = await fetch("/api/payment/history", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (e) {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    toast.info("Refreshing account data...");
    try {
      // Hard refresh to get latest data from server
      window.location.reload();
    } catch (e) {
      toast.error("Failed to refresh");
      setIsRefreshing(false);
    }
  }

  // Auto-load when switching to Billing tab
  if (
    typeof window !== "undefined" &&
    activeSection === "billing" &&
    payments === null &&
    !loadingPayments
  ) {
    // fire-and-forget
    fetchBilling();
  }

  const menuItems = [
    {
      id: "account",
      label: "Account Information",
      icon: User,
    },
    {
      id: "usage",
      label: "Usage",
      icon: BarChart3,
    },
    {
      id: "badges",
      label: "Badges & Achievements",
      icon: Award,
    },
    {
      id: "security",
      label: "Security",
      icon: Lock,
    },
    {
      id: "pricing",
      label: "Pricing & Plans",
      icon: CreditCard,
    },
    {
      id: "billing",
      label: "Billing History",
      icon: Receipt,
      disabled: !user?.email,
    },
    {
      id: "delete",
      label: "Delete Account",
      icon: Trash2,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Account Information
            </h2>
            <div className="bg-muted rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <p className="text-muted-foreground">
                    {user.email || "No email provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Name
                  </label>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your full name"
                        className="w-48 px-2 py-1 text-sm border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={savingName}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                        title="Save"
                      >
                        {savingName ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={savingName}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">
                        {currentName || "Not provided"}
                      </p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit name"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone Number
                  </label>
                  {isEditingPhone ? (
                    <div className="flex items-center gap-2">
                      <CountryCodeSelect
                        value={editCountryCode}
                        onChange={setEditCountryCode}
                        disabled={savingPhone}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editPhone}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          if (v.length <= 15) setEditPhone(v);
                        }}
                        placeholder={getCountryByCode(editCountryCode)?.placeholder || "Phone number"}
                        className="w-32 px-2 py-1 text-sm border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={savingPhone}
                        autoFocus
                      />
                      <button
                        onClick={handleSavePhone}
                        disabled={savingPhone}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                        title="Save"
                      >
                        {savingPhone ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditPhone}
                        disabled={savingPhone}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">
                        {formatPhoneNumber(currentPhone, currentCountryCode) ||
                          "Not provided"}
                      </p>
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit phone number"
                      >
                        <Pencil className="size-4" />
                      </button>
                      {currentPhone && (
                        <button
                          onClick={handleDeletePhone}
                          disabled={savingPhone}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete phone number"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  )}
                  {!currentPhone && !isEditingPhone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the edit icon to add a contact number.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Current Plan
                  </label>
                  {user.isPro ? (
                    <div className="text-muted-foreground">
                      <p>Pro Plan</p>
                      {user.currentPeriodEnd && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Plan expires{" "}
                          {new Date(user.currentPeriodEnd).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Free Plan
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "usage":
        return <UsageSection isPro={user.isPro || false} />;

      case "badges":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Badges & Achievements
            </h2>
            {!user.badges || user.badges.length === 0 ? (
              <div className="bg-muted rounded-lg p-6 text-center">
                <Award className="size-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Badges Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Keep using Lucidity to earn badges and unlock special benefits!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {user.badges.map((badge) => (
                  <BadgeCard key={badge.badgeId} badge={badge} />
                ))}
              </div>
            )}
          </div>
        );

      case "security":
        return <SecuritySection />;

      case "pricing":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Pricing & Plans
            </h2>
            <div className="bg-muted rounded-lg p-6">
              <p className="text-muted-foreground mb-4">
                Manage your subscription and view available plans.
              </p>
              <button
                onClick={() => router.push("/beta/pricing")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
              >
                View Pricing Plans
              </button>
            </div>
          </div>
        );

      case "billing":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Billing History
            </h2>
            <BillingHistory payments={payments} loading={loadingPayments} />
          </div>
        );

      case "delete":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Delete Account
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
              <h3 className="font-medium text-red-900 dark:text-red-400 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Delete My Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen flex-col pt-20">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Account Settings
          </h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="md:w-64 shrink-0">
              <nav className="bg-card rounded-lg shadow-lg p-4">
                <ul className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() =>
                            !item.disabled && setActiveSection(item.id)
                          }
                          disabled={item.disabled}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            activeSection === item.id
                              ? "bg-primary/10 text-primary"
                              : item.disabled
                              ? "text-muted-foreground/50 cursor-not-allowed"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="size-5" />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {item.disabled && (
                            <span className="ml-auto text-xs text-muted-foreground/50">
                              Soon
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-card rounded-lg shadow-lg p-8">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/contact-us"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact Us
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/legal"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Legal
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="text-center mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lucidity. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Security
      </h2>
      <div className="bg-muted rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-foreground mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-4 py-2 rounded-md transition-colors font-medium"
          >
            {isSubmitting ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface UsageCurrentPeriod {
  unitsUsed: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  periodStart: string;
  periodEnd: string;
}

interface UsageHistoryItem {
  periodStart: string;
  periodEnd: string;
  unitsUsed: number;
}

interface UsageData {
  current: UsageCurrentPeriod;
  history: UsageHistoryItem[];
  isPro: boolean;
  plan: string;
}

function UsageSection({ isPro }: { isPro: boolean }) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Please log in to view usage data");
          }
          throw new Error("Failed to load usage data");
        }
        return res.json();
      })
      .then((data: UsageData) => {
        setUsage(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Usage fetch error:", err);
        setError(err.message || "Unable to load usage data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Usage</h2>
        <div className="bg-muted rounded-lg p-6">
          <p className="text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Usage</h2>
        <div className="bg-muted rounded-lg p-6">
          <p className="text-muted-foreground">
            {error || "Unable to load usage data."}
          </p>
        </div>
      </div>
    );
  }

  const { current, history } = usage;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground mb-6">Usage</h2>

      {/* Current Period Card */}
      <div className="bg-muted rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Current Period
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date(current.periodStart).toLocaleDateString()} -{" "}
              {new Date(current.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPro
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }`}
          >
            {isPro ? "Pro" : "Free"} Plan
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-foreground font-medium">
              {current.unitsUsed.toFixed(1)} units used
            </span>
            <span className="text-muted-foreground">
              {current.limit} units limit
            </span>
          </div>
          <div className="h-3 bg-card rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                current.percentUsed >= 100
                  ? "bg-red-500"
                  : current.percentUsed >= 80
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, current.percentUsed)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-card rounded-lg p-3">
            <p className="text-muted-foreground">Remaining</p>
            <p className="text-xl font-semibold text-foreground">
              {current.remaining.toFixed(1)} units
            </p>
          </div>
          <div className="bg-card rounded-lg p-3">
            <p className="text-muted-foreground">Resets in</p>
            <p className="text-xl font-semibold text-foreground">
              {Math.max(
                0,
                Math.ceil(
                  (new Date(current.periodEnd).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              )}{" "}
              days
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {!isPro && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6 text-center">
          <Crown className="size-10 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Need more capacity?
          </h3>
          <p className="text-muted-foreground mb-4">
            Upgrade to Pro for 5,000 units per month - 5x more than the free
            plan.
          </p>
          <button
            onClick={() => router.push("/beta/pricing")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Usage History */}
      <div className="bg-muted rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Usage History
        </h3>
        {history.length === 0 ? (
          <p className="text-muted-foreground">No previous usage data.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h: UsageHistoryItem) => (
              <div
                key={String(h.periodStart)}
                className="flex justify-between items-center py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(h.periodStart).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {h.unitsUsed.toFixed(1)} units
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BillingHistory({
  payments,
  loading,
}: {
  payments: any[] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <p className="text-muted-foreground">Loading payments…</p>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <p className="text-muted-foreground">
          No billing history yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Environment
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {payments.map((p) => {
              const date = p.createdAt ? new Date(p.createdAt) : null;
              const amount = Number(p.amount ?? 0);
              return (
                <tr
                  key={p.orderId}
                  className="hover:bg-muted"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {date ? date.toLocaleString("en-IN") : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-foreground">
                    {p.orderId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {p.planName || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    ₹{amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 font-medium ${
                        String(p.status).toUpperCase().includes("SUCCESS") ||
                        String(p.status).toUpperCase().includes("PAID")
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : String(p.status).toUpperCase().includes("FAILED")
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String(p.status).replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {p.environment || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
