/* ==========================================================
   felles.js – ting som brukes på flere sider
   ----------------------------------------------------------
   1. hentAlleOppskrifter() – laster inn .md-filene
   2. kategoriIkon()        – strek-ikoner for kategoriene
   3. lagKort()             – HTML for ett oppskriftskort
   4. "Tilfeldig oppskrift"-knapper
   Må lastes ETTER liste.js og markdown.js.
   ========================================================== */


/* ---------- 1. Hent oppskriftene ----------
   Henter alle filene i OPPSKRIFT_LISTE samtidig (Promise.all),
   og gir tilbake en liste med ferdig tolkede oppskrifter.
   En oppskrift som ikke finnes, hoppes over med en melding i konsollen. */
var oppskrifterLagret = null; // så vi bare henter én gang per side

function hentOppskrift(navn, plass) {
  return fetch("oppskrifter/" + navn + ".md")
    .then(function (svar) {
      if (!svar.ok) throw new Error("fant ikke filen");
      return svar.text();
    })
    .then(function (fil) {
      var delt = lesFrontMatter(fil);
      var d = delt.data;
      var html = markdownTilHtml(delt.tekst);
      return {
        navn: navn,                              // filnavnet, brukes i adressen
        tittel: d.title || navn,
        kategori: d.kategori || "Annet",
        porsjoner: Number(d.porsjoner) || 0,
        tid: d.tid || "",
        notat: d.notat || "",
        bilde: d.bilde || "",
        html: html,
        plass: plass,                            // plassen i lista (høyere = nyere)
        // All tekst med små bokstaver, brukt når du søker
        sokTekst: ((d.title || "") + " " + delt.tekst).toLowerCase()
      };
    })
    .catch(function (feil) {
      console.warn('Kunne ikke lese "oppskrifter/' + navn + '.md": ' + feil.message +
        ". Sjekk at navnet i liste.js stemmer med filnavnet.");
      return null;
    });
}

function hentAlleOppskrifter() {
  if (!oppskrifterLagret) {
    oppskrifterLagret = Promise.all(OPPSKRIFT_LISTE.map(hentOppskrift))
      .then(function (alle) {
        return alle.filter(Boolean); // fjern de som ikke kunne leses (null)
      });
  }
  return oppskrifterLagret;
}

// Lenken til en oppskrift, f.eks. "oppskrift.html?navn=pannekaker"
function oppskriftLenke(navn) {
  return "oppskrift.html?navn=" + encodeURIComponent(navn);
}


/* ---------- 2. Kategori-ikoner ----------
   Hver kategori har en liten tegning laget av SVG-streker.
   currentColor betyr at ikonet får samme farge som teksten rundt.
   Ny kategori? Legg til en linje med navnet (små bokstaver) og tegningen. */
var KATEGORI_IKONER = {
  "middag":   '<path d="M5 28h30"/><path d="M8 28a12 12 0 0 1 24 0"/><path d="M20 16v-3M17 13h6"/><path d="M4 32h32"/>',
  "frokost":  '<path d="M6 18h22a11 11 0 0 1-22 0z"/><path d="M28 21h3a3 3 0 0 0 0-6h-3"/><path d="M12 12q-2-3 0-6M18 12q-2-3 0-6M24 12q-2-3 0-6"/>',
  "suppe":    '<path d="M4 20h32"/><path d="M6 20a14 12 0 0 0 28 0"/><path d="M14 33h12"/><path d="M30 18l6-12"/>',
  "salat":    '<path d="M4 22h32a16 12 0 0 1-32 0z"/><path d="M12 22q-2-8 6-10q0 7-6 10"/><path d="M22 22q0-9 9-9q-1 8-9 9"/><circle cx="20" cy="17" r="2.5"/>',
  "brød":     '<path d="M6 30v-10a14 10 0 0 1 28 0v10z"/><path d="M14 16l-2 6M21 14l-1 7M28 16l-1 6"/>',
  "kake":     '<path d="M6 32V18l28-8v22z"/><path d="M6 24l28-6"/><circle cx="28" cy="7" r="3"/>',
  "dessert":  '<path d="M13 18l7 18 7-18"/><path d="M11 18a9 9 0 0 1 18 0z"/><path d="M16 23l6 4M15 28l8-2"/>',
  "pannekaker": '<ellipse cx="20" cy="30" rx="14" ry="3.5"/><path d="M6 30v-4M34 30v-4"/><ellipse cx="20" cy="22" rx="13" ry="3.5"/><path d="M7 22v-3M33 22v-3"/><ellipse cx="20" cy="15" rx="12" ry="3.5"/><path d="M17 11q3-4 6 0"/>',
  // Brukes når kategorien ikke finnes over: tallerken med kniv og gaffel
  "standard": '<circle cx="20" cy="22" r="11"/><circle cx="20" cy="22" r="6"/><path d="M5 8v8a2 2 0 0 0 2 2v16M5 8v6M9 8v6"/><path d="M35 8c-3 2-3 8 0 10v16"/>'
};

// Andre navn som skal få samme ikon
var IKON_ALIASER = {
  "supper": "suppe", "salater": "salat", "bakst": "brød", "brød og bakst": "brød",
  "kaker": "kake", "vafler": "pannekaker"
};

function kategoriIkon(kategori) {
  var navn = String(kategori || "").toLowerCase();
  navn = IKON_ALIASER[navn] || navn;
  var tegning = KATEGORI_IKONER[navn] || KATEGORI_IKONER.standard;
  return '<svg class="kategori-ikon" viewBox="0 0 40 40" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    tegning + "</svg>";
}


/* ---------- 3. Ett oppskriftskort ----------
   Brukes på forsiden og på "Alle oppskrifter". */
function lagKort(o) {
  // Eget bilde hvis det finnes, ellers kategori-ikonet som plassholder
  var bilde = o.bilde
    ? '<img src="' + trygg(o.bilde) + '" alt="" loading="lazy">'
    : kategoriIkon(o.kategori);

  var info = trygg(o.kategori) + (o.tid ? " · " + trygg(o.tid) : "");

  var li = document.createElement("li");
  li.className = "kort";
  li.dataset.kategori = o.kategori;   // brukes av filteret
  li.innerHTML =
    '<a href="' + oppskriftLenke(o.navn) + '">' +
      '<div class="kort-bilde">' + bilde + "</div>" +
      '<span class="kort-tittel">' + trygg(o.tittel) + "</span>" +
      '<span class="kort-info">' + info + "</span>" +
    "</a>";
  return li;
}

// Alle kategoriene, uten duplikater, sortert alfabetisk på norsk (æøå til slutt)
function finnKategorier(oppskrifter) {
  var unike = [];
  oppskrifter.forEach(function (o) {
    if (unike.indexOf(o.kategori) === -1) unike.push(o.kategori);
  });
  return unike.sort(function (a, b) { return a.localeCompare(b, "no"); });
}


/* ---------- 4. Tilfeldig oppskrift ----------
   Alle knapper med data-tilfeldig sender deg til en tilfeldig oppskrift. */
document.querySelectorAll("[data-tilfeldig]").forEach(function (knapp) {
  knapp.addEventListener("click", function () {
    if (OPPSKRIFT_LISTE.length === 0) return;
    // Math.random() gir et tall mellom 0 og 1. Ganget med lengden og
    // rundet ned blir det en gyldig plass i lista.
    var tilfeldig = OPPSKRIFT_LISTE[Math.floor(Math.random() * OPPSKRIFT_LISTE.length)];
    window.location.href = oppskriftLenke(tilfeldig);
  });
});


/* ---------- Varsel hvis siden åpnes uten server ----------
   fetch() fungerer ikke når du dobbeltklikker på HTML-fila (file://).
   Da viser vi en beskjed i stedet for en tom side. */
if (window.location.protocol === "file:") {
  document.addEventListener("DOMContentLoaded", function () {
    var varsel = document.createElement("p");
    varsel.className = "varsel";
    varsel.textContent = "Oppskriftene kan ikke lastes når fila åpnes direkte. " +
      "Åpne siden med Live Server i VS Code, eller via GitHub Pages.";
    document.body.prepend(varsel);
  });
}
