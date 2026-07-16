import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recettes Thermomix testées et approuvées',
  description: 'Découvre ma sélection de recettes Thermomix testées personnellement : plats du quotidien, desserts et recettes healthy pour toute la famille.',
}

export default function RecettesLayout({ children }: { children: React.ReactNode }) {
  return children
}
