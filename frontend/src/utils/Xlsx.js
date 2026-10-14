// Générateur de fichier Excel (.xlsx) minimal, sans bibliothèque : bandeau de titre, ligne de période,
// en-têtes filtrables, lignes alternées, cellules colorées, ligne de total, volets figés.
// Un .xlsx est une archive ZIP de fichiers XML ; l'archive est écrite sans compression.

const enc = new TextEncoder();

// ---------- ZIP (méthode « stockée ») ----------
const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(octets) {
  let c = 0xffffffff;
  for (let i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function creerZip(fichiers) {
  const maintenant = new Date();
  const heure = (maintenant.getHours() << 11) | (maintenant.getMinutes() << 5) | (maintenant.getSeconds() >> 1);
  const date = ((maintenant.getFullYear() - 1980) << 9) | ((maintenant.getMonth() + 1) << 5) | maintenant.getDate();
  const morceaux = [];
  const centrale = [];
  let decalage = 0;

  fichiers.forEach((f) => {
    const nom = enc.encode(f.nom);
    const crc = crc32(f.contenu);
    const taille = f.contenu.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // noms en UTF-8
    local.setUint16(8, 0, true); // pas de compression
    local.setUint16(10, heure, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, taille, true);
    local.setUint32(22, taille, true);
    local.setUint16(26, nom.length, true);
    local.setUint16(28, 0, true);
    morceaux.push(new Uint8Array(local.buffer), nom, f.contenu);

    const entree = new DataView(new ArrayBuffer(46));
    entree.setUint32(0, 0x02014b50, true);
    entree.setUint16(4, 20, true);
    entree.setUint16(6, 20, true);
    entree.setUint16(8, 0x0800, true);
    entree.setUint16(10, 0, true);
    entree.setUint16(12, heure, true);
    entree.setUint16(14, date, true);
    entree.setUint32(16, crc, true);
    entree.setUint32(20, taille, true);
    entree.setUint32(24, taille, true);
    entree.setUint16(28, nom.length, true);
    entree.setUint32(42, decalage, true);
    centrale.push(new Uint8Array(entree.buffer), nom);

    decalage += 30 + nom.length + taille;
  });

  const tailleCentrale = centrale.reduce((n, m) => n + m.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, fichiers.length, true);
  fin.setUint16(10, fichiers.length, true);
  fin.setUint32(12, tailleCentrale, true);
  fin.setUint32(16, decalage, true);

  const tous = [...morceaux, ...centrale, new Uint8Array(fin.buffer)];
  const total = tous.reduce((n, m) => n + m.length, 0);
  const sortie = new Uint8Array(total);
  let p = 0;
  tous.forEach((m) => {
    sortie.set(m, p);
    p += m.length;
  });
  return sortie;
}

// ---------- Utilitaires XML / couleurs ----------
const echapper = (v) =>
  String(v ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const lettre = (n) => {
  let s = '';
  let x = n + 1;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
};

const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const versHex = (c) => c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
const melange = (hex, avec, part) => {
  const a = rgb(hex);
  const b = rgb(avec);
  return versHex(a.map((x, i) => x * (1 - part) + b[i] * part));
};

// ---------- Styles ----------
function creerStyles() {
  const polices = ['<font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/><family val="2"/></font>'];
  const remplissages = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  const bordures = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
  const formats = [];
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  const cache = new Map();
  const index = (liste, xml) => {
    let i = liste.indexOf(xml);
    if (i < 0) {
      liste.push(xml);
      i = liste.length - 1;
    }
    return i;
  };

  /** spec : { gras, italique, taille, couleur, fond, bordure, h, v, retour, format } → index de style. */
  const style = (spec) => {
    const cle = JSON.stringify(spec);
    if (cache.has(cle)) return cache.get(cle);
    const police = index(
      polices,
      `<font>${spec.gras ? '<b/>' : ''}${spec.italique ? '<i/>' : ''}<sz val="${spec.taille || 11}"/><color rgb="FF${spec.couleur || '000000'}"/><name val="Calibri"/><family val="2"/></font>`,
    );
    const fond = spec.fond
      ? index(remplissages, `<fill><patternFill patternType="solid"><fgColor rgb="FF${spec.fond}"/><bgColor indexed="64"/></patternFill></fill>`)
      : 0;
    const bordure = spec.bordure
      ? index(
          bordures,
          `<border>${['left', 'right', 'top', 'bottom'].map((c) => `<${c} style="thin"><color rgb="FF${spec.bordure}"/></${c}>`).join('')}<diagonal/></border>`,
        )
      : 0;
    let fmt = 0;
    if (spec.format === '0') fmt = 1;
    else if (spec.format) fmt = 164 + index(formats, spec.format);
    const alignement = `<alignment${spec.h ? ` horizontal="${spec.h}"` : ''} vertical="${spec.v || 'center'}"${spec.retour ? ' wrapText="1"' : ''}/>`;
    xfs.push(
      `<xf numFmtId="${fmt}" fontId="${police}" fillId="${fond}" borderId="${bordure}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1">${alignement}</xf>`,
    );
    const id = xfs.length - 1;
    cache.set(cle, id);
    return id;
  };

  const xml = () =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    (formats.length ? `<numFmts count="${formats.length}">${formats.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${echapper(f)}"/>`).join('')}</numFmts>` : '') +
    `<fonts count="${polices.length}">${polices.join('')}</fonts>` +
    `<fills count="${remplissages.length}">${remplissages.join('')}</fills>` +
    `<borders count="${bordures.length}">${bordures.join('')}</borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`;

  return { style, xml };
}

// ---------- Feuille ----------
const BLEU_TITRE = '1F4E79';
const BLEU_ENTETE = '2E75B6';
const GRIS_BORDURE = 'D0D7E2';
const BANDE = 'F4F8FC';

/**
 * feuille : { nom, titre, sousTitre, colonnes:[{ titre, type, largeur?, couleur?:(v)=>hex|null }], lignes:[[valeurs]], total }
 * type : 'texte' | 'entier' | 'decimal' | 'centre' (texte centré)
 * La valeur d'une cellule peut être un nombre, un texte ou null ; `couleur` colore la cellule (état, priorité…).
 */
function xmlFeuille(feuille, styles, indexFeuille) {
  const nbCols = feuille.colonnes.length;
  const derniere = lettre(nbCols - 1);
  const LIGNE_ENTETE = 4;
  const premiere = LIGNE_ENTETE + 1;
  const derniereLigne = LIGNE_ENTETE + feuille.lignes.length;

  const sTitre = styles.style({ gras: true, taille: 15, couleur: 'FFFFFF', fond: BLEU_TITRE, h: 'center' });
  const sSous = styles.style({ italique: true, taille: 10, couleur: '5B6B85', h: 'center' });
  const sEntete = styles.style({ gras: true, couleur: 'FFFFFF', fond: BLEU_ENTETE, bordure: BLEU_ENTETE, h: 'center', retour: true });
  const sTotal = styles.style({ gras: true });

  // Largeurs : contenu le plus long (échantillon), borné.
  const largeurs = feuille.colonnes.map((c, i) => {
    if (c.largeur) return c.largeur;
    let m = String(c.titre).length * 1.05 + 4;
    for (let r = 0; r < Math.min(feuille.lignes.length, 400); r++) {
      const v = feuille.lignes[r][i];
      if (v !== null && v !== undefined) m = Math.max(m, String(v).length + 3);
    }
    return Math.min(Math.max(m, 10), 46);
  });

  const cellule = (col, ligne, valeur, s) => {
    const ref = `${lettre(col)}${ligne}`;
    if (valeur === null || valeur === undefined || valeur === '') return `<c r="${ref}" s="${s}"/>`;
    if (typeof valeur === 'number' && Number.isFinite(valeur)) return `<c r="${ref}" s="${s}"><v>${valeur}</v></c>`;
    return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${echapper(valeur)}</t></is></c>`;
  };

  const lignesXml = [];
  // 1. Titre (fusionné sur toute la largeur)
  lignesXml.push(
    `<row r="1" ht="30" customHeight="1">${cellule(0, 1, feuille.titre, sTitre)}${Array.from({ length: nbCols - 1 }, (_, i) => `<c r="${lettre(i + 1)}1" s="${sTitre}"/>`).join('')}</row>`,
  );
  // 2. Sous-titre (période, date de génération)
  lignesXml.push(
    `<row r="2" ht="20" customHeight="1">${cellule(0, 2, feuille.sousTitre, sSous)}${Array.from({ length: nbCols - 1 }, (_, i) => `<c r="${lettre(i + 1)}2" s="${sSous}"/>`).join('')}</row>`,
  );
  // 4. En-têtes
  lignesXml.push(`<row r="${LIGNE_ENTETE}" ht="34" customHeight="1">${feuille.colonnes.map((c, i) => cellule(i, LIGNE_ENTETE, c.titre, sEntete)).join('')}</row>`);

  // 5+. Données
  feuille.lignes.forEach((ligne, n) => {
    const r = premiere + n;
    const bande = n % 2 === 1 ? BANDE : null;
    const cellules = feuille.colonnes.map((c, i) => {
      const v = ligne[i];
      const base = { bordure: GRIS_BORDURE, fond: bande || undefined };
      const couleur = c.couleur && v !== null && v !== undefined ? c.couleur(v) : null;
      let s;
      if (couleur) {
        s = styles.style({ ...base, fond: melange(couleur, 'FFFFFF', 0.84), couleur: melange(couleur, '000000', 0.3), gras: true, h: 'center' });
      } else if (c.type === 'entier') s = styles.style({ ...base, h: 'right', format: '0' });
      else if (c.type === 'decimal') s = styles.style({ ...base, h: 'right', format: '0.0' });
      else if (c.type === 'centre') s = styles.style({ ...base, h: 'center' });
      else s = styles.style({ ...base, h: 'left' });
      return cellule(i, r, v, s);
    });
    lignesXml.push(`<row r="${r}">${cellules.join('')}</row>`);
  });

  // Total (une ligne vide avant, comme dans le modèle)
  const ligneTotal = derniereLigne + 2;
  lignesXml.push(`<row r="${ligneTotal}">${cellule(0, ligneTotal, feuille.total, sTotal)}</row>`);

  const cols = largeurs.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w.toFixed(1)}" customWidth="1"/>`).join('');
  const fusions = `<mergeCells count="2"><mergeCell ref="A1:${derniere}1"/><mergeCell ref="A2:${derniere}2"/></mergeCells>`;
  const filtre = feuille.lignes.length ? `<autoFilter ref="A${LIGNE_ENTETE}:${derniere}${derniereLigne}"/>` : '';

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` +
    `<dimension ref="A1:${derniere}${ligneTotal}"/>` +
    `<sheetViews><sheetView ${indexFeuille === 0 ? 'tabSelected="1" ' : ''}showGridLines="0" workbookViewId="0"><pane ySplit="${LIGNE_ENTETE}" topLeftCell="A${premiere}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${premiere}" sqref="A${premiere}"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="16"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${lignesXml.join('')}</sheetData>` +
    filtre +
    fusions +
    `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>` +
    `<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>` +
    `</worksheet>`
  );
}

const nomOnglet = (nom, i) => String(nom || `Feuille${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);

/** @returns {Uint8Array} contenu du fichier .xlsx */
export function genererXlsx(feuilles) {
  const styles = creerStyles();
  const xmlFeuilles = feuilles.map((f, i) => xmlFeuille(f, styles, i));
  const noms = feuilles.map((f, i) => nomOnglet(f.nom, i));

  const fichiers = [
    {
      nom: '[Content_Types].xml',
      contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${feuilles
        .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
        .join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      nom: '_rels/.rels',
      contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      nom: 'xl/workbook.xml',
      contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${noms
        .map((n, i) => `<sheet name="${echapper(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('')}</sheets>${`<definedNames>${feuilles
        .map((f, i) => (f.lignes.length ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${echapper(noms[i]).replace(/'/g, "''")}'!$A$4:$${lettre(f.colonnes.length - 1)}$${4 + f.lignes.length}</definedName>` : ''))
        .join('')}</definedNames>`}</workbook>`,
    },
    {
      nom: 'xl/_rels/workbook.xml.rels',
      contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${feuilles
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join('')}<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { nom: 'xl/styles.xml', contenu: styles.xml() },
    ...xmlFeuilles.map((x, i) => ({ nom: `xl/worksheets/sheet${i + 1}.xml`, contenu: x })),
  ].map((f) => ({ nom: f.nom, contenu: enc.encode(f.contenu) }));

  return creerZip(fichiers);
}
