import { useMemo, useState } from 'react';

/** Tri + pagination côté client pour les tableaux. */
export function useTableau(lignes, { parPage = 10, triInitial = null } = {}) {
  const [page, setPage] = useState(1);
  const [tri, setTri] = useState(triInitial); // { cle, sens: 'asc'|'desc', valeur: fn }

  const triees = useMemo(() => {
    if (!tri) return lignes;
    const f = tri.valeur;
    return [...lignes].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      if (x === y) return 0;
      if (x === null || x === undefined || x === '') return 1;
      if (y === null || y === undefined || y === '') return -1;
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fr');
      return tri.sens === 'asc' ? r : -r;
    });
  }, [lignes, tri]);

  const nbPages = Math.max(1, Math.ceil(triees.length / parPage));
  const pageCourante = Math.min(page, nbPages);
  const visibles = triees.slice((pageCourante - 1) * parPage, pageCourante * parPage);

  const trierPar = (colonne) => {
    if (!colonne.tri) return;
    setPage(1);
    setTri((t) => (t?.cle === colonne.cle ? { ...t, sens: t.sens === 'asc' ? 'desc' : 'asc' } : { cle: colonne.cle, sens: 'asc', valeur: colonne.tri }));
  };

  return { visibles, page: pageCourante, nbPages, setPage, tri, trierPar, total: lignes.length };
}
