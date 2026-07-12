import Link from 'next/link'

export default function CtaBanner({
  text,
  buttonLabel,
  href,
}: {
  text: string
  buttonLabel: string
  href: string
}) {
  return (
    <section className="px-6 sm:px-8 py-10 bg-[#DCEAF0]/30 text-center mt-10 rounded-2xl">
      <p className="text-[#3A3532]/70 mb-4 max-w-md mx-auto">{text}</p>
      <Link
        href={href}
        className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
      >
        {buttonLabel}
      </Link>
    </section>
  )
}
