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
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            Legal Documents
          </h1>

          <p className="text-muted-foreground text-center mb-8">
            Access all important legal documents and policies for Lucidity
            services.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Terms and Conditions */}
            <div className="bg-muted rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Terms and Conditions
              </h2>
              <p className="text-muted-foreground mb-4">
                Review our terms of service that govern your use of Lucidity's
                AI chat assistant.
              </p>
              <a
                href="/legal/terms-and-conditions"
                className="inline-block w-full text-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors"
              >
                View Terms & Conditions
              </a>
            </div>

            {/* Refund and Cancellation Policy */}
            <div className="bg-muted rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Refund & Cancellation Policy
              </h2>
              <p className="text-muted-foreground mb-4">
                Understand our refund and cancellation policies for subscription
                services.
              </p>
              <a
                href="/legal/refund-policy"
                className="inline-block w-full text-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors"
              >
                View Refund Policy
              </a>
            </div>

            {/* Contact Us */}
            <div className="bg-muted rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Contact Us
              </h2>
              <p className="text-muted-foreground mb-4">
                Get in touch with our support team for any questions or
                assistance.
              </p>
              <a
                href="/contact-us"
                className="inline-block w-full text-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors"
              >
                View Contact Information
              </a>
            </div>

            {/* Privacy Policy */}
            <div className="bg-muted rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Privacy Policy
              </h2>
              <p className="text-muted-foreground mb-4">
                Learn how we collect, use, and protect your personal
                information.
              </p>
              <a
                href="/privacy"
                className="inline-block w-full text-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors"
              >
                View Privacy Policy
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              All documents are regularly updated. Last reviewed:{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
