import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6', padding: 32 },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  headerCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#F0EAE0' },
  brandName: { fontSize: 14, fontWeight: 700, color: '#3A3532', textAlign: 'center' },
  tagline: { fontSize: 9, color: '#3A3532', opacity: 0.7, textAlign: 'center', marginTop: 2 },

  recipeImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16, objectFit: 'cover' },
  title: { fontSize: 20, fontWeight: 700, color: '#3A3532', marginBottom: 6, textAlign: 'center' },
  description: { fontSize: 10, color: '#3A3532', opacity: 0.8, textAlign: 'center', marginBottom: 16 },

  timesRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 },
  timeText: { fontSize: 9, color: '#3A3532' },

  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#4A5A45', marginTop: 10, marginBottom: 8 },
  ingredientLine: { fontSize: 9.5, color: '#3A3532', marginBottom: 3, paddingLeft: 4 },
  stepsText: { fontSize: 9.5, color: '#3A3532', lineHeight: 1.5 },

  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 10, textAlign: 'center' },
  footerText: { fontSize: 8, color: '#3A3532', opacity: 0.7 },
  footerLink: { fontSize: 8, color: '#3A3532', textDecoration: 'underline' },
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

export default function LeadMagnetPdfDocument({
  recipe,
  backgroundImage,
}: {
  recipe: Recipe
  backgroundImage: string | null
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <View style={styles.headerCard}>
          <Text style={styles.brandName}>Thermomix With Love, Hasna</Text>
          <Text style={styles.tagline}>Ta recette offerte, avec plaisir 💛</Text>
        </View>

        {recipe.image_url && <Image src={recipe.image_url} style={styles.recipeImage} />}

        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

        {(recipe.prep_time_minutes || recipe.total_time_minutes) && (
          <View style={styles.timesRow}>
            {recipe.prep_time_minutes && (
              <Text style={styles.timeText}>Préparation : {recipe.prep_time_minutes} min</Text>
            )}
            {recipe.total_time_minutes && (
              <Text style={styles.timeText}>Temps total : {recipe.total_time_minutes} min</Text>
            )}
          </View>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Ingrédients</Text>
            {recipe.ingredients.map((ing, i) => (
              <Text key={i} style={styles.ingredientLine}>
                - {ing}
              </Text>
            ))}
          </View>
        )}

        {recipe.steps && (
          <View>
            <Text style={styles.sectionTitle}>Étapes de préparation</Text>
            <Text style={styles.stepsText}>{recipe.steps}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Merci de m'avoir fait confiance !</Text>
          <Link src={SITE_URL} style={styles.footerLink}>
            www.withlovehasna.com
          </Link>
        </View>
      </Page>
    </Document>
  )
}