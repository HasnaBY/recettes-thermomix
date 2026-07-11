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
    <section className="px-6 sm:px-8 py-10 bg-gray-50 text-center mt-10">
      <p className="text-gray-700 mb-4 max-w-md mx-auto">{text}</p>
      <Link
        href={href}
        className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors no-underline"
      >
        {buttonLabel}
      </Link>
    </section>
  )
}
