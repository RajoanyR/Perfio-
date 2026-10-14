import { useCallback, useEffect, useRef, useState } from 'react';
import { activitesTache } from '../api/tacheApi.js';
import { enParallele } from '../utils/stats.js';

/**
 * Le backend n'expose les activités (temps passé) que par tâche : GET /taches/:id/activites.
 * Ce hook les charge pour une liste de tâches (6 requêtes en parallèle) et renvoie une liste à plat.
 */
export function useActivites(taches) {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const compteur = useRef(0);
  const cle = taches.map((t) => t.id_tache).join(',');

  const charger = useCallback(async () => {
    const n = ++compteur.current;
    setLoading(true);
    setError('');
    const resultats = await enParallele(taches, (t) => activitesTache(t.id_tache));
    if (n !== compteur.current) return;
    if (taches.length && resultats.every((r) => r === null)) setError('Impossible de charger les activités.');
    setActivites(resultats.flatMap((r, i) => (r || []).map((a) => ({ ...a, tache: taches[i] }))));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  useEffect(() => {
    charger();
  }, [charger]);

  return { activites, loading, error, reload: charger };
}
