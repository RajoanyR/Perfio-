import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alerte, Avatar, Badge, Bouton, Champ, Chargement, EtatVide, Etats, Modal, PageHeader } from '../components/ui.jsx';
import { creerEquipe, membresEquipe, modifierEquipe } from '../api/equipeApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { EQUIPE_STATUTS } from '../config/valeurs.js';
import { formatDate, libelle, nomComplet } from '../utils/format.js';

function EquipeForm({ equipe, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ nom_equipe: equipe?.nom_equipe ?? '', description: equipe?.description ?? '', statut: equipe?.statut ?? 'ACTIVE' });
  const [erreur, setErreur] = useState('');
  const [erreurNom, setErreurNom] = useState('');
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (ev) => {
    ev?.preventDefault();
    setErreur('');
    setErreurNom('');
    if (!f.nom_equipe.trim()) return setErreurNom("Le nom de l'équipe est obligatoire.");
    if (f.nom_equipe.length > 100) return setErreurNom('100 caractères maximum.');
    setEnCours(true);
    try {
      const dto = { nom_equipe: f.nom_equipe.trim(), statut: f.statut };
      if (f.description.trim()) dto.description = f.description.trim();
      if (equipe) await modifierEquipe(equipe.id_equipe, dto);
      else await creerEquipe(dto);
      toast.succes(equipe ? 'Équipe modifiée.' : 'Équipe créée.');
      onSaved();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal titre={equipe ? "Modifier l'équipe" : 'Nouvelle équipe'} onClose={onClose} pied={<><Bouton variante="secondary" onClick={onClose} disabled={enCours}>Annuler</Bouton><Bouton enCours={enCours} onClick={soumettre}>{equipe ? 'Enregistrer' : "Créer l'équipe"}</Bouton></>}>
      <form onSubmit={soumettre} noValidate className="pile">
        {erreur && <Alerte>{erreur}</Alerte>}
        <Champ label="Nom de l'équipe" requis erreur={erreurNom}><input value={f.nom_equipe} onChange={(e) => setF({ ...f, nom_equipe: e.target.value })} maxLength={100} /></Champ>
        <Champ label="Statut">
          <select value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value })}>
            {EQUIPE_STATUTS.map((s) => <option key={s} value={s}>{libelle(s)}</option>)}
          </select>
        </Champ>
        <Champ label="Description"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Champ>
      </form>
    </Modal>
  );
}

function EquipeDetail({ equipe, onClose }) {
  const { projets, taches } = useDonnees();
  const membres = useFetch(() => membresEquipe(equipe.id_equipe), [equipe.id_equipe]);
  const sesProjets = projets.filter((p) => p.id_equipe === equipe.id_equipe);
  return (
    <Modal titre={equipe.nom_equipe} onClose={onClose} large>
      <div className="pile">
        <div className="infos">
          <div><div className="info-label">Statut</div><Badge valeur={equipe.statut} /></div>
          <div><div className="info-label">Créée le</div><div className="info-valeur">{formatDate(equipe.date_creation)}</div></div>
          <div><div className="info-label">Tâches de l'équipe</div><div className="info-valeur">{taches.filter((t) => t.id_equipe === equipe.id_equipe).length}</div></div>
        </div>
        {equipe.description && <p>{equipe.description}</p>}
        <div>
          <h3 style={{ marginBottom: 10 }}>Membres</h3>
          {membres.loading ? <Chargement /> : membres.error ? <Alerte onRetry={membres.reload}>{membres.error}</Alerte> : !membres.data?.length ? <p className="muted">Aucun membre dans cette équipe.</p> : (
            <ul className="fil">
              {membres.data.map((u) => (
                <li key={u.id_utilisateur}><Avatar utilisateur={u} taille={32} /><div className="fil-texte"><div className="fil-titre">{nomComplet(u)}</div><div className="fil-detail">{u.poste} · {u.email}</div></div><Badge valeur={u.statut} /></li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 style={{ marginBottom: 10 }}>Projets associés</h3>
          {sesProjets.length === 0 ? <p className="muted">Aucun projet pour cette équipe.</p> : (
            <ul className="fil">{sesProjets.map((p) => <li key={p.id_projet}><div className="fil-texte"><div className="fil-titre"><Link to={`/projets/${p.id_projet}`}>{p.nom_projet}</Link></div><div className="fil-detail">{p.code_projet}</div></div><Badge valeur={p.etat} /></li>)}</ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Equipes() {
  const { equipes, utilisateurs, projets, chargement, erreur, recharger } = useDonnees();
  const { droits } = useAuth();
  const [modale, setModale] = useState(null); // { type: 'form'|'detail', equipe }

  return (
    <>
      <PageHeader titre="Équipes" sousTitre="Organisation des équipes du Groupe OPQUAL" actions={droits.peutGerer && <Bouton icone="plus" onClick={() => setModale({ type: 'form' })}>Nouvelle équipe</Bouton>} />
      <Etats loading={chargement} error={erreur} onRetry={recharger} vide={!equipes.length} videProps={{ titre: 'Aucune équipe', texte: 'Créez une équipe pour y affecter des collaborateurs.' }}>
        <div className="grille grille-3">
          {equipes.map((e) => (
            <div className="card" key={e.id_equipe}>
              <div className="card-titre"><div><h2>{e.nom_equipe}</h2><p>{e.description || 'Sans description'}</p></div><Badge valeur={e.statut} /></div>
              <div className="ligne ligne-entre" style={{ marginBottom: 14 }}>
                <span className="muted">{utilisateurs.filter((u) => u.id_equipe === e.id_equipe).length} membre(s)</span>
                <span className="muted">{projets.filter((p) => p.id_equipe === e.id_equipe).length} projet(s)</span>
              </div>
              <div className="ligne">
                <Bouton variante="secondary" taille="sm" onClick={() => setModale({ type: 'detail', equipe: e })}>Voir le détail</Bouton>
                {droits.peutGerer && <Bouton variante="ghost" taille="sm" icone="edit" onClick={() => setModale({ type: 'form', equipe: e })}>Modifier</Bouton>}
              </div>
            </div>
          ))}
        </div>
      </Etats>
      {modale?.type === 'form' && <EquipeForm equipe={modale.equipe} onClose={() => setModale(null)} onSaved={() => { setModale(null); recharger(); }} />}
      {modale?.type === 'detail' && <EquipeDetail equipe={modale.equipe} onClose={() => setModale(null)} />}
    </>
  );
}
