// ---------- Nombres ----------
// Les colonnes Decimal de PostgreSQL arrivent en texte ("8.00") : on les convertit.
export const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const formatHeures = (h) => `${num(h).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
export const formatPourcent = (v) => `${Math.round(num(v))} %`;

// ---------- Dates ----------
export function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const formatDate = (v) => {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '—';
};
export const formatDateHeure = (v) => {
  const d = parseDate(v);
  return d
    ? d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
};
/** « il y a 2 h » */
export function depuis(v) {
  const d = parseDate(v);
  if (!d) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `il y a ${Math.floor(s / 86400)} j`;
  return formatDate(v);
}
/** yyyy-mm-dd pour <input type="date"> (colonnes @db.Date → minuit UTC) */
export function versChampDate(v) {
  const d = parseDate(v);
  return d ? d.toISOString().slice(0, 10) : '';
}
export const aujourdhuiISO = () => new Date().toISOString().slice(0, 10);

// ---------- Personnes ----------
export const nomComplet = (u) => (u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : '—');
export const initiales = (u) => {
  if (!u) return '?';
  const p = (u.prenom || '').trim();
  const n = (u.nom || '').trim();
  if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
  // Sans prénom (courant à Madagascar) : les deux premières lettres du nom.
  return (n || p).slice(0, 2).toUpperCase() || '?';
};

// ---------- Libellés ----------
const LIBELLES = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  PLANIFIE: 'Planifié',
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  RETIRE: 'Retiré',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVEE: 'Archivée',
  FERMEE: 'Fermée',
};
/** Libellé lisible pour une valeur technique ; inconnue → « Valeur technique » mise en forme. */
export function libelle(valeur) {
  if (!valeur) return '—';
  if (LIBELLES[valeur]) return LIBELLES[valeur];
  const t = String(valeur).replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Couleur de badge : success | warning | danger | info | neutral */
export function tonDe(valeur) {
  switch (valeur) {
    case 'TERMINE':
    case 'ACTIF':
    case 'ACTIVE':
      return 'success';
    case 'EN_COURS':
    case 'PLANIFIE':
      return 'info';
    case 'HAUTE':
      return 'warning';
    case 'URGENTE':
      return 'danger';
    case 'INACTIF':
    case 'INACTIVE':
    case 'ARCHIVEE':
    case 'FERMEE':
      return 'neutral';
    default:
      return 'neutral';
  }
}

/** Fusionne valeurs connues (config) et valeurs réellement présentes dans les données. */
export function optionsAvec(connues, lignes, champ) {
  const set = new Set(connues);
  (lignes || []).forEach((l) => l?.[champ] && set.add(l[champ]));
  return [...set];
}

// ---------- CSV ----------
export function genererCsv(colonnes, lignes) {
  const echapper = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const entete = colonnes.map((c) => echapper(c.titre)).join(';');
  const corps = lignes.map((l) => colonnes.map((c) => echapper(c.valeur(l))).join(';'));
  return '\uFEFF' + [entete, ...corps].join('\r\n'); // BOM pour Excel
}
export function telecharger(nom, contenu, mime) {
  const blob = new Blob([contenu], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
