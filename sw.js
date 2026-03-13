const CACHE_NAME = 'souq-wayak-v2'; // تم تغيير الإصدار لتحديث الكاش القديم
const ASSETS_TO_CACHE =[
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // تجاهل طلبات POST و PUT (مثل رفع الصور أو تسجيل الدخول)
  if (event.request.method !== 'GET') return;

  // استثناء روابط فايربيز وصور كلاوديناري من الكاش الديناميكي لضمان جلب أحدث البيانات دائماً
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('cloudinary.com')) {
      return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // تخزين الملفات السليمة سواء كانت من نفس الموقع (basic) أو من سيرفر خارجي مثل Tailwind (cors)
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // في حالة انقطاع الإنترنت، نبحث في الكاش
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // السحر هنا: إذا كان المستخدم أوفلاين وطلب رابط عقار (/?id=123)، نعطيه الصفحة الرئيسية لتعمل كـ SPA
        if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
      })
  );
});