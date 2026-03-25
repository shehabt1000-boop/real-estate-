const PROPERTIES = {
  "1": {
    title: "شقة للبيع في الزقازيق",
    desc: "شقة 3 غرف نوم، قريب من الخدمات",
    price: 1250000,
    images: ["https://res.cloudinary.com/db9h7zm1h/image/upload/v1774440353/property1.jpg"]
  }
};

export default function handler(req, res) {
  const { id } = req.query;
  const property = PROPERTIES[id];

  if (!property) return res.redirect("/");

  const title = `${property.title} - ${property.price.toLocaleString('ar-EG')} جنيه`;
  const imageUrl = property.images[0];

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");

  res.send(`
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
    </head>
    <body>
      <script>window.location.replace("/?id=${id}")</script>
    </body>
    </html>
  `);
}