import { getDb } from '../../../drizzle/db'
import { settings } from '../../../drizzle/schema'
import { eq, sql } from 'drizzle-orm'

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
        const db = getDb(env);

        // GET - Fetch settings
        if (request.method === 'GET') {
            const result = await db.select().from(settings).where(eq(settings.id, 1)).get();

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
                email = null,
                timezone = 'Africa/Nairobi'
            } = body;

            // Check if settings exist
            const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.id, 1)).get();

            if (existing) {
                // Update existing settings
                await db.update(settings)
                    .set({
                        businessName: business_name,
                        primaryColor: primary_color,
                        secondaryColor: secondary_color,
                        currencySymbol: currency_symbol,
                        currencyCode: currency_code,
                        taxRate: tax_rate,
                        logoUrl: logo_url,
                        address,
                        phone,
                        email,
                        timezone,
                        setupComplete: 1,
                        updatedAt: sql`CURRENT_TIMESTAMP`
                    })
                    .where(eq(settings.id, 1));
            } else {
                // Insert new settings
                await db.insert(settings).values({
                    id: 1,
                    businessName: business_name,
                    primaryColor: primary_color,
                    secondaryColor: secondary_color,
                    currencySymbol: currency_symbol,
                    currencyCode: currency_code,
                    taxRate: tax_rate,
                    logoUrl: logo_url,
                    address,
                    phone,
                    email,
                    timezone,
                    setupComplete: 1
                });
            }

            // Fetch and return updated settings
            const updated = await db.select().from(settings).where(eq(settings.id, 1)).get();

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
