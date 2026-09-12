import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import LeadMagnetPdfDocument from '@/lib/pdf/LeadMagnetPdfDocument'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  const { firstName, email, phone } = await request.json()

  if (!firstName || !email || !phone) {
    return NextResponse.json({ error: 'Tous les champs sont obligatoires.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('lead_magnet_settings')
    .select('recipe_id')
    .eq('id', 1)
    .single()

  if (!settings?.recipe_id) {
    return NextResponse.json({ error: "Aucune recette n'est configurée pour l'instant." }, { status: 400 })
  }

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('title, description, image_url, ingredients, steps, prep_time_minutes, total_time_minutes')
    .eq('id', settings.recipe_id)
    .single()

  if (recipeError || !recipe) {
    return NextResponse.json({ error: 'Recette introuvable.' }, { status: 500 })
  }

  const { error: insertError } = await supabase.from('leads').insert({
    first_name: firstName,
    email,
    phone,
    recipe_id: settings.recipe_id,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { data: bg } = await supabase
    .from('brand_photos')
    .select('image_url')
    .eq('key', 'lead_magnet_pdf_background')
    .single()

  try {
    const pdfElement = React.createElement(LeadMagnetPdfDocument, {
        recipe,
        backgroundImage: bg?.image_url ?? null,
        }) as React.ReactElement<any>

        const pdfBuffer = await renderToBuffer(pdfElement)

    await getResend().emails.send({
      from: 'With Love, Hasna <onboarding@resend.dev>',
      to: email,
      subject: `Ta recette offerte : ${recipe.title} — Thermomix With Love, Hasna`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#3A3532;">
          <p>Bonjour ${firstName},</p>
          <p>Merci pour ton intérêt ! Voici ta recette offerte en pièce jointe : <strong>${recipe.title}</strong>.</p>
          <p>N'hésite pas à me contacter pour toute question ou pour découvrir mon accompagnement Thermomix.</p>
          <p>À très bientôt,<br/>Hasna — Conseillère Thermomix</p>
        </div>
      `,
      attachments: [
        {
          filename: `${recipe.title.replace(/[^a-z0-9]/gi, '-')}.pdf`,
          content: pdfBuffer,
        },
      ],
    })
  } catch (err: any) {
    // Le lead est déjà enregistré même si l'email échoue, pour ne pas perdre le contact.
    return NextResponse.json({ error: "Ton contact a bien été enregistré, mais l'envoi de l'email a rencontré un souci. Hasna te recontactera directement." }, { status: 200 })
  }

  return NextResponse.json({ success: true })
}