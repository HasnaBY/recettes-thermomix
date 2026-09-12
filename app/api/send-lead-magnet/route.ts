import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

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
    .select('recipe_id, pdf_url')
    .eq('id', 1)
    .single()

  if (!settings?.pdf_url) {
    return NextResponse.json({ error: "Aucun PDF n'est encore configuré. Réessaie plus tard." }, { status: 400 })
  }

  let recipeTitle = 'ta recette'
  if (settings.recipe_id) {
    const { data: recipe } = await supabase.from('recipes').select('title').eq('id', settings.recipe_id).single()
    if (recipe) recipeTitle = recipe.title
  }

  const { error: insertError } = await supabase.from('leads').insert({
    first_name: firstName,
    email,
    phone,
    recipe_id: settings.recipe_id ?? null,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  try {
    await getResend().emails.send({
      from: 'With Love, Hasna <onboarding@resend.dev>',
      to: email,
      subject: `Ta recette offerte : ${recipeTitle} — Thermomix With Love, Hasna`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#3A3532; max-width:500px; margin:0 auto;">
          <p>Bonjour ${firstName},</p>
          <p>Merci pour ton intérêt ! Voici ta recette offerte : <strong>${recipeTitle}</strong>.</p>
          <div style="text-align:center; margin:24px 0;">
            <a href="${settings.pdf_url}" style="display:inline-block; padding:12px 24px; background:#3A3532; color:#FDFBF6; border-radius:999px; text-decoration:none; font-weight:bold;">
              Télécharger ma recette (PDF)
            </a>
          </div>
          <p>N'hésite pas à me contacter pour toute question ou pour découvrir mon accompagnement Thermomix.</p>
          <p>À très bientôt,<br/>Hasna — Conseillère Thermomix</p>
        </div>
      `,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Ton contact a bien été enregistré, mais l'envoi de l'email a rencontré un souci. Hasna te recontactera directement." },
      { status: 200 }
    )
  }

  return NextResponse.json({ success: true })
}