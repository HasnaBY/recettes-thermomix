'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function NewRecipe() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')
  const [cookidooUrl, setCookidooUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    let imageUrl = null

    if (imageFile) {
      try {
        const compressed = await imageCompression(imageFile, {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })

        const fileName = `${Date.now()}-${imageFile.name.replace(/\.[^.]+$/, '')}.webp`

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, compressed)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      } catch (err: any) {
        setError('Erreur upload image : ' + err.message)
        setUploading(false)
        return
      }
    }

    const { error: insertError } = await supabase.from('recipes').insert({
      title,
      description,
      category,
      time_minutes: parseInt(timeMinutes) || null,
      cookidoo_url: cookidooUrl || null,
      image_url: imageUrl,
    })

    if (insertError) {
      setError(insertError.message)
      setUploading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ajouter une recette</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          placeholder="Catégorie (ex: plat, dessert...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="number"
          placeholder="Temps (minutes)"
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        
