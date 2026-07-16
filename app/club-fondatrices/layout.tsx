import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Le Cercle With Love — Avantages clientes Thermomix',
  description: "Rejoignez Le Cercle With Love : recettes exclusives, challenges mensuels et accompagnement prioritaire réservés à mes clientes Thermomix.",
}

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return children
}
