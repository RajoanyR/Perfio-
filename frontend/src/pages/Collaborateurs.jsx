import { useMemo, useState } from 'react';
import { Alerte, Avatar, Badge, BarreRecherche, Bouton, Champ, Etats, Modal, ModaleConfirmation, PageHeader, Tableau } from '../components/ui.jsx';
import { activerUtilisateur, creerUtilisateur, desactiverUtilisateur, modifierUtilisateur } from '../api/utilisateurApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTableau } from '../hooks/useTableau.js';
import { formatDate, nomComplet, num } from '../utils/format.js';

/** Champs et validations alignés sur CreateUtilisateurDto / UpdateUtilisateurDto. */
function UtilisateurForm({ cible, onClose, onSaved }) {
  const { equipes, roles } = useDonnees();
  const { utilisateur } = useAuth();
  const toast = useToast();
  const edition = !!cible;
  const [f, setF] = useState({
    nom: cible?.nom ?? '', prenom: cible?.prenom ?? '', email: cible?.email ?? '', mot_de_passe: '',
    telephone: cible?.telephone ?? '', poste: cible?.poste ?? '',
    id_role: cible?.id_role ?? '', id_equipe: cible?.id_equipe ?? '',
    capacite_hebdomadaire_heures: cible ? String(num(cible.capacite_hebdomadaire_heures)) : '40',
  });
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [voir, setVoir] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const valider = () => {
    const e = {};
    if (!f.nom.trim()) e.nom = 'Le nom est obligatoire.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "L'adresse e-mail n'est pas valide.";
    if (!edition && f.mot_de_passe.length < 8) e.mot_de_passe = '8 caractères minimum.';
    if (edition && f.mot_de_passe && f.mot_de_passe.length < 8) e.mot_de_passe = '8 caractères minimum.';
    if (!f.poste.trim()) e.poste = 'Le poste est obligatoire.';
    if (!f.id_role) e.id_role = 'Choisissez un rôle.';
    if (!f.id_equipe) e.id_equipe = 'Choisissez une équipe.';
    const c = Number(f.capacite_hebdomadaire_heures);
    if (Number.isNaN(c) || c < 1 || c > 60) e.capacite_hebdomadaire_heures = 'Entre 1 et 60 heures.';
    setErreurs(e);
    return !Object.keys(e).length;
  };

  const soumettre = async (ev) => {
    ev?.preventDefault();
    setErreurApi('');
    if (!valider()) return;
    const dto = {
      nom: f.nom.trim(), prenom: f.prenom.trim(), email: f.email.trim(), poste: f.poste.trim(),
      id_role: Number(f.id_role), id_equipe: Number(f.id_equipe),
      capacite_hebdomadaire_heures: Number(f.capacite_hebdomadaire_heures),
    };
    if (f.telephone.trim()) dto.telephone = f.telephone.trim();
    if (f.mot_de_passe) dto.mot_de_passe = f.mot_de_passe;
    setEnCours(true);
    try {
      if (edition) await modifierUtilisateur(cible.id_utilisateur, dto);
      else await creerUtilisateur({ ...dto, id_entreprise: utilisateur.id_entreprise });
      toast.succes(edition ? 'Collaborateur modifié.' : 'Collaborateur créé.');
      onSaved();
    } catch (e) {
      setErreurApi(e.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal titre={edition ? 'Modifier le collaborateur' : 'Nouveau collaborateur'} onClose={onClose} large pied={<><Bouton variante="secondary" onClick={onClose} disabled={enCours}>Annuler</Bouton><Bouton enCours={enCours} onClick={soumettre}>{edition ? 'Enregistrer' : 'Créer'}</Bouton></>}>
      <form onSubmit={soumettre} noValidate className="grille-champs">
        {erreurApi && <div className="plein"><Alerte>{erreurApi}</Alerte></div>}
        <Champ label="Prénom (facultatif)" erreur={erreurs.prenom}><input value={f.prenom} onChange={maj('prenom')} /></Champ>
        <Champ label="Nom" requis erreur={erreurs.nom}><input value={f.nom} onChange={maj('nom')} /></Champ>
        <Champ label="Adresse e-mail" requis erreur={erreurs.email}><input type="email" value={f.email} onChange={maj('email')} /></Champ>
        <Champ label="Téléphone"><input value={f.telephone} onChange={maj('telephone')} /></Champ>
        <Champ label={edition ? 'Nouveau mot de passe' : 'Mot de passe'} requis={!edition} erreur={erreurs.mot_de_passe} aide={edition ? 'Laissez vide pour ne pas le changer.' : '8 caractères minimum.'}>
          <div className="champ-mdp">
            <input type={voir ? 'text' : 'password'} autoComplete="new-password" value={f.mot_de_passe} onChange={maj('mot_de_passe')} />
            <button type="button" className="icon-btn" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer' : 'Afficher'}>{voir ? '🙈' : '👁'}</button>
          </div>
        </Champ>
        <Champ label="Poste" requis erreur={erreurs.poste}><input value={f.poste} onChange={maj('poste')} /></Champ>
        <Champ label="Rôle" requis erreur={erreurs.id_role}>
          <select value={f.id_role} onChange={maj('id_role')}><option value="">Choisir…</option>{roles.map((r) => <option key={r.id_role} value={r.id_role}>{r.nom_role}</option>)}</select>
        </Champ>
        <Champ label="Équipe" requis erreur={erreurs.id_equipe}>
          <select value={f.id_equipe} onChange={maj('id_equipe')}><option value="">Choisir…</option>{equipes.map((e) => <option key={e.id_equipe} value={e.id_equipe}>{e.nom_equipe}</option>)}</select>
        </Champ>
        <Champ label="Capacité hebdomadaire (h)" erreur={erreurs.capacite_hebdomadaire_heures}><input type="number" min="1" max="60" value={f.capacite_hebdomadaire_heures} onChange={maj('capacite_hebdomadaire_heures')} /></Champ>
      </form>
    </Modal>
  );
}

export default function Collaborateurs() {
  const { utilisateurs, equipeParId, roleParId, equipes, roles, chargement, erreur, recharger } = useDonnees();
  const { droits, utilisateur } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [equipe, setEquipe] = useState('');
  const [role, setRole] = useState('');
  const [modale, setModale] = useState(null); // { type: 'form'|'statut', u }
  const [enCours, setEnCours] = useState(false);

  const lignes = useMemo(() => {
    const t = q.trim().toLowerCase();
    return utilisateurs
      .filter((u) => (!statut || u.statut === statut) && (!equipe || String(u.id_equipe) === equipe) && (!role || String(u.id_role) === role))
      .filter((u) => !t || [nomComplet(u), u.email, u.poste].some((s) => String(s || '').toLowerCase().includes(t)));
  }, [utilisateurs, q, statut, equipe, role]);
  const tableau = useTableau(lignes, { parPage: 10 });
  const f = (set) => (e) => { set(e.target.value); tableau.setPage(1); };

  const basculer = async () => {
    const u = modale.u;
    setEnCours(true);
    try {
      if (u.statut === 'ACTIF') await desactiverUtilisateur(u.id_utilisateur);
      else await activerUtilisateur(u.id_utilisateur);
      toast.succes(u.statut === 'ACTIF' ? 'Collaborateur désactivé.' : 'Collaborateur activé.');
      setModale(null);
      recharger();
    } catch (e) {
      toast.erreur(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const colonnes = [
    { cle: 'nom', titre: 'Collaborateur', tri: (u) => nomComplet(u), rendu: (u) => (<div className="ligne" style={{ gap: 10, flexWrap: 'nowrap' }}><Avatar utilisateur={u} taille={34} /><div><div className="cellule-principale">{nomComplet(u)}</div><div className="cellule-secondaire">{u.email}</div></div></div>) },
    { cle: 'poste', titre: 'Poste', tri: (u) => u.poste, valeur: (u) => u.poste || '—' },
    { cle: 'role', titre: 'Rôle', tri: (u) => roleParId.get(u.id_role)?.nom_role, valeur: (u) => roleParId.get(u.id_role)?.nom_role ?? '—' },
    { cle: 'equipe', titre: 'Équipe', tri: (u) => equipeParId.get(u.id_equipe)?.nom_equipe, valeur: (u) => equipeParId.get(u.id_equipe)?.nom_equipe ?? '—' },
    { cle: 'statut', titre: 'Statut', tri: (u) => u.statut, rendu: (u) => <Badge valeur={u.statut} /> },
    { cle: 'date', titre: 'Depuis le', tri: (u) => u.date_creation, valeur: (u) => formatDate(u.date_creation) },
  ];
  if (droits.peutGererUtilisateurs) {
    colonnes.push({
      cle: 'actions', titre: 'Actions',
      rendu: (u) => (
        <div className="ligne" style={{ gap: 4, flexWrap: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setModale({ type: 'form', u })}><span aria-hidden>✎</span></button>
          {u.id_utilisateur !== utilisateur.id_utilisateur && <Bouton variante="ghost" taille="sm" onClick={() => setModale({ type: 'statut', u })}>{u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}</Bouton>}
        </div>
      ),
    });
  }

  return (
    <>
      <PageHeader titre="Collaborateurs" sousTitre="Annuaire et gestion des comptes" actions={droits.peutGererUtilisateurs && <Bouton icone="plus" onClick={() => setModale({ type: 'form' })}>Nouveau collaborateur</Bouton>} />
      <div className="card">
        <div className="barre-filtres">
          <BarreRecherche valeur={q} onChange={(v) => { setQ(v); tableau.setPage(1); }} placeholder="Rechercher un nom, un e-mail, un poste…" />
          <select value={statut} onChange={f(setStatut)} aria-label="Statut"><option value="">Tous les statuts</option><option value="ACTIF">Actif</option><option value="INACTIF">Inactif</option></select>
          <select value={role} onChange={f(setRole)} aria-label="Rôle"><option value="">Tous les rôles</option>{roles.map((r) => <option key={r.id_role} value={r.id_role}>{r.nom_role}</option>)}</select>
          <select value={equipe} onChange={f(setEquipe)} aria-label="Équipe"><option value="">Toutes les équipes</option>{equipes.map((e) => <option key={e.id_equipe} value={e.id_equipe}>{e.nom_equipe}</option>)}</select>
        </div>
        <Etats loading={chargement} error={erreur} onRetry={recharger} vide={false}>
          <Tableau colonnes={colonnes} tableau={tableau} cle={(u) => u.id_utilisateur} vide={<div className="state"><h3>Aucun résultat</h3><p>Modifiez votre recherche ou vos filtres.</p></div>} />
        </Etats>
      </div>
      {modale?.type === 'form' && <UtilisateurForm cible={modale.u} onClose={() => setModale(null)} onSaved={() => { setModale(null); recharger(); }} />}
      {modale?.type === 'statut' && (
        <ModaleConfirmation
          titre={modale.u.statut === 'ACTIF' ? 'Désactiver le collaborateur' : 'Activer le collaborateur'}
          message={modale.u.statut === 'ACTIF' ? `Voulez-vous vraiment désactiver ${nomComplet(modale.u)} ? Cette personne ne pourra plus se connecter.` : `Réactiver le compte de ${nomComplet(modale.u)} ?`}
          confirmer={modale.u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'} danger={modale.u.statut === 'ACTIF'} enCours={enCours} onConfirm={basculer} onClose={() => setModale(null)}
        />
      )}
    </>
  );
}
