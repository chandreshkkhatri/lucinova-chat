"use client";

import { User, CreditCard, Trash2, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AccountClientProps {
  user: {
    email?: string | null;
    name?: string | null;
    plan?: "free" | "pro";
    isPro?: boolean;
    currentPeriodEnd?: string | Date | null;
  };
}

export default function AccountClient({ user }: AccountClientProps) {
  const [activeSection, setActiveSection] = useState("account");
  const router = useRouter();

  const menuItems = [
    {
      id: "account",
      label: "Account Information",
      icon: User,
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
      disabled: true,
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
                    Current Plan
                  </label>
                  {user.isPro ? (
                    <div className="text-gray-600 dark:text-gray-400">
                      <p>Pro Plan</p>
                      {user.currentPeriodEnd && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Renews on{" "}
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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-500 dark:text-gray-400">
                Billing history feature coming soon. You&apos;ll be able to view
                and download your invoices here.
              </p>
            </div>
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
            © {new Date().getFullYear()} Delibration. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
