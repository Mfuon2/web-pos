import { getDb } from '../../../drizzle/db'
import { sales, saleItems, products, expenses, purchaseOrders, purchaseOrderItems, stock } from '../../../drizzle/schema'
import { and, between, count, eq, sql, gt, desc } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = getDb(env);
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date') || '1970-01-01';
        const endDate = url.searchParams.get('end_date') || '2099-12-31';

        // 1. Basic Stats (Revenue, Sales Count)
        const [revenueResult] = await db.select({
            totalRevenue: sql`COALESCE(SUM(${sales.total}), 0)`,
            salesCount: count()
        }).from(sales).where(between(sales.createdAt, startDate, endDate));

        // 2. Stock Purchases
        const [stockPurchasesResult] = await db.select({
            totalStockPurchases: sql`COALESCE(SUM(${purchaseOrders.total}), 0)`
        }).from(purchaseOrders).where(
            and(
                eq(purchaseOrders.status, 'received'),
                between(purchaseOrders.receivedAt, startDate, endDate)
            )
        );

        // 3. Expenses
        const [expensesResult] = await db.select({
            totalExpenses: sql`COALESCE(SUM(${expenses.amount}), 0)`
        }).from(expenses).where(between(expenses.createdAt, startDate, endDate));

        // 4. Gross Profit & COGS (JOIN saleItems and products)
        const [grossProfitResult] = await db.select({
            totalCogs: sql`COALESCE(SUM(${saleItems.quantity} * ${products.cost}), 0)`,
            grossProfit: sql`COALESCE(SUM(${saleItems.quantity} * (${saleItems.price} - ${products.cost})), 0)`
        }).from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(between(sales.createdAt, startDate, endDate));

        // 5. Payment Method Breakdown
        const paymentMethodBreakdown = await db.select({
            method: sql`LOWER(${sales.paymentMethod})`,
            total: sql`SUM(${sales.total})`,
            count: count()
        }).from(sales)
        .where(between(sales.createdAt, startDate, endDate))
        .groupBy(sql`LOWER(${sales.paymentMethod})`);

        // 6. Top Products BY QUANTITY
        const topByQuantity = await db.select({
            id: products.id,
            name: products.name,
            quantity: sql`SUM(${saleItems.quantity})`,
            revenue: sql`SUM(${saleItems.quantity} * ${saleItems.price})`
        }).from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(between(sales.createdAt, startDate, endDate))
        .groupBy(products.id)
        .orderBy(desc(sql`SUM(${saleItems.quantity})`))
        .limit(5);

        // 7. Top Products BY PROFIT
        const topByProfit = await db.select({
            id: products.id,
            name: products.name,
            profit: sql`SUM(${saleItems.quantity} * (${saleItems.price} - ${products.cost}))`
        }).from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(between(sales.createdAt, startDate, endDate))
        .groupBy(products.id)
        .orderBy(desc(sql`SUM(${saleItems.quantity} * (${saleItems.price} - ${products.cost}))`))
        .limit(5);

        // 8. Daily Trends (Revenue vs Expenses)
        // Note: This might be complex depending on date range. For now let's just do revenue.
        const dailyTrends = await db.select({
            date: sql`DATE(${sales.createdAt})`,
            revenue: sql`SUM(${sales.total})`
        }).from(sales)
        .where(between(sales.createdAt, startDate, endDate))
        .groupBy(sql`DATE(${sales.createdAt})`)
        .orderBy(sql`DATE(${sales.createdAt})`);

        // 9. Product Analytics (Active vs Inactive)
        // We reuse logic from product-analytics.js but for ALL products
        
        // Get all products with current stock
        const allProducts = await db.select({
            id: products.id,
            name: products.name,
            barcode: products.barcode,
            cost: products.cost,
            price: products.price,
            currentStock: sql`COALESCE(${stock.count}, 0)`
        }).from(products)
        .leftJoin(stock, eq(products.id, stock.productId))
        .where(sql`${products.deletedAt} IS NULL`);

        // Aggregate sales since start_date for all products (for opening balance calculation)
        const salesSinceStartMap = await db.select({
            productId: saleItems.productId,
            totalSoldSinceStart: sql`SUM(CASE WHEN ${sales.createdAt} > ${startDate} THEN ${saleItems.quantity} ELSE 0 END)`,
            periodSold: sql`SUM(CASE WHEN ${sales.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${saleItems.quantity} ELSE 0 END)`,
            periodAmount: sql`SUM(CASE WHEN ${sales.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${saleItems.quantity} * ${saleItems.price} ELSE 0 END)`,
            periodProfit: sql`SUM(CASE WHEN ${sales.createdAt} BETWEEN ${startDate} AND ${endDate} THEN ${saleItems.quantity} * (${saleItems.price} - ${products.cost}) ELSE 0 END)`
        }).from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(gt(sales.createdAt, startDate))
        .groupBy(saleItems.productId);

        // Aggregate purchases since start_date for all products
        const purchasesSinceStartMap = await db.select({
            productId: purchaseOrderItems.productId,
            totalPurchasedSinceStart: sql`SUM(CASE WHEN ${purchaseOrders.receivedAt} > ${startDate} THEN ${purchaseOrderItems.quantity} ELSE 0 END)`,
            periodPurchased: sql`SUM(CASE WHEN ${purchaseOrders.receivedAt} BETWEEN ${startDate} AND ${endDate} THEN ${purchaseOrderItems.quantity} ELSE 0 END)`
        }).from(purchaseOrderItems)
        .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
        .where(
            and(
                eq(purchaseOrders.status, 'received'),
                gt(purchaseOrders.receivedAt, startDate)
            )
        )
        .groupBy(purchaseOrderItems.productId);

        const salesMap = new Map(salesSinceStartMap.map(s => [s.productId, s]));
        const purchasesMap = new Map(purchasesSinceStartMap.map(p => [p.productId, p]));

        const productAnalytics = allProducts.map(p => {
            const s = salesMap.get(p.id) || { totalSoldSinceStart: 0, periodSold: 0, periodAmount: 0, periodProfit: 0 };
            const pur = purchasesMap.get(p.id) || { totalPurchasedSinceStart: 0, periodPurchased: 0 };

            const openingQuantity = Number(p.currentStock) + Number(s.totalSoldSinceStart) - Number(pur.totalPurchasedSinceStart);
            const soldQuantity = Number(s.periodSold);
            const purchasedQuantity = Number(pur.periodPurchased);
            const closingQuantity = openingQuantity + purchasedQuantity - soldQuantity;

            return {
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                cost: p.cost,
                price: p.price,
                openingQuantity,
                soldQuantity,
                purchasedQuantity,
                closingQuantity,
                soldAmount: s.periodAmount,
                profit: s.periodProfit
            };
        });

        const activeProducts = productAnalytics.filter(pa => pa.soldQuantity > 0);
        const inactiveProducts = productAnalytics.filter(pa => pa.soldQuantity === 0);

        // Calculate Final Metrics
        const revenue = Number(revenueResult.totalRevenue) || 0;
        const stockPurchases = Number(stockPurchasesResult.totalStockPurchases) || 0;
        const totalExpenses = Number(expensesResult.totalExpenses) || 0;
        const grossProfit = Number(grossProfitResult.grossProfit) || 0;
        const totalCogs = Number(grossProfitResult.totalCogs) || 0;
        const netProfit = revenue - (stockPurchases + totalExpenses);
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        const summary = {
            total_revenue: parseFloat(revenue.toFixed(2)),
            total_stock_purchases: parseFloat(stockPurchases.toFixed(2)),
            total_expenses: parseFloat(totalExpenses.toFixed(2)),
            total_cogs: parseFloat(totalCogs.toFixed(2)),
            gross_profit: parseFloat(grossProfit.toFixed(2)),
            net_profit: parseFloat(netProfit.toFixed(2)),
            profit_margin: parseFloat(profitMargin.toFixed(2)),
            sales_count: revenueResult.salesCount || 0,
            payment_breakdown: paymentMethodBreakdown,
            top_products: {
                by_quantity: topByQuantity,
                by_profit: topByProfit
            },
            daily_trends: dailyTrends,
            product_analytics: {
                active: activeProducts,
                inactive: inactiveProducts
            },
            period: { startDate, endDate }
        };

        return new Response(JSON.stringify(summary), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Summary stats error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
