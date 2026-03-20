// sw.js — PianoHelse Service Worker
// Enkel passthrough-versjon for MVP-utvikling.
// Gir offline-støtte for App Shell etter første lasting.

'use strict';

const CACHE_NAVN = 'pianohelse-v1';

// Filer som alltid skal caches ved installasjon (app shell)
const APP_SHELL = [
    './index.html',
    './style.css',
    './router.js',
    './app.js',
    './piano-keyboard.js',
    './piano-scanner.js',
    './health-scorer.js',
    './tuning-curve.js',
    './manifest.json'
];

// ── INSTALL: Cache app shell ───────────────────────────────────────────────

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAVN)
            .then(cache =>
                Promise.allSettled(
                    APP_SHELL.map(url =>
                        cache.add(url).catch(err =>
                            console.warn('[SW] Kunne ikke cache:', url, err.message)
                        )
                    )
                )
            )
            .then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: Fjern gamle cacher ──────────────────────────────────────────

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(nøkler =>
                Promise.all(
                    nøkler
                        .filter(n => n !== CACHE_NAVN)
                        .map(n => caches.delete(n))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ── FETCH: Network First, fall back til cache ──────────────────────────────
// Enkel strategi: prøv nettverket alltid. Hvis nettverket feiler og vi har
// en cachet versjon, bruk den. Ellers pass forespørselen videre ubehandlet.

self.addEventListener('fetch', (event) => {
    // Kun GET-forespørsler
    if (event.request.method !== 'GET') return;

    // Aldri intercept: mikrofon, WebSocket, Supabase auth/realtime
    const url = new URL(event.request.url);
    if (
        url.protocol === 'blob:' ||
        url.protocol === 'data:' ||
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('stripe.com')
    ) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache vellykket respons for app shell-filer
                if (response.ok && url.origin === location.origin) {
                    const kopi = response.clone();
                    caches.open(CACHE_NAVN).then(cache => cache.put(event.request, kopi));
                }
                return response;
            })
            .catch(() =>
                // Nettverket feilet — prøv cache
                caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // Ingen cache — returner en 503 i stedet for å krasje
                    return new Response('Offline — ressurs ikke tilgjengelig', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                })
            )
    );
});
