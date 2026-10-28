/* ==========================================================
   maal-og-vekt.js – kalkulatoren på maal-og-vekt.html
   ----------------------------------------------------------
   Slik fungerer den:
   - Hver ingrediens har en vekt per desiliter (g).
   - Alt regnes om via milliliter (ml) som "felles språk":
     det du skriver inn -> ml -> alle de andre enhetene.
   ========================================================== */


/* ---------- Ingrediensene ----------
   g = omtrent hvor mange gram 1 dl veier.
   Vil du legge til flere? Bare lag en ny linje i samme format. */
var INGREDIENSER = [
  { navn: "Vann",           g: 100 },
  { navn: "Melk",           g: 103 },
  { navn: "Fløte",          g: 100 },
  { navn: "Olje",           g: 90 },
  { navn: "Smør (smeltet)", g: 95 },
  { navn: "Hvetemel",       g: 60 },
  { navn: "Sukker",         g: 85 },
  { navn: "Melis",          g: 60 },
  { navn: "Brunt sukker",   g: 80 },
  { navn: "Havregryn",      g: 35 },
  { navn: "Ris (ukokt)",    g: 85 },
  { navn: "Kakao",          g: 40 },
  { navn: "Salt",           g: 120 },
  { navn: "Honning",        g: 140 }
];

/* ---------- Enhetene ----------
   type "vol" = volum, faktor er antall ml i én enhet
   type "vekt" = vekt, faktor er antall gram i én enhet */
var ENHETER = {
  g:   { type: "vekt", faktor: 1 },
  dl:  { type: "vol",  faktor: 100 },
  l:   { type: "vol",  faktor: 1000 },
  ss:  { type: "vol",  faktor: 15 },
  ts:  { type: "vol",  faktor: 5 },
  cup: { type: "vol",  faktor: 236.6 },
  oz:  { type: "vekt", faktor: 28.35 },
  lb:  { type: "vekt", faktor: 453.6 }
};

// Hva er valgt akkurat nå (starter med 1 dl hvetemel)
var valgt = INGREDIENSER[5];
var sistEnhet = "dl";   // feltet du sist skrev i
var sistTekst = "1";    // det du skrev der

var knappeListe = document.getElementById("ingrediens-valg");
var valgtNavn = document.getElementById("valgt-navn");
var felter = document.querySelectorAll("[data-enhet]");


/* ---------- Hjelpefunksjoner ---------- */

// "1,5" -> 1.5   (tom eller ugyldig tekst blir 0)
function lesTall(tekst) {
  var n = parseFloat(String(tekst).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// 1.5 -> "1,5". Store tall rundes til hele, små får flere desimaler.
function skrivTall(n) {
  if (!n) return "0";
  var r;
  if (n >= 100) r = Math.round(n);
  else if (n >= 1) r = Math.round(n * 10) / 10;
  else r = Math.round(n * 100) / 100;
  return String(r).replace(".", ",");
}

// Gjør en mengde i en enhet om til milliliter
function tilMl(mengde, enhet) {
  var e = ENHETER[enhet];
  if (e.type === "vol") return mengde * e.faktor;
  // vekt -> ml: del grammene på hvor mange gram 1 ml veier (g per dl / 100)
  return (mengde * e.faktor) / (valgt.g / 100);
}

// Gjør milliliter om til en enhet
function fraMl(ml, enhet) {
  var e = ENHETER[enhet];
  if (e.type === "vol") return ml / e.faktor;
  return (ml * (valgt.g / 100)) / e.faktor;
}


/* ---------- Regn ut alle feltene ---------- */
function oppdaterFelter() {
  var ml = tilMl(lesTall(sistTekst), sistEnhet);

  felter.forEach(function (felt) {
    var enhet = felt.dataset.enhet;
    // Feltet du skriver i skal ikke endres mens du skriver
    if (enhet === sistEnhet) {
      if (felt !== document.activeElement) felt.value = sistTekst;
    } else {
      felt.value = skrivTall(fraMl(ml, enhet));
    }
  });
}


/* ---------- Lag ingrediensknappene ---------- */
INGREDIENSER.forEach(function (ing) {
  var knapp = document.createElement("button");
  knapp.type = "button";
  knapp.innerHTML = "<span></span><small></small>";
  // textContent i stedet for innerHTML for selve teksten = trygt mot rare tegn
  knapp.querySelector("span").textContent = ing.navn;
  knapp.querySelector("small").textContent = "1 dl ≈ " + ing.g + " g";
  knapp.setAttribute("aria-pressed", String(ing === valgt));

  knapp.addEventListener("click", function () {
    valgt = ing;
    valgtNavn.textContent = ing.navn;
    // Flytt markeringen til knappen du trykket på
    knappeListe.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b === knapp));
    });
    oppdaterFelter();
  });

  knappeListe.appendChild(knapp);
});


/* ---------- Lytt på feltene ---------- */
felter.forEach(function (felt) {
  felt.addEventListener("input", function () {
    sistEnhet = felt.dataset.enhet;
    sistTekst = felt.value;
    oppdaterFelter();
  });
  // Marker hele tallet når du trykker i feltet, så det er lett å skrive nytt
  felt.addEventListener("focus", function () { felt.select(); });
});

// Vis startverdiene med en gang siden åpnes
valgtNavn.textContent = valgt.navn;
oppdaterFelter();
