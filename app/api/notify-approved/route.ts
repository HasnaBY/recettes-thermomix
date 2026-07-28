import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const record = body.record
  const oldRecord = body.old_record

  // On n'envoie l'email que lors du passage de non-approuvé à approuvé
  const justApproved = record?.approved === true && oldRecord?.approved === false

  if (!justApproved || !record?.email) {
    return NextResponse.json({ skipped: true })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.withlovehasna.com'

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color:#FDFBF6; padding:24px; color:#3A3532;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; border:1px solid #F0EAE0;">
      <h1 style="font-size:22px; margin:0 0 4px 0; color:#3A3532;">Thermomix With Love, Hasna</h1>
      <p style="font-size:14px; color:#3A3532aa; margin:0 0 24px 0;">Ton compte est validé !</p>

      <p style="margin:0 0 16px 0;">Bonjour ${record.full_name ?? ''},</p>

      <p style="margin:0 0 16px 0;">
        Bonne nouvelle : ton compte vient d'être validé. Tu as maintenant accès à toutes
        les recettes, astuces, et au challenge du mois sur le site.
      </p>

      <div style="text-align:center; margin:24px 0;">
        <a href="${siteUrl}/recettes" style="display:inline-block; padding:12px 24px; background:#3A3532; color:#FDFBF6; border-radius:999px; text-decoration:none; font-weight:bold;">
          Découvrir mes recettes
        </a>
      </div>

      <p style="margin:24px 0 0 0;">À très bientôt,<br/>Hasna — Conseillère Thermomix</p>
    </div>
  </div>
  `

  await resend.emails.send({
    from: 'With Love, Hasna <onboarding@resend.dev>',
    to: record.email,
    subject: 'Ton compte est validé — Thermomix With Love, Hasna',
    html,
  })

  return NextResponse.json({ success: true })
}