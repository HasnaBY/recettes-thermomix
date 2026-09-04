import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'
const LOGO_LINK = { top: 1, left: 30, width: 40, height: 17 }
const FOOTER_LINK = { top: 96, left: 20, width: 60, height: 3.5 }

// Espace réservé en haut de CHAQUE page pour laisser voir l'entête décoratif du fond.
const HEADER_SPACE = 195
const FOOTER_SPACE = 60

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  invisibleLink: { position: 'absolute', border: 'none' },
  headerSpacer: { height: HEADER_SPACE },

  content: { paddingHorizontal: 34, paddingBottom: FOOTER_SPACE, fontSize: 10, color: '#3A3532' },
  dateText: { fontSize: 8, color: '#3A3532', opacity: 0.6, marginBottom: 14, textAlign: 'right' },

  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, marginBottom: 10, alignItems: 'center' },
  cardImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10, objectFit: 'cover' },
  cardImagePlaceholder: { width: 60, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: '#F0EAE0' },
  cardInfo: { flexDirection: 'column', flex: 1 },
  cardBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7, marginBottom: 4 },
  cardTitle: { fontSize: 9.5, fontWeight: 700, color: '#3A3532', marginBottom: 2 },
  cardLink: { fontSize: 7, color: '#3A3532', textDecoration: 'underline' },

  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#4A5A45', marginTop: 6, marginBottom: 8 },
})

const CATEGORY_STYLES: Record<string, { bg: string; label: string; badgeBg: string }> = {
  plats: { bg: '#DCEAF0', label: 'Plats', badgeBg: '#3A3532' },
  desserts: { bg: '#F6DEE1', label: 'Desserts / goûters', badgeBg: '#C97064' },
  boissons: { bg: '#E3ECDD', label: 'Boissons', badgeBg: '#7A9471' },
  entrees: { bg: '#F0EAE0', label: 'Entrées', badgeBg: '#B08A5A' },
  pains: { bg: '#F0EAE0', label: 'Pains', badgeBg: '#B08A5A' },
}

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }
type CategorizedRecipes = Record<string, Recipe[]>

function RecipeCard({ recipe, badgeBg, badgeLabel }: { recipe: Recipe; badgeBg: string; badgeLabel: string }) {
  return (
    <View style={styles.card} wrap={false}>
      {recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
      <View style={styles.cardInfo}>
        <View style={[styles.cardBadge, { backgroundColor: badgeBg }]}>
          <Text style={{ fontSize: 6.5, fontWeight: 700, color: '#FDFBF6' }}>{badgeLabel.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardTitle}>{recipe.title}</Text>
        {recipe.cookidoo_url && (
          <Link src={recipe.cookidoo_url} style={styles.cardLink}>
            Voir sur Cookidoo
          </Link>
        )}
      </View>
    </View>
  )
}

export default function ClientMenuPdfDocument({
  categorizedRecipes,
  backgroundImage,
  generatedAt,
}: {
  categorizedRecipes: CategorizedRecipes
  backgroundImage: string | null
  generatedAt: string
}) {
  const orderedCategoryKeys = ['plats', 'entrees', 'desserts', 'boissons', 'pains']

  return (
    <Document>
      <Page size="A4" wrap>
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <Link
          src={SITE_URL}
          style={[
            styles.invisibleLink,
            { top: `${LOGO_LINK.top}%`, left: `${LOGO_LINK.left}%`, width: `${LOGO_LINK.width}%`, height: `${LOGO_LINK.height}%` },
          ]}
          fixed
        >
          <Text> </Text>
        </Link>

        <View style={styles.headerSpacer} fixed />

        <View style={styles.content}>
          <Text style={styles.dateText}>Généré le {generatedAt}</Text>

          {orderedCategoryKeys.map((key) => {
            const recipes = categorizedRecipes[key] ?? []
            if (recipes.length === 0) return null
            const style = CATEGORY_STYLES[key]

            return (
              <View key={key}>
                <Text style={styles.sectionTitle}>{style.label}</Text>
                {recipes.map((r) => (
                  <RecipeCard key={r.id} recipe={r} badgeBg={style.badgeBg} badgeLabel={style.label.split(' ')[0]} />
                ))}
              </View>
            )
          })}
        </View>

        <Link
          src={SITE_URL}
          style={[
            styles.invisibleLink,
            { top: `${FOOTER_LINK.top}%`, left: `${FOOTER_LINK.left}%`, width: `${FOOTER_LINK.width}%`, height: `${FOOTER_LINK.height}%` },
          ]}
          fixed
        >
          <Text> </Text>
        </Link>
      </Page>
    </Document>
  )
}