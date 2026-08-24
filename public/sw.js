self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Passe-plat simple : laisse toutes les requêtes suivre leur cours normal.
  // Un vrai cache pourra être ajouté plus tard si besoin de mode hors-ligne.
})