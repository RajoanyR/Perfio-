import { useState } from 'react';
import { Alerte, Bouton, Champ, Modal } from './ui.jsx';
import { creerTache, modifierTache } from '../api/tacheApi.js';
import { PRIORITES, TACHE_ETATS } from '../config/valeurs.js';
import { libelle, nomComplet, optionsAvec, versChampDate } from '../utils/format.js';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Création / modification d'une tâche — champs identiques à CreateTacheDto / UpdateTacheDto. */
export default function TacheModal({ tache, projetInitial, onClose, onSaved }) {
  const { projets, equipes, utilisateurs, taches, projetParId } = useDonnees();
  const toast = useToast();
  const edition = !!tache;
  const [f, setF] = useState({
    titre: tache?.titre ?? '',
    description: tache?.description ?? '',
    id_projet: tache?.id_projet ?? projetInitial ?? '',
    id_responsable: tache?.id_responsable ?? '',
    id_equipe: tache?.id_equipe ?? (projetInitial ? projetParId.get(projetInitial)?.id_equipe : '') ?? '',
    priorite: tache?.priorite ?? 'NORMALE',
    etat: tache?.etat ?? 'A_FAIRE',
    temps_estime: tache ? String(Number(tache.temps_estime)) : '',
    date_debut: versChampDate(tache?.date_debut),
    date_limite: versChampDate(tache?.date_limite),
  });
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const changerProjet = (e) => {
    const id = e.target.value;
    // Pré-remplit l'équipe avec celle du projet (modifiable)
    const p = projetParId.get(Number(id));
    setF({ ...f, id_projet: id, id_equipe: p && !f.id_equipe ? p.id_equipe : f.id_equipe });
  };

  const valider = () => {
    const e = {};
    if (!f.titre.trim()) e.titre = 'Le titre est obligatoire.';
    else if (f.titre.length > 150) e.titre = '150 caractères maximum.';
    if (!f.id_projet) e.id_projet = 'Choisissez le projet.';
    if (!f.id_responsable) e.id_responsable = 'Choisissez le responsable.';
    if (!f.id_equipe) e.id_equipe = "Choisissez l'équipe.";
    if (f.temps_estime !== '' && (Number.isNaN(Number(f.temps_estime)) || Number(f.temps_estime) < 0)) e.temps_estime = 'Saisissez un nombre positif.';
    if (f.date_debut && f.date_limite && f.date_limite < f.date_debut) e.date_limite = "L'échéance doit être après le début.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async (ev) => {
    ev.preventDefault();
    setErreurApi('');
    if (!valider()) return;
    const dto = {
      titre: f.titre.trim(),
      id_projet: Number(f.id_projet),
      id_responsable: Number(f.id_responsable),
      id_equipe: Number(f.id_equipe),
      priorite: f.priorite,
      etat: f.etat,
    };
    if (f.description.trim()) dto.description = f.description.trim();
    if (f.temps_estime !== '') dto.temps_estime = Number(f.temps_estime);
    if (f.date_debut) dto.date_debut = f.date_debut;
    if (f.date_limite) dto.date_limite = f.date_limite;
    setEnCours(true);
    try {
      const r = edition ? await modifierTache(tache.id_tache, dto) : await creerTache(dto);
      toast.succes(edition ? 'Tâche modifiée.' : 'Tâche créée.');
      onSaved(r);
    } catch (e) {
      setErreurApi(e.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={edition ? 'Modifier la tâche' : 'Nouvelle tâche'}
      onClose={onClose}
      large
      pied={
        <>
          <Bouton variante="secondary" onClick={onClose} disabled={enCours}>Annuler</Bouton>
          <Bouton enCours={enCours} onClick={soumettre}>{edition ? 'Enregistrer' : 'Créer la tâche'}</Bouton>
        </>
      }
    >
      <form onSubmit={soumettre} noValidate className="grille-champs">
        {erreurApi && <div className="plein"><Alerte>{erreurApi}</Alerte></div>}
        <div className="plein"><Champ label="Titre" requis erreur={erreurs.titre}><input value={f.titre} onChange={maj('titre')} maxLength={150} /></Champ></div>
        <Champ label="Projet" requis erreur={erreurs.id_projet}>
          <select value={f.id_projet} onChange={changerProjet}>
            <option value="">Choisir…</option>
            {projets.map((p) => <option key={p.id_projet} value={p.id_projet}>{p.nom_projet}</option>)}
          </select>
        </Champ>
        <Champ label="Responsable" requis erreur={erreurs.id_responsable}>
          <select value={f.id_responsable} onChange={maj('id_responsable')}>
            <option value="">Choisir…</option>
            {utilisateurs.filter((u) => u.statut === 'ACTIF' || u.id_utilisateur === tache?.id_responsable).map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{nomComplet(u)}</option>)}
          </select>
        </Champ>
        <Champ label="Équipe" requis erreur={erreurs.id_equipe}>
          <select value={f.id_equipe} onChange={maj('id_equipe')}>
            <option value="">Choisir…</option>
            {equipes.map((e) => <option key={e.id_equipe} value={e.id_equipe}>{e.nom_equipe}</option>)}
          </select>
        </Champ>
        <Champ label="Temps estimé (heures)" erreur={erreurs.temps_estime}><input type="number" min="0" step="0.5" value={f.temps_estime} onChange={maj('temps_estime')} /></Champ>
        <Champ label="Priorité">
          <select value={f.priorite} onChange={maj('priorite')}>
            {optionsAvec(PRIORITES, taches, 'priorite').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
        </Champ>
        <Champ label="État">
          <select value={f.etat} onChange={maj('etat')}>
            {optionsAvec(TACHE_ETATS, taches, 'etat').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
        </Champ>
        <Champ label="Date de début"><input type="date" value={f.date_debut} onChange={maj('date_debut')} /></Champ>
        <Champ label="Échéance" erreur={erreurs.date_limite}><input type="date" value={f.date_limite} onChange={maj('date_limite')} /></Champ>
        <div className="plein"><Champ label="Description"><textarea value={f.description} onChange={maj('description')} /></Champ></div>
      </form>
    </Modal>
  );
}
