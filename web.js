// Web de Testigo del Humo: pestañas de la ficha (enlazables con #video, #documentacion, #transcripcion)
// y reproductor de YouTube que solo se carga al pulsar (youtube-nocookie). Sin cookies ni analítica.
document.documentElement.classList.add("js");

const pestanas = [...document.querySelectorAll('[role="tab"]')];
const paneles = pestanas.map((b) => document.getElementById(b.getAttribute("aria-controls")));

const abrir = (id, enfocar = false) => {
  const i = paneles.findIndex((p) => p && p.id === id);
  if (i < 0) return false;
  pestanas.forEach((b, j) => {
    b.setAttribute("aria-selected", String(i === j));
    b.tabIndex = i === j ? 0 : -1;
    paneles[j].hidden = i !== j;
  });
  if (enfocar) pestanas[i].focus();
  return true;
};

// Un ancla puede ser una pestaña o algo de dentro de una (#h-012 abre «Documentación» y baja al hecho).
const seguirAncla = () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || abrir(id)) return;
  const destino = document.getElementById(id);
  const panel = destino?.closest('[role="tabpanel"]');
  if (panel && abrir(panel.id)) destino.scrollIntoView();
};

if (pestanas.length) {
  pestanas.forEach((b, i) => {
    b.addEventListener("click", () => {
      abrir(paneles[i].id);
      history.replaceState(null, "", `#${paneles[i].id}`);
    });
    b.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      const j = (i + d + pestanas.length) % pestanas.length;
      abrir(paneles[j].id, true);
      history.replaceState(null, "", `#${paneles[j].id}`);
    });
  });
  if (!location.hash || !document.getElementById(decodeURIComponent(location.hash.slice(1)))) abrir(paneles[0].id);
  else seguirAncla();
  addEventListener("hashchange", seguirAncla);
}

// Reproductor: la miniatura hasta que se pulsa; los capítulos y la transcripción saltan al minuto.
const caja = document.querySelector(".reproductor[data-yt]");
if (caja) {
  const id = caja.dataset.yt;
  let marco = null;
  const cargar = (t = 0) => {
    if (marco) {
      marco.contentWindow.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [t, true] }), "*");
      marco.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      return;
    }
    marco = document.createElement("iframe");
    marco.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1&start=${Math.floor(t)}`;
    marco.title = caja.dataset.titulo || "Vídeo";
    marco.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    marco.allowFullscreen = true;
    caja.replaceChildren(marco);
  };
  caja.querySelector("button")?.addEventListener("click", () => cargar(0));
  document.querySelectorAll("a[data-t]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      cargar(Number(a.dataset.t));
      caja.scrollIntoView({ block: "center" });
    }),
  );
}
