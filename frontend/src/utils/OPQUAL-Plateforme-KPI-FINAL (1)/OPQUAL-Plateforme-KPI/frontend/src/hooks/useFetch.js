import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Charge des données et expose { data, loading, error, reload }.
 * `chargeur` est une fonction qui retourne une promesse (appel api/*.js).
 */
export function useFetch(chargeur, deps = [], { actif = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(actif);
  const [error, setError] = useState('');
  const compteur = useRef(0);

  const charger = useCallback(async () => {
    const n = ++compteur.current;
    setLoading(true);
    setError('');
    try {
      const r = await chargeur();
      if (n === compteur.current) setData(r);
    } catch (e) {
      if (n === compteur.current) setError(e.message || 'Une erreur est survenue.');
    } finally {
      if (n === compteur.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (actif) charger();
  }, [charger, actif]);

  return { data, loading, error, reload: charger, setData };
}
