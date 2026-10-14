import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Anneau } from '../components/Charts.jsx';
import PeriodeBarre from '../components/PeriodeBarre.jsx';
import { Alerte, Badge, CarteKpi, Chargement, EtatVide, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useActivites } from '../hooks/useActivites.js';
import { usePeriode } from '../hooks/usePeriode.js';
import { formatDate, formatHeures, formatPourcent, libelle, num, parseDate } from '../utils/format.js';
import { compter, estEnRetard, resumeTaches, tachesDeLaPeriode } from '../utils/stats.js';

export default function MaPerformance() {
  const { utilisateur } = useAuth();
  const { taches, projetParId, chargement, erreur, recharger } = useDonnees();
  const periode = usePeriode('mois');

  const mesTaches = useMemo(() => taches.filter((t) => t.id_responsable === utilisateur.id_utilisateur), [taches, utilisateur.id_utilisateur]);
  const act = useActivites(mesTaches);

  const calc = useMemo(() => {
    const dansPeriode = tachesDeLaPeriode(mesTaches, periode.plage);
    const r = resumeTaches(dansPeriode);
    const heures = act.activites
      .filter((a) => a.id_utilisateur === utilisateur.id_utilisateur)
      .filter((a) => {
        const d = parseDate(a.date_activite);
        return d && d >= periode.plage.debut && d <= periode.plage.fin;
      })
      .reduce((s, a) => s + num(a.temps_passe), 0);
    const parEtat = Object.entries(compter(dansPeriode, 'etat')).map(([k, v]) => ({ label: libelle(k), valeur: v }));
    const aSuivre = mesTaches.filter((t) => t.etat !== 'TERMINE').sort((a, b) => (parseDate(a.date_limite)?.getTime() ?? Infinity) - (parseDate(b.date_limite)?.getTime() ?? Infinity)).slice(0, 6);
    return { ...r, heures, parEtat, aSuivre };
  }, [mesTaches, act.activites, periode.plage, utilisateur.id_utilisateur]);

  if (chargement) return <Chargement />;
  if (erreur) return <Alerte onRetry={recharger}>{erreur}</Alerte>;

  const capacite = num(utilisateur.capacite_hebdomadaire_heures);

  return (
    <>
      <PageHeader titre="Ma performance" sousTitre="Vos tâches, votre temps et vos résultats" actions={<PeriodeBarre periode={periode} />} />
      {mesTaches.length === 0 ? (
        <div className="card"><EtatVide titre="Aucune tâche ne vous est assignée" texte="Vos indicateurs apparaîtront dès qu'une tâche vous sera confiée." /></div>
      ) : (
        <div className="pile">
          <div className="grille grille-kpi">
            <CarteKpi titre="Mes tâches" valeur={calc.total} icone="taches" detail="sur la période" />
            <CarteKpi titre="Terminées" valeur={calc.terminees} icone="check-circle" ton="success" />
            <CarteKpi titre="Taux de réalisation" valeur={formatPourcent(calc.taux)} icone="target" ton="success" />
            <CarteKpi titre="En retard" valeur={calc.retard} icone="alert" ton={calc.retard ? 'danger' : 'success'} />
            <CarteKpi titre="Heures imputées" valeur={act.loading ? '…' : formatHeures(calc.heures)} icone="temps" detail={`capacité hebdomadaire : ${formatHeures(capacite)}`} />
          </div>
          {act.error && <Alerte type="warning">{act.error}</Alerte>}
          <div className="grille grille-2">
            <div className="card">
              <div className="card-titre"><div><h2>Répartition de mes tâches</h2><p>Période sélectionnée</p></div></div>
              {calc.parEtat.length ? <Anneau donnees={calc.parEtat} centre={calc.total} sousCentre="Total" /> : <p className="muted">Aucune tâche sur cette période.</p>}
            </div>
            <div className="card">
              <div className="card-titre"><div><h2>À traiter en priorité</h2><p>Tâches non terminées, par échéance</p></div><Link to="/taches?mes=1">Tout voir</Link></div>
              {calc.aSuivre.length === 0 ? <p className="muted">Toutes vos tâches sont terminées.</p> : (
                <ul className="fil">
                  {calc.aSuivre.map((t) => (
                    <li key={t.id_tache}>
                      <div className="fil-texte">
                        <div className="fil-titre"><Link to={`/taches/${t.id_tache}`}>{t.titre}</Link></div>
                        <div className="fil-detail">{projetParId.get(t.id_projet)?.nom_projet} · échéance {formatDate(t.date_limite)}</div>
                      </div>
                      {estEnRetard(t) ? <Badge ton="danger">Retard</Badge> : <Badge valeur={t.etat} />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
