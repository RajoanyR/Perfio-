import { useState } from 'react';
import { Alerte, Bouton, Champ, Chargement, Etats, Modal, PageHeader } from '../components/ui.jsx';
import { ajouterPermissionAuRole, creerRole, listerPermissions, listerRoles, modifierRole, permissionsDuRole, retirerPermissionDuRole } from '../api/roleApi.js';
import { useDonnees } from '../context/DonneesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';

function RoleForm({ role, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ nom_role: role?.nom_role ?? '', description: role?.description ?? '' });
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const soumettre = async (ev) => {
    ev?.preventDefault();
    if (!f.nom_role.trim()) return setErreur('Le nom du rôle est obligatoire.');
    setErreur('');
    setEnCours(true);
    try {
      const dto = { nom_role: f.nom_role.trim() };
      if (f.description.trim()) dto.description = f.description.trim();
      if (role) await modifierRole(role.id_role, dto);
      else await creerRole(dto);
      toast.succes(role ? 'Rôle modifié.' : 'Rôle créé.');
      onSaved();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  };
  return (
    <Modal titre={role ? 'Modifier le rôle' : 'Nouveau rôle'} onClose={onClose} pied={<><Bouton variante="secondary" onClick={onClose}>Annuler</Bouton><Bouton enCours={enCours} onClick={soumettre}>Enregistrer</Bouton></>}>
      <form onSubmit={soumettre} noValidate className="pile">
        {erreur && <Alerte>{erreur}</Alerte>}
        <Champ label="Nom du rôle" requis><input value={f.nom_role} maxLength={50} onChange={(e) => setF({ ...f, nom_role: e.target.value })} /></Champ>
        <Champ label="Description"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Champ>
      </form>
    </Modal>
  );
}

function PermissionsDuRole({ role, onClose }) {
  const toast = useToast();
  const toutes = useFetch(() => listerPermissions(), []);
  const liees = useFetch(() => permissionsDuRole(role.id_role), [role.id_role]);
  const [occupe, setOccupe] = useState(null);
  const ids = new Set((liees.data || []).map((l) => String(l.id_permission)));

  const basculer = async (p) => {
    setOccupe(p.id_permission);
    try {
      if (ids.has(String(p.id_permission))) await retirerPermissionDuRole(role.id_role, p.id_permission);
      else await ajouterPermissionAuRole(role.id_role, p.id_permission);
      liees.reload();
    } catch (e) {
      toast.erreur(e.message);
    } finally {
      setOccupe(null);
    }
  };

  return (
    <Modal titre={`Permissions — ${role.nom_role}`} onClose={onClose} large>
      {toutes.loading || liees.loading ? <Chargement /> : toutes.error || liees.error ? <Alerte>{toutes.error || liees.error}</Alerte> : !toutes.data?.length ? <p className="muted">Aucune permission n'est définie.</p> : (
        <ul className="fil">
          {toutes.data.map((p) => (
            <li key={p.id_permission}>
              <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2 }} checked={ids.has(String(p.id_permission))} disabled={occupe === p.id_permission} onChange={() => basculer(p)} aria-label={p.nom_permission} />
              <div className="fil-texte"><div className="fil-titre">{p.nom_permission}</div><div className="fil-detail">{p.code_permission}{p.description ? ` — ${p.description}` : ''}</div></div>
            </li>
          ))}
        </ul>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>Ces associations sont enregistrées dans le backend. Il ne les applique pas encore sur ses routes : elles servent de référence.</p>
    </Modal>
  );
}

export default function Roles() {
  const { recharger } = useDonnees();
  const r = useFetch(() => listerRoles(), []);
  const [modale, setModale] = useState(null);
  return (
    <>
      <PageHeader titre="Rôles" sousTitre="Rôles de l'entreprise et permissions associées" actions={<Bouton icone="plus" onClick={() => setModale({ type: 'form' })}>Nouveau rôle</Bouton>} />
      <div className="card">
        <Etats loading={r.loading} error={r.error} onRetry={r.reload} vide={!r.data?.length} videProps={{ titre: 'Aucun rôle' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Rôle</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                {r.data?.map((x) => (
                  <tr key={x.id_role}>
                    <td data-label="Rôle" className="cellule-principale">{x.nom_role}</td>
                    <td data-label="Description">{x.description || '—'}</td>
                    <td data-label="Actions"><div className="ligne" style={{ gap: 4 }}><Bouton variante="secondary" taille="sm" onClick={() => setModale({ type: 'perms', role: x })}>Permissions</Bouton><Bouton variante="ghost" taille="sm" icone="edit" onClick={() => setModale({ type: 'form', role: x })}>Modifier</Bouton></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Etats>
      </div>
      {modale?.type === 'form' && <RoleForm role={modale.role} onClose={() => setModale(null)} onSaved={() => { setModale(null); r.reload(); recharger(); }} />}
      {modale?.type === 'perms' && <PermissionsDuRole role={modale.role} onClose={() => setModale(null)} />}
    </>
  );
}
