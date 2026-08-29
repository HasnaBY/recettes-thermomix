import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { formatDateRange } from '@/lib/dateHelpers'

// Coordonnées à ajuster (en % de la page) une fois le calibrage vérifié.
const ROW_TOP = [25.0, 38.0, 51.0, 64.0, 77.0]
const ROW_HEIGHT = 11.3
const PLAT_LEFT = 23.5
const PLAT_WIDTH = 33.5
const DESSERT_LEFT = 59.0
const DESSERT_WIDTH = 33.5
const DATE_TOP = 23.2

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  dateBanner: { position: 'absolute', top: `${DATE_TOP}%`, left: '20%', width: '60%', textAlign: 'center' },
  dateBannerText: { fontSize: 9, fontWeight: 700, color: '#3A3532', letterSpacing: 0.5 },

  cell: { position: 'absolute', flexDirection: 'column', alignItems: 'center', padding: 4 },
  cellDebugBorder: { borderWidth: 1.5, borderColor: '#FF0000', borderStyle: 'dashed' },
  cellDebugLabel: { fontSize: 7, color: '#FF0000', fontWeight: 700, marginBottom: 2 },
  cellImage: { width: '100%', height: '72%', borderRadius: 8, objectFit: 'cover' },
  cellImagePlaceholder: { width: '100%', height: '72%', borderRadius: 8, backgroundColor: '#E0E0E0' },
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
  debugLabel,
  debug,
}: {
  recipe: Recipe | undefined
  top: number
  left: number
  width: number
  height: number
  debugLabel: string
  debug: boolean
}) {
  return (
    <View
      style={[
        styles.cell,
        { top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` },
        debug ? styles.cellDebugBorder : {},
      ]}
    >
      {debug && <Text style={styles.cellDebugLabel}>{debugLabel}</Text>}

      {!recipe ? (
        debug && <Text style={styles.cellTitle}>(vide)</Text>
      ) : (
        <>
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
        </>
      )}
    </View>
  )
}

export default function MenuPdfDocument({
  categorizedRecipes,
  backgroundImage,
  periodStart,
  debug = false,
}: {
  categorizedRecipes: Record<string, Recipe[]>
  backgroundImage: string | null
  periodStart: string | null
  debug?: boolean
}) {
  const plats = categorizedRecipes.plats ?? []
  const accompaniments: Recipe[] = [...(categorizedRecipes.desserts ?? []), ...(categorizedRecipes.boissons ?? [])]

  const dateLabel = periodStart
    ? formatDateRange(periodStart, 5)
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4">
        {backgroundImage ? (
          <Image src={backgroundImage} style={styles.background} fixed />
        ) : (
          debug && (
            <View style={[styles.background, { backgroundColor: '#FFDDDD' }]}>
              <Text style={{ padding: 20, fontSize: 12, color: 'red' }}>
                AUCUNE IMAGE DE FOND TROUVÉE (menu_pdf_background vide)
              </Text>
            </View>
          )
        )}

        <View style={[styles.dateBanner, debug ? { borderWidth: 1, borderColor: 'blue' } : {}]}>
          <Text style={styles.dateBannerText}>{dateLabel.toUpperCase()}</Text>
        </View>

        {ROW_TOP.map((top, i) => (
          <View key={i}>
            <Cell
              recipe={plats[i]}
              top={top}
              left={PLAT_LEFT}
              width={PLAT_WIDTH}
              height={ROW_HEIGHT}
              debugLabel={`Plat J${i + 1}`}
              debug={debug}
            />
            <Cell
              recipe={accompaniments[i]}
              top={top}
              left={DESSERT_LEFT}
              width={DESSERT_WIDTH}
              height={ROW_HEIGHT}
              debugLabel={`Dessert J${i + 1}`}
              debug={debug}
            />
          </View>
        ))}
      </Page>
    </Document>
  )
}