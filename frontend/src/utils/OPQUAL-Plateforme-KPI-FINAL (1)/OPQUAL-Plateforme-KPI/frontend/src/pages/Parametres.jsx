import { useEffect, useRef, useState } from 'react';
import { Alerte, Avatar, Badge, Bouton, Champ, Etats, PageHeader } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { lireEntreprise, modifierEntreprise } from '../api/entrepriseApi.js';
import { fermerSession, sessionsUtilisateur } from '../api/sessionApi.js';
import { modifierUtilisateur } from '../api/utilisateurApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { THEME_CLAIR, THEME_SOMBRE } from '../config/valeurs.js';
import { formatDateHeure, libelle, nomComplet } from '../utils/format.js';
import { lireSession } from '../api/client.js';
import { enregistrerPhoto, redimensionner, supprimerPhoto, usePhoto } from '../utils/photo.js';

const PHOTO_MAX_OCTETS = 5 * 1024 * 1024;

const SECTIONS = [
  { id: 'compte', label: 'Compte', icone: 'user' },
  { id: 'apparence', label: 'Apparence', icone: 'sun' },
  { id: 'securite', label: 'Sécurité', icone: 'lock' },
  { id: 'sessions', label: 'Sessions', icone: 'history' },
  { id: 'entreprise', label: 'Entreprise', icone: 'building' },
];

function Compte() {
  const { utilisateur, role, rafraichirUtilisateur } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ nom: utilisateur.nom || '', prenom: utilisateur.prenom || '', email: utilisateur.email || '', telephone: utilisateur.telephone || '', poste: utilisateur.poste || '' });
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const photo = usePhoto(utilisateur.id_utilisateur);
  const champPhoto = useRef(null);

  const choisirPhoto = async (ev) => {
    const fichier = ev.target.files?.[0];
    ev.target.value = ''; // permet de re-choisir le même fichier
    if (!fichier) return;
    if (!fichier.type.startsWith('image/')) return toast.erreur('Choisissez un fichier image (JPG, PNG, WebP…).');
    if (fichier.size > PHOTO_MAX_OCTETS) return toast.erreur('Image trop lourde (5 Mo maximum).');
    try {
      enregistrerPhoto(utilisateur.id_utilisateur, await redimensionner(fichier));
      toast.succes('Photo de profil mise à jour.');
    } catch (err) {
      toast.erreur(err.message || "Impossible d'enregistrer la photo.");
    }
  };
  const retirerPhoto = () => {
    supprimerPhoto(utilisateur.id_utilisateur);
    toast.succes('Photo de profil supprimée.');
  };

  const enregistrer = async (ev) => {
    ev.preventDefault();
    setErreurApi('');
    const e = {};
    if (!f.nom.trim()) e.nom = 'Le nom est obligatoire.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "L'adresse e-mail n'est pas valide.";
    setErreurs(e);
    if (Object.keys(e).length) return;
    setEnCours(true);
    try {
      const dto = { nom: f.nom.trim(), prenom: f.prenom.trim(), email: f.email.trim() };
      if (f.telephone.trim()) dto.telephone = f.telephone.trim();
      if (f.poste.trim()) dto.poste = f.poste.trim();
      await modifierUtilisateur(utilisateur.id_utilisateur, dto);
      await rafraichirUtilisateur();
      toast.succes('Informations enregistrées.');
    } catch (err) {
      setErreurApi(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="card">
      <div className="card-titre"><div><h2>Informations du compte</h2><p>Modifiez vos informations personnelles</p></div></div>
      <div className="photo-bloc">
        <Avatar utilisateur={utilisateur} taille={88} />
        <div className="photo-actions">
          <div className="ligne">
            <Bouton type="button" variante="secondary" icone="camera" onClick={() => champPhoto.current?.click()}>{photo ? 'Changer la photo' : 'Ajouter une photo'}</Bouton>
            {photo && <Bouton type="button" variante="secondary" icone="trash" onClick={retirerPhoto}>Supprimer</Bouton>}
          </div>
          <span className="photo-aide">JPG, PNG ou WebP, 5 Mo maximum. La photo est recadrée en carré et conservée sur cet appareil.</span>
          <input ref={champPhoto} type="file" accept="image/*" className="visually-hidden" onChange={choisirPhoto} aria-label="Choisir une photo de profil" />
        </div>
      </div>
      <form onSubmit={enregistrer} noValidate className="grille-champs">
        {erreurApi && <div className="plein"><Alerte>{erreurApi}</Alerte></div>}
        <Champ label="Prénom (facultatif)" erreur={erreurs.prenom}><input value={f.prenom} onChange={maj('prenom')} /></Champ>
        <Champ label="Nom" requis erreur={erreurs.nom}><input value={f.nom} onChange={maj('nom')} /></Champ>
        <Champ label="Adresse e-mail" requis erreur={erreurs.email}><input type="email" value={f.email} onChange={maj('email')} /></Champ>
        <Champ label="Téléphone"><input value={f.telephone} onChange={maj('telephone')} /></Champ>
        <Champ label="Poste"><input value={f.poste} onChange={maj('poste')} /></Champ>
        <Champ label="Rôle"><input value={role?.nom_role ?? '—'} disabled /></Champ>
        <div><Bouton type="submit" enCours={enCours}>Enregistrer</Bouton></div>
      </form>
    </div>
  );
}

function Apparence() {
  const { theme, setTheme } = useTheme();
  const { utilisateur } = useAuth();
  const choisir = (t) => {
    setTheme(t);
    modifierUtilisateur(utilisateur.id_utilisateur, { theme: t }).catch(() => {});
  };
  return (
    <div className="card">
      <div className="card-titre"><div><h2>Apparence</h2><p>Le thème est conservé sur cet appareil.</p></div></div>
      <div className="segments">
        <button type="button" className={`segment ${theme === THEME_CLAIR ? 'actif' : ''}`} onClick={() => choisir(THEME_CLAIR)}>Thème clair</button>
        <button type="button" className={`segment ${theme === THEME_SOMBRE ? 'actif' : ''}`} onClick={() => choisir(THEME_SOMBRE)}>Thème sombre</button>
      </div>
    </div>
  );
}

function Securite() {
  const { utilisateur, deconnecter } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ nouveau: '', confirmation: '' });
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [voir, setVoir] = useState(false);

  const changer = async (ev) => {
    ev.preventDefault();
    setErreurApi('');
    const e = {};
    if (f.nouveau.length < 8) e.nouveau = '8 caractères minimum.';
    if (f.confirmation !== f.nouveau) e.confirmation = 'Les mots de passe ne correspondent pas.';
    setErreurs(e);
    if (Object.keys(e).length) return;
    setEnCours(true);
    try {
      await modifierUtilisateur(utilisateur.id_utilisateur, { mot_de_passe: f.nouveau });
      toast.succes('Mot de passe modifié.');
      setF({ nouveau: '', confirmation: '' });
    } catch (err) {
      setErreurApi(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="pile">
      <div className="card">
        <div className="card-titre"><div><h2>Changer votre mot de passe</h2><p>Choisissez un mot de passe fort (8 caractères minimum).</p></div></div>
        <form onSubmit={changer} noValidate className="grille-champs">
          {erreurApi && <div className="plein"><Alerte>{erreurApi}</Alerte></div>}
          <Champ label="Nouveau mot de passe" erreur={erreurs.nouveau}>
            <div className="champ-mdp">
              <input type={voir ? 'text' : 'password'} autoComplete="new-password" value={f.nouveau} onChange={(e) => setF({ ...f, nouveau: e.target.value })} />
              <button type="button" className="icon-btn" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer' : 'Afficher'}><Icon name={voir ? 'eye-off' : 'eye'} size={18} /></button>
            </div>
          </Champ>
          <Champ label="Confirmer le mot de passe" erreur={erreurs.confirmation}><input type={voir ? 'text' : 'password'} autoComplete="new-password" value={f.confirmation} onChange={(e) => setF({ ...f, confirmation: e.target.value })} /></Champ>
          <div><Bouton type="submit" enCours={enCours}>Modifier le mot de passe</Bouton></div>
        </form>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Le backend ne demande pas l'ancien mot de passe pour le modifier.</p>
      </div>
      <div className="card">
        <div className="card-titre"><div><h2>Session</h2><p>Fermez votre session sur cet appareil.</p></div></div>
        <Bouton variante="secondary" icone="logout" onClick={() => deconnecter()}>Se déconnecter</Bouton>
      </div>
    </div>
  );
}

function Sessions() {
  const { utilisateur, deconnecter } = useAuth();
  const toast = useToast();
  const s = useFetch(() => sessionsUtilisateur(utilisateur.id_utilisateur), [utilisateur.id_utilisateur]);
  const courante = lireSession()?.id_session;

  const fermer = async (x) => {
    try {
      if (String(x.id_session) === String(courante)) return deconnecter();
      await fermerSession(x.id_session);
      toast.succes('Session fermée.');
      s.reload();
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  return (
    <div className="card">
      <div className="card-titre"><div><h2>Sessions</h2><p>Connexions associées à votre compte</p></div></div>
      <Etats loading={s.loading} error={s.error} onRetry={s.reload} vide={!s.data?.length} videProps={{ titre: 'Aucune session' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Connexion</th><th>Dernière activité</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {s.data?.map((x) => (
                <tr key={x.id_session}>
                  <td data-label="Connexion">{formatDateHeure(x.date_connexion)} {String(x.id_session) === String(courante) && <Badge ton="info">Cet appareil</Badge>}</td>
                  <td data-label="Dernière activité">{formatDateHeure(x.derniere_activite)}</td>
                  <td data-label="Statut"><Badge valeur={x.statut} /></td>
                  <td data-label="Actions">{x.statut === 'ACTIVE' ? <Bouton variante="ghost" taille="sm" onClick={() => fermer(x)}>Fermer</Bouton> : <span className="muted">{x.date_deconnexion ? formatDateHeure(x.date_deconnexion) : '—'}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Etats>
    </div>
  );
}

function Entreprise() {
  const { utilisateur, droits } = useAuth();
  const toast = useToast();
  const e = useFetch(() => lireEntreprise(utilisateur.id_entreprise), [utilisateur.id_entreprise]);
  const [f, setF] = useState(null);
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (e.data) setF({ nom: e.data.nom || '', adresse: e.data.adresse || '', email: e.data.email || '', telephone: e.data.telephone || '', informations_generales: e.data.informations_generales || '' });
  }, [e.data]);

  const enregistrer = async (ev) => {
    ev.preventDefault();
    setErreurApi('');
    if (!f.nom.trim()) return setErreurApi("Le nom de l'entreprise est obligatoire.");
    setEnCours(true);
    try {
      const dto = { nom: f.nom.trim() };
      ['adresse', 'email', 'telephone', 'informations_generales'].forEach((k) => { if (f[k].trim()) dto[k] = f[k].trim(); });
      await modifierEntreprise(utilisateur.id_entreprise, dto);
      toast.succes('Entreprise mise à jour.');
      e.reload();
    } catch (err) {
      setErreurApi(err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="card">
      <div className="card-titre"><div><h2>Entreprise</h2><p>Informations du Groupe</p></div></div>
      <Etats loading={e.loading} error={e.error} onRetry={e.reload} vide={!f}>
        {f && (
          <form onSubmit={enregistrer} noValidate className="grille-champs">
            {erreurApi && <div className="plein"><Alerte>{erreurApi}</Alerte></div>}
            <Champ label="Nom" requis><input value={f.nom} disabled={!droits.peutAdministrer} onChange={(ev) => setF({ ...f, nom: ev.target.value })} /></Champ>
            <Champ label="Adresse"><input value={f.adresse} disabled={!droits.peutAdministrer} onChange={(ev) => setF({ ...f, adresse: ev.target.value })} /></Champ>
            <Champ label="E-mail"><input type="email" value={f.email} disabled={!droits.peutAdministrer} onChange={(ev) => setF({ ...f, email: ev.target.value })} /></Champ>
            <Champ label="Téléphone"><input value={f.telephone} disabled={!droits.peutAdministrer} onChange={(ev) => setF({ ...f, telephone: ev.target.value })} /></Champ>
            <div className="plein"><Champ label="Informations générales"><textarea value={f.informations_generales} disabled={!droits.peutAdministrer} onChange={(ev) => setF({ ...f, informations_generales: ev.target.value })} /></Champ></div>
            {droits.peutAdministrer && <div><Bouton type="submit" enCours={enCours}>Enregistrer</Bouton></div>}
          </form>
        )}
      </Etats>
    </div>
  );
}

export default function Parametres() {
  const [section, setSection] = useState('compte');
  return (
    <>
      <PageHeader titre="Paramètres" sousTitre="Gérez vos informations et préférences" />
      <div className="onglets" role="tablist">
        {SECTIONS.map((s) => <button key={s.id} type="button" role="tab" aria-selected={section === s.id} className={`onglet ${section === s.id ? 'actif' : ''}`} onClick={() => setSection(s.id)}>{s.label}</button>)}
      </div>
      {section === 'compte' && <Compte />}
      {section === 'apparence' && <Apparence />}
      {section === 'securite' && <Securite />}
      {section === 'sessions' && <Sessions />}
      {section === 'entreprise' && <Entreprise />}
    </>
  );
}
