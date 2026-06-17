// NDC26 큐카드 오프라인 서비스 워커
// 캐시 버전: 큐카드를 수정해 다시 올릴 때 이 숫자를 v2, v3... 으로 올리면
// 아이패드가 새 버전을 다시 받아 캐시를 갱신합니다.
const CACHE = 'ndc26-cuecard-v1';

// 같은 폴더의 핵심 파일들을 캐시
const ASSETS = [
  './',
  'index.html',
];

// 설치: 핵심 파일을 미리 저장
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {});
    })
  );
});

// 활성화: 옛 버전 캐시 정리
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// 요청 처리: 캐시 우선, 없으면 네트워크 → 캐시에 저장
// 네트워크도 실패하면(오프라인) 저장해둔 index.html 반환
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        return caches.open(CACHE).then(function (cache) {
          try { cache.put(e.request, resp.clone()); } catch (err) {}
          return resp;
        });
      }).catch(function () {
        return caches.match('index.html');
      });
    })
  );
});
