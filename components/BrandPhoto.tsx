'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BrandPhoto({
  photoKey,
  className,
  alt,
}: {
  photoKey: string
  className?: string
  alt: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('brand_photos')
      .select('image_url')
      .eq('key', photoKey)
      .maybeSingle()
      .then(({ data }) => setUrl(data?.image_url ?? null))
  }, [photoKey])

  if (!url) return null

  return <img src={url} alt={alt} className={className} />
}
