import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'

const DARK_GREEN = '#2A3D2F'
const CORAL = '#C97064'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6', flexDirection: 'column' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  headerSpacer: { height: 130 },

  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 42, paddingBottom: 60 },

  title: { fontSize: 18, fontWeight: 700, color: DARK_GREEN, textAlign: 'center', marginBottom: 5, lineHeight: 1.2 },
  subtitle: { fontSize: 10, fontStyle: 'italic', color: CORAL, textAlign: 'center', marginBottom: 4 },
  intro: { fontSize: 8.5, color: '#3A3532', opacity: 0.8, textAlign: 'center', marginBottom: 12 },

  photo: { width: '44%', height: 105, borderRadius: 9, alignSelf: 'center', marginBottom: 10, objectFit: 'cover' },

  description: { fontSize: 8.5, color: '#3A3532', textAlign: 'center', lineHeight: 1.4, marginBottom: 14, paddingHorizontal: 26 },

  columnsRow: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  column: { flex: 1 },
  columnHeader: { fontSize: 10.5, fontWeight: 700, color: DARK_GREEN, marginBottom: 7, borderBottomWidth: 1.3, borderBottomColor: DARK_GREEN, paddingBottom: 4 },
  ingredientLine: { fontSize: 8, color: '#3A3532', marginBottom: 4.5, lineHeight: 1.3 },
  stepRow: { flexDirection: 'row', marginBottom: 5 },
  stepNumber: { fontSize: 8, fontWeight: 700, color: CORAL, width: 14 },
  stepText: { fontSize: 8, color: '#3A3532', flex: 1, lineHeight: 1.3 },

  metaRow: { fontSize: 7.5, fontWeight: 700, color: DARK_GREEN, marginTop: 6 },

  servingBox: { backgroundColor: '#F6DEE1', borderRadius: 8, padding: 9, marginBottom: 12 },
  servingLabel: { fontSize: 8.5, fontWeight: 700, color: '#3A3532', marginBottom: 2 },
  servingText: { fontSize: 8, color: '#3A3532' },

  ctaBanner: { backgroundColor: DARK_GREEN, borderRadius: 9, padding: 11, alignItems: 'center' },
  ctaTitle: { fontSize: 9.5, fontWeight: 700, color: '#FDFBF6', textAlign: 'center', marginBottom: 2 },
  ctaSubtitle: { fontSize: 8, color: '#FDFBF6', textAlign: 'center', opacity: 0.9 },

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