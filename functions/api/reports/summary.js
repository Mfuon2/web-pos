// GET /api/reports/summary - Financial P&L calculation (Cash Flow Approach)

export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date') || '1970-01-01';
        const endDate = url.searchParams.get('end_date') || '2099-12-31';

        // Money In: Calculate total revenue from sales
        const revenueResult = await env.DB.prepare(
            'SELECT COALESCE(SUM(total), 0) as total_revenue FROM sales WHERE created_at BETWEEN ? AND ?'
        ).bind(startDate, endDate).first();

        // Money Out (Stock): Calculate stock purchases from received purchase orders
        const stockPurchasesResult = await env.DB.prepare(
            'SELECT COALESCE(SUM(total), 0) as total_stock_purchases FROM purchase_orders WHERE status = ? AND received_at BETWEEN ? AND ?'
        ).bind('received', startDate, endDate).first();

        // Money Out (OpEx): Calculate total operational expenses
        const expensesResult = await env.DB.prepare(
            'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE created_at BETWEEN ? AND ?'
        ).bind(startDate, endDate).first();

        // Calculate metrics using Cash Flow approach
        const revenue = revenueResult.total_revenue || 0;
        const stockPurchases = stockPurchasesResult.total_stock_purchases || 0;
        const expenses = expensesResult.total_expenses || 0;

        // Net Profit = Money In - (Money Out Stock + Money Out OpEx)
        const netProfit = revenue - (stockPurchases + expenses);
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // Get sales count
        const salesCountResult = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM sales WHERE created_at BETWEEN ? AND ?'
        ).bind(startDate, endDate).first();

        const summary = {
            total_revenue: parseFloat(revenue.toFixed(2)),
            total_stock_purchases: parseFloat(stockPurchases.toFixed(2)),
            total_expenses: parseFloat(expenses.toFixed(2)),
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
