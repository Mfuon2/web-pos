import { getNairobiTimestamp } from "../utils/timezone.js";

export async function onRequestPost(context) {
  const { env } = context;

  try {
    // 1. Add sale_date column if it doesn't exist
    try {
      await env.DB.prepare("ALTER TABLE sales ADD COLUMN sale_date DATE").run();
    } catch (e) {
      if (!e.message.includes("duplicate column name")) {
        throw e;
      }
      // Column might already exist, which is fine
    }

    // 2. Backfill existing records
    // We update sale_date to be the date part of created_at where sale_date is NULL
    const result = await env.DB.prepare(
      `UPDATE sales 
       SET sale_date = DATE(created_at) 
       WHERE sale_date IS NULL`,
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added sale_date column and backfilled data",
        updatedRows: result.meta.changes,
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
