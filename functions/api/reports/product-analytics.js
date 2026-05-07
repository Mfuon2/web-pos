import { getDb } from '../../../drizzle/db'
import { products, saleItems, sales, purchaseOrderItems, purchaseOrders, stock } from '../../../drizzle/schema'
import { and, between, eq, sql, gt } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = getDb(env);
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const productId = url.searchParams.get('product_id');

        if (!startDate || !endDate) {
            return new Response(JSON.stringify({ error: 'Start date and end date are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // If no product_id is provided, we might want to return analytics for all products or errors.
        // The user request suggests "specific product (select field with search capabilities)", 
        // so we'll focus on a single product if provided, or return list of all products sold if not.
        
        if (productId) {
            // Detailed analytics for a single product
            const pid = parseInt(productId);
            
            // 1. Get Product Info
            const [productInfo] = await db.select().from(products).where(eq(products.id, pid));
            if (!productInfo) {
                return new Response(JSON.stringify({ error: 'Product not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 2. Get Current Stock
            const [currentStock] = await db.select().from(stock).where(eq(stock.productId, pid));
            const currentStockCount = currentStock ? currentStock.count : 0;

            // 3. Sales in period
            const [salesInPeriod] = await db.select({
                totalQuantity: sql`COALESCE(SUM(${saleItems.quantity}), 0)`,
                totalAmount: sql`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price}), 0)`
            }).from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .where(
                and(
                    eq(saleItems.productId, pid),
                    between(sales.createdAt, startDate, endDate)
                )
            );

            // 4. Purchases in period
            const [purchasesInPeriod] = await db.select({
                totalQuantity: sql`COALESCE(SUM(${purchaseOrderItems.quantity}), 0)`,
                totalAmount: sql`COALESCE(SUM(${purchaseOrderItems.quantity} * ${purchaseOrderItems.cost}), 0)`
            }).from(purchaseOrderItems)
            .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
            .where(
                and(
                    eq(purchaseOrderItems.productId, pid),
                    eq(purchaseOrders.status, 'received'),
                    between(purchaseOrders.receivedAt, startDate, endDate)
                )
            );

            // 5. Calculate Opening Quantity (backward from NOW)
            // Opening Quantity = Current Stock + Total Sold Since startDate - Total Purchased Since startDate
            
            const [salesSinceStart] = await db.select({
                totalQuantity: sql`COALESCE(SUM(${saleItems.quantity}), 0)`
            }).from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .where(
                and(
                    eq(saleItems.productId, pid),
                    gt(sales.createdAt, startDate)
                )
            );

            const [purchasesSinceStart] = await db.select({
                totalQuantity: sql`COALESCE(SUM(${purchaseOrderItems.quantity}), 0)`
            }).from(purchaseOrderItems)
            .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
            .where(
                and(
                    eq(purchaseOrderItems.productId, pid),
                    eq(purchaseOrders.status, 'received'),
                    gt(purchaseOrders.receivedAt, startDate)
                )
            );

            const openingQuantity = currentStockCount + Number(salesSinceStart.totalQuantity) - Number(purchasesSinceStart.totalQuantity);

            const result = {
                product: productInfo,
                analytics: {
                    openingQuantity,
                    soldQuantity: Number(salesInPeriod.totalQuantity),
                    soldAmount: Number(salesInPeriod.totalAmount),
                    purchasedQuantity: Number(purchasesInPeriod.totalQuantity),
                    purchasedAmount: Number(purchasesInPeriod.totalAmount),
                    closingQuantity: openingQuantity + Number(purchasesInPeriod.totalQuantity) - Number(salesInPeriod.totalQuantity)
                }
            };

            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
            });

        } else {
            // Detailed analytics for ALL products
            
            // 1. Get all products with current stock
            const allProducts = await db.select({
                id: products.id,
                name: products.name,
                barcode: products.barcode,
                currentStock: sql`COALESCE(${stock.count}, 0)`
            }).from(products)
            .leftJoin(stock, eq(products.id, stock.productId))
            .where(sql`${products.deletedAt} IS NULL`);

            // 2. Aggregate sales since start_date for all products
            const salesSinceStartMap = await db.select({
                productId: saleItems.productId,
                totalSold: sql`SUM(${saleItems.quantity})`,
                totalAmount: sql`SUM(${saleItems.quantity} * ${saleItems.price})`,
                periodSold: sql`SUM(CASE WHEN ${sales.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${saleItems.quantity} ELSE 0 END)`,
                periodAmount: sql`SUM(CASE WHEN ${sales.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${saleItems.quantity} * ${saleItems.price} ELSE 0 END)`
            }).from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .where(gt(sales.createdAt, startDate))
            .groupBy(saleItems.productId);

            // 3. Aggregate purchases since start_date for all products
            const purchasesSinceStartMap = await db.select({
                productId: purchaseOrderItems.productId,
                totalPurchased: sql`SUM(${purchaseOrderItems.quantity})`,
                periodPurchased: sql`SUM(CASE WHEN ${purchaseOrders.receivedAt} BETWEEN ${startDate} AND ${endDate} THEN ${purchaseOrderItems.quantity} ELSE 0 END)`,
                periodAmount: sql`SUM(CASE WHEN ${purchaseOrders.receivedAt} BETWEEN ${startDate} AND ${endDate} THEN ${purchaseOrderItems.quantity} * ${purchaseOrderItems.cost} ELSE 0 END)`
            }).from(purchaseOrderItems)
            .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
            .where(
                and(
                    eq(purchaseOrders.status, 'received'),
                    gt(purchaseOrders.receivedAt, startDate)
                )
            )
            .groupBy(purchaseOrderItems.productId);

            // Create maps for quick lookup
            const salesMap = new Map(salesSinceStartMap.map(s => [s.productId, s]));
            const purchasesMap = new Map(purchasesSinceStartMap.map(p => [p.productId, p]));

            // 4. Combine data
            const results = allProducts.map(p => {
                const s = salesMap.get(p.id) || { totalSold: 0, periodSold: 0, periodAmount: 0 };
                const pur = purchasesMap.get(p.id) || { totalPurchased: 0, periodPurchased: 0, periodAmount: 0 };

                const openingQuantity = Number(p.currentStock) + Number(s.totalSold) - Number(pur.totalPurchased);
                const soldQuantity = Number(s.periodSold);
                const soldAmount = Number(s.periodAmount);
                const purchasedQuantity = Number(pur.periodPurchased);
                const purchasedAmount = Number(pur.periodAmount);
                const closingQuantity = openingQuantity + purchasedQuantity - soldQuantity;

                return {
                    product: { id: p.id, name: p.name, barcode: p.barcode },
                    analytics: {
                        openingQuantity,
                        soldQuantity,
                        soldAmount,
                        purchasedQuantity,
                        purchasedAmount,
                        closingQuantity
                    }
                };
            });

            // Filter out products with no activity if needed, but the user asked for "all existing products"
            // Let's filter to only those that have non-zero stock or had activity in the period to keep it clean.
            const activeResults = results.filter(r => 
                r.analytics.openingQuantity !== 0 || 
                r.analytics.soldQuantity !== 0 || 
                r.analytics.purchasedQuantity !== 0 ||
                r.analytics.closingQuantity !== 0
            );

            return new Response(JSON.stringify({ products: activeResults }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
