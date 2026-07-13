import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="font-display text-2xl text-[#3A3532] mb-4">Page introuvable</h1>
      <p className="text-[#3A3532]/70 mb-6">
        Cette page n'existe pas ou n'est plus disponible.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
