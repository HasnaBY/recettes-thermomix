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
    .map(
      (url: string) =>
        `<img src="${url}" alt="Offre Thermomix" width="100%" style="max-width:680px;width:100%;height:auto;display:block;margin:0 auto 16px auto;border-radius:8px;" />`
    )
    .join('')

  const descriptionHtml = (offers?.description ?? '')
    .split('\n')
    .filter((line: string) => line.trim() !== '')
    .map((line: string) => `<p style="margin:0 0 12px 0;">${line}</p>`)
    .join('')

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color:#FDFBF6; padding:24px; color:#3A3532;">
    <div style="max-width:720px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; border:1px solid #F0EAE0;">
      <h1 style="font-size:22px; margin:0 0 4px 0; color:#3A3532;">Thermomix With Love, Hasna</h1>
      <p style="font-size:14px; color:#3A3532aa; margin:0 0 24px 0;">Les offres du moment</p>

      <p style="margin:0 0 16px 0;">Bonjour ${record.name ?? ''},</p>

      ${descriptionHtml || '<p style="margin:0 0 16px 0;">Voici les offres du moment :</p>'}

      ${imagesHtml}

      <p style="margin:24px 0 0 0;">N'hésite pas à me contacter pour toute question !</p>
      <p style="margin:16px 0 0 0; font-size:14px; color:#3A3532aa;">À très bientôt,<br/>Hasna — Conseillère Thermomix</p>
    </div>
  </div>
  `

  await resend.emails.send({
    from: 'With Love, Hasna <onboarding@resend.dev>',
    to: record.email,
    subject: 'Les offres du moment — Thermomix With Love, Hasna',
    html,
  })

  return NextResponse.json({ success: true })
}
