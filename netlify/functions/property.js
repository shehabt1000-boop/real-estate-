exports.handler = async (event, context) => {
    // استخراج رقم العقار من الرابط
    const id = event.queryStringParameters.id || event.path.split('/').pop();

    if (!id) {
        return { statusCode: 404, body: 'Not Found' };
    }

    // معرف مشروعك في فايربيز 
    const projectId = 'sharqia-81030';
    const collection = 'listings_v2';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`;

    try {
        // جلب البيانات من فايربيز
        const response = await fetch(firestoreUrl);
        if (!response.ok) throw new Error('Document not found');
        const data = await response.json();

        // استخراج البيانات
        const fields = data.fields || {};
        const title = fields.title?.stringValue || 'عقار مميز في السوق وياك';
        const desc = fields.desc?.stringValue || 'اضغط هنا لمشاهدة تفاصيل وصور العقار بالكامل على السوق وياك.';

        // الصورة الافتراضية
        let imageUrl = 'https://cdn-icons-png.flaticon.com/512/9128/9128710.png'; 
        if (fields.images && fields.images.arrayValue && fields.images.arrayValue.values && fields.images.arrayValue.values.length > 0) {
            imageUrl = fields.images.arrayValue.values[0].stringValue;
        } else if (fields.image?.stringValue) {
            imageUrl = fields.image.stringValue;
        }

        // تسريع صاروخي لعملية جلب الصورة لواتساب
        if (imageUrl.includes('cloudinary.com')) {
            const parts = imageUrl.split('/upload/');
            if (parts.length === 2) {
                let cleanUrl = parts[1];
                const isVideo = cleanUrl.includes('.mp4') || cleanUrl.includes('.mov') || parts[0].includes('/video');
                
                if (isVideo) {
                    const lastDot = cleanUrl.lastIndexOf('.');
                    if (lastDot !== -1) cleanUrl = cleanUrl.substring(0, lastDot) + '.jpg';
                    // استخدام f_jpg و q_auto:eco ومقاس 600x315 لضمان سرعة فائقة وحجم أقل من 300KB
                    imageUrl = `${parts[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg,so_0/${cleanUrl}`;
                } else {
                    imageUrl = `${parts[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg/${cleanUrl}`;
                }
            }
        }

        // الصفحة الوهمية المدعمة بكل ما يطلبه واتساب
        const html = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${title} | السوق وياك</title>
                
                <!-- Open Graph / Facebook / WhatsApp -->
                <meta property="og:type" content="website" />
                <meta property="og:title" content="${title}" />
                <meta property="og:description" content="${desc}" />
                
                <!-- أهم 4 تاجات لضمان ظهور الصورة في واتساب -->
                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:image:secure_url" content="${imageUrl}" />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:image:width" content="600" />
                <meta property="og:image:height" content="315" />
                
                <meta property="og:site_name" content="السوق وياك" />
                
                <!-- Twitter -->
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${title}" />
                <meta name="twitter:description" content="${desc}" />
                <meta name="twitter:image" content="${imageUrl}" />

                <!-- تحويل المستخدم -->
                <meta http-equiv="refresh" content="0;url=/?id=${id}" />
                <script>
                    window.location.replace("/?id=${id}");
                </script>
            </head>
            <body>
                <p>جاري التحويل...</p>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: html
        };
    } catch (error) {
        return {
            statusCode: 200, 
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: `<html><head><meta http-equiv="refresh" content="0;url=/" /></head><body>جاري التحويل...</body></html>`
        };
    }
};