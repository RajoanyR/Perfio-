import { useMemo } from 'react';
import { BarresHorizontales, Courbe } from '../components/Charts.jsx';
import PeriodeBarre from '../components/PeriodeBarre.jsx';
import { Alerte, CarteKpi, Chargement, EtatVide, PageHeader } from '../components/ui.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useActivites } from '../hooks/useActivites.js';
import { usePeriode } from '../hooks/usePeriode.js';
import { formatHeures, formatPourcent, nomComplet, num, parseDate } from '../utils/format.js';
import { estTerminee, evolutionAnnuelle, resumeTaches, tachesDeLaPeriode } from '../utils/stats.js';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function AnalyseKpi() {
  const { taches, equipes, utilisateurs, chargement, erreur, recharger } = useDonnees();
  const periode = usePeriode('trimestre');

  const dansPeriode = useMemo(() => tachesDeLaPeriode(taches, periode.plage), [taches, periode.plage]);
  const act = useActivites(dansPeriode);

  const calc = useMemo(() => {
    const r = resumeTaches(dansPeriode);
    // Respect des délais : tâches terminées ayant une échéance, clôturées au plus tard le jour de l'échéance
    const avecEcheance = dansPeriode.filter((t) => estTerminee(t) && t.date_limite && t.date_terminaison);
    const dansLesTemps = avecEcheance.filter((t) => parseDate(t.date_terminaison) < new Date(parseDate(t.date_limite).getTime() + 86400000)).length;
    const respect = avecEcheance.length ? (dansLesTemps / avecEcheance.length) * 100 : null;
    const passe = act.activites.reduce((s, a) => s + num(a.temps_passe), 0);
    const parEquipe = equipes.map((e) => {
      const x = resumeTaches(dansPeriode.filter((t) => t.id_equipe === e.id_equipe));
      return { label: e.nom_equipe, valeur: x.taux, total: x.total, detail: `${x.terminees}/${x.total} · ${Math.round(x.taux)} %` };
    }).filter((e) => e.total > 0).sort((a, b) => b.valeur - a.valeur);
    const parCollab = utilisateurs.map((u) => {
      const x = resumeTaches(dansPeriode.filter((t) => t.id_responsable === u.id_utilisateur));
      return { label: nomComplet(u), valeur: x.taux, total: x.total, detail: `${x.terminees}/${x.total} · ${Math.round(x.taux)} %` };
    }).filter((e) => e.total > 0).sort((a, b) => b.valeur - a.valeur).slice(0, 8);
    const courbe = evolutionAnnuelle(taches, periode.reference.getFullYear()).map((m) => ({ label: MOIS[m.mois], valeur: m.taux }));
    const tauxRetard = r.total ? (r.retard / r.total) * 100 : 0;
    return { r, respect, passe, parEquipe, parCollab, courbe, tauxRetard };
  }, [dansPeriode, act.activites, equipes, utilisateurs, taches, periode.reference]);

  if (chargement) return <Chargement />;
  if (erreur) return <Alerte onRetry={recharger}>{erreur}</Alerte>;

  const ecart = calc.r.estime ? ((calc.passe - calc.r.estime) / calc.r.estime) * 100 : null;

  return (
    <>
      <PageHeader titre="Analyse KPI" sousTitre="Indicateurs calculés à partir des tâches et des temps imputés" actions={<PeriodeBarre periode={periode} />} />
      {dansPeriode.length === 0 ? (
        <div className="card"><EtatVide titre="Aucune tâche sur cette période" texte="Choisissez une autre période pour afficher les indicateurs." /></div>
      ) : (
        <div className="pile">
          <div className="grille grille-kpi">
            <CarteKpi titre="Taux de réalisation" valeur={formatPourcent(calc.r.taux)} icone="target" ton="success" detail={`${calc.r.terminees} terminée(s) sur ${calc.r.total}`} />
            <CarteKpi titre="Respect des délais" valeur={calc.respect === null ? '—' : formatPourcent(calc.respect)} icone="calendar" ton="info" detail="tâches terminées dans les temps" />
            <CarteKpi titre="Taux de retard" valeur={formatPourcent(calc.tauxRetard)} icone="alert" ton={calc.r.retard ? 'danger' : 'success'} detail={`${calc.r.retard} tâche(s) en retard`} />
            <CarteKpi titre="Temps estimé" valeur={formatHeures(calc.r.estime)} icone="temps" />
            <CarteKpi titre="Temps imputé" valeur={act.loading ? '…' : formatHeures(calc.passe)} icone="temps" ton="warning" detail={ecart === null || act.loading ? undefined : `${ecart > 0 ? '+' : ''}${Math.round(ecart)} % vs estimé`} />
          </div>
          {act.error && <Alerte type="warning">{act.error}</Alerte>}
          <div className="card">
            <div className="card-titre"><div><h2>Évolution du taux de réalisation</h2><p>Par mois — année {periode.reference.getFullYear()}</p></div></div>
            <Courbe points={calc.courbe} />
          </div>
          <div className="grille grille-2">
            <div className="card">
              <div className="card-titre"><div><h2>Performance des équipes</h2><p>Terminées / tâches de la période</p></div></div>
              {calc.parEquipe.length ? <BarresHorizontales donnees={calc.parEquipe} /> : <p className="muted">Aucune donnée.</p>}
            </div>
            <div className="card">
              <div className="card-titre"><div><h2>Performance des collaborateurs</h2><p>Top 8 selon le taux de réalisation</p></div></div>
              {calc.parCollab.length ? <BarresHorizontales donnees={calc.parCollab} /> : <p className="muted">Aucune donnée.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
