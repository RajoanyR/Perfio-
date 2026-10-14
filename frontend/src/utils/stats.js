import { ETAT_TERMINE } from '../config/valeurs.js';
import { num, parseDate } from './format.js';

// ---------- Périodes ----------
export const PERIODES = [
  { id: 'jour', label: 'Jour' },
  { id: 'semaine', label: 'Semaine' },
  { id: 'mois', label: 'Mois' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'annee', label: 'Année' },
  { id: 'perso', label: 'Personnalisé' },
];

const debutJour = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const finJour = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Retourne { debut, fin } (objets Date) pour la période choisie autour de la date de référence. */
export function plageDePeriode(type, reference, perso) {
  const ref = reference instanceof Date ? reference : new Date(reference);
  switch (type) {
    case 'jour':
      return { debut: debutJour(ref), fin: finJour(ref) };
    case 'semaine': {
      const decal = (ref.getDay() + 6) % 7; // lundi = 0
      const lundi = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - decal);
      const dimanche = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + 6);
      return { debut: debutJour(lundi), fin: finJour(dimanche) };
    }
    case 'mois':
      return { debut: new Date(ref.getFullYear(), ref.getMonth(), 1), fin: finJour(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)) };
    case 'trimestre': {
      const q = Math.floor(ref.getMonth() / 3) * 3;
      return { debut: new Date(ref.getFullYear(), q, 1), fin: finJour(new Date(ref.getFullYear(), q + 3, 0)) };
    }
    case 'annee':
      return { debut: new Date(ref.getFullYear(), 0, 1), fin: finJour(new Date(ref.getFullYear(), 11, 31)) };
    case 'perso': {
      const d = perso?.debut ? debutJour(new Date(perso.debut)) : debutJour(ref);
      const f = perso?.fin ? finJour(new Date(perso.fin)) : finJour(ref);
      return { debut: d, fin: f };
    }
    default:
      return plageDePeriode('mois', ref);
  }
}

const dansPlage = (date, plage) => !!date && date >= plage.debut && date <= plage.fin;

// ---------- Tâches ----------
export const estTerminee = (t) => t?.etat === ETAT_TERMINE;

/** Tâche non terminée dont l'échéance est dépassée. */
export function estEnRetard(t, maintenant = new Date()) {
  if (estTerminee(t)) return false;
  const limite = parseDate(t.date_limite);
  if (!limite) return false;
  // date_limite est une colonne DATE (minuit UTC) : en retard à partir du lendemain
  return limite.getTime() + 86400000 <= maintenant.getTime();
}

/**
 * Tâches « concernées » par une période : celles dont l'échéance (à défaut la date de création)
 * tombe dans la période, ou qui ont été terminées pendant la période.
 */
export function tachesDeLaPeriode(taches, plage) {
  return taches.filter((t) => {
    const ref = parseDate(t.date_limite) || parseDate(t.date_creation);
    return dansPlage(ref, plage) || dansPlage(parseDate(t.date_terminaison), plage);
  });
}

export function compter(liste, champ) {
  const r = {};
  liste.forEach((x) => {
    const k = x[champ] ?? 'Non défini';
    r[k] = (r[k] || 0) + 1;
  });
  return r;
}

export function resumeTaches(taches) {
  const total = taches.length;
  const terminees = taches.filter(estTerminee).length;
  const retard = taches.filter((t) => estEnRetard(t)).length;
  const taux = total ? (terminees / total) * 100 : 0;
  const estime = taches.reduce((s, t) => s + num(t.temps_estime), 0);
  return { total, terminees, retard, taux, estime };
}

/** Taux de réalisation par mois d'une année (0..11). */
export function evolutionAnnuelle(taches, annee) {
  const mois = Array.from({ length: 12 }, (_, i) => ({ mois: i, total: 0, terminees: 0 }));
  taches.forEach((t) => {
    const ref = parseDate(t.date_limite) || parseDate(t.date_creation);
    if (!ref || ref.getUTCFullYear() !== annee) return;
    const m = mois[ref.getUTCMonth()];
    m.total += 1;
    if (estTerminee(t)) m.terminees += 1;
  });
  return mois.map((m) => ({ ...m, taux: m.total ? (m.terminees / m.total) * 100 : null }));
}

// ---------- Projets ----------
export function progressionProjet(projet, taches) {
  const siennes = taches.filter((t) => t.id_projet === projet.id_projet);
  const r = resumeTaches(siennes);
  return { ...r, progression: r.total ? Math.round(r.taux) : 0 };
}

export function projetActif(p) {
  return p.statut === 'ACTIF' && !p.date_fin_reelle;
}

// ---------- Activités ----------
/** Exécute `fn` sur chaque élément avec au plus `limite` requêtes en parallèle. */
export async function enParallele(elements, fn, limite = 6) {
  const resultats = new Array(elements.length);
  let i = 0;
  async function ouvrier() {
    while (i < elements.length) {
      const idx = i++;
      try {
        resultats[idx] = await fn(elements[idx]);
      } catch {
        resultats[idx] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, elements.length) }, ouvrier));
  return resultats;
}

export const parJourISO = (v) => {
  const d = parseDate(v);
  if (!d) return '';
  const l = new Date(d.getTime() - d.getTimezoneOffset() * 60000); // jour local
  return l.toISOString().slice(0, 10);
};
