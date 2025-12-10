import { getDb } from '../../../drizzle/db'
import { sales, expenses, purchaseOrders } from '../../../drizzle/schema'
import { and, between, count, eq, sql } from 'drizzle-orm'

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const db = getDb(env);
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date') || '1970-01-01';
        const endDate = url.searchParams.get('end_date') || '2099-12-31';

        // Money In: Calculate total revenue from sales
        const [revenueResult] = await db.select({
            totalRevenue: sql`COALESCE(SUM(${sales.total}), 0)`
        }).from(sales).where(between(sales.createdAt, startDate, endDate));

        // Money Out (Stock): Calculate stock purchases from received purchase orders
        const [stockPurchasesResult] = await db.select({
            totalStockPurchases: sql`COALESCE(SUM(${purchaseOrders.total}), 0)`
        }).from(purchaseOrders).where(
            and(
                eq(purchaseOrders.status, 'received'),
                between(purchaseOrders.receivedAt, startDate, endDate)
            )
        );

        // Money Out (OpEx): Calculate total operational expenses
        const [expensesResult] = await db.select({
            totalExpenses: sql`COALESCE(SUM(${expenses.amount}), 0)`
        }).from(expenses).where(between(expenses.createdAt, startDate, endDate));

        // Calculate metrics using Cash Flow approach
        const revenue = Number(revenueResult.totalRevenue) || 0;
        const stockPurchases = Number(stockPurchasesResult.totalStockPurchases) || 0;
        const totalExpenses = Number(expensesResult.totalExpenses) || 0;

        // Net Profit = Money In - (Money Out Stock + Money Out OpEx)
        const netProfit = revenue - (stockPurchases + totalExpenses);
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // Get sales count
        const [salesCountResult] = await db.select({
            count: count()
        }).from(sales).where(between(sales.createdAt, startDate, endDate));

        const summary = {
            total_revenue: parseFloat(revenue.toFixed(2)),
            total_stock_purchases: parseFloat(stockPurchases.toFixed(2)),
            total_expenses: parseFloat(totalExpenses.toFixed(2)),
            net_profit: parseFloat(netProfit.toFixed(2)),
            profit_margin: parseFloat(profitMargin.toFixed(2)),
            sales_count: salesCountResult.count || 0,
            period: { startDate, endDate }
        };

        return new Response(JSON.stringify(summary), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
