// Retire the former private-test shell so installed copies reach the waitlist.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).filter(key => key.startsWith('loki-shell-')).map(key => caches.delete(key)));
  await self.registration.unregister();
  for (const client of await self.clients.matchAll({type:'window'})) {
    if (new URL(client.url).pathname.startsWith('/loki/')) await client.navigate('/loki/');
  }
})()));
