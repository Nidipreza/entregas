// Guarda só a "casca" do app para abrir rápido e poder ser instalado.
// Os dados (entregas, assinaturas) NUNCA ficam no cache: sempre vêm do banco.
const VERSAO = "entregas-v1";
const CASCA = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./logo.png", "./icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // só arquivos do próprio app; tudo que vai para o banco passa direto
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // tenta a internet primeiro (pega versões novas); se estiver sem sinal, usa o guardado
  e.respondWith(
    fetch(req)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(VERSAO).then((c) => c.put(req, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
