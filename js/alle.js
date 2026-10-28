/* ==========================================================
   alle.js – "Alle oppskrifter": liste, søk og kategorifilter
   ========================================================== */

var sok = document.getElementById("sok");
var filter = document.getElementById("filter");
var liste = document.getElementById("liste");
var ingen = document.getElementById("ingen");

var alleOppskrifter = [];
var valgtKategori = "alle";

hentAlleOppskrifter().then(function (oppskrifter) {
  // Alfabetisk etter tittel (på norsk, så æøå havner riktig)
  alleOppskrifter = oppskrifter.slice().sort(function (a, b) {
    return a.tittel.localeCompare(b.tittel, "no");
  });

  // Én filterknapp per kategori
  finnKategorier(alleOppskrifter).forEach(function (k) {
    var knapp = document.createElement("button");
    knapp.type = "button";
    knapp.dataset.kategori = k;
    knapp.textContent = k;
    filter.appendChild(knapp);
  });

  // Lag alle kortene én gang. Senere skjuler vi bare de som ikke passer.
  liste.innerHTML = "";
  alleOppskrifter.forEach(function (o) {
    var kort = lagKort(o);
    kort.dataset.sok = o.sokTekst;
    liste.appendChild(kort);
  });

  // Kom du fra forsiden med ?sok=... eller ?kategori=... i adressen?
  // Da fyller vi inn søket / velger kategorien med en gang.
  var adresse = new URLSearchParams(window.location.search);
  if (adresse.get("sok")) sok.value = adresse.get("sok");

  var fraAdresse = adresse.get("kategori");
  var finnes = alleOppskrifter.some(function (o) { return o.kategori === fraAdresse; });
  velgKategori(finnes ? fraAdresse : "alle");
});


/* Går gjennom alle kortene og skjuler dem som ikke passer */
function oppdaterListe() {
  var tekst = sok.value.trim().toLowerCase();
  var synlige = 0;

  liste.querySelectorAll(".kort").forEach(function (kort) {
    var riktigKategori = valgtKategori === "alle" || kort.dataset.kategori === valgtKategori;
    var treff = kort.dataset.sok.indexOf(tekst) !== -1;
    kort.hidden = !(riktigKategori && treff);
    if (!kort.hidden) synlige++;
  });

  // "Fant ingen oppskrifter" vises bare når alt er skjult
  ingen.hidden = synlige > 0;
}

/* Marker riktig filterknapp og oppdater lista */
function velgKategori(kategori) {
  valgtKategori = kategori;
  filter.querySelectorAll("button").forEach(function (b) {
    b.classList.toggle("aktiv", b.dataset.kategori === kategori);
  });
  oppdaterListe();
}

// Søk på nytt for hver bokstav du skriver
sok.addEventListener("input", oppdaterListe);

// Én klikk-lytter på hele filteret i stedet for én per knapp
filter.addEventListener("click", function (e) {
  var knapp = e.target.closest("button");
  if (knapp) velgKategori(knapp.dataset.kategori);
});
