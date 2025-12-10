// Serve images from R2 storage with security measures
export async function onRequestGet(context) {
    const { env, params } = context;
    const filename = params.filename;

    // Security: Validate filename format to prevent path traversal attacks
    // Only allow alphanumeric, dashes, underscores, and dots for file extension
    const safeFilenamePattern = /^product-\d+-\d+\.(jpeg|jpg|png|webp)$/i;
    if (!safeFilenamePattern.test(filename)) {
        return new Response('Invalid filename', { status: 400 });
    }

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return new Response('Invalid filename', { status: 400 });
    }

    try {
        const object = await env.IMAGES.get(filename);

        if (!object) {
            return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();
        // Content headers
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
        headers.set('ETag', object.httpEtag);

        // Cache headers for performance
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        // Security headers
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");

        return new Response(object.body, { headers });

    } catch (error) {
        return new Response('Error fetching image', { status: 500 });
    }
}
