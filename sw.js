// sw.js - Service Worker for Image Editor PWA
// アップデートが即座に反映される「Network First（ネットワーク優先）」戦略

const CACHE_NAME = 'image-editor-v1.1.0';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './manifest.json',
    './icon.svg',
    './icon-192.png',
    './icon-512.png'
];

// インストール時にコアアセットを最新取得してキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                ASSETS_TO_CACHE.map((url) =>
                    cache.add(new Request(url, { cache: 'reload' }))
                )
            );
        }).then(() => {
            // 新しいバージョンを即座にアクティブにする
            return self.skipWaiting();
        })
    );
});

// アクティベート時に古いキャッシュを自動削除し、新しいWorkerを全クライアントに即時適用
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] 古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// フェッチ処理：バージョン固定のCDNデコーダはCache First、アプリ本体はNetwork First
self.addEventListener('fetch', (event) => {
    // GET リクエストのみ対象
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isSameOrigin = url.origin === self.location.origin;

    // バージョン固定の外部デコーダライブラリ（libheif-js / heic-to / utif / ag-psd 等）はキャッシュ優先で即座に返す
    if (!isSameOrigin && /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\/npm\/[^@]+@\d/i.test(url.href)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    const fetchRequest = (isSameOrigin && (event.request.mode === 'navigate' || /\.(html|css|js|json)$/i.test(url.pathname)))
        ? new Request(event.request, { cache: 'no-cache' })
        : event.request;

    // Google Fonts などの外部リクエストやローカルアセットを処理
    event.respondWith(
        fetch(fetchRequest)
            .then((networkResponse) => {
                // 正常なレスポンスならキャッシュを更新
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // オフライン時はキャッシュから返す
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // オフラインでキャッシュもない場合、index.html を返す
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
