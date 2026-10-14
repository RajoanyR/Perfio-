import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TacheModal from '../components/TacheModal.jsx';
import TransfertModal from '../components/TransfertModal.jsx';
import Icon from '../components/Icon.jsx';
import { Alerte, Avatar, Badge, Bouton, Champ, Chargement, EtatVide, ModaleConfirmation, PageHeader } from '../components/ui.jsx';
import {
  activitesTache, ajouterActivite, ajouterCommentaire, changerEtatTache,
  commentairesTache, historiqueTache, lireTache, modifierCommentaire, terminerTache, transfertsTache,
} from '../api/tacheApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { ETAT_TERMINE, TACHE_ETATS } from '../config/valeurs.js';
import { depuis, formatDate, formatDateHeure, formatHeures, libelle, nomComplet, num, optionsAvec } from '../utils/format.js';
import { estEnRetard } from '../utils/stats.js';

export default function TacheDetail() {
  const { id } = useParams();
  const { utilisateur, droits } = useAuth();
  const { projetParId, equipeParId, utilisateurParId, taches, recharger } = useDonnees();
  const toast = useToast();
  const tache = useFetch(() => lireTache(id), [id]);
  const commentaires = useFetch(() => commentairesTache(id), [id]);
  const activites = useFetch(() => activitesTache(id), [id]);
  const historique = useFetch(() => historiqueTache(id), [id]);
  const transferts = useFetch(() => transfertsTache(id), [id]);

  const [onglet, setOnglet] = useState('commentaires');
  const [modale, setModale] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const t = tache.data;
  if (tache.loading) return <Chargement />;
  if (tache.error) return <Alerte onRetry={tache.reload}>{tache.error}</Alerte>;
  if (!t) return null;

  const estResponsable = t.id_responsable === utilisateur.id_utilisateur;
  const peutAgir = droits.peutGerer || estResponsable;
  const termine = t.etat === ETAT_TERMINE;
  const tempsPasse = (activites.data || []).reduce((s, a) => s + num(a.temps_passe), 0);

  const actualiser = () => {
    tache.reload();
    historique.reload();
    transferts.reload();
    recharger();
  };

  const changerEtat = async (etat) => {
    if (etat === t.etat) return;
    setEnCours(true);
    try {
      await changerEtatTache(t.id_tache, etat);
      toast.succes('État mis à jour.');
      actualiser();
    } catch (e) {
      toast.erreur(e.message);
    } finally {
      setEnCours(false);
    }
  };
  const terminer = async () => {
    setEnCours(true);
    try {
      await terminerTache(t.id_tache);
      toast.succes('Tâche terminée.');
      setModale(null);
      actualiser();
    } catch (e) {
      toast.erreur(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const onglets = [
    { id: 'commentaires', label: 'Commentaires', n: commentaires.data?.length },
    { id: 'activites', label: 'Activités', n: activites.data?.length },
    { id: 'historique', label: 'Historique', n: historique.data?.length },
    { id: 'transferts', label: 'Transferts', n: transferts.data?.length },
  ];

  return (
    <>
      <p style={{ marginBottom: 8 }}><Link to="/taches">← Tâches</Link></p>
      <PageHeader
        titre={t.titre}
        sousTitre={<>Projet : <Link to={`/projets/${t.id_projet}`}>{projetParId.get(t.id_projet)?.nom_projet ?? `#${t.id_projet}`}</Link></>}
        actions={
          <>
            {peutAgir && !termine && <Bouton variante="secondary" icone="check" onClick={() => setModale('terminer')}>Terminer</Bouton>}
            {droits.peutGerer && <Bouton variante="secondary" icone="transfer" onClick={() => setModale('transfert')}>Transférer la tâche</Bouton>}
            {droits.peutGerer && <Bouton icone="edit" onClick={() => setModale('edit')}>Modifier</Bouton>}
          </>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-titre"><h2>Informations</h2></div>
        <div className="infos">
          <div>
            <div className="info-label">État</div>
            {peutAgir ? (
              <select value={t.etat} onChange={(e) => changerEtat(e.target.value)} disabled={enCours} aria-label="Changer l'état" style={{ maxWidth: 190 }}>
                {optionsAvec(TACHE_ETATS, [t], 'etat').map((v) => <option key={v} value={v}>{libelle(v)}</option>)}
              </select>
            ) : <Badge valeur={t.etat} />}
          </div>
          <div><div className="info-label">Priorité</div><Badge valeur={t.priorite} /></div>
          <div><div className="info-label">Responsable</div><div className="ligne" style={{ gap: 8 }}><Avatar utilisateur={utilisateurParId.get(t.id_responsable)} taille={26} /><span className="info-valeur">{nomComplet(utilisateurParId.get(t.id_responsable))}</span></div></div>
          <div><div className="info-label">Équipe</div><div className="info-valeur">{equipeParId.get(t.id_equipe)?.nom_equipe ?? '—'}</div></div>
          <div><div className="info-label">Temps estimé</div><div className="info-valeur">{formatHeures(t.temps_estime)}</div></div>
          <div><div className="info-label">Temps passé (activités)</div><div className="info-valeur">{activites.loading ? '…' : formatHeures(tempsPasse)}</div></div>
          <div><div className="info-label">Début</div><div className="info-valeur">{formatDate(t.date_debut)}</div></div>
          <div><div className="info-label">Échéance</div><div className="info-valeur">{formatDate(t.date_limite)} {estEnRetard(t) && <Badge ton="danger">En retard</Badge>}</div></div>
          <div><div className="info-label">Terminée le</div><div className="info-valeur">{formatDateHeure(t.date_terminaison)}</div></div>
          <div><div className="info-label">Créée le</div><div className="info-valeur">{formatDateHeure(t.date_creation)}</div></div>
        </div>
        {t.description && <p style={{ marginTop: 18 }}>{t.description}</p>}
      </div>

      <div className="card">
        <div className="onglets" role="tablist">
          {onglets.map((o) => (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} className={`onglet ${onglet === o.id ? 'actif' : ''}`} onClick={() => setOnglet(o.id)}>
              {o.label}{o.n !== undefined ? ` (${o.n})` : ''}
            </button>
          ))}
        </div>
        {onglet === 'commentaires' && <Commentaires idTache={t.id_tache} source={commentaires} />}
        {onglet === 'activites' && <Activites idTache={t.id_tache} source={activites} />}
        {onglet === 'historique' && <Historique source={historique} />}
        {onglet === 'transferts' && <Transferts source={transferts} />}
      </div>

      {modale === 'edit' && <TacheModal tache={t} onClose={() => setModale(null)} onSaved={() => { setModale(null); actualiser(); }} />}
      {modale === 'transfert' && (
        <TransfertModal
          tache={t}
          onClose={() => setModale(null)}
          onSaved={() => {
            // Le transfert et son historique sont enregistrés par le serveur.
            setModale(null);
            actualiser();
          }}
        />
      )}
      {modale === 'terminer' && <ModaleConfirmation titre="Terminer la tâche" message="Voulez-vous vraiment marquer cette tâche comme terminée ?" confirmer="Terminer" enCours={enCours} onConfirm={terminer} onClose={() => setModale(null)} />}
    </>
  );
}

// ---------- Sections ----------
function Section({ source, vide, children }) {
  if (source.loading) return <Chargement />;
  if (source.error) return <Alerte onRetry={source.reload}>{source.error}</Alerte>;
  if (!source.data?.length) return vide;
  return children;
}

function Commentaires({ idTache, source }) {
  const { utilisateur, droits } = useAuth();
  const { utilisateurParId } = useDonnees();
  const toast = useToast();
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [edition, setEdition] = useState(null); // { id, contenu }
  const [erreur, setErreur] = useState('');

  const envoyer = async (ev) => {
    ev.preventDefault();
    if (!texte.trim()) return setErreur('Saisissez un commentaire.');
    setErreur('');
    setEnCours(true);
    try {
      await ajouterCommentaire(idTache, { id_utilisateur: utilisateur.id_utilisateur, contenu: texte.trim() });
      setTexte('');
      source.reload();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  };
  const enregistrer = async () => {
    if (!edition.contenu.trim()) return;
    try {
      await modifierCommentaire(edition.id, { contenu: edition.contenu.trim() });
      setEdition(null);
      toast.succes('Commentaire modifié.');
      source.reload();
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  return (
    <div className="pile">
      <form onSubmit={envoyer} className="pile" noValidate>
        {erreur && <Alerte>{erreur}</Alerte>}
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ajouter un commentaire…" aria-label="Nouveau commentaire" />
        <div><Bouton type="submit" enCours={enCours} icone="send">Commenter</Bouton></div>
      </form>
      <Section source={source} vide={<EtatVide titre="Aucun commentaire" texte="Soyez le premier à commenter cette tâche." />}>
        <ul className="fil">
          {source.data?.map((c) => {
            const auteur = utilisateurParId.get(c.id_utilisateur);
            const mien = c.id_utilisateur === utilisateur.id_utilisateur;
            return (
              <li key={c.id_commentaire}>
                <Avatar utilisateur={auteur} taille={34} />
                <div className="fil-texte">
                  <div className="fil-titre">{nomComplet(auteur)} <span className="fil-quand">· {formatDateHeure(c.date_creation)}{c.date_modification ? ' (modifié)' : ''}</span></div>
                  {edition?.id === c.id_commentaire ? (
                    <div className="pile" style={{ marginTop: 6 }}>
                      <textarea value={edition.contenu} onChange={(e) => setEdition({ ...edition, contenu: e.target.value })} />
                      <div className="ligne"><Bouton taille="sm" onClick={enregistrer}>Enregistrer</Bouton><Bouton taille="sm" variante="ghost" onClick={() => setEdition(null)}>Annuler</Bouton></div>
                    </div>
                  ) : (
                    <p style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{c.contenu}</p>
                  )}
                </div>
                {(mien || droits.estAdmin) && edition?.id !== c.id_commentaire && (
                  <button type="button" className="icon-btn" aria-label="Modifier le commentaire" onClick={() => setEdition({ id: c.id_commentaire, contenu: c.contenu })}><Icon name="edit" size={16} /></button>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

function Activites({ idTache, source }) {
  const { utilisateur } = useAuth();
  const { utilisateurParId } = useDonnees();
  const [f, setF] = useState({ temps_passe: '', description: '' });
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  const envoyer = async (ev) => {
    ev.preventDefault();
    const h = Number(f.temps_passe);
    if (f.temps_passe === '' || Number.isNaN(h) || h <= 0) return setErreur('Saisissez un temps passé supérieur à 0 (en heures).');
    setErreur('');
    setEnCours(true);
    try {
      const dto = { id_utilisateur: utilisateur.id_utilisateur, temps_passe: h };
      if (f.description.trim()) dto.description = f.description.trim();
      await ajouterActivite(idTache, dto);
      setF({ temps_passe: '', description: '' });
      source.reload();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="pile">
      <form onSubmit={envoyer} noValidate className="grille-champs">
        {erreur && <div className="plein"><Alerte>{erreur}</Alerte></div>}
        <Champ label="Temps passé (heures)"><input type="number" min="0" step="0.25" value={f.temps_passe} onChange={(e) => setF({ ...f, temps_passe: e.target.value })} /></Champ>
        <Champ label="Travail effectué"><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description (facultatif)" /></Champ>
        <div><Bouton type="submit" enCours={enCours} icone="plus">Imputer du temps</Bouton></div>
      </form>
      <Section source={source} vide={<EtatVide titre="Aucune activité" texte="Aucun temps n'a encore été imputé sur cette tâche." />}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Collaborateur</th><th>Description</th><th>Durée</th></tr></thead>
            <tbody>
              {source.data?.map((a) => (
                <tr key={a.id_activite}>
                  <td data-label="Date">{formatDateHeure(a.date_activite)}</td>
                  <td data-label="Collaborateur">{nomComplet(utilisateurParId.get(a.id_utilisateur))}</td>
                  <td data-label="Description">{a.description || '—'}</td>
                  <td data-label="Durée" className="cellule-principale">{formatHeures(a.temps_passe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Historique({ source }) {
  const { utilisateurParId } = useDonnees();
  return (
    <Section source={source} vide={<EtatVide titre="Aucun historique" texte="Les changements d'état et transferts apparaîtront ici." />}>
      <ul className="chronologie">
        {source.data?.map((h) => (
          <li key={h.id_historique}>
            <div className="fil-titre">{libelle(h.action)}</div>
            {h.description && <div>{h.description}</div>}
            <div className="fil-detail">{formatDateHeure(h.date_action)}{h.id_utilisateur ? ` · ${nomComplet(utilisateurParId.get(h.id_utilisateur))}` : ''}</div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Transferts({ source }) {
  const { utilisateurParId, equipeParId } = useDonnees();
  return (
    <Section source={source} vide={<EtatVide titre="Aucun transfert" texte="Cette tâche n'a jamais été transférée." />}>
      <ul className="chronologie">
        {source.data?.map((x) => (
          <li key={x.id_transfert}>
            <div className="fil-titre">
              {nomComplet(utilisateurParId.get(x.ancien_responsable))} ({equipeParId.get(x.ancienne_equipe)?.nom_equipe ?? '—'}) → {nomComplet(utilisateurParId.get(x.nouveau_responsable))} ({equipeParId.get(x.nouvelle_equipe)?.nom_equipe ?? '—'})
            </div>
            <div>{x.motif}</div>
            <div className="fil-detail">{formatDateHeure(x.date_transfert)} · par {nomComplet(utilisateurParId.get(x.utilisateur_transfert))}</div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
