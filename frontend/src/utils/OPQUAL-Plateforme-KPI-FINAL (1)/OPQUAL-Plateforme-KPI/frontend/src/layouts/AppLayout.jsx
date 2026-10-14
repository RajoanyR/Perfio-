import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Avatar, Modal } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { DonneesProvider } from '../context/DonneesContext.jsx';
import { useInactivite } from '../hooks/useInactivite.js';
import { notificationsUtilisateur } from '../api/notificationApi.js';
import { lireUtilisateur, modifierUtilisateur } from '../api/utilisateurApi.js';
import { THEME_CLAIR, THEME_SOMBRE } from '../config/valeurs.js';
import { depuis, nomComplet } from '../utils/format.js';
import logoBlanc from '../assets/logo-blanc.png';
import { NOM_APPLICATION, NOM_ENTREPRISE, SLOGAN } from '../config/app.js';

// Menu de gauche : visible par défaut ; l'utilisateur peut le masquer (il devient un menu « hamburger »).
const CLE_MENU_MASQUE = 'opqual_menu_masque';
const lireMenuMasque = () => {
  try {
    return localStorage.getItem(CLE_MENU_MASQUE) === '1';
  } catch {
    return false;
  }
};

// Chaque entrée de menu correspond à une page réellement connectée à l'API.
function groupesMenu(droits) {
  const groupes = [
    {
      titre: 'Pilotage',
      liens: [
        { to: '/dashboard', label: 'Tableau de bord', icone: 'dashboard' },
        { to: '/performance', label: 'Ma performance', icone: 'performance' },
        { to: '/kpi', label: 'Analyse KPI', icone: 'kpi' },
        { to: '/rapports', label: 'Rapports et exports', icone: 'rapport' },
      ],
    },
    {
      titre: 'Exécution',
      liens: [
        { to: '/projets', label: 'Projets', icone: 'projet' },
        { to: '/taches', label: 'Tâches', icone: 'taches' },
        { to: '/suivi-temps', label: 'Suivi du temps', icone: 'temps' },
      ],
    },
    {
      titre: 'Organisation',
      liens: [
        { to: '/equipes', label: 'Équipes', icone: 'equipes' },
        { to: '/collaborateurs', label: 'Collaborateurs', icone: 'user' },
      ],
    },
  ];
  const admin = [{ to: '/parametres', label: 'Paramètres', icone: 'settings' }];
  if (droits.peutAdministrer) {
    admin.unshift({ to: '/roles', label: 'Rôles', icone: 'shield' }, { to: '/permissions', label: 'Permissions', icone: 'key' });
  }
  groupes.push({ titre: 'Administration', liens: admin });
  return groupes;
}

function Sidebar({ ouverte, fermer, masque, basculerMasque }) {
  const { droits } = useAuth();
  return (
    <>
      <div className={`sidebar-voile ${ouverte ? 'ouverte' : ''}`} onClick={fermer} />
      <aside className={`sidebar ${ouverte ? 'ouverte' : ''}`} aria-label="Navigation principale">
        <div className="sidebar-marque">
          <img src={logoBlanc} alt={NOM_ENTREPRISE} />
          <div>
            <strong>{NOM_APPLICATION}</strong>
            <span>{SLOGAN}</span>
          </div>
          <button
            type="button"
            className="sidebar-bascule"
            onClick={basculerMasque}
            aria-label={masque ? 'Garder le menu affiché' : 'Masquer le menu'}
            title={masque ? 'Garder le menu affiché' : 'Masquer le menu'}
          >
            <Icon name={masque ? 'pin' : 'chevron-left'} size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {groupesMenu(droits).map((g) => (
            <div key={g.titre}>
              <div className="nav-groupe">{g.titre}</div>
              {g.liens.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-lien ${isActive ? 'actif' : ''}`} onClick={fermer}>
                  <Icon name={l.icone} size={18} />
                  {l.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function Header({ ouvrirMenu }) {
  const { utilisateur, role, deconnecter } = useAuth();
  const { sombre, basculer } = useTheme();
  const navigate = useNavigate();
  const lieu = useLocation();
  const [menu, setMenu] = useState(null); // 'notifs' | 'profil' | null
  const [notifs, setNotifs] = useState([]);
  const zoneNotifs = useRef(null);
  const zoneProfil = useRef(null);

  // Notifications : au chargement, à chaque changement de page puis toutes les 60 s
  useEffect(() => {
    let actif = true;
    const charger = () =>
      notificationsUtilisateur(utilisateur.id_utilisateur)
        .then((n) => actif && setNotifs(n))
        .catch(() => {});
    charger();
    const t = setInterval(charger, 60000);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [utilisateur.id_utilisateur, lieu.pathname]);

  useEffect(() => {
    // Un clic n'est « extérieur » que s'il tombe hors des DEUX zones (notifications et profil).
    const clic = (e) => {
      const dedans = [zoneNotifs.current, zoneProfil.current].some((z) => z && z.contains(e.target));
      if (!dedans) setMenu(null);
    };
    document.addEventListener('mousedown', clic);
    return () => document.removeEventListener('mousedown', clic);
  }, []);
  useEffect(() => setMenu(null), [lieu.pathname]);

  const nonLues = notifs.filter((n) => !n.est_lue).length;

  // Le thème est conservé localement ; on tente aussi de l'enregistrer dans utilisateur.theme.
  const changerTheme = () => {
    basculer();
    modifierUtilisateur(utilisateur.id_utilisateur, { theme: sombre ? THEME_CLAIR : THEME_SOMBRE }).catch(() => {});
  };

  return (
    <header className="header">
      <button type="button" className="icon-btn menu-mobile" onClick={ouvrirMenu} aria-label="Ouvrir le menu">
        <Icon name="menu" />
      </button>
      <div className="header-espace" />
      <button type="button" className="icon-btn" onClick={changerTheme} aria-label={sombre ? 'Passer au thème clair' : 'Passer au thème sombre'} title={sombre ? 'Thème clair' : 'Thème sombre'}>
        <Icon name={sombre ? 'sun' : 'moon'} />
      </button>

      <div className="relatif" ref={zoneNotifs}>
        <button type="button" className="icon-btn" onClick={() => setMenu(menu === 'notifs' ? null : 'notifs')} aria-label={`Notifications (${nonLues} non lues)`}>
          <Icon name="bell" />
          {nonLues > 0 && <span className="pastille">{nonLues > 9 ? '9+' : nonLues}</span>}
        </button>
        {menu === 'notifs' && (
          <div className="menu-flottant notifs-panneau">
            <div className="notifs-liste">
              {notifs.length === 0 && <p className="muted" style={{ padding: 16 }}>Aucune notification.</p>}
              {notifs.slice(0, 6).map((n) => (
                <div key={n.id_notification} className={`notif-item ${n.est_lue ? '' : 'non-lue'}`}>
                  <div>
                    <div>{n.message}</div>
                    <div className="cellule-secondaire">{depuis(n.date_creation)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="notif-pied">
              <Link to="/notifications">Voir toutes les notifications</Link>
            </div>
          </div>
        )}
      </div>

      <div className="relatif" ref={zoneProfil}>
        <button type="button" className="profil-btn" onClick={() => setMenu(menu === 'profil' ? null : 'profil')} aria-haspopup="menu">
          <Avatar utilisateur={utilisateur} />
          <span>
            <span className="profil-nom">{nomComplet(utilisateur)}</span>
            <span className="profil-role">{role?.nom_role || utilisateur.poste}</span>
          </span>
          <Icon name="chevron" size={16} />
        </button>
        {menu === 'profil' && (
          <div className="menu-flottant" role="menu">
            <button type="button" className="menu-item" onClick={() => navigate('/parametres')}>
              <Icon name="settings" size={16} /> Paramètres
            </button>
            <button type="button" className="menu-item" onClick={() => deconnecter()}>
              <Icon name="logout" size={16} /> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Interieur() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [menuMasque, setMenuMasque] = useState(lireMenuMasque);

  const changerMenuMasque = (valeur) => {
    setMenuMasque(valeur);
    setMenuOuvert(false);
    try {
      localStorage.setItem(CLE_MENU_MASQUE, valeur ? '1' : '0');
    } catch {
      /* préférence non conservée */
    }
  };
  const { utilisateur, deconnecter } = useAuth();
  const lieu = useLocation();
  const { avertissement, secondes, resterConnecte } = useInactivite(
    true,
    () => deconnecter('Vous avez été déconnecté après une période d’inactivité.'),
    () => lireUtilisateur(utilisateur.id_utilisateur), // battement : requête authentifiée existante
  );

  useEffect(() => setMenuOuvert(false), [lieu.pathname]);
  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && setMenuOuvert(false);
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, []);

  return (
    <div className={`app ${menuMasque ? 'menu-masque' : ''}`}>
      <Sidebar ouverte={menuOuvert} fermer={() => setMenuOuvert(false)} masque={menuMasque} basculerMasque={() => changerMenuMasque(!menuMasque)} />
      <div className="contenu-app">
        <Header ouvrirMenu={() => setMenuOuvert(true)} />
        <main className="page">
          <Outlet />
        </main>
      </div>

      {avertissement && (
        <Modal
          titre="Inactivité"
          onClose={resterConnecte}
          pied={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => deconnecter()}>
                Se déconnecter
              </button>
              <button type="button" className="btn btn-primary" onClick={resterConnecte}>
                Rester connecté
              </button>
            </>
          }
        >
          <p>
            <strong>Vous êtes inactif depuis 6 minutes.</strong>
          </p>
          <p className="muted" style={{ marginTop: 8 }}>
            Votre session sera fermée automatiquement dans {secondes} seconde{secondes > 1 ? 's' : ''}.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <DonneesProvider>
      <Interieur />
    </DonneesProvider>
  );
}
