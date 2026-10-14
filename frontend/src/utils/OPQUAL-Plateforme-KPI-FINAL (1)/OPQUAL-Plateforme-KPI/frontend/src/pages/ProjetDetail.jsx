import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Anneau } from '../components/Charts.jsx';
import ProjetModal from '../components/ProjetModal.jsx';
import TacheModal from '../components/TacheModal.jsx';
import { Alerte, Avatar, Badge, Bouton, CarteKpi, Champ, Chargement, EtatVide, Modal, PageHeader, Progression } from '../components/ui.jsx';
import { ajouterParticipant, lireProjet, modifierParticipant, participantsProjet } from '../api/projetApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate, formatHeures, libelle, nomComplet, num } from '../utils/format.js';
import { estEnRetard, progressionProjet } from '../utils/stats.js';

export default function ProjetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { droits } = useAuth();
  const { taches, utilisateurs, equipeParId, utilisateurParId, recharger } = useDonnees();
  const toast = useToast();
  const projet = useFetch(() => lireProjet(id), [id]);
  const parts = useFetch(() => participantsProjet(id), [id]);
  const [modale, setModale] = useState(null); // 'edit' | 'tache' | 'participant'
  const [choix, setChoix] = useState('');
  const [erreurPart, setErreurPart] = useState('');
  const [enCours, setEnCours] = useState(false);

  const p = projet.data;
  const siennes = useMemo(() => (p ? taches.filter((t) => t.id_projet === p.id_projet) : []), [taches, p]);
  const stats = p ? progressionProjet(p, taches) : null;
  const heures = siennes.reduce((s, t) => s + num(t.temps_estime), 0);

  if (projet.loading) return <Chargement />;
  if (projet.error) return <Alerte onRetry={projet.reload}>{projet.error}</Alerte>;
  if (!p) return null;

  const participants = parts.data || [];
  const dejaIds = new Set(participants.map((x) => x.id_utilisateur));

  const ajouter = async () => {
    if (!choix) return setErreurPart('Choisissez un collaborateur.');
    setEnCours(true);
    setErreurPart('');
    try {
      await ajouterParticipant(p.id_projet, { id_utilisateur: Number(choix) });
      toast.succes('Participant ajouté.');
      setModale(null);
      setChoix('');
      parts.reload();
    } catch (e) {
      setErreurPart(e.message);
    } finally {
      setEnCours(false);
    }
  };
  const basculerParticipant = async (x) => {
    try {
      await modifierParticipant(p.id_projet, x.id_utilisateur, { statut: x.statut === 'ACTIF' ? 'RETIRE' : 'ACTIF' });
      parts.reload();
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  return (
    <>
      <p style={{ marginBottom: 8 }}><Link to="/projets">← Projets</Link></p>
      <PageHeader
        titre={p.nom_projet}
        sousTitre={`${p.code_projet} · ${equipeParId.get(p.id_equipe)?.nom_equipe ?? 'Équipe inconnue'}`}
        actions={
          droits.peutGerer && (
            <>
              <Bouton variante="secondary" icone="edit" onClick={() => setModale('edit')}>Modifier</Bouton>
              <Bouton icone="plus" onClick={() => setModale('tache')}>Nouvelle tâche</Bouton>
            </>
          )
        }
      />

      <div className="grille grille-kpi" style={{ marginBottom: 16 }}>
        <CarteKpi titre="Progression" valeur={`${stats.progression} %`} icone="target" ton="success" detail={`${stats.terminees} tâche(s) terminée(s) sur ${stats.total}`} />
        <CarteKpi titre="Tâches" valeur={stats.total} icone="taches" />
        <CarteKpi titre="En retard" valeur={stats.retard} icone="alert" ton={stats.retard ? 'danger' : 'success'} />
        <CarteKpi titre="Temps estimé" valeur={formatHeures(heures)} icone="temps" detail="somme des tâches" />
      </div>

      <div className="grille grille-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-titre"><h2>Informations générales</h2></div>
          <div className="infos">
            <div><div className="info-label">État</div><Badge valeur={p.etat} /></div>
            <div><div className="info-label">Priorité</div><Badge valeur={p.priorite} /></div>
            <div><div className="info-label">Statut</div><Badge valeur={p.statut} /></div>
            <div><div className="info-label">Chef de projet</div><div className="info-valeur">{nomComplet(utilisateurParId.get(p.id_chef_projet))}</div></div>
            <div><div className="info-label">Début</div><div className="info-valeur">{formatDate(p.date_debut)}</div></div>
            <div><div className="info-label">Fin prévue</div><div className="info-valeur">{formatDate(p.date_fin_prevue)}</div></div>
            <div><div className="info-label">Fin réelle</div><div className="info-valeur">{formatDate(p.date_fin_reelle)}</div></div>
          </div>
          {p.description && <p style={{ marginTop: 18 }}>{p.description}</p>}
          <div style={{ marginTop: 18 }}><Progression valeur={stats.progression} /></div>
        </div>

        <div className="card">
          <div className="card-titre">
            <div><h2>Participants</h2><p>Équipe : {equipeParId.get(p.id_equipe)?.nom_equipe ?? '—'}</p></div>
            {droits.peutGerer && <Bouton variante="secondary" taille="sm" icone="plus" onClick={() => setModale('participant')}>Ajouter</Bouton>}
          </div>
          {parts.loading ? <Chargement /> : parts.error ? <Alerte onRetry={parts.reload}>{parts.error}</Alerte> : participants.length === 0 ? (
            <EtatVide titre="Aucun participant" texte="Ajoutez des collaborateurs à ce projet." />
          ) : (
            <ul className="fil">
              {participants.map((x) => {
                const u = utilisateurParId.get(x.id_utilisateur);
                return (
                  <li key={x.id_utilisateur}>
                    <Avatar utilisateur={u} taille={34} />
                    <div className="fil-texte"><div className="fil-titre">{nomComplet(u)}</div><div className="fil-detail">{u?.poste} · depuis le {formatDate(x.date_participation)}</div></div>
                    <Badge valeur={x.statut} />
                    {droits.peutGerer && <Bouton variante="ghost" taille="sm" onClick={() => basculerParticipant(x)}>{x.statut === 'ACTIF' ? 'Retirer du projet' : 'Réactiver'}</Bouton>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-titre"><h2>Tâches du projet</h2></div>
        {siennes.length === 0 ? <EtatVide titre="Aucune tâche" texte="Ce projet ne contient pas encore de tâche." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tâche</th><th>État</th><th>Priorité</th><th>Responsable</th><th>Échéance</th><th>Estimé</th></tr></thead>
              <tbody>
                {siennes.map((t) => (
                  <tr key={t.id_tache} className="cliquable" onClick={() => navigate(`/taches/${t.id_tache}`)}>
                    <td data-label="Tâche" className="cellule-principale">{t.titre}</td>
                    <td data-label="État"><Badge valeur={t.etat} /></td>
                    <td data-label="Priorité"><Badge valeur={t.priorite} /></td>
                    <td data-label="Responsable">{nomComplet(utilisateurParId.get(t.id_responsable))}</td>
                    <td data-label="Échéance">{formatDate(t.date_limite)} {estEnRetard(t) && <Badge ton="danger">Retard</Badge>}</td>
                    <td data-label="Estimé">{formatHeures(t.temps_estime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modale === 'edit' && <ProjetModal projet={p} onClose={() => setModale(null)} onSaved={() => { setModale(null); projet.reload(); recharger(); }} />}
      {modale === 'tache' && <TacheModal projetInitial={p.id_projet} onClose={() => setModale(null)} onSaved={() => { setModale(null); recharger(); }} />}
      {modale === 'participant' && (
        <Modal titre="Ajouter un participant" onClose={() => setModale(null)} pied={<><Bouton variante="secondary" onClick={() => setModale(null)}>Annuler</Bouton><Bouton enCours={enCours} onClick={ajouter}>Ajouter</Bouton></>}>
          {erreurPart && <Alerte>{erreurPart}</Alerte>}
          <Champ label="Collaborateur">
            <select value={choix} onChange={(e) => setChoix(e.target.value)}>
              <option value="">Choisir…</option>
              {utilisateurs.filter((u) => u.statut === 'ACTIF' && !dejaIds.has(u.id_utilisateur)).map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{nomComplet(u)}</option>)}
            </select>
          </Champ>
        </Modal>
      )}
    </>
  );
}
