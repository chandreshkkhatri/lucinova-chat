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
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Cancellation & Refund Policy
          </h1>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Last updated on 27-09-2025 18:47:05
            </p>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <p>
                  CHANDRESH KUMAR believes in helping its customers as far as
                  possible, and has therefore a liberal cancellation policy.
                  Under this policy:
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Cancellation Policy
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    Cancellations will be considered only if the request is made
                    immediately after placing the order. However, the
                    cancellation request may not be entertained if the orders
                    have been communicated to the vendors/merchants and they
                    have initiated the process of shipping them.
                  </li>
                  <li>
                    CHANDRESH KUMAR does not accept cancellation requests for
                    perishable items like flowers, eatables etc. However,
                    refund/replacement can be made if the customer establishes
                    that the quality of product delivered is not good.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Damaged or Defective Items
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    In case of receipt of damaged or defective items please
                    report the same to our Customer Service team. The request
                    will, however, be entertained once the merchant has checked
                    and determined the same at his own end. This should be
                    reported within <strong>7 Days</strong> of receipt of the
                    products.
                  </li>
                  <li>
                    In case you feel that the product received is not as shown
                    on the site or as per your expectations, you must bring it
                    to the notice of our customer service within{" "}
                    <strong>7 Days</strong> of receiving the product. The
                    Customer Service Team after looking into your complaint will
                    take an appropriate decision.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Refund Policy
                </h2>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-3">
                  <li>
                    In case of complaints regarding products that come with a
                    warranty from manufacturers, please refer the issue to them.
                  </li>
                  <li>
                    In case of any Refunds approved by the CHANDRESH KUMAR,
                    it&apos;ll take <strong>9-15 Days</strong> for the refund to be
                    processed to the end customer.
                  </li>
                </ul>
              </section>

              <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
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
