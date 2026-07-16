import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pourquoi commander votre Thermomix avec moi',
  description: "Un accompagnement personnalisé avant, pendant et après votre achat de Thermomix : conseils, prise en main, recettes et suivi sur le long terme.",
}

export default function PourquoiCommanderLayout({ children }: { children: React.ReactNode }) {
  return children
}
