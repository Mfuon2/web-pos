export async function onRequest(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const db = env.DB;

        // GET - Fetch settings
        if (request.method === 'GET') {
            const result = await db.prepare('SELECT * FROM settings WHERE id = 1').first();

            if (!result) {
                return new Response(JSON.stringify({ setup_complete: false }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PUT - Update settings
        if (request.method === 'PUT') {
            const body = await request.json();
            const {
                business_name,
                primary_color,
                secondary_color,
                currency_symbol,
                currency_code,
                tax_rate = 0,
                logo_url = null,
                address = null,
                phone = null,
                email = null
            } = body;

            // Check if settings exist
            const existing = await db.prepare('SELECT id FROM settings WHERE id = 1').first();

            if (existing) {
                // Update existing settings
                await db.prepare(`
          UPDATE settings 
          SET business_name = ?,
              primary_color = ?,
              secondary_color = ?,
              currency_symbol = ?,
              currency_code = ?,
              tax_rate = ?,
              logo_url = ?,
              address = ?,
              phone = ?,
              email = ?,
              setup_complete = 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `).bind(
                    business_name,
                    primary_color,
                    secondary_color,
                    currency_symbol,
                    currency_code,
                    tax_rate,
                    logo_url,
                    address,
                    phone,
                    email
                ).run();
            } else {
                // Insert new settings
                await db.prepare(`
          INSERT INTO settings (
            id, business_name, primary_color, secondary_color,
            currency_symbol, currency_code, tax_rate,
            logo_url, address, phone, email, setup_complete
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
                    business_name,
                    primary_color,
                    secondary_color,
                    currency_symbol,
                    currency_code,
                    tax_rate,
                    logo_url,
                    address,
                    phone,
                    email
                ).run();
            }

            // Fetch and return updated settings
            const updated = await db.prepare('SELECT * FROM settings WHERE id = 1').first();

            return new Response(JSON.stringify(updated), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    } catch (error) {
        console.error('Settings API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
