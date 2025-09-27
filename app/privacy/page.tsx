import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Delibration AI chat assistant service - learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 pt-20">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Privacy Policy
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Introduction
                </h2>
                <p>
                  At Delibration, we are committed to protecting your privacy
                  and ensuring the security of your personal information. This
                  Privacy Policy explains how we collect, use, disclose, and
                  safeguard your information when you use our AI-powered chat
                  assistant service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Information We Collect
                </h2>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  2.1 Personal Information
                </h3>
                <p>We may collect the following personal information:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>
                    Email address (for account creation and communication)
                  </li>
                  <li>Name (if provided during registration)</li>
                  <li>Profile information (if you choose to provide it)</li>
                  <li>
                    Payment information (processed securely through third-party
                    providers)
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                  2.2 Usage Information
                </h3>
                <p>
                  We automatically collect certain information about your use of
                  our service:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>
                    Chat conversations and interactions with our AI assistant
                  </li>
                  <li>Device information (browser type, operating system)</li>
                  <li>
                    IP address and location data (for security and analytics)
                  </li>
                  <li>Usage patterns and preferences</li>
                  <li>
                    Log data (access times, pages viewed, errors encountered)
                  </li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                  2.3 Cookies and Tracking Technologies
                </h3>
                <p>We use cookies and similar tracking technologies to:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze usage patterns and improve our service</li>
                  <li>Provide personalized content and recommendations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. How We Use Your Information
                </h2>
                <p>
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>
                    Providing and maintaining our AI chat assistant service
                  </li>
                  <li>Processing your requests and responding to inquiries</li>
                  <li>Improving our AI models and service quality</li>
                  <li>Personalizing your experience and recommendations</li>
                  <li>Sending important service updates and notifications</li>
                  <li>
                    Detecting and preventing fraud, abuse, and security threats
                  </li>
                  <li>
                    Complying with legal obligations and resolving disputes
                  </li>
                  <li>
                    Conducting research and analytics to enhance our services
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Information Sharing and Disclosure
                </h2>
                <p>
                  We do not sell your personal information. We may share your
                  information in the following circumstances:
                </p>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                  4.1 Service Providers
                </h3>
                <p>
                  We may share information with trusted third-party service
                  providers who help us operate our business:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Cloud hosting and storage providers</li>
                  <li>Payment processors</li>
                  <li>Analytics and monitoring services</li>
                  <li>Customer support platforms</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                  4.2 Legal Requirements
                </h3>
                <p>
                  We may disclose your information if required by law or in
                  response to:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Valid legal requests from government authorities</li>
                  <li>Court orders or subpoenas</li>
                  <li>Protection of our rights, property, or safety</li>
                  <li>Prevention of fraud or illegal activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Data Security
                </h2>
                <p>
                  We implement appropriate technical and organizational measures
                  to protect your information:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Employee training on data protection practices</li>
                  <li>Incident response procedures for security breaches</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Data Retention
                </h2>
                <p>We retain your information for as long as necessary to:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Improve our AI models and services</li>
                </ul>
                <p className="mt-2">
                  Chat conversations may be retained to improve our AI models,
                  but we implement data minimization practices and regularly
                  review retention periods.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Your Rights and Choices
                </h2>
                <p>
                  You have the following rights regarding your personal
                  information:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>
                    <strong>Access:</strong> Request access to your personal
                    information
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    information
                  </li>
                  <li>
                    <strong>Portability:</strong> Request a copy of your data in
                    a portable format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to certain processing of
                    your information
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request restriction of
                    processing
                  </li>
                </ul>
                <p className="mt-2">
                  To exercise these rights, please contact us at
                  privacy@delibration.com.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Third-Party Services
                </h2>
                <p>
                  Our service may contain links to third-party websites or
                  integrate with third-party services. We are not responsible
                  for the privacy practices of these third parties. We encourage
                  you to review their privacy policies before providing any
                  information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  9. Children's Privacy
                </h2>
                <p>
                  Our service is not intended for children under 13 years of
                  age. We do not knowingly collect personal information from
                  children under 13. If we become aware that we have collected
                  such information, we will take steps to delete it promptly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  10. International Data Transfers
                </h2>
                <p>
                  Your information may be transferred to and processed in
                  countries other than your own. We ensure appropriate
                  safeguards are in place to protect your information in
                  accordance with applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  11. Changes to This Privacy Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes by posting the new Privacy
                  Policy on our website and updating the "Last updated" date.
                  Your continued use of our service after such changes
                  constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  12. Contact Information
                </h2>
                <p>
                  If you have any questions about this Privacy Policy or our
                  privacy practices, please contact us at:
                </p>
                <p className="mt-2">
                  <strong>Support:</strong> support@delibration.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
