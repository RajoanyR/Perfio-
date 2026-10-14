import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarreRecherche, Badge, Bouton, Etats, PageHeader, Progression, Tableau } from '../components/ui.jsx';
import ProjetModal from '../components/ProjetModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useTableau } from '../hooks/useTableau.js';
import { PRIORITES, PROJET_ETATS } from '../config/valeurs.js';
import { formatDate, libelle, nomComplet, optionsAvec } from '../utils/format.js';
import { progressionProjet } from '../utils/stats.js';

export default function Projets() {
  const { projets, taches, equipeParId, utilisateurParId, chargement, erreur, recharger } = useDonnees();
  const { droits } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [etat, setEtat] = useState('');
  const [priorite, setPriorite] = useState('');
  const [modale, setModale] = useState(false);

  const lignes = useMemo(
    () =>
      projets
        .map((p) => ({ ...p, ...progressionProjet(p, taches), equipe: equipeParId.get(p.id_equipe), chef: utilisateurParId.get(p.id_chef_projet) }))
        .filter((p) => (!etat || p.etat === etat) && (!priorite || p.priorite === priorite))
        .filter((p) => {
          const t = q.trim().toLowerCase();
          return !t || [p.nom_projet, p.code_projet, p.equipe?.nom_equipe, nomComplet(p.chef)].some((x) => String(x || '').toLowerCase().includes(t));
        }),
    [projets, taches, equipeParId, utilisateurParId, q, etat, priorite],
  );
  const tableau = useTableau(lignes, { parPage: 10 });

  const colonnes = [
    { cle: 'nom', titre: 'Projet', tri: (p) => p.nom_projet, rendu: (p) => (<><div className="cellule-principale">{p.nom_projet}</div><div className="cellule-secondaire">{p.code_projet}</div></>) },
    { cle: 'etat', titre: 'État', tri: (p) => p.etat, rendu: (p) => <Badge valeur={p.etat} /> },
    { cle: 'priorite', titre: 'Priorité', tri: (p) => p.priorite, rendu: (p) => <Badge valeur={p.priorite} /> },
    { cle: 'chef', titre: 'Responsable', tri: (p) => nomComplet(p.chef), valeur: (p) => nomComplet(p.chef) },
    { cle: 'equipe', titre: 'Équipe', tri: (p) => p.equipe?.nom_equipe, valeur: (p) => p.equipe?.nom_equipe ?? '—' },
    { cle: 'prog', titre: 'Progression', tri: (p) => p.progression, rendu: (p) => (<div style={{ minWidth: 110 }}><Progression valeur={p.progression} /><div className="cellule-secondaire">{p.progression} % · {p.terminees}/{p.total} tâches</div></div>) },
    { cle: 'retard', titre: 'Retards', tri: (p) => p.retard, rendu: (p) => (p.retard ? <Badge ton="danger">{p.retard}</Badge> : <span className="muted">0</span>) },
    { cle: 'fin', titre: 'Fin prévue', tri: (p) => p.date_fin_prevue, valeur: (p) => formatDate(p.date_fin_prevue) },
  ];

  return (
    <>
      <PageHeader
        titre="Projets"
        sousTitre="Suivez l'avancement de vos projets"
        actions={droits.peutGerer && <Bouton icone="plus" onClick={() => setModale(true)}>Nouveau projet</Bouton>}
      />
      <div className="card">
        <div className="barre-filtres">
          <BarreRecherche valeur={q} onChange={(v) => { setQ(v); tableau.setPage(1); }} placeholder="Rechercher un projet, un code, une équipe…" />
          <select value={etat} onChange={(e) => { setEtat(e.target.value); tableau.setPage(1); }} aria-label="Filtrer par état">
            <option value="">Tous les états</option>
            {optionsAvec(PROJET_ETATS, projets, 'etat').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
          <select value={priorite} onChange={(e) => { setPriorite(e.target.value); tableau.setPage(1); }} aria-label="Filtrer par priorité">
            <option value="">Toutes les priorités</option>
            {optionsAvec(PRIORITES, projets, 'priorite').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
        </div>
        <Etats loading={chargement} error={erreur} onRetry={recharger} vide={false}>
          <Tableau
            colonnes={colonnes}
            tableau={tableau}
            cle={(p) => p.id_projet}
            onLigne={(p) => navigate(`/projets/${p.id_projet}`)}
            vide={<div className="state"><h3>{projets.length ? 'Aucun résultat' : 'Aucun projet'}</h3><p>{projets.length ? 'Modifiez votre recherche ou vos filtres.' : 'Créez votre premier projet pour commencer.'}</p></div>}
          />
        </Etats>
      </div>
      {modale && <ProjetModal onClose={() => setModale(false)} onSaved={(p) => { setModale(false); recharger(); navigate(`/projets/${p.id_projet}`); }} />}
    </>
  );
}
