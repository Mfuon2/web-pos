export async function onRequestPost(context) {
  const { env } = context;

  try {
    // 1. Add returned_quantity column
    try {
      await env.DB.prepare(
        `ALTER TABLE borrowed_items ADD COLUMN returned_quantity INTEGER DEFAULT 0`,
      ).run();
    } catch (e) {
      console.warn(
        "Could not add returned_quantity (might already exist):",
        e.message,
      );
    }

    // 2. Add returned status if not already handled by logic (optional, status is just text)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added returned_quantity to borrowed_items.",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
