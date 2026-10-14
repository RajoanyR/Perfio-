import { useState } from 'react';
import { Alerte, Bouton, Champ, Modal } from './ui.jsx';
import { creerProjet, modifierProjet } from '../api/projetApi.js';
import { PRIORITES, PROJET_ETATS, PROJET_STATUTS } from '../config/valeurs.js';
import { libelle, nomComplet, optionsAvec, versChampDate } from '../utils/format.js';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Création / modification d'un projet — champs et limites identiques à CreateProjetDto / UpdateProjetDto. */
export default function ProjetModal({ projet, onClose, onSaved }) {
  const { equipes, utilisateurs, projets } = useDonnees();
  const toast = useToast();
  const edition = !!projet;
  const [f, setF] = useState({
    nom_projet: projet?.nom_projet ?? '',
    code_projet: projet?.code_projet ?? '',
    description: projet?.description ?? '',
    id_equipe: projet?.id_equipe ?? '',
    id_chef_projet: projet?.id_chef_projet ?? '',
    priorite: projet?.priorite ?? 'NORMALE',
    etat: projet?.etat ?? 'PLANIFIE',
    statut: projet?.statut ?? 'ACTIF',
    date_debut: versChampDate(projet?.date_debut),
    date_fin_prevue: versChampDate(projet?.date_fin_prevue),
    date_fin_reelle: versChampDate(projet?.date_fin_reelle),
  });
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const valider = () => {
    const e = {};
    if (!f.nom_projet.trim()) e.nom_projet = 'Le nom est obligatoire.';
    else if (f.nom_projet.length > 150) e.nom_projet = '150 caractères maximum.';
    if (!f.code_projet.trim()) e.code_projet = 'Le code est obligatoire.';
    else if (f.code_projet.length > 50) e.code_projet = '50 caractères maximum.';
    if (!f.id_equipe) e.id_equipe = "Choisissez l'équipe.";
    if (!f.id_chef_projet) e.id_chef_projet = 'Choisissez le chef de projet.';
    if (!f.date_debut) e.date_debut = 'La date de début est obligatoire.';
    if (!f.date_fin_prevue) e.date_fin_prevue = 'La date de fin prévue est obligatoire.';
    if (f.date_debut && f.date_fin_prevue && f.date_fin_prevue < f.date_debut) e.date_fin_prevue = 'La fin prévue doit être après le début.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async (ev) => {
    ev.preventDefault();
    setErreurApi('');
    if (!valider()) return;
    const dto = {
      nom_projet: f.nom_projet.trim(),
      code_projet: f.code_projet.trim(),
      id_equipe: Number(f.id_equipe),
      id_chef_projet: Number(f.id_chef_projet),
      priorite: f.priorite,
      etat: f.etat,
      statut: f.statut,
      date_debut: f.date_debut,
      date_fin_prevue: f.date_fin_prevue,
    };
    if (f.description.trim()) dto.description = f.description.trim();
    if (f.date_fin_reelle) dto.date_fin_reelle = f.date_fin_reelle;
    setEnCours(true);
    try {
      const r = edition ? await modifierProjet(projet.id_projet, dto) : await creerProjet(dto);
      toast.succes(edition ? 'Projet modifié.' : 'Projet créé.');
      onSaved(r);
    } catch (e) {
      setErreurApi(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const chefs = utilisateurs.filter((u) => u.statut === 'ACTIF' || u.id_utilisateur === projet?.id_chef_projet);

  return (
    <Modal
      titre={edition ? 'Modifier le projet' : 'Nouveau projet'}
      onClose={onClose}
      large
      pied={
        <>
          <Bouton variante="secondary" onClick={onClose} disabled={enCours}>Annuler</Bouton>
          <Bouton enCours={enCours} onClick={soumettre}>{edition ? 'Enregistrer' : 'Créer le projet'}</Bouton>
        </>
      }
    >
      <form onSubmit={soumettre} noValidate className="grille-champs">
        {erreurApi && <div className="plein"><Alerte>{erreurApi}</Alerte></div>}
        <Champ label="Nom du projet" requis erreur={erreurs.nom_projet}><input value={f.nom_projet} onChange={maj('nom_projet')} maxLength={150} /></Champ>
        <Champ label="Code projet" requis erreur={erreurs.code_projet} aide="Unique (ex. PRJ-2026-01)"><input value={f.code_projet} onChange={maj('code_projet')} maxLength={50} /></Champ>
        <Champ label="Équipe" requis erreur={erreurs.id_equipe}>
          <select value={f.id_equipe} onChange={maj('id_equipe')}>
            <option value="">Choisir…</option>
            {equipes.map((e) => <option key={e.id_equipe} value={e.id_equipe}>{e.nom_equipe}</option>)}
          </select>
        </Champ>
        <Champ label="Chef de projet" requis erreur={erreurs.id_chef_projet}>
          <select value={f.id_chef_projet} onChange={maj('id_chef_projet')}>
            <option value="">Choisir…</option>
            {chefs.map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{nomComplet(u)}</option>)}
          </select>
        </Champ>
        <Champ label="Priorité">
          <select value={f.priorite} onChange={maj('priorite')}>
            {optionsAvec(PRIORITES, projets, 'priorite').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
        </Champ>
        <Champ label="État">
          <select value={f.etat} onChange={maj('etat')}>
            {optionsAvec(PROJET_ETATS, projets, 'etat').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
        </Champ>
        <Champ label="Date de début" requis erreur={erreurs.date_debut}><input type="date" value={f.date_debut} onChange={maj('date_debut')} /></Champ>
        <Champ label="Fin prévue" requis erreur={erreurs.date_fin_prevue}><input type="date" value={f.date_fin_prevue} onChange={maj('date_fin_prevue')} /></Champ>
        <Champ label="Fin réelle"><input type="date" value={f.date_fin_reelle} onChange={maj('date_fin_reelle')} /></Champ>
        <Champ label="Statut">
          <select value={f.statut} onChange={maj('statut')}>
            {optionsAvec(PROJET_STATUTS, projets, 'statut').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
          </select>
        </Champ>
        <div className="plein">
          <Champ label="Description"><textarea value={f.description} onChange={maj('description')} /></Champ>
        </div>
      </form>
    </Modal>
  );
}
