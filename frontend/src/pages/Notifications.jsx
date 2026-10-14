import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Bouton, Etats, PageHeader } from '../components/ui.jsx';
import { marquerLue, marquerNonLue, notificationsUtilisateur } from '../api/notificationApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { depuis, formatDateHeure, libelle } from '../utils/format.js';

export default function Notifications() {
  const { utilisateur } = useAuth();
  const toast = useToast();
  const [filtre, setFiltre] = useState('toutes');
  const n = useFetch(() => notificationsUtilisateur(utilisateur.id_utilisateur), [utilisateur.id_utilisateur]);
  const liste = n.data || [];
  const nonLues = liste.filter((x) => !x.est_lue).length;
  const affichees = liste.filter((x) => filtre === 'toutes' || (filtre === 'non-lues' ? !x.est_lue : x.est_lue));

  const basculer = async (x) => {
    try {
      await (x.est_lue ? marquerNonLue(x.id_notification) : marquerLue(x.id_notification));
      n.reload();
    } catch (e) {
      toast.erreur(e.message);
    }
  };
  const toutLire = async () => {
    try {
      await Promise.all(liste.filter((x) => !x.est_lue).map((x) => marquerLue(x.id_notification)));
      n.reload();
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  return (
    <>
      <PageHeader titre="Notifications" sousTitre={`${nonLues} non lue${nonLues > 1 ? 's' : ''}`} actions={nonLues > 0 && <Bouton variante="secondary" onClick={toutLire}>Tout marquer comme lu</Bouton>} />
      <div className="card">
        <div className="segments" style={{ marginBottom: 16 }}>
          {[['toutes', 'Toutes'], ['non-lues', 'Non lues'], ['lues', 'Lues']].map(([id, label]) => <button key={id} type="button" className={`segment ${filtre === id ? 'actif' : ''}`} onClick={() => setFiltre(id)}>{label}</button>)}
        </div>
        <Etats loading={n.loading} error={n.error} onRetry={n.reload} vide={!affichees.length} videProps={{ titre: 'Aucune notification', texte: filtre === 'toutes' ? "Vous n'avez reçu aucune notification." : 'Aucune notification dans cette catégorie.' }}>
          <ul className="fil">
            {affichees.map((x) => (
              <li key={x.id_notification} style={{ padding: 12, borderRadius: 10, background: x.est_lue ? 'transparent' : 'var(--blue-50)' }}>
                <div className="fil-texte">
                  <div className="fil-titre">{x.message} {!x.est_lue && <Badge ton="info">Nouveau</Badge>}</div>
                  <div className="fil-detail">{libelle(x.type)} · {depuis(x.date_creation)} ({formatDateHeure(x.date_creation)})</div>
                </div>
                <Bouton variante="ghost" taille="sm" onClick={() => basculer(x)}>{x.est_lue ? 'Marquer non lue' : 'Marquer lue'}</Bouton>
              </li>
            ))}
          </ul>
        </Etats>
      </div>
    </>
  );
}
