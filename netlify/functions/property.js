exports.handler = async (event, context) => {
    // 1. استخراج رقم العقار من الرابط
    const id = event.queryStringParameters?.id || event.path.split('/').pop();

    if (!id) {
        return { statusCode: 302, headers: { Location: '/' } };
    }

    // 2. التحقق مما إذا كان الزائر "بوت" (واتساب، فيسبوك، الخ) أم "إنسان حقيقي"
    const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || '';
    const isBot = /whatsapp|facebook|twitter|telegram|linkedin|bot|crawler|spider|discord/i.test(userAgent);

    // 3. إذا كان إنسان حقيقي، قم بتحويله فوراً للموقع بدون تضييع وقت في جلب البيانات
    if (!isBot) {
        return {
            statusCode: 302,
            headers: { Location: `/?id=${id}` }
        };
    }

    // 4. إذا كان الزائر "بوت واتساب"، نجلب البيانات من فايربيز
    const projectId = 'sharqia-81030';
    const collection = 'listings_v2';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`;

    try {
        const response = await fetch(firestoreUrl);
        if (!response.ok) throw new Error('Document not found');
        const data = await response.json();

        // استخراج البيانات
        const fields = data.fields || {};
        const title = fields.title?.stringValue || 'عقار مميز في السوق وياك';
        const price = fields.price?.integerValue || fields.price?.doubleValue || '';
        const titleWithPrice = price ? `${title} - ${price} جنيه` : title;
        const desc = fields.desc?.stringValue || 'اضغط هنا لمشاهدة تفاصيل وصور العقار بالكامل على السوق وياك.';

        // الصورة الافتراضية
        let imageUrl = 'https://raw.githubusercontent.com/shehabt1000-boop/real-estate-/3c57da6b5eb64d257a15e1a2ff26510ac9c5549f/real-estate.jpg'; 
        
        if (fields.images?.arrayValue?.values?.length > 0) {
            imageUrl = fields.images.arrayValue.values[0].stringValue;
        } else if (fields.image?.stringValue) {
            imageUrl = fields.image.stringValue;
        }

        // 5. تهيئة الصورة لتكون مثالية وصاروخية للواتساب (1200x630 بصيغة JPG)
        if (imageUrl.includes('cloudinary.com')) {
            const parts = imageUrl.split('/upload/');
            if (parts.length === 2) {
                let cleanUrl = parts[1];
                const isVideo = cleanUrl.includes('.mp4') || cleanUrl.includes('.mov') || parts[0].includes('/video');

                if (isVideo) {
                    const lastDot = cleanUrl.lastIndexOf('.');
                    if (lastDot !== -1) cleanUrl = cleanUrl.substring(0, lastDot) + '.jpg';
                    // استخدام w_1200,h_630 وهو المقاس القياسي لـ Open Graph
                    imageUrl = `${parts[0]}/upload/w_1200,h_630,c_fill,q_80,f_jpg,so_0/${cleanUrl}`;
                } else {
                    imageUrl = `${parts[0]}/upload/w_1200,h_630,c_fill,q_80,f_jpg/${cleanUrl}`;
                }
            }
        }

        // 6. الصفحة الوهمية الخفيفة جداً للبوتات فقط
        const html = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${titleWithPrice} | السوق وياك</title>
                
                <!-- Open Graph / Facebook / WhatsApp -->
                <meta property="og:type" content="website" />
                <meta property="og:title" content="${titleWithPrice}" />
                <meta property="og:description" content="${desc}" />
                
                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:image:secure_url" content="${imageUrl}" />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                
                <meta property="og:site_name" content="السوق وياك" />
                <meta property="og:url" content="https://${event.headers.host}/?id=${id}" />
                
                <!-- Twitter -->
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${titleWithPrice}" />
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
                // إضافة كاش لمدة 24 ساعة لتسريع المشاركات المتتالية لنفس العقار
                'Cache-Control': 'public, max-age=86400' 
            },
            body: html
        };
    } catch (error) {
        // في حالة حدوث خطأ في قاعدة البيانات، قم بتحويل المستخدم للموقع فوراً
        return {
            statusCode: 302,
            headers: { Location: `/?id=${id}` }
        };
    }
};