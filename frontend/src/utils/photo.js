import { useEffect, useState } from 'react';

// La table utilisateur n'a pas de colonne « photo » : la photo est conservée dans ce navigateur,
// par utilisateur. (Pour la partager entre appareils, il faudrait une colonne en base : à valider.)
const cle = (id) => `opqual_photo_${id}`;
const EVENEMENT = 'opqual-photo';

export function lirePhoto(id) {
  if (id === undefined || id === null) return null;
  try {
    return localStorage.getItem(cle(id));
  } catch {
    return null;
  }
}

export function enregistrerPhoto(id, dataUrl) {
  localStorage.setItem(cle(id), dataUrl);
  window.dispatchEvent(new Event(EVENEMENT));
}

export function supprimerPhoto(id) {
  try {
    localStorage.removeItem(cle(id));
  } catch {
    /* ignoré */
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Recadre en carré (centre) et réduit l'image : ~20 Ko au lieu de plusieurs Mo. */
export function redimensionner(fichier, taille = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const cote = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = taille;
      canvas.height = taille;
      canvas.getContext('2d').drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, taille, taille);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Ce fichier n'est pas une image lisible."));
    };
    img.src = url;
  });
}

/** Photo (data URL) d'un utilisateur, mise à jour automatiquement. */
export function usePhoto(id) {
  const [photo, setPhoto] = useState(() => lirePhoto(id));
  useEffect(() => {
    const maj = () => setPhoto(lirePhoto(id));
    maj();
    window.addEventListener(EVENEMENT, maj);
    window.addEventListener('storage', maj);
    return () => {
      window.removeEventListener(EVENEMENT, maj);
      window.removeEventListener('storage', maj);
    };
  }, [id]);
  return photo;
}
