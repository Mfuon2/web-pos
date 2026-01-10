export async function onRequestGet(context) {
    const { env } = context;
    try {
        // Join loans with items for a complete view
        // Since D1 doesn't support complex JSON_GROUP_ARRAY easily in all versions, 
        // we might fetch loans then fetch items, or just fetch flat structure.
        // Let's fetch loans and then their items or use a join.
        // For simplicity in UI, we often want "Loan #123 (Shop X) - 3 items".

        // Fetch all loans first
        const { results: loans } = await env.DB.prepare(`
      SELECT * FROM loans ORDER BY created_at DESC
    `).all();

        if (loans.length === 0) {
            return Response.json([]);
        }

        // This loop might be slightly N+1 but D1 is fast locally. 
        // Optimized: get all loan items for these loans
        const loanIds = loans.map(l => l.id).join(',');
        const { results: items } = await env.DB.prepare(`
      SELECT 
        li.*, p.name as product_name, p.barcode 
      FROM loan_items li
      JOIN products p ON li.product_id = p.id
      WHERE li.loan_id IN (${loanIds})
    `).all();

        // Attach items to loans
        const loansWithItems = loans.map(loan => ({
            ...loan,
            items: items.filter(i => i.loan_id === loan.id)
        }));

        return Response.json(loansWithItems);
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        const { borrower_name, borrower_contact, collateral, collateral_description, items } = body;

        if (!borrower_name || !items || items.length === 0) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }



        // There is a quirk in D1 local vs remote with RETURNING. 
        // results is usually an array of result sets or the object with 'results' property.
        // Let's assume standardized D1 return or last_insert_rowid if needed.
        // For standard D1 shim: result.meta.last_row_id or similar.
        // However, RETURNING id gives us the ID in results array.

        // Depending on D1 version logic:
        // With .run(), results usually contains { success: true, meta: { ... }, results: [] }
        // but .first() or .all() is better for RETURNING.
        // Let's use two distinct queries or handle it carefully.

        // Re-run safely:
        // Implementation note: D1 client API might differ. 
        // Safest cross-env way: INSERT then SELECT last_insert_rowid()

        const db = env.DB;

        // Use batch? No, we need ID for next steps.

        // 1. Insert Loan
        const insertLoan = await db.prepare(`
        INSERT INTO loans (borrower_name, borrower_contact, collateral, collateral_description)
        VALUES (?, ?, ?, ?)
    `).bind(borrower_name, borrower_contact, collateral, collateral_description).run();

        if (!insertLoan.success) throw new Error('Failed to insert loan');

        // 2. Get ID
        // Note: meta.last_row_id is available in recent D1 versions
        const loanId = insertLoan.meta.last_row_id;

        // 3. Insert Items and Update Stock!
        // IMPORTANT: Providing a loan reduces physical stock available in store? 
        // Usually yes. If I loan it out, I can't sell it.
        // But stock tracking can be tricky. "Loaned" might be a separate state.
        // For now, let's decrement stock to prevent selling it, but logic might vary.
        // User request: "load a dialog with all the selected Items and qty".
        // Assumption: Loans DECREASE available stock.

        const statements = [];
        for (const item of items) {
            statements.push(
                db.prepare(`
           INSERT INTO loan_items (loan_id, product_id, quantity)
           VALUES (?, ?, ?)
         `).bind(loanId, item.product_id, item.quantity)
            );

            // Decrement stock
            statements.push(
                db.prepare(`
           UPDATE products SET stock = stock - ? WHERE id = ?
         `).bind(item.quantity, item.product_id)
            );
        }

        await db.batch(statements);

        return Response.json({ success: true, message: 'Loan recorded successfully', id: loanId }, { status: 201 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        const { id, status, borrower_name, items_to_return } = body;
        // Simplified update: Just status or edit details.
        // If returning items: we need to increment stock back.

        if (!id) return Response.json({ error: 'Missing ID' }, { status: 400 });

        if (status) {
            // If status is becoming 'returned', we should restock items?
            // This logic can gets complex if partial return.
            // User requirement: "option of updating the loaned listing".
            // Let's assume for now just updating textual details or entire status.

            // If changing status to 'returned', verify if we need to restock.
            // We'll require a specific 'action' flag if we want to restock.

            const { action } = body; // 'return_items'

            if (action === 'return_all') {
                // Get items first
                const { results: loanItems } = await env.DB.prepare(`SELECT * FROM loan_items WHERE loan_id = ?`).bind(id).all();

                const statements = [];
                // Update status
                statements.push(env.DB.prepare(`UPDATE loans SET status = 'returned' WHERE id = ?`).bind(id));

                // Restock
                for (const item of loanItems) {
                    statements.push(env.DB.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`).bind(item.quantity, item.product_id));
                }

                await env.DB.batch(statements);
                return Response.json({ success: true, message: 'Loan returned and items restocked' });
            }

            await env.DB.prepare(`UPDATE loans SET status = ? WHERE id = ?`).bind(status, id).run();
        } else {
            // Just update details
            await env.DB.prepare(`UPDATE loans SET borrower_name = ?, borrower_contact = ?, collateral = ?, collateral_description = ? WHERE id = ?`)
                .bind(body.borrower_name, body.borrower_contact, body.collateral, body.collateral_description, id).run();
        }

        return Response.json({ success: true, message: 'Loan updated' });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
