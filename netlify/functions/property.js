exports.handler = async (event, context) => {
    const id = event.queryStringParameters?.id || event.path.split('/').pop();

    if (!id) {
        return { statusCode: 302, headers: { Location: '/' } };
    }

    const userAgent = event.headers['user-agent']?.toLowerCase() || '';
    const isBot = /whatsapp|facebook|twitter|telegram|linkedin|bot|crawler|spider|discord/i.test(userAgent);

    if (!isBot) {
        return { statusCode: 302, headers: { Location: `/?id=${id}` } };
    }

    const projectId = 'sharqia-81030';
    const collection = 'listings_v2';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`;

    try {
        const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 1500);

const response = await fetch(firestoreUrl, {
  signal: controller.signal
});

clearTimeout(timeout);
        if (!response.ok) throw new Error('Document not found');
        const data = await response.json();

        const fields = data.fields || {};
        const title = fields.title?.stringValue || 'عقار مميز في السوق وياك';
        const price = fields.price?.integerValue || fields.price?.doubleValue || '';

        // كود العقار
        const shortCode = fields.shortCode?.stringValue || id.substring(0, 3).toUpperCase();

        // تنسيق السعر
        const formattedPrice = price ? Number(price).toLocaleString('ar-EG') + ' جنيه' : '';

        // الشكل النهائي للعنوان
        const titleWithCodeAndPrice = `${title}${formattedPrice ? ' - ' + formattedPrice : ''}\nكود العقار: ${shortCode}`;

        const desc = fields.desc?.stringValue || 'اضغط هنا لمشاهدة تفاصيل وصور العقار بالكامل على السوق وياك.';

        let imageUrl = 'https://raw.githubusercontent.com/shehabt1000-boop/real-estate-/3c57da6b5eb64d257a15e1a2ff26510ac9c5549f/real-estate.jpg'; 

        if (fields.images?.arrayValue?.values?.length > 0) {
            imageUrl = fields.images.arrayValue.values[0].stringValue;
        } else if (fields.image?.stringValue) {
            imageUrl = fields.image.stringValue;
        }

        // تحسين صورة Cloudinary للواتساب
        if (imageUrl.includes('cloudinary.com')) {
            const parts = imageUrl.split('/upload/');
            if (parts.length === 2) {
                let cleanUrl = parts[1];
                const isVideo = cleanUrl.includes('.mp4') || cleanUrl.includes('.mov') || parts[0].includes('/video');

                if (isVideo) {
                    const lastDot = cleanUrl.lastIndexOf('.');
                    if (lastDot !== -1) cleanUrl = cleanUrl.substring(0, lastDot) + '.jpg';
                    imageUrl = `${parts[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg,so_0/${cleanUrl}`;
                } else {
                    imageUrl = `${parts[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg/${cleanUrl}`;
                }
            }
        }

        const html = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${titleWithCodeAndPrice} | السوق وياك</title>

                <meta name="robots" content="index, follow" />

                <meta property="og:type" content="website" />
                <meta property="og:title" content="${titleWithCodeAndPrice}" />
                <meta property="og:description" content="${desc}" />

                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:image:secure_url" content="${imageUrl}" />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:image:width" content="600" />
                <meta property="og:image:height" content="315" />
                <meta property="og:image:alt" content="صورة العقار" />

                <meta property="og:site_name" content="السوق وياك" />
                <meta property="og:url" content="https://${event.headers.host}/property/${id}" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${titleWithCodeAndPrice}" />
                <meta name="twitter:description" content="${desc}" />
                <meta name="twitter:image" content="${imageUrl}" />

            </head>
            <body>
                <script>window.location.replace("/?id=${id}");</script>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            headers: { 
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
},
            body: html
        };

    } catch (error) {
        return { statusCode: 302, headers: { Location: `/?id=${id}` } };
    }
};