import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to get user identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    const { product_id, quantity = 1 } = await req.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: "product_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get product
    const { data: product, error: prodErr } = await admin
      .from("products")
      .select("*")
      .eq("id", product_id)
      .eq("is_active", true)
      .single();

    if (prodErr || !product) {
      return new Response(JSON.stringify({ error: "Product not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check stock
    if (product.stock < quantity) {
      return new Response(JSON.stringify({ error: "Not enough stock available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalPrice = product.price * quantity;

    // 3. Get wallet
    const { data: wallet, error: walletErr } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletErr || !wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Check balance
    if (Number(wallet.balance) < totalPrice) {
      return new Response(
        JSON.stringify({
          error: "Insufficient balance",
          required: totalPrice,
          current: Number(wallet.balance),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Deduct balance
    const newBalance = Number(wallet.balance) - totalPrice;
    const { error: balErr } = await admin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    if (balErr) {
      return new Response(JSON.stringify({ error: "Failed to deduct balance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Decrement stock
    const { error: stockErr } = await admin
      .from("products")
      .update({ stock: product.stock - quantity })
      .eq("id", product.id);

    if (stockErr) {
      // Rollback wallet
      await admin.from("wallets").update({ balance: wallet.balance }).eq("id", wallet.id);
      return new Response(JSON.stringify({ error: "Failed to update stock" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Create order
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        product_id: product.id,
        product_title: product.title,
        product_platform: product.platform,
        total_price: totalPrice,
        quantity,
        currency: product.currency,
        status: "pending",
      })
      .select()
      .single();

    if (orderErr) {
      // Rollback wallet + stock
      await admin.from("wallets").update({ balance: wallet.balance }).eq("id", wallet.id);
      await admin.from("products").update({ stock: product.stock }).eq("id", product.id);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Create transaction record
    await admin.from("transactions").insert({
      user_id: user.id,
      amount: totalPrice,
      type: "debit",
      description: `Purchase: ${product.title}`,
      reference: order.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        new_balance: newBalance,
        message: "Purchase successful",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
