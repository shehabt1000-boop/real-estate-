import fetch from "node-fetch"; // لو Vercel supports native fetch ممكن تشيل import

export default async function handler(req, res) {
  const id = req.query.id;
  if (!id) return res.redirect("/");

  const userAgent = (req.headers['user-agent'] || "").toLowerCase();
  const isBot = /whatsapp|facebook|twitter|telegram|linkedin|bot|crawler|spider|discord/i.test(userAgent);

  if (!isBot) {
    // المستخدم العادي → redirect للصفحة
    return res.redirect(`/?id=${id}`);
  }

  // جلب بيانات العقار من Firestore
  const projectId = "sharqia-81030";
  const collection = "listings_v2";
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`;

  try {
    const response = await fetch(firestoreUrl);
    if (!response.ok) throw new Error("Document not found");
    const data = await response.json();

    const fields = data.fields || {};
    const title = fields.title?.stringValue || "عقار مميز في السوق وياك";
    const price = fields.price?.integerValue || fields.price?.doubleValue || "";
    const shortCode = fields.shortCode?.stringValue || id.substring(0, 3).toUpperCase();
    const formattedPrice = price ? Number(price).toLocaleString("ar-EG") + " جنيه" : "";
    const titleWithCode = `${title}${formattedPrice ? " - " + formattedPrice : ""} | كود: ${shortCode}`;
    const desc = fields.desc?.stringValue || "اضغط هنا لمشاهدة تفاصيل وصور العقار بالكامل على السوق وياك.";

    // أول صورة
    let imageUrl = "https://raw.githubusercontent.com/shehabt1000-boop/real-estate-/3c57da6b5eb64d257a15e1a2ff26510ac9c5549f/real-estate.jpg";
    if (fields.images?.arrayValue?.values?.length > 0) {
      imageUrl = fields.images.arrayValue.values[0].stringValue;
    } else if (fields.image?.stringValue) {
      imageUrl = fields.image.stringValue;
    }

    // تحسين صورة Cloudinary للواتساب
    if (imageUrl.includes("cloudinary.com")) {
      const parts = imageUrl.split("/upload/");
      if (parts.length === 2) {
        let cleanUrl = parts[1];
        const isVideo = cleanUrl.includes(".mp4") || cleanUrl.includes(".mov") || parts[0].includes("/video");
        if (isVideo) {
          const lastDot = cleanUrl.lastIndexOf(".");
          if (lastDot !== -1) cleanUrl = cleanUrl.substring(0, lastDot) + ".jpg";
        }
        imageUrl = `${parts[0]}/upload/w_600,h_315,c_fill,q_auto:eco,f_jpg/${cleanUrl}`;
      }
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${titleWithCode}</title>
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="${titleWithCode}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:secure_url" content="${imageUrl}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="315" />
        <meta property="og:image:alt" content="صورة العقار" />
        <meta property="og:site_name" content="السوق وياك" />
        <meta property="og:url" content="https://${req.headers.host}/property/${id}" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${titleWithCode}" />
        <meta name="twitter:description" content="${desc}" />
        <meta name="twitter:image" content="${imageUrl}" />
      </head>
      <body>
        <h1>${titleWithCode}</h1>
        <p>${desc}</p>
        <img src="${imageUrl}" alt="صورة العقار" />
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).send(html);

  } catch (error) {
    return res.redirect(`/?id=${id}`);
  }
}