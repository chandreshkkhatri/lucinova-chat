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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Account Information
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Email
                  </label>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.email || "No email provided"}
                  </p>
                </div>
                {user.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Name
                    </label>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user.name}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatPhoneNumber(user.phone, user.countryCode) ||
                      "Not provided"}
                  </p>
                  {!user.phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Update your profile from the app menu to add a contact
                      number.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Current Plan
                  </label>
                  {user.isPro ? (
                    <div className="text-gray-600 dark:text-gray-400">
                      <p>Pro Plan</p>
                      {user.currentPeriodEnd && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Plan expires{" "}
                          {new Date(user.currentPeriodEnd).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Pricing & Plans
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your subscription and view available plans.
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                View Pricing Plans
              </button>
            </div>
          </div>
        );

      case "billing":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Billing History
            </h2>
            <BillingHistory payments={payments} loading={loadingPayments} />
          </div>
        );

      case "delete":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Account Settings
          </h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="md:w-64 shrink-0">
              <nav className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
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
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : item.disabled
                              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <Icon className="size-5" />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {item.disabled && (
                            <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
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
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/contact"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Contact Us
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link
              href="/legal"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Legal
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link
              href="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-500">
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
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Security
      </h2>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors font-medium"
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
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading payments…</p>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">
          No billing history yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Environment
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {payments.map((p) => {
              const date = p.createdAt ? new Date(p.createdAt) : null;
              const amount = Number(p.amount ?? 0);
              return (
                <tr
                  key={p.orderId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {date ? date.toLocaleString("en-IN") : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">
                    {p.orderId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {p.planName || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                      }`}
                    >
                      {String(p.status).replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
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
