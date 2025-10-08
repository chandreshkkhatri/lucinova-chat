import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Lucidity team for support, feedback, or general inquiries.",
};

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Contact Us
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            The best place to reach us is via email:
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <a
              href="mailto:support@lucidity.chat"
              className="text-2xl font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              support@lucidity.chat
            </a>
          </div>

          <p className="text-gray-500 dark:text-gray-400">
            We typically respond within 24-48 hours
          </p>
        </div>
      </div>
    </main>
  );
}
