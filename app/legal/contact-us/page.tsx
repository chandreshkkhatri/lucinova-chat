import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact information for Lucidity - get in touch with us for support and inquiries.",
};

export default function ContactUsPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 pt-20">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Contact Us
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Last updated on 27-09-2025 18:41:19
            </p>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <p className="text-center mb-8">
                  You may contact us using the information below:
                </p>
              </section>

              <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Merchant Legal Entity
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Name:
                    </p>
                    <p>CHANDRESH KUMAR</p>
                  </div>
                </div>
              </section>

              <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Registered Address
                </h2>
                <p>
                  202, 2nd Floor, Plot No 786, 5th Cross, 4th block,
                  Koramangala, Near Swabhimaana Karanji Park, Bengaluru,
                  Karnataka, PIN: 560034
                </p>
              </section>

              <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Operational Address
                </h2>
                <p>
                  202, 2nd Floor, Plot No 786, 5th Cross, 4th block,
                  Koramangala, Near Swabhimaana Karanji Park, Bengaluru,
                  Karnataka, PIN: 560034
                </p>
              </section>

              <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Telephone:
                    </p>
                    <p>
                      <a
                        href="tel:8209972074"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        8209972074
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email:
                    </p>
                    <p>
                      <a
                        href="mailto:support@lucidity.chat"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        support@lucidity.chat
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  We strive to respond to all inquiries within 24-48 hours
                  during business days.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
