import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: '#FDFBF6', fontSize: 10, color: '#3A3532' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, borderBottom: 1.5, borderBottomColor: '#C9A44C', paddingBottom: 12 },
  logo: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },
  headerTextWrap: { flexDirection: 'column', flex: 1 },
  siteName: { fontSize: 16, fontWeight: 700, color: '#3A3532' },
  subtitle: { fontSize: 9, color: '#3A3532', opacity: 0.7, marginTop: 2 },
  cercleLogoSmall: { width: 26, height: 26, borderRadius: 13, marginLeft: 8 },
  dateText: { fontSize: 8, color: '#3A3532', opacity: 0.6, marginTop: 12, marginBottom: 10, textAlign: 'right' },

  dayRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  dayLabel: { width: 62, fontSize: 9, fontWeight: 700, color: '#3A3532', backgroundColor: '#C9A44C', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 4, textAlign: 'center' },

  categoryBlock: { borderRadius: 10, padding: 12, marginBottom: 14 },
  categoryTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#3A3532' },
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recipeCard: { width: '100%', flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  recipeImage: { width: 90, height: 90, borderRadius: 8, marginRight: 10 },
  recipeImagePlaceholder: { width: 90, height: 90, borderRadius: 8, marginRight: 10, backgroundColor: '#FDFBF6' },
  recipeInfo: { flexDirection: 'column', flex: 1 },
  recipeTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#3A3532' },
  recipeLink: { fontSize: 9, color: '#3A3532', textDecoration: 'underline' },

  footer: { position: 'absolute', bottom: 18, left: 28, right: 28, fontSize: 8, color: '#3A3532', textAlign: 'center', borderTop: 1, borderTopColor: '#F0EAE0', paddingTop: 6, opacity: 0.7 },
})

const CATEGORY_STYLES: Record<string, { bg: string; label: string }> = {
  plats: { bg: '#DCEAF0', label: 'Plats' },
  desserts: { bg: '#F6DEE1', label: 'Desserts / goûters' },
  boissons: { bg: '#E3ECDD', label: 'Boissons' },
  pains: { bg: '#F0EAE0', label: 'Pains' },
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }
type CategorizedRecipes = Record<string, Recipe[]>

export default function MenuPdfDocument({
  categorizedRecipes,
  siteLogo,
  cercleLogo,
  generatedAt,
  distributeByDay,
}: {
  categorizedRecipes: CategorizedRecipes
  siteLogo: string | null
  cercleLogo: string | null
  generatedAt: string
  distributeByDay: boolean
}) {
  const RecipeRow = ({ r, dayLabel }: { r: Recipe; dayLabel?: string }) => (
    <View style={styles.recipeCard} wrap={false}>
      {dayLabel && <Text style={styles.dayLabel}>{dayLabel}</Text>}
      {r.cookidoo_url ? (
        <Link src={r.cookidoo_url}>
          {r.image_url ? (
            <Image src={r.image_url} style={[styles.recipeImage, dayLabel ? { marginLeft: 10 } : {}]} />
          ) : (
            <View style={[styles.recipeImagePlaceholder, dayLabel ? { marginLeft: 10 } : {}]} />
          )}
        </Link>
      ) : r.image_url ? (
        <Image src={r.image_url} style={[styles.recipeImage, dayLabel ? { marginLeft: 10 } : {}]} />
      ) : (
        <View style={[styles.recipeImagePlaceholder, dayLabel ? { marginLeft: 10 } : {}]} />
      )}
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{r.title}</Text>
        {r.cookidoo_url && (
          <Link src={r.cookidoo_url} style={styles.recipeLink}>
            Voir sur Cookidoo
          </Link>
        )}
      </View>
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {siteLogo && <Image src={siteLogo} style={styles.logo} />}
          <View style={styles.headerTextWrap}>
            <Text style={styles.siteName}>Thermomix With Love, Hasna</Text>
            <Text style={styles.subtitle}>Ton menu personnalise - Le Cercle With Love</Text>
          </View>
          {cercleLogo && <Image src={cercleLogo} style={styles.cercleLogoSmall} />}
        </View>

        <Text style={styles.dateText}>Genere le {generatedAt}</Text>

        {Object.entries(categorizedRecipes).map(([key, recipes]) => {
          if (recipes.length === 0) return null
          const style = CATEGORY_STYLES[key]
          const useDays = distributeByDay && key === 'plats'

          return (
            <View key={key} style={[styles.categoryBlock, { backgroundColor: style.bg }]} wrap={false}>
              <Text style={styles.categoryTitle}>{style.label}</Text>
              <View style={styles.recipeGrid}>
                {recipes.map((r, i) => (
                  <RecipeRow key={r.id} r={r} dayLabel={useDays ? DAYS[i % DAYS.length] : undefined} />
                ))}
              </View>
            </View>
          )
        })}

        <Text style={styles.footer} fixed>
          Thermomix With Love, Hasna - www.withlovehasna.com
        </Text>
      </Page>
    </Document>
  )
}