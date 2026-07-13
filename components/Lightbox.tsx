'use client'

export default function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
    >
      <img src={src} alt="" className="max-w-full max-h-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl">
        ✕
      </button>
    </div>
  )
}
