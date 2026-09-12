import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'

const DARK_GREEN = '#2A3D2F'
const CORAL = '#C97064'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6', flexDirection: 'column' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  headerSpacer: { height: 140 },

  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 45, paddingBottom: 65 },

  title: { fontSize: 22, fontWeight: 700, color: DARK_GREEN, textAlign: 'center', marginBottom: 6, lineHeight: 1.25 },
  subtitle: { fontSize: 11.5, fontStyle: 'italic', color: CORAL, textAlign: 'center', marginBottom: 5 },
  intro: { fontSize: 10, color: '#3A3532', opacity: 0.8, textAlign: 'center', marginBottom: 18 },

  photo: { width: '52%', height: 145, borderRadius: 10, alignSelf: 'center', marginBottom: 14, objectFit: 'cover' },

  description: { fontSize: 10, color: '#3A3532', textAlign: 'center', lineHeight: 1.5, marginBottom: 22, paddingHorizontal: 30 },

  columnsRow: { flexDirection: 'row', gap: 30, marginBottom: 18 },
  column: { flex: 1 },
  columnHeader: { fontSize: 12.5, fontWeight: 700, color: DARK_GREEN, marginBottom: 9, borderBottomWidth: 1.5, borderBottomColor: DARK_GREEN, paddingBottom: 5 },
  ingredientLine: { fontSize: 9.5, color: '#3A3532', marginBottom: 6, lineHeight: 1.4 },
  stepRow: { flexDirection: 'row', marginBottom: 7 },
  stepNumber: { fontSize: 9.5, fontWeight: 700, color: CORAL, width: 16 },
  stepText: { fontSize: 9.5, color: '#3A3532', flex: 1, lineHeight: 1.4 },

  metaRow: { fontSize: 8.5, fontWeight: 700, color: DARK_GREEN, marginTop: 8 },

  servingBox: { backgroundColor: '#F6DEE1', borderRadius: 9, padding: 12, marginBottom: 18 },
  servingLabel: { fontSize: 9.5, fontWeight: 700, color: '#3A3532', marginBottom: 3 },
  servingText: { fontSize: 9, color: '#3A3532' },

  ctaBanner: { backgroundColor: DARK_GREEN, borderRadius: 10, padding: 14, alignItems: 'center' },
  ctaTitle: { fontSize: 10.5, fontWeight: 700, color: '#FDFBF6', textAlign: 'center', marginBottom: 3 },
  ctaSubtitle: { fontSize: 9, color: '#FDFBF6', textAlign: 'center', opacity: 0.9 },

  invisibleLink: { position: 'absolute', border: 'none' },
})

type Recipe = {
  title: string
  description: string | null
  image_url: string | null
  ingredients: string[] | null
  steps: string | null
  prep_time_minutes: number | null
  total_time_minutes: number | null
}

function splitSteps(steps: string | null): string[] {
  if (!steps) return []
  return steps
    .split('\n')
    .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
    .filter((s) => s.length > 0)
}

export default function LeadMagnetPdfDocument({
  recipe,
  backgroundImage,
  pdfSubtitle,
  pdfIntro,
  servingSuggestions,
  ctaTitle,
  ctaSubtitle,
}: {
  recipe: Recipe
  backgroundImage: string | null
  pdfSubtitle?: string
  pdfIntro?: string
  servingSuggestions?: string
  ctaTitle?: string
  ctaSubtitle?: string
}) {
  const steps = splitSteps(recipe.steps)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <Link
          src={SITE_URL}
          style={[styles.invisibleLink, { top: '1%', left: '30%', width: '40%', height: '13%' }]}
        >
          <Text> </Text>
        </Link>

        <View style={styles.headerSpacer} />

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          {pdfSubtitle && <Text style={styles.subtitle}>— {pdfSubtitle} —</Text>}
          {pdfIntro && <Text style={styles.intro}>{pdfIntro}</Text>}

          {recipe.image_url && <Image src={recipe.image_url} style={styles.photo} />}

          {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

          <View style={styles.columnsRow}>
            <View style={styles.column}>
              <Text style={styles.columnHeader}>■ Ingrédients</Text>
              {(recipe.ingredients ?? []).map((ing, i) => (
                <Text key={i} style={styles.ingredientLine}>
                  • {ing}
                </Text>
              ))}

              {(recipe.prep_time_minutes || recipe.total_time_minutes) && (
                <Text style={styles.metaRow}>
                  ■ {recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min de préparation` : ''}
                  {recipe.prep_time_minutes && recipe.total_time_minutes ? ' • ' : ''}
                  {recipe.total_time_minutes ? `${recipe.total_time_minutes} min au total` : ''}
                </Text>
              )}
            </View>

            <View style={styles.column}>
              <Text style={styles.columnHeader}>■ Étapes</Text>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{i + 1}.</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {servingSuggestions && (
            <View style={styles.servingBox}>
              <Text style={styles.servingLabel}>■ Idées pour la déguster</Text>
              <Text style={styles.servingText}>{servingSuggestions}</Text>
            </View>
          )}

          {(ctaTitle || ctaSubtitle) && (
            <View style={styles.ctaBanner}>
              {ctaTitle && <Text style={styles.ctaTitle}>{ctaTitle}</Text>}
              {ctaSubtitle && <Text style={styles.ctaSubtitle}>{ctaSubtitle}</Text>}
            </View>
          )}
        </View>

        <Link
          src={SITE_URL}
          style={[styles.invisibleLink, { top: '96%', left: '20%', width: '60%', height: '3.5%' }]}
        >
          <Text> </Text>
        </Link>
      </Page>
    </Document>
  )
}