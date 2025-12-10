export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const file = formData.get('image');
        const productId = formData.get('productId');

        if (!file || !productId) {
            return new Response(JSON.stringify({ error: 'Missing image or productId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPG, PNG, WebP' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: 'File too large. Maximum size is 2MB' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate unique filename
        const ext = file.type.split('/')[1];
        const filename = `product-${productId}-${Date.now()}.${ext}`;

        // Upload to R2
        await env.IMAGES.put(filename, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Generate public URL (using R2 public bucket URL pattern)
        // Note: R2 bucket must have public access enabled, or use a custom domain
        const imageUrl = `/api/images/${filename}`;

        // Update product with image URL
        await env.DB.prepare(
            'UPDATE products SET image = ? WHERE id = ?'
        ).bind(imageUrl, productId).run();

        return new Response(JSON.stringify({
            success: true,
            imageUrl,
            filename
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Image upload error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;

    try {
        const { productId, filename } = await request.json();

        if (!productId) {
            return new Response(JSON.stringify({ error: 'Missing productId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete from R2 if filename provided
        if (filename) {
            try {
                await env.IMAGES.delete(filename);
            } catch (e) {
                // Ignore R2 deletion errors
                console.error('R2 delete error:', e);
            }
        }

        // Clear image URL from product
        await env.DB.prepare(
            'UPDATE products SET image = NULL WHERE id = ?'
        ).bind(productId).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
