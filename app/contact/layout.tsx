import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contactez votre conseillère Thermomix',
  description: "Réservez un atelier, demandez une démonstration ou posez vos questions sur le Thermomix. Réponse personnalisée garantie.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
