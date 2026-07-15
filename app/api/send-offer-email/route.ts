import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const record = body.record

  if (record?.request_type !== 'offres' || !record?.email) {
    return NextResponse.json({ skipped: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: offers } = await supabase
    .from('current_offers')
    .select('*')
    .eq('id', 1)
    .single()

  const imagesHtml = (offers?.image_urls ?? [])
    .map((url: string) => `<img src="${url}" alt="Offre" style="width:100%;max-width:500px;margin-bottom:12px;border-radius:8px;" />`)
    .join('')

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: record.email,
    subject: 'Les offres du moment — Thermomix With Love, Hasna',
    html: `
      <p>Bonjour ${record.name ?? ''},</p>
      <p>${offers?.description ?? 'Voici les offres du moment :'}</p>
      ${imagesHtml}
      <p>N'hésite pas à me contacter pour toute question !</p>
    `,
  })

  return NextResponse.json({ success: true })
}
