exports.handler = async (event, context) => {
    // استخراج رقم العقار من الرابط
    const id = event.queryStringParameters.id || event.path.split('/').pop();

    if (!id) {
        return { statusCode: 404, body: 'Not Found' };
    }

    // معرف مشروعك في فايربيز من الكود الخاص بك
    const projectId = 'sharqia-81030';
    const collection = 'listings_v2';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`;

    try {
        // جلب البيانات من فايربيز
        const response = await fetch(firestoreUrl);
        if (!response.ok) throw new Error('Document not found');
        const data = await response.json();

        // استخراج البيانات من شكل استجابة REST API الخاص بفايربيز
        const fields = data.fields || {};
        const title = fields.title?.stringValue || 'عقار مميز في السوق وياك';
        const desc = fields.desc?.stringValue || 'اضغط هنا لمشاهدة تفاصيل وصور العقار بالكامل على السوق وياك.';

        // استخراج أول صورة من المصفوفة (أو أيقونة الموقع الجديدة كافتراضي)
        let imageUrl = 'https://cdn-icons-png.flaticon.com/512/9128/9128710.png'; 
        if (fields.images && fields.images.arrayValue && fields.images.arrayValue.values && fields.images.arrayValue.values.length > 0) {
            imageUrl = fields.images.arrayValue.values[0].stringValue;
        } else if (fields.image?.stringValue) {
            imageUrl = fields.image.stringValue;
        }

        // تحسين مقاس الصورة / أو استخراج صورة من الفيديو لفيسبوك وواتساب
        if (imageUrl.includes('cloudinary.com')) {
            const parts = imageUrl.split('/upload/');
            if (parts.length === 2) {
                let cleanUrl = parts[1];
                // التحقق مما إذا كان الملف فيديو
                const isVideo = cleanUrl.includes('.mp4') || cleanUrl.includes('.mov') || parts[0].includes('/video');
                
                if (isVideo) {
                    // إذا كان فيديو: نقوم بتغيير الامتداد إلى .jpg ونستخدم so_0 لالتقاط أول لقطة منه
                    const lastDot = cleanUrl.lastIndexOf('.');
                    if (lastDot !== -1) cleanUrl = cleanUrl.substring(0, lastDot) + '.jpg';
                    // قص الصورة لمقاس متناسق للـ Social Media مع التقاط الثانية صفر (so_0)
                    imageUrl = `${parts[0]}/upload/w_800,h_418,c_fill,q_auto:eco,f_auto,so_0/${cleanUrl}`;
                } else {
                    // إذا كان صورة عادية
                    imageUrl = `${parts[0]}/upload/w_800,h_418,c_fill,q_auto:eco,f_auto/${cleanUrl}`;
                }
            }
        }

        // الصفحة الوهمية التي سيقرأها واتساب وفيسبوك
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
                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:image:width" content="800" />
                <meta property="og:image:height" content="418" />
                <meta property="og:site_name" content="السوق وياك" />
                
                <!-- Twitter -->
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${title}" />
                <meta name="twitter:description" content="${desc}" />
                <meta name="twitter:image" content="${imageUrl}" />

                <!-- تحويل المستخدم الحقيقي للموقع الأصلي -->
                <meta http-equiv="refresh" content="0;url=/?id=${id}" />
                <script>
                    window.location.replace("/?id=${id}");
                </script>
                <style>
                    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: #10b981; }
                </style>
            </head>
            <body>
                <h2>جاري تحويلك لتفاصيل العقار...</h2>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: html
        };
    } catch (error) {
        // في حال تم حذف العقار أو وجود خطأ
        return {
            statusCode: 200, 
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: `<html><head><meta http-equiv="refresh" content="0;url=/" /></head><body>جاري التحويل...</body></html>`
        };
    }
};