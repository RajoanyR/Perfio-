import { useMemo, useState } from 'react';
import { plageDePeriode } from '../utils/stats.js';
import { aujourdhuiISO } from '../utils/format.js';

/** État d'une barre de période (jour / semaine / mois / trimestre / année / personnalisé). */
export function usePeriode(initiale = 'mois') {
  const [type, setType] = useState(initiale);
  const [reference, setReference] = useState(new Date());
  const [perso, setPerso] = useState({ debut: aujourdhuiISO(), fin: aujourdhuiISO() });

  const plage = useMemo(() => plageDePeriode(type, reference, perso), [type, reference, perso]);

  const decaler = (sens) => {
    const d = new Date(reference);
    if (type === 'jour') d.setDate(d.getDate() + sens);
    else if (type === 'semaine') d.setDate(d.getDate() + 7 * sens);
    else if (type === 'mois') d.setMonth(d.getMonth() + sens);
    else if (type === 'trimestre') d.setMonth(d.getMonth() + 3 * sens);
    else if (type === 'annee') d.setFullYear(d.getFullYear() + sens);
    setReference(d);
  };

  return { type, setType, reference, setReference, perso, setPerso, plage, decaler };
}
