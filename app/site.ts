import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://recettes-thermomix.vercel.app'

  const routes = [
    '',
    '/qui-suis-je',
    '/pourquoi-commander',
    '/club-fondatrices',
    '/recettes',
    '/listes',
    '/confiance',
    '/laisser-un-avis',
    '/parrainage',
    '/grand-concours',
    '/contact',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}
