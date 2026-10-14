import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Anneau, BarresHorizontales, COULEURS, Courbe } from '../components/Charts.jsx';
import PeriodeBarre from '../components/PeriodeBarre.jsx';
import { Alerte, Avatar, CarteKpi, Chargement, EtatVide, PageHeader } from '../components/ui.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { usePeriode } from '../hooks/usePeriode.js';
import { depuis, libelle, nomComplet, formatPourcent, parseDate } from '../utils/format.js';
import { couleurValeur } from '../utils/couleurs.js';
import { compter, estEnRetard, estTerminee, evolutionAnnuelle, projetActif, resumeTaches, tachesDeLaPeriode } from '../utils/stats.js';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function Dashboard() {
  const { projets, taches, utilisateurs, equipes, utilisateurParId, equipeParId, chargement, erreur, recharger } = useDonnees();
  const periode = usePeriode('mois');

  const calc = useMemo(() => {
    const dansPeriode = tachesDeLaPeriode(taches, periode.plage);
    const resume = resumeTaches(dansPeriode);
    const parEtat = Object.entries(compter(dansPeriode, 'etat')).map(([k, v], i) => ({ label: libelle(k), valeur: v, couleur: couleurValeur(k) || COULEURS[(i + 3) % COULEURS.length] }));
    const parPriorite = Object.entries(compter(dansPeriode, 'priorite')).map(([k, v]) => ({ label: libelle(k), valeur: dansPeriode.length ? (v / dansPeriode.length) * 100 : 0, detail: `${v} tâche${v > 1 ? 's' : ''}`, couleur: couleurValeur(k) || undefined }));
    const parEtatProjet = Object.entries(compter(projets, 'etat')).map(([k, v], i) => ({ label: libelle(k), valeur: v, couleur: couleurValeur(k) || COULEURS[i % COULEURS.length] }));
    const parEquipe = equipes
      .map((e) => {
        const r = resumeTaches(dansPeriode.filter((t) => t.id_equipe === e.id_equipe));
        return { label: e.nom_equipe, valeur: r.taux, detail: r.total ? `${r.terminees}/${r.total} tâches · ${Math.round(r.taux)} %` : 'Aucune tâche' };
      })
      .filter((e) => e.detail !== 'Aucune tâche')
      .sort((a, b) => b.valeur - a.valeur)
      .slice(0, 6);
    const annee = periode.reference.getFullYear();
    const evolution = evolutionAnnuelle(taches, annee);
    const courbe = evolution.map((m) => ({ label: MOIS[m.mois], valeur: m.taux, detail: m.total ? `${m.terminees} terminée${m.terminees > 1 ? 's' : ''} sur ${m.total}` : undefined }));
    const mesures = evolution.filter((m) => m.total > 0);
    const dernierMois = mesures[mesures.length - 1];
    const meilleurMois = mesures.reduce((a, m) => (!a || m.taux > a.taux ? m : a), null);
    const moyenneCourbe = mesures.length ? mesures.reduce((somme, m) => somme + m.taux, 0) / mesures.length : null;
    const resumeCourbe = { dernier: dernierMois && { label: MOIS[dernierMois.mois], taux: dernierMois.taux }, meilleur: meilleurMois && { label: MOIS[meilleurMois.mois], taux: meilleurMois.taux }, moyenne: moyenneCourbe };

    // Fil d'activités déduit des dates réelles des projets et tâches
    const evenements = [];
    projets.forEach((p) => evenements.push({ id: `p${p.id_projet}`, quand: p.date_creation, titre: 'Projet créé', detail: p.nom_projet, qui: utilisateurParId.get(p.id_chef_projet), lien: `/projets/${p.id_projet}` }));
    taches.forEach((t) => {
      evenements.push({ id: `t${t.id_tache}`, quand: t.date_creation, titre: 'Tâche créée', detail: t.titre, qui: utilisateurParId.get(t.id_responsable), lien: `/taches/${t.id_tache}` });
      if (t.date_terminaison) evenements.push({ id: `f${t.id_tache}`, quand: t.date_terminaison, titre: 'Tâche terminée', detail: t.titre, qui: utilisateurParId.get(t.id_responsable), lien: `/taches/${t.id_tache}` });
    });
    evenements.sort((a, b) => (parseDate(b.quand)?.getTime() || 0) - (parseDate(a.quand)?.getTime() || 0));

    return {
      resume,
      parEtat,
      parPriorite,
      parEtatProjet,
      parEquipe,
      courbe,
      resumeCourbe,
      annee,
      evenements: evenements.slice(0, 8),
      projetsActifs: projets.filter(projetActif).length,
      collabsActifs: utilisateurs.filter((u) => u.statut === 'ACTIF').length,
      equipesActives: equipes.filter((e) => e.statut === 'ACTIVE').length,
    };
  }, [taches, projets, equipes, utilisateurs, periode.plage, periode.reference, utilisateurParId]);

  if (chargement) return <Chargement texte="Chargement du tableau de bord…" />;
  if (erreur) return <Alerte onRetry={recharger}>{erreur}</Alerte>;

  const { resume } = calc;

  return (
    <>
      <PageHeader titre="Tableau de bord" sousTitre="Vue d'ensemble de la performance de vos équipes et projets" actions={<PeriodeBarre periode={periode} />} />

      <div className="grille grille-kpi" style={{ marginBottom: 16 }}>
        <CarteKpi titre="Projets actifs" valeur={calc.projetsActifs} icone="projet" detail={`${projets.length} projet${projets.length > 1 ? 's' : ''} au total`} />
        <CarteKpi titre="Tâches réalisées" valeur={resume.terminees} icone="check-circle" ton="success" detail={`sur ${resume.total} sur la période`} />
        <CarteKpi titre="Taux de réalisation" valeur={formatPourcent(resume.taux)} icone="target" ton="success" detail="tâches terminées / tâches de la période" />
        <CarteKpi titre="Tâches en retard" valeur={resume.retard} icone="alert" ton={resume.retard ? 'danger' : 'success'} detail="échéance dépassée, non terminées" />
        <CarteKpi titre="Collaborateurs" valeur={calc.collabsActifs} icone="user" detail={`${utilisateurs.length} au total`} />
        <CarteKpi titre="Équipes" valeur={calc.equipesActives} icone="equipes" detail={`${equipes.length} au total`} />
      </div>

      {taches.length === 0 && projets.length === 0 ? (
        <div className="card">
          <EtatVide titre="Aucune donnée pour le moment" texte="Créez un projet puis des tâches pour alimenter le tableau de bord." action={<Link to="/projets" className="btn btn-primary">Aller aux projets</Link>} />
        </div>
      ) : (
        <div className="pile">
          <div className="grille grille-dash">
            <div className="card">
              <div className="card-titre">
                <div>
                  <h2>Répartition des tâches</h2>
                  <p>État du portefeuille de la période</p>
                </div>
              </div>
              {calc.parEtat.length ? <Anneau donnees={calc.parEtat} centre={resume.total} sousCentre="Total" /> : <p className="muted">Aucune tâche sur cette période.</p>}
            </div>

            <div className="card">
              <div className="card-titre">
                <div>
                  <h2>Évolution des performances</h2>
                  <p>Taux de réalisation par mois — {calc.annee}</p>
                </div>
              </div>
              <div className="resume-courbe">
                <div className="resume-puce">
                  <span>Dernier mois</span>
                  <strong>{calc.resumeCourbe.dernier ? `${Math.round(calc.resumeCourbe.dernier.taux)} %` : '—'}</strong>
                  <small>{calc.resumeCourbe.dernier?.label || 'Aucune donnée'}</small>
                </div>
                <div className="resume-puce">
                  <span>Moyenne</span>
                  <strong>{calc.resumeCourbe.moyenne !== null ? `${Math.round(calc.resumeCourbe.moyenne)} %` : '—'}</strong>
                  <small>sur les mois avec tâches</small>
                </div>
                <div className="resume-puce">
                  <span>Meilleur mois</span>
                  <strong>{calc.resumeCourbe.meilleur ? `${Math.round(calc.resumeCourbe.meilleur.taux)} %` : '—'}</strong>
                  <small>{calc.resumeCourbe.meilleur?.label || 'Aucune donnée'}</small>
                </div>
              </div>
              <Courbe points={calc.courbe} />
            </div>
          </div>

          <div className="grille grille-3">
            <div className="card">
              <div className="card-titre"><div><h2>Tâches par priorité</h2><p>Période sélectionnée</p></div></div>
              {calc.parPriorite.length ? <BarresHorizontales donnees={calc.parPriorite} /> : <p className="muted">Aucune tâche.</p>}
            </div>
            <div className="card">
              <div className="card-titre"><div><h2>Projets par état</h2><p>Tous les projets</p></div></div>
              {calc.parEtatProjet.length ? <Anneau donnees={calc.parEtatProjet} centre={projets.length} sousCentre="Projets" taille={140} /> : <p className="muted">Aucun projet.</p>}
            </div>
            <div className="card">
              <div className="card-titre"><div><h2>Performance des équipes</h2><p>Taux de réalisation sur la période</p></div></div>
              {calc.parEquipe.length ? <BarresHorizontales donnees={calc.parEquipe} /> : <p className="muted">Aucune tâche affectée aux équipes sur cette période.</p>}
            </div>
          </div>
          <div className="card">
            <div className="card-titre">
              <div>
                <h2>Activités récentes</h2>
                <p>Créations et clôtures de projets et tâches</p>
              </div>
            </div>
            {calc.evenements.length === 0 ? (
              <p className="muted">Aucune activité.</p>
            ) : (
              <ul className="fil fil-2col">
                {calc.evenements.map((e) => (
                  <li key={e.id}>
                    <Avatar utilisateur={e.qui} taille={32} />
                    <div className="fil-texte">
                      <div className="fil-titre">{e.titre}</div>
                      <div className="fil-detail">
                        <Link to={e.lien}>{e.detail}</Link>
                        {e.qui && ` · ${nomComplet(e.qui)}`}
                      </div>
                    </div>
                    <span className="fil-quand">{depuis(e.quand)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Une tâche appartient à une période si son échéance (à défaut sa date de création) ou sa date de clôture tombe dans cette période. Les indicateurs sont calculés à partir des données du backend.
          </p>
        </div>
      )}
    </>
  );
}
