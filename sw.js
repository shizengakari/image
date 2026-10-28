// sw.js - Service Worker for Image Editor PWA
// アップデートが即座に反映される「Network First（ネットワーク優先）」戦略

const CACHE_NAME = 'image-editor-v1.0.1';

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

// インストール時にコアアセットをキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
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

// フェッチ処理：Network First（ネットワーク優先）
// 通信できる場合は常に最新のサーバーファイルを取得し、キャッシュも更新。
// オフライン時のみキャッシュを使用。これによりWeb更新が確実に即時反映されます。
self.addEventListener('fetch', (event) => {
    // GET リクエストのみ対象
    if (event.request.method !== 'GET') return;

    // Google Fonts などの外部リクエストやローカルアセットを処理
    event.respondWith(
        fetch(event.request)
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
