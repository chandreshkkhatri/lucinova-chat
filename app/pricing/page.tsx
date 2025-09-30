import { auth } from "@/app/(auth)/auth";
import { getUserByEmail } from "@/db/queries";
import { PricingSection } from "@/components/pricing-section";

export default async function PricingPage() {
  const session = await auth();
  let isPro = false;

  // Check if user is pro
  if (session?.user?.email) {
    try {
      const dbUser = await getUserByEmail(session.user.email);
      if (dbUser && !Array.isArray(dbUser)) {
        isPro = !!dbUser.isPro;
      }
    } catch {}
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
      <PricingSection isPro={isPro} />
    </main>
  );
}