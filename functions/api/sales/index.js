import { getNairobiTimestamp } from '../../utils/timezone.js'
import { getDb } from '../../../drizzle/db'
import { sales, saleItems, products } from '../../../drizzle/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env } = context;

    try {
        const db = getDb(env);

        // Get all sales with their items using a join
        const salesData = await db.select({
            id: sales.id,
            total: sales.total,
            paymentMethod: sales.paymentMethod,
            createdAt: sales.createdAt
        }).from(sales).orderBy(desc(sales.createdAt));

        // For each sale, get the items
        const salesWithItems = await Promise.all(salesData.map(async (sale) => {
            const items = await db.select({
                id: saleItems.id,
                quantity: saleItems.quantity,
                price: saleItems.price,
                productName: products.name,
                productId: products.id
            }).from(saleItems)
                .leftJoin(products, eq(saleItems.productId, products.id))
                .where(eq(saleItems.saleId, sale.id));

            return {
                ...sale,
                items
            };
        }));

        return new Response(JSON.stringify(salesWithItems), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const db = getDb(env);
        const body = await request.json();
        const { items, total, payment_method } = body;

        // Get Nairobi timestamp
        const timestamp = getNairobiTimestamp();

        // Insert the sale with Nairobi time
        const [saleResult] = await db.insert(sales).values({
            total,
            paymentMethod: payment_method,
            createdAt: timestamp
        }).returning({ id: sales.id });

        const saleId = saleResult.id;

        // Insert sale items and update stock
        for (const item of items) {
            await db.insert(saleItems).values({
                saleId,
                productId: item.product_id,
                quantity: item.quantity,
                price: item.price
            });

            await db.update(products)
                .set({ stock: sql`${products.stock} - ${item.quantity}` })
                .where(eq(products.id, item.product_id));
        }

        return new Response(JSON.stringify({
            success: true,
            sale_id: saleId,
            created_at: timestamp
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
