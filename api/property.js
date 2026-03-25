export default function handler(req, res) {
  const { id } = req.query;
  const property = PROPERTIES[id];

  if (!property) {
    return res.status(404).send("العقار غير موجود");
  }

  const imageUrl = property.images[0];
  const title = `${property.title} - ${property.price.toLocaleString('ar-EG')} جنيه`;

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>

      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${property.desc}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:url" content="https://${req.headers.host}/property/${id}" />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${property.desc}" />
      <meta name="twitter:image" content="${imageUrl}" />
    </head>
    <body>
      <h1>${title}</h1>
      <p>${property.desc}</p>
      <img src="${imageUrl}" alt="صورة العقار" />
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).send(html);
}