const Razorpay = require("razorpay");
require("dotenv").config({ path: ".env.local" });
// Fallback to .env if .env.local doesn't exist or is empty
require("dotenv").config();

async function verify() {
    console.log("🔍 Verifying Payment Configuration...");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!keyId || !keySecret) {
        console.error("❌ Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
        process.exit(1);
    }

    console.log("✅ Credentials found.");

    try {
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Try to fetch the plan if ID is provided
        if (planId) {
            console.log(`Checking Plan ID: ${planId}...`);
            try {
                const plan = await razorpay.plans.fetch(planId);
                console.log(`✅ Plan found: ${plan.item.name} (${plan.item.amount / 100} ${plan.item.currency})`);
            } catch (error) {
                console.error(`❌ Plan ${planId} not found or invalid.`);
                console.error(error.error?.description || error.message);
            }
        } else {
            console.warn("⚠️ RAZORPAY_PLAN_ID not set. The app will attempt to create one automatically on first subscription attempt.");
        }

        console.log("\n✅ Configuration verification complete.");

    } catch (error) {
        console.error("❌ Failed to initialize Razorpay client or connect:");
        console.error(error);
    }
}

verify();
