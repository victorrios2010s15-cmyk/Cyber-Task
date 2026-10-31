const CACHE_NAME = "cyber-task-v1";
const ASSETS = [
  "/Cyber-Task/",
  "/Cyber-Task/index.html",
  "/Cyber-Task/style.css",
  "/Cyber-Task/script.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});

self.addEventListener("push", (e) => {
  const datos = e.data ? e.data.json() : { titulo: "CyberNET Squad", mensaje: "Nueva asignación detectada en la terminal." };
  
  const opciones = {
    body: datos.mensaje,
    icon: "https://icons8.com",
    badge: "https://icons8.com",
    vibrate:,
    data: {
      url: "/Cyber-Task/"
    }
  };

  e.waitUntil(
    self.registration.showNotification(datos.titulo, opciones)
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/Cyber-Task/") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/Cyber-Task/");
      }
    })
  );
});
