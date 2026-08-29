import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { formatDateRange } from '@/lib/dateHelpers'

// Coordonnées estimées à partir du visuel du fond (en % de la page).
// Si l'alignement n'est pas parfait avec ton image, ajuste ces valeurs.
const ROW_TOP = [25.0, 38.0, 51.0, 64.0, 77.0] // % du haut de page pour Lundi -> Vendredi
const ROW_HEIGHT = 11.3 // % de hauteur de page par ligne
const PLAT_LEFT = 23.5
const PLAT_WIDTH = 33.5
const DESSERT_LEFT = 59.0
const DESSERT_WIDTH = 33.5

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  dateBanner: {
    position: 'absolute',
    top: '23.2%',
    left: '20%',
    width: '60%',
    textAlign: 'center',
  },
  dateBannerText: { fontSize: 9, fontWeight: 700, color: '#3A3532', letterSpacing: 0.5 },

  cell: { position: 'absolute', flexDirection: 'column', alignItems: 'center', padding: 4 },
  cellImage: { width: '100%', height: '72%', borderRadius: 8, objectFit: 'cover' },
  cellImagePlaceholder: { width: '100%', height: '72%', borderRadius: 8, backgroundColor: '#FFFFFF33' },
  cellTitle: { fontSize: 7.5, fontWeight: 700, color: '#3A3532', textAlign: 'center', marginTop: 4 },
  cellLink: { fontSize: 6, color: '#3A3532', textDecoration: 'underline', marginTop: 1 },
})

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }

function Cell({
  recipe,
  top,
  left,
  width,
  height,
}: {
  recipe: Recipe | undefined
  top: number
  left: number
  width: number
  height: number
}) {
  if (!recipe) return null

  return (
    <View style={[styles.cell, { top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }]}>
      {recipe.cookidoo_url ? (
        <Link src={recipe.cookidoo_url} style={{ width: '100%' }}>
          {recipe.image_url ? (
            <Image src={recipe.image_url} style={styles.cellImage} />
          ) : (
            <View style={styles.cellImagePlaceholder} />
          )}
        </Link>
      ) : recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.cellImage} />
      ) : (
        <View style={styles.cellImagePlaceholder} />
      )}

      {recipe.cookidoo_url ? (
        <Link src={recipe.cookidoo_url} style={{ textDecoration: 'none' }}>
          <Text style={styles.cellTitle}>{recipe.title}</Text>
          <Text style={styles.cellLink}>Voir sur Cookidoo</Text>
        </Link>
      ) : (
        <Text style={styles.cellTitle}>{recipe.title}</Text>
      )}
    </View>
  )
}

export default function MenuPdfDocument({
  categorizedRecipes,
  backgroundImage,
  periodStart,
}: {
  categorizedRecipes: Record<string, Recipe[]>
  backgroundImage: string | null
  periodStart: string | null
}) {
  const plats = categorizedRecipes.plats ?? []
  const accompaniments: Recipe[] = [...(categorizedRecipes.desserts ?? []), ...(categorizedRecipes.boissons ?? [])]

  const dateLabel = periodStart
    ? formatDateRange(periodStart, 5)
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4">
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <View style={styles.dateBanner}>
          <Text style={styles.dateBannerText}>{dateLabel.toUpperCase()}</Text>
        </View>

        {ROW_TOP.map((top, i) => (
          <View key={i}>
            <Cell recipe={plats[i]} top={top} left={PLAT_LEFT} width={PLAT_WIDTH} height={ROW_HEIGHT} />
            <Cell recipe={accompaniments[i]} top={top} left={DESSERT_LEFT} width={DESSERT_WIDTH} height={ROW_HEIGHT} />
          </View>
        ))}
      </Page>
    </Document>
  )
}