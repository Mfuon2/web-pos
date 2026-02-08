export async function onRequestPost(context) {
  const { env } = context;

  try {
    // Add paid_quantity column
    try {
      await env.DB.prepare(
        `ALTER TABLE borrowed_items ADD COLUMN paid_quantity INTEGER DEFAULT 0`,
      ).run();
    } catch (e) {
      console.warn(
        "Could not add paid_quantity (might already exist):",
        e.message,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added paid_quantity to borrowed_items.",
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
