import Stripe from "npm:stripe@17.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
    const appUrl = Deno.env.get("APP_URL");

    if (!stripeSecretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    if (!stripePriceId) {
      throw new Error("Missing STRIPE_PRICE_ID");
    }

    if (!appUrl) {
      throw new Error("Missing APP_URL");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });

    // Read request body
    const { email, userId } = await req.json();

    if (!email) {
      throw new Error("Email is required.");
    }

    if (!userId) {
      throw new Error("User ID is required.");
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      customer_email: email,

      client_reference_id: userId,

      payment_method_types: ["card"],

      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],

      subscription_data: {
        trial_period_days: 30,
        metadata: {
          user_id: userId,
        },
      },

      metadata: {
        user_id: userId,
      },

      success_url: `${appUrl}/onboarding`,

      cancel_url: `${appUrl}/subscribe?canceled=true`,
    });

    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("CHECKOUT SESSION ERROR:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown checkout error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});