/* ==========================================================
   forside.js – fyller inn kategoriene og «Siste oppskrifter»
   ========================================================== */

hentAlleOppskrifter().then(function (oppskrifter) {

  /* ---------- Kategorifliser ----------
     Én flis per kategori. Lenken går til "Alle oppskrifter"
     med kategorien i adressen, f.eks. oppskrifter.html?kategori=Middag */
  var kategoriListe = document.getElementById("kategori-liste");
  finnKategorier(oppskrifter).forEach(function (k) {
    var li = document.createElement("li");
    li.innerHTML =
      '<a class="kategori" href="oppskrifter.html?kategori=' + encodeURIComponent(k) + '">' +
        kategoriIkon(k) + "<span>" + trygg(k) + "</span>" +
      "</a>";
    kategoriListe.appendChild(li);
  });

  /* ---------- Siste oppskrifter ----------
     De som står nederst i liste.js er nyest. Vi sorterer etter
     plassen i lista (størst først) og tar de tre første. */
  var siste = oppskrifter.slice().sort(function (a, b) { return b.plass - a.plass; }).slice(0, 3);

  var sisteListe = document.getElementById("siste-liste");
  sisteListe.innerHTML = ""; // fjern "Laster oppskrifter …"
  siste.forEach(function (o) { sisteListe.appendChild(lagKort(o)); });

  if (siste.length === 0) {
    sisteListe.innerHTML = '<li class="laster">Ingen oppskrifter ennå.</li>';
  }
});
