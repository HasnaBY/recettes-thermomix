'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

type Advantage = { icon: string; title: string; text: string }

export default function AdminHomepage() {
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroParagraph3, setHeroParagraph3] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [advantages, setAdvantages] = useState<Advantage[]>([])
  const [storyTeaser, setStoryTeaser] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('homepage_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setHeroTitle(data.hero_title ?? '')
          setHeroSubtitle(data.hero_subtitle ?? '')
          setHeroParagraph3(data.hero_paragraph_3 ?? '')
          setHeroImageUrl(data.hero_image_url)
          setAdvantages(data.advantages ?? [])
          setStoryTeaser(data.story_teaser ?? '')
        }
        setLoading(false)
      })
  }, [])

  const updateAdvantage = (index: number, field: keyof Advantage, value: string) => {
    setAdvantages((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  const removeAdvantage = (index: number) => {
    setAdvantages((prev) => prev.filter((_, i) => i !== index))
  }

  const addAdvantage = () => {
    setAdvantages((prev) => [...prev, { icon: '', title: '', text: '' }])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    let finalImageUrl = heroImageUrl

    if (imageFile) {
      try {
        const compressed = await imageCompression(imageFile, {
          maxWidthOrHeight: 800,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })
        const fileName = `hero-${Date.now()}.webp`
        const { error: uploadError } = await supabase.storage
          .from('site-images')
          .upload(fileName, compressed)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('site-images').getPublicUrl(fileName)
        finalImageUrl = urlData.publicUrl
      } catch (err: any) {
        setMessage('Erreur upload image : ' + err.message)
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('homepage_content')
      .update({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_paragraph_3: heroParagraph3,
        hero_image_url: finalImageUrl,
        advantages,
        story_teaser: storyTeaser,
      })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier la page d'accueil</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Photo de présentation</label>
          {heroImageUrl && (
            <img src={heroImageUrl} alt="Aperçu" className="w-32 h-32 rounded-full object-cover mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Titre principal</label>
          <textarea
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Sous-titre</label>
          <textarea
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            3ème paragraphe (avant les boutons)
          </label>
          <textarea
            value={heroParagraph3}
            onChange={(e) => setHeroParagraph3(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-gray-700">Les avantages</label>
          <div className="flex flex-col gap-4">
            {advantages.map((a, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                <input
                  value={a.icon}
                  onChange={(e) => updateAdvantage(i, 'icon', e.target.value)}
                  placeholder="Emoji"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg w-20"
                />
                <input
                  value={a.title}
                  onChange={(e) => updateAdvantage(i, 'title', e.target.value)}
                  placeholder="Titre"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <input
                  value={a.text}
                  onChange={(e) => updateAdvantage(i, 'text', e.target.value)}
                  placeholder="Description"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeAdvantage(i)}
                  className="self-start text-sm text-red-600 border border-red-300 rounded-lg px-3 py-1"
                >
                  Retirer cet avantage
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAdvantage} className="mt-3 text-sm text-gray-700 underline">
            + Ajouter un avantage
          </button>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Teaser "Découvrez mon histoire"
          </label>
          <textarea
            value={storyTeaser}
            onChange={(e) => setStoryTeaser(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
