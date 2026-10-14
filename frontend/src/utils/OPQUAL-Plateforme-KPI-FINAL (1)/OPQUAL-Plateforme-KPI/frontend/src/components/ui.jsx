import { useEffect } from 'react';
import Icon from './Icon.jsx';
import { initiales, libelle, tonDe } from '../utils/format.js';
import { couleurValeur } from '../utils/couleurs.js';
import { usePhoto } from '../utils/photo.js';

// ---------- États : chargement / vide / erreur ----------
export function Chargement({ texte = 'Chargement…' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{texte}</p>
    </div>
  );
}

export function EtatVide({ titre = 'Aucun élément', texte, action }) {
  return (
    <div className="state">
      <div className="state-icon">
        <Icon name="info" size={24} />
      </div>
      <h3>{titre}</h3>
      {texte && <p>{texte}</p>}
      {action}
    </div>
  );
}

export function Alerte({ type = 'danger', children, onRetry }) {
  return (
    <div className={`alert alert-${type}`} role={type === 'danger' ? 'alert' : 'status'}>
      <Icon name={type === 'success' ? 'check-circle' : type === 'info' ? 'info' : 'alert'} size={18} />
      <div className="alert-body">{children}</div>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

/** Gère les 3 états d'une page chargée depuis l'API. */
export function Etats({ loading, error, onRetry, vide, videProps, children }) {
  if (loading) return <Chargement />;
  if (error) return <Alerte onRetry={onRetry}>{error}</Alerte>;
  if (vide) return <EtatVide {...videProps} />;
  return children;
}

export function Skeleton({ hauteur = 16, largeur = '100%' }) {
  return <span className="skeleton" style={{ height: hauteur, width: largeur }} />;
}

// ---------- Badges & avatar ----------
export function Badge({ valeur, ton, children }) {
  // États et priorités : une couleur différente par valeur (voir utils/couleurs.js).
  const couleur = !ton ? couleurValeur(valeur) : null;
  if (couleur) {
    return (
      <span className="badge badge-couleur" style={{ '--bc': couleur }}>
        {children ?? libelle(valeur)}
      </span>
    );
  }
  const t = ton || tonDe(valeur);
  return <span className={`badge badge-${t}`}>{children ?? libelle(valeur)}</span>;
}

export function Avatar({ utilisateur, taille = 36 }) {
  const photo = usePhoto(utilisateur?.id_utilisateur);
  if (photo) {
    return <img className="avatar avatar-img" src={photo} alt="" style={{ width: taille, height: taille }} />;
  }
  return (
    <span className="avatar" style={{ width: taille, height: taille, fontSize: taille * 0.38 }}>
      {initiales(utilisateur)}
    </span>
  );
}

// ---------- En-tête de page ----------
export function PageHeader({ titre, sousTitre, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{titre}</h1>
        {sousTitre && <p className="muted">{sousTitre}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

// ---------- Carte KPI ----------
export function CarteKpi({ titre, valeur, detail, icone, ton = 'info', children }) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <span className="kpi-title">{titre}</span>
        {icone && (
          <span className={`kpi-icon tone-${ton}`}>
            <Icon name={icone} size={18} />
          </span>
        )}
      </div>
      <div className="kpi-main">
        <span className="kpi-value">{valeur}</span>
        {children}
      </div>
      {detail && <span className="kpi-detail">{detail}</span>}
    </div>
  );
}

// ---------- Modale ----------
export function Modal({ titre, onClose, children, pied, large = false }) {
  useEffect(() => {
    const fermer = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fermer);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', fermer);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-fond" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${large ? 'modal-large' : ''}`} role="dialog" aria-modal="true" aria-label={titre}>
        <div className="modal-tete">
          <h2>{titre}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-corps">{children}</div>
        {pied && <div className="modal-pied">{pied}</div>}
      </div>
    </div>
  );
}

export function ModaleConfirmation({ titre, message, confirmer = 'Confirmer', danger = false, enCours, onConfirm, onClose }) {
  return (
    <Modal
      titre={titre}
      onClose={onClose}
      pied={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enCours}>
            Annuler
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={enCours}>
            {enCours ? 'En cours…' : confirmer}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

// ---------- Champs de formulaire ----------
// `requis` : champ obligatoire (contrôlé à l'envoi du formulaire) ; plus d'astérisque affichée.
export function Champ({ label, erreur, aide, children }) {
  return (
    <label className="champ">
      <span className="champ-label">
        {label}
      </span>
      {children}
      {aide && !erreur && <span className="champ-aide">{aide}</span>}
      {erreur && <span className="champ-erreur">{erreur}</span>}
    </label>
  );
}

export function Bouton({ enCours, children, type = 'button', variante = 'primary', taille, icone, ...rest }) {
  return (
    <button type={type} className={`btn btn-${variante} ${taille ? `btn-${taille}` : ''}`} disabled={enCours || rest.disabled} {...rest}>
      {enCours ? <span className="spinner spinner-sm" aria-hidden="true" /> : icone ? <Icon name={icone} size={16} /> : null}
      {children}
    </button>
  );
}

// ---------- Recherche ----------
export function BarreRecherche({ valeur, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div className="recherche">
      <Icon name="search" size={16} />
      <input type="search" value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

// ---------- Tableau ----------
export function Tableau({ colonnes, tableau, cle, onLigne, vide }) {
  const { visibles, page, nbPages, setPage, tri, trierPar, total } = tableau;
  if (total === 0) return vide || <EtatVide />;
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {colonnes.map((c) => (
                <th key={c.cle} className={c.tri ? 'triable' : ''} onClick={() => trierPar(c)} aria-sort={tri?.cle === c.cle ? (tri.sens === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {c.titre}
                  {tri?.cle === c.cle && <span className="tri-fleche">{tri.sens === 'asc' ? ' ↑' : ' ↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((l) => (
              <tr key={cle(l)} className={onLigne ? 'cliquable' : ''} onClick={onLigne ? () => onLigne(l) : undefined}>
                {colonnes.map((c) => (
                  <td key={c.cle} data-label={c.titre}>
                    {c.rendu ? c.rendu(l) : c.valeur(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} nbPages={nbPages} setPage={setPage} total={total} />
    </>
  );
}

export function Pagination({ page, nbPages, setPage, total }) {
  if (nbPages <= 1) return <div className="pagination-info">{total} résultat{total > 1 ? 's' : ''}</div>;
  return (
    <div className="pagination">
      <span className="pagination-info">
        {total} résultats · page {page} sur {nbPages}
      </span>
      <div className="pagination-boutons">
        <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Page précédente">
          <Icon name="chevron-left" size={16} />
        </button>
        <button type="button" className="icon-btn" disabled={page >= nbPages} onClick={() => setPage(page + 1)} aria-label="Page suivante">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------- Barre de progression ----------
export function Progression({ valeur, ton }) {
  const v = Math.max(0, Math.min(100, valeur));
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-bar ${ton ? `tone-bg-${ton}` : ''}`} style={{ width: `${v}%` }} />
    </div>
  );
}
