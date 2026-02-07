export async function onRequestPost(context) {
  const { env } = context;

  try {
    // Add incurred_date column
    try {
      await env.DB.prepare(
        `ALTER TABLE expenses ADD COLUMN incurred_date DATE`,
      ).run();
    } catch (e) {
      console.log("Column might already exist:", e.message);
    }

    // Backfill incurred_date from createdAt
    // SQLite: date(created_at) extracts the YYYY-MM-DD part
    await env.DB.prepare(
      `
      UPDATE expenses 
      SET incurred_date = date(created_at) 
      WHERE incurred_date IS NULL OR incurred_date = ''
    `,
    ).run();

    return Response.json({
      success: true,
      message: "Successfully added and backfilled incurred_date for expenses.",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
