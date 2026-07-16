import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Qui suis-je ? Mon histoire avec le Thermomix',
  description: "Découvrez mon parcours de maman active et salariée à temps plein, et comment le Thermomix a transformé mon quotidien avant de devenir conseillère.",
}

export default function QuiSuisJeLayout({ children }: { children: React.ReactNode }) {
  return children
}
