import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Alerte, Bouton, Champ } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LogoGroupe from '../components/LogoGroupe.jsx';
import MarqueApplication from '../components/MarqueApplication.jsx';
import { NOM_APPLICATION, SLOGAN } from '../config/app.js';

const FONCTIONS = [
  { icone: 'kpi', titre: 'Suivi des KPI', texte: 'en temps réel' },
  { icone: 'dashboard', titre: 'Tableaux de bord', texte: 'interactifs' },
  { icone: 'target', titre: 'Gestion des objectifs', texte: 'et indicateurs' },
  { icone: 'shield', titre: 'Sécurité et accès', texte: 'contrôlés' },
];

export default function Login() {
  const { etat, connecter, messageSession } = useAuth();
  const navigate = useNavigate();
  const lieu = useLocation();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voir, setVoir] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [aide, setAide] = useState(false);
  const [aideCompte, setAideCompte] = useState(false);

  if (etat === 'connecte') return <Navigate to={lieu.state?.depuis || '/dashboard'} replace />;

  const valider = () => {
    const e = {};
    // Même règles que LoginDto : email valide, mot de passe non vide
    if (!email.trim()) e.email = "L'adresse e-mail est obligatoire.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "L'adresse e-mail n'est pas valide.";
    if (!motDePasse) e.motDePasse = 'Le mot de passe est obligatoire.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async (ev) => {
    ev.preventDefault();
    setErreurApi('');
    if (!valider()) return;
    setEnCours(true);
    try {
      await connecter(email.trim(), motDePasse);
      navigate(lieu.state?.depuis || '/dashboard', { replace: true });
    } catch (e) {
      // Message réel du backend (ex. « Email ou mot de passe incorrect. », « Compte temporairement verrouillé. »)
      setErreurApi(e.message || 'Une erreur est survenue.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="cx">
      <section className="cx-gauche" aria-label="Présentation">
        <div className="cx-gauche-contenu">
          <div className="cx-entete">
            <LogoGroupe couleur="blanc" largeur="8.2em" devise />
          </div>

          <div className="cx-centre">
            <h1 className="cx-marque">
              <MarqueApplication />
            </h1>
            <h2 className="cx-slogan">{SLOGAN}</h2>
            <span className="cx-trait" />
            <p className="cx-intro">
              Suivez vos KPI, analysez vos performances
              <br />
              et prenez les bonnes décisions.
            </p>
          </div>

          <div className="cx-fonctions">
            {FONCTIONS.map((f) => (
              <div className="cx-fonction" key={f.titre}>
                <span className="cx-pastille">
                  <Icon name={f.icone} size={26} />
                </span>
                <span>
                  <strong>{f.titre}</strong>
                  {f.texte}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cx-droite">
        <div className="cx-carte">
          <LogoGroupe couleur="bleu" largeur="7.4em" devise className="cx-logo-carte cx-logo-clair" />
          <LogoGroupe couleur="blanc" largeur="7.4em" devise className="cx-logo-carte cx-logo-sombre" />
          <h2>Connexion</h2>
          <p className="cx-sous">
            Connectez-vous à votre espace <strong>{NOM_APPLICATION}</strong>
          </p>

          {messageSession && <Alerte type="info">{messageSession}</Alerte>}
          {erreurApi && <Alerte>{erreurApi}</Alerte>}

          <form onSubmit={soumettre} noValidate>
            <Champ label="Adresse e-mail" erreur={erreurs.email}>
              <div className="champ-icone">
                <Icon name="mail" size={18} />
                <input type="email" autoComplete="username" placeholder="exemple@domaine.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </Champ>
            <Champ label="Mot de passe" erreur={erreurs.motDePasse}>
              <div className="champ-icone champ-mdp">
                <Icon name="lock" size={18} />
                <input type={voir ? 'text' : 'password'} autoComplete="current-password" placeholder="Votre mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
                <button type="button" className="icon-btn" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  <Icon name={voir ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </Champ>
            <div className="cx-oublie">
              <button type="button" className="login-lien" onClick={() => setAide(!aide)}>
                Mot de passe oublié ?
              </button>
            </div>
            {aide && <Alerte type="info">La réinitialisation n'est pas disponible en libre-service. Contactez votre administrateur.</Alerte>}
            <button type="submit" className="cx-bouton" disabled={enCours}>
              {enCours ? 'Connexion…' : 'Se connecter'}
              {!enCours && <Icon name="arrow" size={20} />}
            </button>
          </form>

          <button type="button" className="cx-secondaire" onClick={() => setAideCompte(!aideCompte)}>
            Créer un compte
          </button>
          {aideCompte && <Alerte type="info">Les comptes sont créés par l'administrateur. Contactez-le pour obtenir vos accès.</Alerte>}

          <p className="cx-pied">
            Groupe OPQUAL © {new Date().getFullYear()} — Tous droits réservés
          </p>
        </div>
      </section>
    </div>
  );
}
