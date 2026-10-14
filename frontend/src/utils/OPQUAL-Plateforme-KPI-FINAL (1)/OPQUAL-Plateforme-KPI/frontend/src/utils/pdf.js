// Générateur de PDF minimal (texte + tableaux), sans bibliothèque.
// Police Helvetica (standard PDF), encodage WinAnsi → accents français OK. Format A4 paysage.

const LARGEUR = 842;
const HAUTEUR = 595;
const MARGE = 36;
const NAVY = '0.04 0.16 0.44';
const BLEU_PALE = '0.93 0.95 0.99';

// Largeurs Helvetica (1/1000 em) pour les caractères 32..126
const W = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
  556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const WIN_ANSI = { '€': 0x80, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '\u00a0': 0x20, '→': null };

/** Convertit un texte en « chaîne binaire » WinAnsi (1 caractère = 1 octet). */
function enWinAnsi(texte) {
  let sortie = '';
  for (const c of String(texte ?? '')) {
    const code = c.codePointAt(0);
    if (c === '→') sortie += '->';
    else if (WIN_ANSI[c] !== undefined && WIN_ANSI[c] !== null) sortie += String.fromCharCode(WIN_ANSI[c]);
    else if (code === 9 || code === 10 || code === 13) sortie += ' ';
    else if (code >= 32 && code <= 255) sortie += c;
    else sortie += '?';
  }
  return sortie;
}

const echapper = (b) => b.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function largeur(binaire, taille, gras = false) {
  let total = 0;
  for (let i = 0; i < binaire.length; i++) {
    const code = binaire.charCodeAt(i);
    total += code >= 32 && code <= 126 ? W[code - 32] : 556;
  }
  return (total / 1000) * taille * (gras ? 1.07 : 1);
}

function tronquer(binaire, taille, max, gras = false) {
  if (largeur(binaire, taille, gras) <= max) return binaire;
  let t = binaire;
  while (t.length > 1 && largeur(`${t}...`, taille, gras) > max) t = t.slice(0, -1);
  return `${t}...`;
}

/**
 * @param {{titre:string, sousTitre?:string, sections:{titre:string, colonnes:string[], lignes:any[][]}[]}} doc
 * @returns {Uint8Array}
 */
export function genererPdf(doc) {
  const pages = [];
  let ops = null;
  let y = 0;

  const nouvellePage = () => {
    ops = [];
    pages.push(ops);
    y = HAUTEUR - MARGE;
  };
  const texte = (x, yy, t, taille = 9, gras = false, couleur = '0.1 0.13 0.25') => {
    ops.push(`BT ${couleur} rg /${gras ? 'F2' : 'F1'} ${taille} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${echapper(enWinAnsi(t))}) Tj ET`);
  };
  const rect = (x, yy, w, h, couleur) => ops.push(`${couleur} rg ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);

  nouvellePage();
  texte(MARGE, y - 16, doc.titre, 18, true, NAVY);
  y -= 34;
  if (doc.sousTitre) {
    texte(MARGE, y - 8, doc.sousTitre, 9, false, '0.38 0.44 0.56');
    y -= 24;
  }

  const utile = LARGEUR - 2 * MARGE;
  const HAUTEUR_LIGNE = 17;
  const TAILLE = 8;

  doc.sections.forEach((section) => {
    if (y < MARGE + 90) nouvellePage();
    texte(MARGE, y - 12, `${section.titre}  (${section.lignes.length})`, 12, true, NAVY);
    y -= 26;

    const entetes = section.colonnes.map((c) => enWinAnsi(c));
    const cellules = section.lignes.map((l) => l.map((v) => enWinAnsi(v === null || v === undefined ? '' : String(v))));

    // Largeur de colonne : contenu le plus long (sur un échantillon), puis mise à l'échelle.
    const voulu = entetes.map((e, i) => {
      let m = largeur(e, TAILLE, true);
      cellules.slice(0, 60).forEach((l) => (m = Math.max(m, largeur(l[i] ?? '', TAILLE))));
      return Math.min(m + 12, 220);
    });
    const somme = voulu.reduce((a, b) => a + b, 0);
    const facteur = utile / somme;
    const cols = voulu.map((w) => w * facteur);

    const dessinerEntete = () => {
      rect(MARGE, y - HAUTEUR_LIGNE + 2, utile, HAUTEUR_LIGNE, NAVY);
      let x = MARGE;
      entetes.forEach((e, i) => {
        texte(x + 5, y - 10, tronquer(e, TAILLE, cols[i] - 8, true), TAILLE, true, '1 1 1');
        x += cols[i];
      });
      y -= HAUTEUR_LIGNE;
    };

    dessinerEntete();
    cellules.forEach((ligne, n) => {
      if (y - HAUTEUR_LIGNE < MARGE + 14) {
        nouvellePage();
        dessinerEntete();
      }
      if (n % 2 === 1) rect(MARGE, y - HAUTEUR_LIGNE + 2, utile, HAUTEUR_LIGNE, BLEU_PALE);
      let x = MARGE;
      ligne.forEach((c, i) => {
        texte(x + 5, y - 10, tronquer(c, TAILLE, cols[i] - 8), TAILLE);
        x += cols[i];
      });
      y -= HAUTEUR_LIGNE;
    });
    y -= 22;
  });

  // Pieds de page (numérotation connue seulement maintenant)
  pages.forEach((p, i) => {
    ops = p;
    texte(MARGE, 20, 'OPQUAL Performance', 8, true, '0.38 0.44 0.56');
    const t = `Page ${i + 1} / ${pages.length}`;
    texte(LARGEUR - MARGE - largeur(enWinAnsi(t), 8), 20, t, 8, false, '0.38 0.44 0.56');
  });

  // Assemblage des objets PDF
  const objets = [];
  const ajouter = (contenu) => objets.push(contenu) && objets.length;
  ajouter('<< /Type /Catalog /Pages 2 0 R >>');
  ajouter(''); // Pages (rempli plus bas)
  ajouter('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  ajouter('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const idsPages = [];
  pages.forEach((p) => {
    const flux = p.join('\n');
    const idContenu = ajouter(`<< /Length ${flux.length} >>\nstream\n${flux}\nendstream`) ;
    const idPage = ajouter(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGEUR} ${HAUTEUR}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${idContenu} 0 R >>`);
    idsPages.push(idPage);
  });
  objets[1] = `<< /Type /Pages /Kids [${idsPages.map((i) => `${i} 0 R`).join(' ')}] /Count ${idsPages.length} >>`;

  let fichier = '%PDF-1.4\n';
  const offsets = [];
  objets.forEach((o, i) => {
    offsets.push(fichier.length);
    fichier += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const debutXref = fichier.length;
  fichier += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (fichier += `${String(o).padStart(10, '0')} 00000 n \n`));
  fichier += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF`;

  const octets = new Uint8Array(fichier.length);
  for (let i = 0; i < fichier.length; i++) octets[i] = fichier.charCodeAt(i) & 0xff;
  return octets;
}
