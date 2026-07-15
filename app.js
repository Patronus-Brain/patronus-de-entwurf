/* ===========================================================
   patronus – Redesign-Entwurf: gemeinsame Logik
   (Mockup – Warenkorb liegt nur im Browser via localStorage,
    keine echte Bestellung, keine echte Bezahlung)
   =========================================================== */

/* ---------- Helfer ---------- */
function fmtPreis(p, prefix) {
  if (p == null) return "Preis auf Anfrage";
  const s = p.toFixed(2).replace(".", ",") + " €";
  return prefix ? '<span class="from">' + prefix + "</span>" + s : s;
}
function getProdukt(id) {
  return (typeof PRODUKTE !== "undefined") ? PRODUKTE.find(p => p.id === id) : null;
}
function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ---------- Warenkorb (localStorage) ---------- */
const CART_KEY = "patronus_cart_mock";
function ladeWarenkorb() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function speichereWarenkorb(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  aktualisiereBadge();
}
function inWarenkorb(id, menge) {
  menge = menge || 1;
  const cart = ladeWarenkorb();
  const pos = cart.find(z => z.id === id);
  if (pos) pos.menge += menge;
  else cart.push({ id: id, menge: menge });
  speichereWarenkorb(cart);
}
function setzeMenge(id, menge) {
  let cart = ladeWarenkorb();
  if (menge <= 0) cart = cart.filter(z => z.id !== id);
  else { const pos = cart.find(z => z.id === id); if (pos) pos.menge = menge; }
  speichereWarenkorb(cart);
}
function entferneAusWarenkorb(id) {
  speichereWarenkorb(ladeWarenkorb().filter(z => z.id !== id));
}
function warenkorbAnzahl() {
  return ladeWarenkorb().reduce((s, z) => s + z.menge, 0);
}
function warenkorbSumme() {
  return ladeWarenkorb().reduce((s, z) => {
    const p = getProdukt(z.id);
    return s + (p && p.price ? p.price * z.menge : 0);
  }, 0);
}
function aktualisiereBadge() {
  const n = warenkorbAnzahl();
  document.querySelectorAll(".header-minicart-badge").forEach(b => {
    b.textContent = n;
    b.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------- Produktkarte (HTML) ---------- */
function karteHTML(p) {
  const preis = fmtPreis(p.price, p.pricePrefix);
  return (
    '<div class="product-card">' +
      '<a class="product-card-link" href="produkt.html?id=' + p.id + '">' +
        '<div class="product-image"><img src="' + p.image + '" alt="' + p.title + '" loading="lazy" /></div>' +
        '<div class="product-body">' +
          '<div class="product-title">' + p.title + "</div>" +
          '<div class="product-price">' + preis + "</div>" +
        "</div>" +
      "</a>" +
      '<button class="btn-cart" onclick="inWarenkorb(\'' + p.id + "'); kurzBestaetigung(this);\">In den Warenkorb</button>" +
    "</div>"
  );
}
function kurzBestaetigung(btn) {
  const orig = btn.textContent;
  btn.textContent = "✓ Hinzugefügt";
  btn.classList.add("added");
  setTimeout(() => { btn.textContent = orig; btn.classList.remove("added"); }, 1200);
}

/* ---------- Suche ---------- */
function sucheProdukte(begriff) {
  begriff = (begriff || "").trim().toLowerCase();
  if (!begriff) return [];
  const worte = begriff.split(/\s+/);
  return PRODUKTE.filter(p => {
    const heu = (p.title + " " + p.subLabel + " " + p.category + " " + p.desc).toLowerCase();
    return worte.every(w => heu.includes(w));
  });
}
function wireSuche() {
  document.querySelectorAll(".search-form").forEach(f => {
    const input = f.querySelector("input[name='q']");
    // Dropdown-Container anlegen
    const drop = document.createElement("div");
    drop.className = "search-suggest";
    f.appendChild(drop);

    function schliessen() { drop.classList.remove("open"); drop.innerHTML = ""; }

    function rendern() {
      const val = input.value.trim();
      if (val.length < 2) { schliessen(); return; }
      const treffer = sucheProdukte(val);
      if (treffer.length === 0) {
        drop.innerHTML = '<div class="suggest-empty">Keine Produkte gefunden für „' + val + '"</div>';
        drop.classList.add("open");
        return;
      }
      const top = treffer.slice(0, 6);
      let html = top.map(p =>
        '<a class="suggest-item" href="produkt.html?id=' + p.id + '">' +
          '<div class="suggest-thumb"><img src="' + p.image + '" alt="' + p.title + '"></div>' +
          '<div class="suggest-info"><div class="suggest-title">' + p.title + "</div>" +
            '<div class="suggest-sub">' + (p.category === "patronen" ? "Tintenpatrone · " + p.subLabel : "Tonerkartusche") + "</div></div>" +
          '<div class="suggest-price">' + fmtPreis(p.price, p.pricePrefix) + "</div>" +
        "</a>"
      ).join("");
      html += '<a class="suggest-all" href="suche.html?q=' + encodeURIComponent(val) + '">Alle ' + treffer.length + " Treffer anzeigen →</a>";
      drop.innerHTML = html;
      drop.classList.add("open");
    }

    input.addEventListener("input", rendern);
    input.addEventListener("focus", rendern);
    // Klick außerhalb schließt das Dropdown
    document.addEventListener("click", e => { if (!f.contains(e.target)) schliessen(); });

    f.addEventListener("submit", e => {
      e.preventDefault();
      location.href = "suche.html?q=" + encodeURIComponent(input.value.trim());
    });
  });
}

/* ---------- Initialisierung auf jeder Seite ---------- */
document.addEventListener("DOMContentLoaded", () => {
  aktualisiereBadge();
  wireSuche();
});
