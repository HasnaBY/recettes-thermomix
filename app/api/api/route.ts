import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const LABELS: Record<string, { subject: string; adminPath: string }> = {
  new_account: { subject: 'Nouvelle demande de compte', adminPath: '/admin' },
  new_testimonial: { subject: 'Nouveau témoignage à valider', adminPath: '/admin/testimonials' },
  new_public_testimonial: { subject: 'Nouvel avis public à valider', adminPath: '/admin/testimonials' },
  new_referral: { subject: 'Nouveau parrainage déclaré', adminPath: '/admin/referrals' },
  new_club_signup: { subject: 'Nouvelle demande pour Le Cercle', adminPath: '/admin/club' },
  new_contact_message: { subject: 'Nouveau message de contact', adminPath: '/admin/messages' },
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  atelier: 'Réserver un atelier',
  demo: 'Demander une démonstration',
  rappel: 'Être rappelé(e)',
  question: 'Poser une question',
  offres: "Recevoir les offres du moment",
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const type = request.nextUrl.searchParams.get('type') as string
  const body = await request.json()
  const record = body.record

  const config = LABELS[type]
  if (!config) {
    return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://recettes-thermomix.vercel.app'

  let detail: string

  if (type === 'new_contact_message') {
    const requestTypeLabel = CONTACT_TYPE_LABELS[record?.request_type] ?? record?.request_type ?? 'Non précisé'
    detail = [
      `Type de demande : ${requestTypeLabel}`,
      `Nom : ${record?.name ?? '-'}`,
      `Email : ${record?.email ?? '-'}`,
      record?.phone ? `Téléphone : ${record.phone}` : null,
      record?.message ? `Message : ${record.message}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  } else {
    detail =
      record?.email ??
      record?.content ??
      record?.name ??
      record?.message ??
      'Nouvelle entrée à examiner'
  }

  const subjectSuffix =
    type === 'new_contact_message' && record?.request_type
      ? ` — ${CONTACT_TYPE_LABELS[record.request_type] ?? record.request_type}`
      : ''

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: process.env.ADMIN_EMAIL!,
    subject: `${config.subject}${subjectSuffix} — Thermomix With Love`,
    text: `${config.subject}\n\n${detail}\n\nVoir : ${siteUrl}${config.adminPath}`,
  })

  return NextResponse.json({ success: true })
}
