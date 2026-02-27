import { getDb } from "../../../drizzle/db";
import { expenses } from "../../../drizzle/schema";
import { getNairobiTimestamp } from "../../utils/timezone.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const search = url.searchParams.get("search");

  try {
    let query = `
      SELECT 
        bi.*,
        p.name as product_name,
        p.barcode as product_barcode,
        p.price as product_price
      FROM borrowed_items bi
      LEFT JOIN products p ON bi.product_id = p.id
    `;

    const params = [];
    if (search) {
      query += `
        WHERE p.name LIKE ? 
        OR p.barcode LIKE ? 
        OR bi.borrowed_from LIKE ? 
        OR bi.reason LIKE ?
      `;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY bi.borrowed_at DESC, bi.created_at DESC`;
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { product_id, quantity, borrowed_from, reason, borrowed_at } = body;

    if (!product_id || !quantity || !borrowed_from) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let query;
    let params;

    if (borrowed_at) {
      query = `
        INSERT INTO borrowed_items (product_id, quantity, borrowed_from, reason, borrowed_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      params = [product_id, quantity, borrowed_from, reason, borrowed_at];
    } else {
      query = `
        INSERT INTO borrowed_items (product_id, quantity, borrowed_from, reason)
        VALUES (?, ?, ?, ?)
      `;
      params = [product_id, quantity, borrowed_from, reason];
    }

    const { success } = await env.DB.prepare(query)
      .bind(...params)
      .run();

    if (!success) {
      return Response.json(
        { error: "Failed to create record" },
        { status: 500 },
      );
    }

    return Response.json(
      { success: true, message: "Borrowed item recorded" },
      { status: 201 },
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const {
      id,
      action,
      returned_quantity,
      paid_quantity,
      borrowed_from,
      reason,
      borrowed_at,
    } = body;

    if (!id) {
      return Response.json({ error: "Missing record ID" }, { status: 400 });
    }

    const db = getDb(env);

    // Fetch current record
    const item = await env.DB.prepare(
      "SELECT * FROM borrowed_items WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    let newStatus = item.status;
    let newReturnedQuantity = item.returned_quantity || 0;
    let newPaidQuantity = item.paid_quantity || 0;
    let newPaidAmount = item.paid_amount || 0;
    let finalBorrowedFrom =
      borrowed_from !== undefined ? borrowed_from : item.borrowed_from;
    let finalReason = reason !== undefined ? reason : item.reason;
    let finalBorrowedAt =
      borrowed_at !== undefined ? borrowed_at : item.borrowed_at;

    if (action === "return") {
      newReturnedQuantity =
        (item.returned_quantity || 0) + (parseInt(returned_quantity) || 0);
    } else if (action === "pay") {
      const payQty = parseInt(paid_quantity) || 0;
      const manualUnitPrice = parseFloat(body.unitPrice);
      newPaidQuantity = (item.paid_quantity || 0) + payQty;

      // Create expense based on paid quantity
      const product = await env.DB.prepare(
        "SELECT name, cost, price FROM products WHERE id = ?",
      )
        .bind(item.product_id)
        .first();
      const unitCost = !isNaN(manualUnitPrice)
        ? manualUnitPrice
        : product.price || 0;
      const expenseAmount = unitCost * payQty;
      newPaidAmount += expenseAmount;

      if (expenseAmount > 0) {
        await db
          .insert(expenses)
          .values({
            category: "Borrowed Items",
            amount: expenseAmount,
            description: `Payment for borrowed item: ${product.name} (${payQty} units) from ${item.borrowed_from}`,
            createdAt: getNairobiTimestamp(),
          })
          .run();
      }
    }

    // Automated status update
    const totalSettled = newReturnedQuantity + newPaidQuantity;
    if (totalSettled >= item.quantity) {
      if (newReturnedQuantity > 0 && newPaidQuantity > 0) {
        newStatus = "settled";
      } else {
        newStatus = newPaidQuantity > 0 ? "paid" : "returned";
      }
    } else if (totalSettled > 0) {
      newStatus = "partial";
    }

    const { success } = await env.DB.prepare(
      `
        UPDATE borrowed_items 
        SET borrowed_from = ?, reason = ?, status = ?, returned_quantity = ?, paid_quantity = ?, paid_amount = ?, borrowed_at = ?
        WHERE id = ?
      `,
    )
      .bind(
        finalBorrowedFrom,
        finalReason,
        newStatus,
        newReturnedQuantity,
        newPaidQuantity,
        newPaidAmount,
        finalBorrowedAt,
        id,
      )
      .run();

    if (!success) {
      return Response.json(
        { error: "Failed to update record" },
        { status: 500 },
      );
    }

    return Response.json(
      { success: true, message: "Record updated", status: newStatus },
      { status: 200 },
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
