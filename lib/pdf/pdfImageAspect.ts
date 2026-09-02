// Ratio approximatif d'une case du PDF menu (largeur/hauteur de la zone photo),
// calculé à partir des dimensions A4 (210 x 297mm) et des pourcentages utilisés
// dans lib/pdf/MenuPdfDocument.tsx. Sert à guider le recadrage de la photo menu
// pour qu'elle corresponde exactement à l'espace disponible dans le PDF.
export const MENU_PHOTO_ASPECT = 2.8