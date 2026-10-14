import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarreRecherche, Badge, Bouton, Etats, PageHeader, Tableau } from '../components/ui.jsx';
import TacheModal from '../components/TacheModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useTableau } from '../hooks/useTableau.js';
import { PRIORITES, TACHE_ETATS } from '../config/valeurs.js';
import { formatDate, formatHeures, libelle, nomComplet, num, optionsAvec } from '../utils/format.js';
import { estEnRetard } from '../utils/stats.js';

export default function Taches() {
  const { taches, projets, utilisateurs, projetParId, utilisateurParId, chargement, erreur, recharger } = useDonnees();
  const { droits, utilisateur } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [etat, setEtat] = useState('');
  const [priorite, setPriorite] = useState('');
  const [projet, setProjet] = useState(params.get('projet') || '');
  const [resp, setResp] = useState(params.get('mes') ? String(utilisateur.id_utilisateur) : '');
  const [retard, setRetard] = useState(false);
  const [modale, setModale] = useState(false);

  const lignes = useMemo(() => {
    const t = q.trim().toLowerCase();
    return taches
      .filter((x) => (!etat || x.etat === etat) && (!priorite || x.priorite === priorite) && (!projet || String(x.id_projet) === projet) && (!resp || String(x.id_responsable) === resp))
      .filter((x) => !retard || estEnRetard(x))
      .filter((x) => !t || [x.titre, projetParId.get(x.id_projet)?.nom_projet, nomComplet(utilisateurParId.get(x.id_responsable))].some((s) => String(s || '').toLowerCase().includes(t)));
  }, [taches, q, etat, priorite, projet, resp, retard, projetParId, utilisateurParId]);
  const tableau = useTableau(lignes, { parPage: 10 });
  const filtre = (setter) => (e) => { setter(e.target.value); tableau.setPage(1); };

  const colonnes = [
    { cle: 'titre', titre: 'Tâche', tri: (t) => t.titre, rendu: (t) => (<><div className="cellule-principale">{t.titre}</div><div className="cellule-secondaire">{projetParId.get(t.id_projet)?.nom_projet ?? '—'}</div></>) },
    { cle: 'etat', titre: 'État', tri: (t) => t.etat, rendu: (t) => <Badge valeur={t.etat} /> },
    { cle: 'priorite', titre: 'Priorité', tri: (t) => t.priorite, rendu: (t) => <Badge valeur={t.priorite} /> },
    { cle: 'resp', titre: 'Responsable', tri: (t) => nomComplet(utilisateurParId.get(t.id_responsable)), valeur: (t) => nomComplet(utilisateurParId.get(t.id_responsable)) },
    { cle: 'limite', titre: 'Échéance', tri: (t) => t.date_limite, rendu: (t) => (<>{formatDate(t.date_limite)} {estEnRetard(t) && <Badge ton="danger">Retard</Badge>}</>) },
    { cle: 'estime', titre: 'Estimé', tri: (t) => num(t.temps_estime), valeur: (t) => formatHeures(t.temps_estime) },
  ];

  return (
    <>
      <PageHeader titre="Tâches" sousTitre="Gérez et suivez les tâches de vos projets" actions={droits.peutGerer && <Bouton icone="plus" onClick={() => setModale(true)}>Nouvelle tâche</Bouton>} />
      <div className="card">
        <div className="barre-filtres">
          <BarreRecherche valeur={q} onChange={(v) => { setQ(v); tableau.setPage(1); }} placeholder="Rechercher une tâche, un projet, un responsable…" />
          <select value={etat} onChange={filtre(setEtat)} aria-label="Filtrer par état">
            <option value="">Tous les états</option>
            {optionsAvec(TACHE_ETATS, taches, 'etat').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
          <select value={priorite} onChange={filtre(setPriorite)} aria-label="Filtrer par priorité">
            <option value="">Toutes les priorités</option>
            {optionsAvec(PRIORITES, taches, 'priorite').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
          <select value={projet} onChange={filtre(setProjet)} aria-label="Filtrer par projet">
            <option value="">Tous les projets</option>
            {projets.map((p) => <option key={p.id_projet} value={p.id_projet}>{p.nom_projet}</option>)}
          </select>
          <select value={resp} onChange={filtre(setResp)} aria-label="Filtrer par responsable">
            <option value="">Tous les responsables</option>
            {utilisateurs.map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{nomComplet(u)}</option>)}
          </select>
          <label className="ligne" style={{ gap: 6, fontSize: 13 }}>
            <input type="checkbox" style={{ width: 16, height: 16 }} checked={retard} onChange={(e) => { setRetard(e.target.checked); tableau.setPage(1); }} /> En retard
          </label>
        </div>
        <Etats loading={chargement} error={erreur} onRetry={recharger} vide={false}>
          <Tableau
            colonnes={colonnes}
            tableau={tableau}
            cle={(t) => t.id_tache}
            onLigne={(t) => navigate(`/taches/${t.id_tache}`)}
            vide={<div className="state"><h3>{taches.length ? 'Aucun résultat' : 'Aucune tâche'}</h3><p>{taches.length ? 'Modifiez votre recherche ou vos filtres.' : 'Les tâches créées apparaîtront ici.'}</p></div>}
          />
        </Etats>
      </div>
      {modale && <TacheModal onClose={() => setModale(false)} onSaved={(t) => { setModale(false); recharger(); navigate(`/taches/${t.id_tache}`); }} />}
    </>
  );
}
