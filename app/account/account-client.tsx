"use client";

import { User, CreditCard, Trash2, Receipt, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AccountClientProps {
  user: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    countryCode?: string | null;
    plan?: "free" | "pro";
    isPro?: boolean;
    currentPeriodEnd?: string | Date | null;
  };
}

export default function AccountClient({ user }: AccountClientProps) {
  const [activeSection, setActiveSection] = useState("account");
  const router = useRouter();
  const [payments, setPayments] = useState<any[] | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatPhoneNumber = (
    value?: string | null,
    countryCode?: string | null
  ) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    const code = countryCode || "+91";
    if (digits.length === 10) {
      return `${code} ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return `${code} ${value}`;
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
                {user.name && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Name
                    </label>
                    <p className="text-muted-foreground">
                      {user.name}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone Number
                  </label>
                  <p className="text-muted-foreground">
                    {formatPhoneNumber(user.phone, user.countryCode) ||
                      "Not provided"}
                  </p>
                  {!user.phone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Update your profile from the app menu to add a contact
                      number.
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
                onClick={() => router.push("/pricing")}
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
              href="/contact"
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
