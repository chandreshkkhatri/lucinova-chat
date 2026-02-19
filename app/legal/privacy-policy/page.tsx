import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Lucidity AI chat assistant - learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 pt-20">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            Privacy Policy
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Last updated on 27-09-2025
            </p>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <p>
                  This Privacy Policy describes how Rebundled Company
                  (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects,
                  uses, and shares information about you when you use our
                  services, including the Lucidity AI chat assistant
                  (&quot;Services&quot;).
                </p>
                <p className="mt-4">
                  By using our Services, you agree to the collection and use of
                  information in accordance with this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Information We Collect
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    <strong>Account Information:</strong> When you register, we
                    collect your name, email address, and password (stored
                    securely hashed).
                  </li>
                  <li>
                    <strong>Usage Data:</strong> We collect information on how
                    you interact with our Services, including chat history,
                    features used, and time spent.
                  </li>
                  <li>
                    <strong>Device &amp; Browser Data:</strong> We may collect
                    information such as your IP address, browser type, device
                    type, and operating system.
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Payment transactions
                    are processed by third-party payment processors. We do not
                    store your full payment card details.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  How We Use Your Information
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>To provide, maintain, and improve our Services.</li>
                  <li>
                    To process transactions and send related information such as
                    confirmations and invoices.
                  </li>
                  <li>
                    To send you technical notices, updates, security alerts, and
                    support messages.
                  </li>
                  <li>
                    To respond to your comments, questions, and requests, and
                    provide customer service.
                  </li>
                  <li>
                    To monitor and analyze trends, usage, and activities in
                    connection with our Services.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Data Sharing &amp; Disclosure
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    We do not sell, trade, or rent your personal information to
                    third parties.
                  </li>
                  <li>
                    We may share data with trusted service providers who assist
                    in operating our Services, subject to confidentiality
                    obligations.
                  </li>
                  <li>
                    We may disclose information when required by law or to
                    protect our rights, safety, or the rights of others.
                  </li>
                  <li>
                    AI models process your chat messages to generate responses.
                    Please do not share sensitive personal or financial
                    information in chats.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Data Retention
                </h2>
                <p>
                  We retain your personal data for as long as your account is
                  active or as needed to provide our Services. You may request
                  deletion of your account and associated data at any time by
                  contacting us at{" "}
                  <a
                    href="mailto:support@lucidity.chat"
                    className="text-primary hover:underline"
                  >
                    support@lucidity.chat
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Cookies
                </h2>
                <p>
                  We use cookies and similar tracking technologies to track
                  activity on our Services and hold certain information. You can
                  instruct your browser to refuse all cookies or to indicate
                  when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Your Rights
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    <strong>Access &amp; Portability:</strong> You may request a
                    copy of your personal data.
                  </li>
                  <li>
                    <strong>Correction:</strong> You may update or correct
                    inaccurate information through your account settings.
                  </li>
                  <li>
                    <strong>Deletion:</strong> You may request deletion of your
                    personal data, subject to legal obligations.
                  </li>
                  <li>
                    <strong>Objection:</strong> You may object to certain
                    processing of your personal data.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Security
                </h2>
                <p>
                  We implement industry-standard security measures to protect
                  your data. However, no method of transmission over the
                  Internet or method of electronic storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new policy on this
                  page and updating the &quot;Last updated&quot; date.
                </p>
              </section>

              <section className="mt-8 pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Contact Us
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, please
                  contact us at{" "}
                  <a
                    href="mailto:support@lucidity.chat"
                    className="text-primary hover:underline"
                  >
                    support@lucidity.chat
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
