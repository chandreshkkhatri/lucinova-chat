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
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
            Contact Us
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6 text-center">
              Last updated on 27-09-2025 18:41:19
            </p>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <p className="text-center mb-8">
                  You may contact us using the information below:
                </p>
              </section>

              <section className="bg-muted rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">
                      Email:
                    </p>
                    <p>
                      <a
                        href="mailto:support@lucidity.chat"
                        className="text-primary hover:underline"
                      >
                        support@lucidity.chat
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Telephone:
                    </p>
                    <p>
                      <a
                        href="tel:8209972074"
                        className="text-primary hover:underline"
                      >
                        8209972074
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8 pt-6 border-t border-border">
                <p className="text-center text-muted-foreground">
                  We strive to respond to all inquiries within 24-48 hours
                  during business days.
                </p>
              </section>

              <section className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Legal Entity & Address
                </h3>
                <div className="text-sm text-muted-foreground/80 space-y-1">
                  <p><span className="font-medium">Entity:</span> Rebundled Company</p>
                  <p><span className="font-medium">Address:</span> 202, 2nd Floor, Plot No 786, 5th Cross, 4th block, Koramangala, Near Swabhimaana Karanji Park, Bengaluru, Karnataka, India - 560034</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
