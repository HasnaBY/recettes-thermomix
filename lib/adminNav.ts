export type AdminLink = { href: string; label: string }
export type AdminSection = { title: string; links: AdminLink[] }

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: 'Vue d\'ensemble',
    links: [
      { href: '/admin', label: '🏠 Accueil admin' },
      { href: '/admin/dashboard', label: '📊 Tableau de bord' },
    ],
  },
  {
    title: 'Contenu du site',
    links: [
      { href: '/admin/homepage', label: "Modifier l'accueil" },
      { href: '/admin/about', label: 'Modifier "Qui suis-je ?"' },
      { href: '/admin/why-order', label: 'Modifier "Pourquoi commander"' },
      { href: '/admin/club', label: 'Gérer le Cercle With Love' },
      { href: '/admin/contest', label: 'Modifier "Grand Concours"' },
      { href: '/admin/brand-photos', label: 'Photos de marque' },
      { href: '/admin/site-settings', label: 'Visibilité des pages & réglages' },
    ],
  },
  {
    title: 'Recettes',
    links: [
      { href: '/admin/new-recipe', label: '+ Ajouter une recette' },
      { href: '/admin/import-recipe', label: 'Importer une recette (lien/texte)' },
      { href: '/admin/recipe-creator', label: 'Créer depuis des ingrédients' },
      { href: '/admin/recipe-lists', label: 'Gérer les listes de recettes' },
      { href: '/admin/featured-recipes', label: 'Recettes mises en avant (ordre)' },
    ],
  },
  {
    title: 'Astuces & challenge',
    links: [
      { href: '/admin/tips', label: 'Gérer les astuces Thermomix' },
      { href: '/admin/challenge', label: 'Gérer le challenge du mois' },
    ],
  },
  {
    title: 'Témoignages & confiance',
    links: [
      { href: '/admin/testimonials', label: 'Gérer les témoignages' },
      { href: '/admin/social-proof', label: 'Gérer "Elles m\'ont fait confiance"' },
    ],
  },
  {
    title: 'Contact & offres',
    links: [
      { href: '/admin/messages', label: 'Messages de contact' },
      { href: '/admin/contact-settings', label: 'Réglages contact' },
      { href: '/admin/offers', label: 'Offres du moment' },
    ],
  },
  {
    title: 'Parrainage',
    links: [{ href: '/admin/referrals', label: 'Gérer le parrainage' }],
  },
  {
    title: 'Intelligence artificielle',
    links: [
      { href: '/admin/ai-settings', label: 'Activer/désactiver les fonctionnalités IA' },
      { href: '/admin/newsletter', label: 'Générer une newsletter' },
      { href: '/admin/menus', label: 'Voir tous les menus générés' },
      { href: '/admin/assign-menu', label: 'Générer un menu pour une cliente' },
    ],
  },
]