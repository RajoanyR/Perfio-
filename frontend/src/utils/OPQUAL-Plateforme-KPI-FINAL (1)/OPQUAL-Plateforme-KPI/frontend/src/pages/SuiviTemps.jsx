import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Anneau, Barres } from '../components/Charts.jsx';
import { Alerte, CarteKpi, Chargement, EtatVide, PageHeader } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useActivites } from '../hooks/useActivites.js';
import { formatDateHeure, formatHeures, nomComplet, num, parseDate } from '../utils/format.js';
import { parJourISO, plageDePeriode } from '../utils/stats.js';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function SuiviTemps() {
  const { utilisateur, droits } = useAuth();
  const { taches, utilisateurs, projetParId, chargement, erreur, recharger } = useDonnees();
  const [ref, setRef] = useState(new Date());
  const [qui, setQui] = useState(utilisateur.id_utilisateur);
  const act = useActivites(taches);

  const plage = plageDePeriode('semaine', ref);
  const cible = utilisateurs.find((u) => u.id_utilisateur === Number(qui)) || utilisateur;

  const calc = useMemo(() => {
    const semaine = act.activites.filter((a) => {
      const d = parseDate(a.date_activite);
      return a.id_utilisateur === Number(qui) && d && d >= plage.debut && d <= plage.fin;
    });
    const total = semaine.reduce((s, a) => s + num(a.temps_passe), 0);
    const jours = JOURS.map((label, i) => {
      const d = new Date(plage.debut);
      d.setDate(d.getDate() + i);
      const iso = parJourISO(d);
      return { label: `${label} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, valeur: semaine.filter((a) => parJourISO(a.date_activite) === iso).reduce((s, a) => s + num(a.temps_passe), 0) };
    });
    const parProjet = {};
    semaine.forEach((a) => {
      const nom = projetParId.get(a.tache.id_projet)?.nom_projet ?? 'Projet inconnu';
      parProjet[nom] = (parProjet[nom] || 0) + num(a.temps_passe);
    });
    return { semaine: semaine.sort((a, b) => new Date(b.date_activite) - new Date(a.date_activite)), total, jours, parProjet: Object.entries(parProjet).map(([label, valeur]) => ({ label, valeur: Math.round(valeur * 10) / 10 })), nbTaches: new Set(semaine.map((a) => a.id_tache)).size };
  }, [act.activites, qui, plage.debut.getTime(), plage.fin.getTime(), projetParId]);

  if (chargement) return <Chargement />;
  if (erreur) return <Alerte onRetry={recharger}>{erreur}</Alerte>;

  const capacite = num(cible.capacite_hebdomadaire_heures);
  const taux = capacite ? (calc.total / capacite) * 100 : 0;
  const decaler = (n) => { const d = new Date(ref); d.setDate(d.getDate() + 7 * n); setRef(d); };

  return (
    <>
      <PageHeader
        titre="Suivi du temps"
        sousTitre={`Feuille de temps du ${plage.debut.toLocaleDateString('fr-FR')} au ${plage.fin.toLocaleDateString('fr-FR')}`}
        actions={
          <>
            {droits.peutGerer && (
              <select value={qui} onChange={(e) => setQui(e.target.value)} aria-label="Collaborateur" style={{ width: 'auto' }}>
                {utilisateurs.map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{nomComplet(u)}</option>)}
              </select>
            )}
            <button type="button" className="icon-btn" onClick={() => decaler(-1)} aria-label="Semaine précédente"><Icon name="chevron-left" /></button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRef(new Date())}>Cette semaine</button>
            <button type="button" className="icon-btn" onClick={() => decaler(1)} aria-label="Semaine suivante"><Icon name="chevron-right" /></button>
          </>
        }
      />
      {act.loading ? <Chargement texte="Chargement des temps imputés…" /> : (
        <div className="pile">
          {act.error && <Alerte onRetry={act.reload}>{act.error}</Alerte>}
          <div className="grille grille-kpi">
            <CarteKpi titre="Heures imputées" valeur={formatHeures(calc.total)} icone="temps" detail={`capacité hebdomadaire : ${formatHeures(capacite)}`} />
            <CarteKpi titre="Taux d'occupation" valeur={`${taux.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`} icone="target" ton={taux > 100 ? 'warning' : 'success'} />
            <CarteKpi titre="Tâches imputées" valeur={calc.nbTaches} icone="taches" />
          </div>
          {calc.semaine.length === 0 ? (
            <div className="card"><EtatVide titre="Aucun temps imputé cette semaine" texte="Imputez du temps depuis l'onglet « Activités » d'une tâche." action={<Link to="/taches" className="btn btn-primary">Voir les tâches</Link>} /></div>
          ) : (
            <>
              <div className="grille grille-2">
                <div className="card"><div className="card-titre"><div><h2>Répartition des heures par jour</h2></div></div><Barres donnees={calc.jours} unite=" h" /></div>
                <div className="card"><div className="card-titre"><div><h2>Par projet</h2></div></div><Anneau donnees={calc.parProjet} centre={formatHeures(calc.total)} sousCentre="Total" /></div>
              </div>
              <div className="card">
                <div className="card-titre"><h2>Détail des imputations</h2></div>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Projet</th><th>Tâche</th><th>Description</th><th>Durée</th></tr></thead>
                    <tbody>
                      {calc.semaine.map((a) => (
                        <tr key={a.id_activite}>
                          <td data-label="Date">{formatDateHeure(a.date_activite)}</td>
                          <td data-label="Projet">{projetParId.get(a.tache.id_projet)?.nom_projet ?? '—'}</td>
                          <td data-label="Tâche"><Link to={`/taches/${a.tache.id_tache}`}>{a.tache.titre}</Link></td>
                          <td data-label="Description">{a.description || '—'}</td>
                          <td data-label="Durée" className="cellule-principale">{formatHeures(a.temps_passe)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          <p className="muted" style={{ fontSize: 12 }}>Les temps sont lus tâche par tâche (le backend n'a pas de point d'accès global aux activités).</p>
        </div>
      )}
    </>
  );
}
