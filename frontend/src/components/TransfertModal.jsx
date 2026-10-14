import { useState } from 'react';
import { Alerte, Bouton, Champ, Modal } from './ui.jsx';
import { transfererTache } from '../api/tacheApi.js';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { nomComplet } from '../utils/format.js';

/** Formulaire du DTO TransfertTacheDto : nouveau_responsable, nouvelle_equipe, motif (l'auteur est lu dans le JWT par le serveur). */
export default function TransfertModal({ tache, onClose, onSaved }) {
  const { utilisateurs, equipes } = useDonnees();
  const toast = useToast();
  const [f, setF] = useState({ nouveau_responsable: '', nouvelle_equipe: tache.id_equipe, motif: '' });
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const soumettre = async (ev) => {
    ev?.preventDefault();
    setErreurApi('');
    const e = {};
    if (!f.nouveau_responsable) e.nouveau_responsable = 'Choisissez le nouveau responsable.';
    if (!f.nouvelle_equipe) e.nouvelle_equipe = "Choisissez l'équipe.";
    if (!f.motif.trim()) e.motif = 'Le motif est obligatoire.';
    if (f.nouveau_responsable && Number(f.nouveau_responsable) === tache.id_responsable && Number(f.nouvelle_equipe) === tache.id_equipe) {
      e.nouveau_responsable = 'La tâche a déjà ce responsable et cette équipe.';
    }
    setErreurs(e);
    if (Object.keys(e).length) return;
    setEnCours(true);
    try {
      await transfererTache(tache.id_tache, {
        nouveau_responsable: Number(f.nouveau_responsable),
        nouvelle_equipe: Number(f.nouvelle_equipe),
        motif: f.motif.trim(),
      });
      toast.succes('Tâche transférée.');
      onSaved(f);
    } catch (err) {
      setErreurApi(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre="Transférer la tâche"
      onClose={onClose}
      pied={
        <>
          <Bouton variante="secondary" onClick={onClose} disabled={enCours}>Annuler</Bouton>
          <Bouton enCours={enCours} onClick={soumettre}>Transférer</Bouton>
        </>
      }
    >
      <form onSubmit={soumettre} noValidate className="pile">
        {erreurApi && <Alerte>{erreurApi}</Alerte>}
        <Champ label="Nouveau responsable" requis erreur={erreurs.nouveau_responsable}>
          <select value={f.nouveau_responsable} onChange={maj('nouveau_responsable')}>
            <option value="">Choisir…</option>
            {utilisateurs.filter((u) => u.statut === 'ACTIF').map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{nomComplet(u)}</option>)}
          </select>
        </Champ>
        <Champ label="Nouvelle équipe" requis erreur={erreurs.nouvelle_equipe}>
          <select value={f.nouvelle_equipe} onChange={maj('nouvelle_equipe')}>
            {equipes.map((e) => <option key={e.id_equipe} value={e.id_equipe}>{e.nom_equipe}</option>)}
          </select>
        </Champ>
        <Champ label="Motif du transfert" requis erreur={erreurs.motif}><textarea value={f.motif} onChange={maj('motif')} /></Champ>
      </form>
    </Modal>
  );
}
