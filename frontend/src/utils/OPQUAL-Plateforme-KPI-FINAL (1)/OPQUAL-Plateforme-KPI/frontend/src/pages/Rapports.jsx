import { useMemo, useState } from 'react';
import { Alerte, Badge, Bouton, Etats, PageHeader } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { enregistrerRapport, rapportsUtilisateur } from '../api/rapportApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate, formatDateHeure, genererCsv, libelle, nomComplet, num, parseDate, telecharger } from '../utils/format.js';
import { genererPdf } from '../utils/pdf.js';
import { genererXlsx } from '../utils/xlsx.js';
import { NOM_ENTREPRISE } from '../config/app.js';
import { COULEUR_ETAT, COULEUR_PRIORITE } from '../utils/couleurs.js';
import { estEnRetard, estTerminee, resumeTaches, tachesDeLaPeriode } from '../utils/stats.js';

const ENTREPRISE = NOM_ENTREPRISE.toUpperCase();
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Couleur d'une cellule d'état / de priorité d'après son libellé affiché.
const COULEUR_PAR_LIBELLE = Object.fromEntries(Object.entries({ ...COULEUR_ETAT, ...COULEUR_PRIORITE }).map(([k, c]) => [libelle(k), c]));
const colorier = (v) => COULEUR_PAR_LIBELLE[v] || null;
const colorierRetard = (v) => (v === 'Oui' ? '#dc2626' : null);

const arrondi1 = (x) => Math.round(x * 10) / 10;
const pad2 = (n) => String(n).padStart(2, '0');
const horodatage = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
};

// Tâches terminées ayant une échéance : part de celles clôturées au plus tard le jour de l'échéance (100 si aucune à évaluer).
function respectDelais(liste) {
  const avec = liste.filter((t) => estTerminee(t) && t.date_limite && t.date_terminaison);
  if (!avec.length) return 100;
  const dansLesTemps = avec.filter((t) => parseDate(t.date_terminaison) < new Date(parseDate(t.date_limite).getTime() + 86400000)).length;
  return arrondi1((dansLesTemps / avec.length) * 100);
}

function indicateurs(liste) {
  const r = resumeTaches(liste);
  return { attendues: r.total, realisees: r.terminees, taux: arrondi1(r.taux), respect: respectDelais(liste), retard: r.retard, heures: arrondi1(r.estime) };
}

function grouper(liste, cle) {
  const m = new Map();
  liste.forEach((x) => {
    const k = x[cle];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  });
  return m;
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Périodes proposées en un clic (plus de saisie de dates, sauf « Personnalisée »).
const PERIODES = [
  { id: 'tout', label: 'Toute la période' },
  { id: 'semaine', label: 'Cette semaine' },
  { id: 'mois', label: 'Ce mois' },
  { id: 'trimestre', label: 'Ce trimestre' },
  { id: 'annee', label: 'Cette année' },
  { id: 'perso', label: 'Personnalisée' },
];

function plageDe(id, persoDebut, persoFin) {
  const n = new Date();
  if (id === 'semaine') {
    const lundi = new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7));
    const dimanche = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + 6);
    return { debut: iso(lundi), fin: iso(dimanche) };
  }
  if (id === 'mois') return { debut: iso(new Date(n.getFullYear(), n.getMonth(), 1)), fin: iso(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
  if (id === 'trimestre') {
    const q = Math.floor(n.getMonth() / 3) * 3;
    return { debut: iso(new Date(n.getFullYear(), q, 1)), fin: iso(new Date(n.getFullYear(), q + 3, 0)) };
  }
  if (id === 'annee') return { debut: `${n.getFullYear()}-01-01`, fin: `${n.getFullYear()}-12-31` };
  if (id === 'perso') return { debut: persoDebut, fin: persoFin };
  return { debut: '', fin: '' };
}

const FORMATS = [
  { id: 'XLSX', titre: 'Excel (.xlsx)', texte: 'Mise en forme complète : titres, filtres, couleurs, total', icone: 'kpi' },
  { id: 'PDF', titre: 'PDF', texte: 'Document prêt à lire ou imprimer', icone: 'rapport' },
  { id: 'CSV', titre: 'CSV', texte: 'Données brutes, à importer dans un autre outil', icone: 'download' },
];

export default function Rapports() {
  const { utilisateur } = useAuth();
  const { projets, taches, utilisateurs, equipes, equipeParId, projetParId, utilisateurParId, chargement, erreur } = useDonnees();
  const toast = useToast();
  const historique = useFetch(() => rapportsUtilisateur(utilisateur.id_utilisateur), [utilisateur.id_utilisateur]);

  const [choix, setChoix] = useState(['collaborateurs']); // choix multiple
  const [periode, setPeriode] = useState('tout');
  const [persoDebut, setPersoDebut] = useState('');
  const [persoFin, setPersoFin] = useState('');
  const [format, setFormat] = useState('XLSX');
  const [enCours, setEnCours] = useState(false);
  const [erreurForm, setErreurForm] = useState('');

  // Aperçu (cartes de choix) : titre de feuille et nombre d'enregistrements.
  const JEUX = useMemo(
    () => ({
      collaborateurs: { label: 'Collaborateurs', icone: 'user', compte: utilisateurs.length },
      equipes: { label: 'Équipes', icone: 'equipes', compte: equipes.length },
      projets: { label: 'Projets', icone: 'projet', compte: projets.length },
      taches: { label: 'Tâches', icone: 'taches', compte: taches.length },
    }),
    [projets, taches, utilisateurs, equipes],
  );

  // Construit une feuille de rapport (colonnes + lignes) pour un type de données et une période.
  const construire = (cle, debut, fin) => {
    const borne = !!(debut || fin);
    const plage = { debut: debut ? new Date(`${debut}T00:00:00`) : new Date(0), fin: fin ? new Date(`${fin}T23:59:59.999`) : new Date(8.64e15) };
    const tachesPeriode = borne ? tachesDeLaPeriode(taches, plage) : taches;
    const nomEquipe = (id) => equipeParId.get(id)?.nom_equipe ?? '';

    if (cle === 'collaborateurs') {
      const parResp = grouper(tachesPeriode, 'id_responsable');
      return {
        onglet: 'Collaborateurs',
        titre: 'PERFORMANCE PAR COLLABORATEUR',
        colonnes: [
          { titre: 'Collaborateur' }, { titre: 'Poste' }, { titre: 'Équipe' },
          { titre: 'Tâches attendues', type: 'entier' }, { titre: 'Tâches réalisées', type: 'entier' },
          { titre: 'Taux de réalisation (%)', type: 'decimal' }, { titre: 'Respect des délais (%)', type: 'decimal' },
          { titre: 'En retard', type: 'entier' }, { titre: 'Heures estimées', type: 'decimal' },
          { titre: 'Capacité hebdo (h)', type: 'decimal' }, { titre: 'Statut', type: 'centre' },
        ],
        lignes: utilisateurs.map((u) => {
          const x = indicateurs(parResp.get(u.id_utilisateur) || []);
          return [nomComplet(u), u.poste ?? '', nomEquipe(u.id_equipe), x.attendues, x.realisees, x.taux, x.respect, x.retard, x.heures, num(u.capacite_hebdomadaire_heures), libelle(u.statut)];
        }),
      };
    }

    if (cle === 'equipes') {
      const parEquipe = grouper(tachesPeriode, 'id_equipe');
      const membres = grouper(utilisateurs, 'id_equipe');
      const projetsParEquipe = grouper(projets, 'id_equipe');
      return {
        onglet: 'Équipes',
        titre: 'PERFORMANCE PAR ÉQUIPE',
        colonnes: [
          { titre: 'Équipe' }, { titre: 'Statut', type: 'centre' }, { titre: 'Membres', type: 'entier' }, { titre: 'Projets', type: 'entier' },
          { titre: 'Tâches attendues', type: 'entier' }, { titre: 'Tâches réalisées', type: 'entier' },
          { titre: 'Taux de réalisation (%)', type: 'decimal' }, { titre: 'Respect des délais (%)', type: 'decimal' },
          { titre: 'En retard', type: 'entier' }, { titre: 'Heures estimées', type: 'decimal' },
        ],
        lignes: equipes.map((e) => {
          const x = indicateurs(parEquipe.get(e.id_equipe) || []);
          return [e.nom_equipe, libelle(e.statut), (membres.get(e.id_equipe) || []).length, (projetsParEquipe.get(e.id_equipe) || []).length, x.attendues, x.realisees, x.taux, x.respect, x.retard, x.heures];
        }),
      };
    }

    if (cle === 'projets') {
      const parProjet = grouper(taches, 'id_projet');
      const lignes = projets
        .filter((p) => {
          if (!borne || !p.date_debut) return true;
          const j = new Date(p.date_debut).toISOString().slice(0, 10);
          return (!debut || j >= debut) && (!fin || j <= fin);
        })
        .map((p) => {
          const r = resumeTaches(parProjet.get(p.id_projet) || []);
          return [
            p.code_projet, p.nom_projet, nomEquipe(p.id_equipe), nomComplet(utilisateurParId.get(p.id_chef_projet)),
            libelle(p.etat), libelle(p.priorite), r.total, r.terminees, r.total ? Math.round(r.taux) : 0, r.retard,
            formatDate(p.date_debut), formatDate(p.date_fin_prevue), p.date_fin_reelle ? formatDate(p.date_fin_reelle) : '',
          ];
        });
      return {
        onglet: 'Projets',
        titre: 'SUIVI DES PROJETS',
        colonnes: [
          { titre: 'Code', type: 'centre' }, { titre: 'Projet' }, { titre: 'Équipe' }, { titre: 'Chef de projet' },
          { titre: 'État', couleur: colorier }, { titre: 'Priorité', couleur: colorier },
          { titre: 'Tâches', type: 'entier' }, { titre: 'Terminées', type: 'entier' }, { titre: 'Avancement (%)', type: 'entier' }, { titre: 'Tâches en retard', type: 'entier' },
          { titre: 'Début', type: 'centre' }, { titre: 'Fin prévue', type: 'centre' }, { titre: 'Fin réelle', type: 'centre' },
        ],
        lignes,
      };
    }

    // tâches
    return {
      onglet: 'Tâches',
      titre: 'SUIVI DES TÂCHES',
      colonnes: [
        { titre: 'Tâche' }, { titre: 'Projet' }, { titre: 'Responsable' }, { titre: 'Équipe' },
        { titre: 'État', couleur: colorier }, { titre: 'Priorité', couleur: colorier },
        { titre: 'Heures estimées', type: 'decimal' }, { titre: 'Échéance', type: 'centre' }, { titre: 'Terminée le', type: 'centre' },
        { titre: 'En retard', type: 'centre', couleur: colorierRetard },
      ],
      lignes: tachesPeriode.map((t) => [
        t.titre, projetParId.get(t.id_projet)?.nom_projet ?? '', nomComplet(utilisateurParId.get(t.id_responsable)), nomEquipe(t.id_equipe),
        libelle(t.etat), libelle(t.priorite), arrondi1(num(t.temps_estime)), formatDate(t.date_limite),
        t.date_terminaison ? formatDateHeure(t.date_terminaison) : '', estEnRetard(t) ? 'Oui' : 'Non',
      ]),
    };
  };

  const basculer = (cle) => setChoix((c) => (c.includes(cle) ? c.filter((x) => x !== cle) : [...c, cle]));
  const toutSelectionner = () => setChoix(choix.length === Object.keys(JEUX).length ? [] : Object.keys(JEUX));

  const libellePeriode = (debut, fin) => (debut || fin ? `du ${debut ? formatDate(debut) : '…'} au ${fin ? formatDate(fin) : '…'}` : 'toute la période');

  // Génère et télécharge le fichier ; renvoie le nom du fichier, ou lance une erreur lisible.
  const produire = ({ cles, debut, fin, fmt }) => {
    if (debut && fin && fin < debut) throw new Error('La date de fin doit être après la date de début.');
    const feuilles = cles.map((cle) => ({ cle, ...construire(cle, debut, fin) }));
    if (!feuilles.some((f) => f.lignes.length)) throw new Error('Aucune donnée à exporter pour ces critères.');

    const nom = `rapport-${cles.length === 1 ? cles[0] : 'complet'}-${horodatage()}.${fmt === 'XLSX' ? 'xlsx' : fmt.toLowerCase()}`;
    const sousTitre = `Période : ${libellePeriode(debut, fin)}   |   Généré le ${formatDateHeure(new Date().toISOString())} par ${nomComplet(utilisateur)}`;
    const total = (f) => `Total : ${f.lignes.length} ligne(s)`;

    if (fmt === 'XLSX') {
      const octets = genererXlsx(feuilles.map((f) => ({ nom: f.onglet, titre: `${ENTREPRISE} - ${f.titre}`, sousTitre, colonnes: f.colonnes, lignes: f.lignes, total: total(f) })));
      telecharger(nom, octets, MIME_XLSX);
    } else if (fmt === 'PDF') {
      const octets = genererPdf({
        titre: feuilles.length === 1 ? `${ENTREPRISE} - ${feuilles[0].titre}` : `${ENTREPRISE} - Rapport`,
        sousTitre: sousTitre.replace(/ {3}\| {3}/, '   ·   '),
        sections: feuilles.map((f) => ({
          titre: f.titre,
          colonnes: f.colonnes.map((c) => c.titre),
          lignes: f.lignes.map((l) => l.map((v) => (typeof v === 'number' ? String(v).replace('.', ',') : v))),
        })),
      });
      telecharger(nom, octets, 'application/pdf');
    } else {
      const versCsv = (f) =>
        genererCsv(
          f.colonnes.map((c, i) => ({ titre: c.titre, valeur: (l) => (typeof l[i] === 'number' ? String(l[i]).replace('.', ',') : l[i]) })),
          f.lignes,
        );
      if (feuilles.length === 1) telecharger(nom, versCsv(feuilles[0]), 'text/csv;charset=utf-8');
      else {
        // Plusieurs types dans un seul CSV : un bloc par type, séparés par une ligne vide.
        const blocs = feuilles.map((f) => `${f.titre}\r\n${versCsv(f).replace('\uFEFF', '')}`);
        telecharger(nom, `\uFEFF${blocs.join('\r\n\r\n')}`, 'text/csv;charset=utf-8');
      }
    }
    return { nom, total: feuilles.reduce((n, f) => n + f.lignes.length, 0) };
  };

  const generer = async () => {
    setErreurForm('');
    if (!choix.length) return setErreurForm('Choisissez au moins un type de données.');
    const { debut, fin } = plageDe(periode, persoDebut, persoFin);
    if (periode === 'perso' && !debut && !fin) return setErreurForm('Indiquez au moins une date pour la période personnalisée.');
    setEnCours(true);
    try {
      const ordonnes = Object.keys(JEUX).filter((k) => choix.includes(k));
      const { nom, total } = produire({ cles: ordonnes, debut, fin, fmt: format });
      toast.succes(`Rapport ${format} généré (${total} ligne${total > 1 ? 's' : ''}).`);
      // Trace dans le backend (POST /rapports), une ligne par type. Non bloquant : le fichier est déjà téléchargé.
      // Pour Excel, on tente « XLSX » puis « EXCEL » (la table rapport limite les valeurs de format).
      const essais = format === 'XLSX' ? ['XLSX', 'EXCEL'] : [format];
      for (const cle of ordonnes) {
        for (const f of essais) {
          try {
            const dto = { id_utilisateur: utilisateur.id_utilisateur, type: cle.toUpperCase(), format: f, chemin_fichier: nom };
            if (debut) dto.periode_debut = debut;
            if (fin) dto.periode_fin = fin;
            await enregistrerRapport(dto);
            break;
          } catch {
            /* valeur refusée ou erreur : on essaie la suivante, sinon l'historique manquera pour ce type */
          }
        }
      }
      historique.reload();
    } catch (e) {
      setErreurForm(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const retelecharger = (r) => {
    const cle = String(r.type || '').toLowerCase();
    if (!JEUX[cle]) return toast.erreur('Ce type de rapport ne peut pas être régénéré.');
    try {
      produire({ cles: [cle], debut: r.periode_debut ? String(r.periode_debut).slice(0, 10) : '', fin: r.periode_fin ? String(r.periode_fin).slice(0, 10) : '', fmt: r.format === 'PDF' ? 'PDF' : r.format === 'XLSX' || r.format === 'EXCEL' ? 'XLSX' : 'CSV' });
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  const plage = plageDe(periode, persoDebut, persoFin);
  const formatLibelle = FORMATS.find((f) => f.id === format)?.titre;

  return (
    <>
      <PageHeader titre="Rapports et exports" sousTitre="Choisissez les données, la période et le format : le fichier est généré dans votre navigateur" />
      <Etats loading={chargement} error={erreur} vide={false}>
        <div className="pile">
          <div className="card">
            <div className="card-titre"><div><h2>Générer un rapport</h2><p>Trois choix, puis un clic.</p></div></div>
            {erreurForm && <div style={{ marginBottom: 14 }}><Alerte>{erreurForm}</Alerte></div>}

            <div className="rapport-etape">
              <div className="rapport-etape-titre">
                <span className="rapport-num">1</span> Données à inclure
                <button type="button" className="login-lien" style={{ marginLeft: 'auto' }} onClick={toutSelectionner}>{choix.length === Object.keys(JEUX).length ? 'Tout désélectionner' : 'Tout sélectionner'}</button>
              </div>
              <div className="choix-grille">
                {Object.entries(JEUX).map(([cle, jeu]) => {
                  const actif = choix.includes(cle);
                  return (
                    <button key={cle} type="button" role="checkbox" aria-checked={actif} className={`choix-carte ${actif ? 'actif' : ''}`} onClick={() => basculer(cle)}>
                      <span className="choix-icone"><Icon name={jeu.icone} size={20} /></span>
                      <span className="choix-texte"><strong>{jeu.label}</strong><small>{jeu.compte} enregistrement{jeu.compte > 1 ? 's' : ''}</small></span>
                      <span className="choix-coche">{actif && <Icon name="check" size={14} />}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rapport-etape">
              <div className="rapport-etape-titre"><span className="rapport-num">2</span> Période</div>
              <div className="segments">
                {PERIODES.map((p) => (
                  <button key={p.id} type="button" className={`segment ${periode === p.id ? 'actif' : ''}`} onClick={() => setPeriode(p.id)}>{p.label}</button>
                ))}
              </div>
              {periode === 'perso' && (
                <div className="grille-champs" style={{ marginTop: 12, maxWidth: 520 }}>
                  <label className="champ"><span className="champ-label">Du</span><input type="date" value={persoDebut} onChange={(e) => setPersoDebut(e.target.value)} /></label>
                  <label className="champ"><span className="champ-label">Au</span><input type="date" value={persoFin} onChange={(e) => setPersoFin(e.target.value)} /></label>
                </div>
              )}
              {periode !== 'tout' && periode !== 'perso' && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{libellePeriode(plage.debut, plage.fin)} (selon la date de début ou l'échéance).</p>}
            </div>

            <div className="rapport-etape">
              <div className="rapport-etape-titre"><span className="rapport-num">3</span> Format</div>
              <div className="choix-grille">
                {FORMATS.map((f) => (
                  <button key={f.id} type="button" role="radio" aria-checked={format === f.id} className={`choix-carte ${format === f.id ? 'actif' : ''}`} onClick={() => setFormat(f.id)}>
                    <span className="choix-icone"><Icon name={f.icone} size={20} /></span>
                    <span className="choix-texte"><strong>{f.titre}</strong><small>{f.texte}</small></span>
                    <span className="choix-radio" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rapport-pied">
              <Bouton icone="download" enCours={enCours} onClick={generer} disabled={!choix.length}>Générer le rapport</Bouton>
              <span className="muted" style={{ fontSize: 13 }}>
                {choix.length ? `${choix.map((c) => JEUX[c].label).join(', ')} · ${formatLibelle} · ${PERIODES.find((p) => p.id === periode)?.label}` : 'Aucune donnée sélectionnée'}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-titre"><h2>Historique des rapports</h2></div>
            <Etats loading={historique.loading} error={historique.error} onRetry={historique.reload} vide={!historique.data?.length} videProps={{ titre: 'Aucun rapport généré pour le moment' }}>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>Type</th><th>Format</th><th>Période</th><th>Fichier</th><th>Action</th></tr></thead>
                  <tbody>
                    {historique.data?.map((r) => (
                      <tr key={r.id_rapport}>
                        <td data-label="Date">{formatDateHeure(r.date_generation)}</td>
                        <td data-label="Type">{libelle(r.type)}</td>
                        <td data-label="Format"><Badge ton={r.format === 'PDF' ? 'danger' : r.format === 'CSV' ? 'info' : 'success'}>{r.format === 'XLSX' || r.format === 'EXCEL' ? 'Excel' : r.format}</Badge></td>
                        <td data-label="Période">{r.periode_debut || r.periode_fin ? `${formatDate(r.periode_debut)} – ${formatDate(r.periode_fin)}` : 'Toute la période'}</td>
                        <td data-label="Fichier">{r.chemin_fichier || '—'}</td>
                        <td data-label="Action">
                          <button type="button" className="icon-btn" onClick={() => retelecharger(r)} aria-label="Télécharger à nouveau" title="Télécharger à nouveau"><Icon name="download" size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Etats>
          </div>
        </div>
      </Etats>
    </>
  );
}
