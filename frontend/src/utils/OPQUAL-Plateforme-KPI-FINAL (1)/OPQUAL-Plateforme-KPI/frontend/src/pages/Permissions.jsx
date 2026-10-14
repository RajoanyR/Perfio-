import { useState } from 'react';
import { Alerte, Bouton, Champ, Etats, Modal, PageHeader } from '../components/ui.jsx';
import { creerPermission, listerPermissions, modifierPermission } from '../api/roleApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';

function PermissionForm({ permission, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ code_permission: permission?.code_permission ?? '', nom_permission: permission?.nom_permission ?? '', description: permission?.description ?? '' });
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const soumettre = async (ev) => {
    ev?.preventDefault();
    if (!f.code_permission.trim() || !f.nom_permission.trim()) return setErreur('Le code et le nom sont obligatoires.');
    setErreur('');
    setEnCours(true);
    try {
      const dto = { code_permission: f.code_permission.trim(), nom_permission: f.nom_permission.trim() };
      if (f.description.trim()) dto.description = f.description.trim();
      if (permission) await modifierPermission(permission.id_permission, dto);
      else await creerPermission(dto);
      toast.succes(permission ? 'Permission modifiée.' : 'Permission créée.');
      onSaved();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  };
  return (
    <Modal titre={permission ? 'Modifier la permission' : 'Nouvelle permission'} onClose={onClose} pied={<><Bouton variante="secondary" onClick={onClose}>Annuler</Bouton><Bouton enCours={enCours} onClick={soumettre}>Enregistrer</Bouton></>}>
      <form onSubmit={soumettre} noValidate className="pile">
        {erreur && <Alerte>{erreur}</Alerte>}
        <Champ label="Code" requis aide="Unique, ex. PROJET_CREER"><input value={f.code_permission} maxLength={100} onChange={(e) => setF({ ...f, code_permission: e.target.value })} /></Champ>
        <Champ label="Nom" requis><input value={f.nom_permission} maxLength={100} onChange={(e) => setF({ ...f, nom_permission: e.target.value })} /></Champ>
        <Champ label="Description"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Champ>
      </form>
    </Modal>
  );
}

export default function Permissions() {
  const p = useFetch(() => listerPermissions(), []);
  const [modale, setModale] = useState(null);
  return (
    <>
      <PageHeader titre="Permissions" sousTitre="Catalogue des permissions disponibles" actions={<Bouton icone="plus" onClick={() => setModale({})}>Nouvelle permission</Bouton>} />
      <div className="card">
        <Etats loading={p.loading} error={p.error} onRetry={p.reload} vide={!p.data?.length} videProps={{ titre: 'Aucune permission' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Code</th><th>Nom</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                {p.data?.map((x) => (
                  <tr key={x.id_permission}>
                    <td data-label="Code" className="cellule-principale">{x.code_permission}</td>
                    <td data-label="Nom">{x.nom_permission}</td>
                    <td data-label="Description">{x.description || '—'}</td>
                    <td data-label="Actions"><Bouton variante="ghost" taille="sm" icone="edit" onClick={() => setModale({ permission: x })}>Modifier</Bouton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Etats>
      </div>
      {modale && <PermissionForm permission={modale.permission} onClose={() => setModale(null)} onSaved={() => { setModale(null); p.reload(); }} />}
    </>
  );
}
