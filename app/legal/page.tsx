import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Access all legal documents including Terms and Conditions, Refund Policy, and other important information.",
};

export default function LegalPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 pt-20">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Legal Documents
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Access all important legal documents and policies for Delibration
            services.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Terms and Conditions */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Terms and Conditions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Review our terms of service that govern your use of
                Delibration's AI chat assistant.
              </p>
              <a
                href="/legal/terms-and-conditions.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                View Terms & Conditions
              </a>
            </div>

            {/* Refund and Cancellation Policy */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Refund & Cancellation Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Understand our refund and cancellation policies for subscription
                services.
              </p>
              <a
                href="/legal/refund-policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                View Refund Policy
              </a>
            </div>

            {/* Contact Us PDF */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Contact Us PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get in touch with our support team for any questions or
                assistance.
              </p>
              <a
                href="/legal/contact-us.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                View Contact Information
              </a>
            </div>

            {/* Privacy Policy */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Privacy Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Learn how we collect, use, and protect your personal
                information.
              </p>
              <a
                href="/privacy"
                className="inline-block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                View Privacy Policy
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              All documents are regularly updated. Last reviewed:{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
