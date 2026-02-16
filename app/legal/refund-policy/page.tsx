import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "Cancellation and Refund Policy for Lucidity - understand our policies for cancellations and refunds.",
};

export default function RefundPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 pt-20">
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            Cancellation & Refund Policy
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Last updated on 27-09-2025 18:47:05
            </p>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <p>
                  Rebundled Company believes in helping its customers as far as
                  possible, and has therefore a liberal cancellation policy.
                  Under this policy:
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Subscription Cancellation
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    You may cancel your subscription at any time through your
                    account settings or by contacting our customer service team.
                  </li>
                  <li>
                    Upon cancellation, your subscription will remain active until
                    the end of the current billing period. You will not be
                    charged for any subsequent billing periods.
                  </li>
                  <li>
                    No refunds will be provided for the current billing period
                    upon cancellation, except as stated in the Refund Policy
                    section below.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Service Issues and Technical Refunds
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    If you experience technical issues that prevent you from
                    using the service, please contact our customer service team
                    immediately at support@lucidity.chat.
                  </li>
                  <li>
                    Refunds for the current billing period may be considered if
                    you experience significant technical issues that prevent
                    service use. You must report the issue within{" "}
                    <strong>7 Days</strong> of the billing date with detailed
                    information about the problem.
                  </li>
                  <li>
                    Our Customer Service Team will investigate your complaint and
                    determine whether a refund or credit is appropriate.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Refund Processing
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    When a refund is approved by Rebundled Company, it will be
                    credited to your original payment method or account balance
                    within <strong>7-15 Business Days</strong>.
                  </li>
                  <li>
                    The exact timeline depends on your payment method and your
                    financial institution's processing time.
                  </li>
                  <li>
                    We recommend checking your account settings and email for
                    confirmation of refund approval and processing status.
                  </li>
                </ul>
              </section>

              <section className="mt-8 pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Contact Us
                </h2>
                <p>
                  For any questions or concerns regarding cancellations and
                  refunds, please contact our customer service team using the
                  contact information provided on this website.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
