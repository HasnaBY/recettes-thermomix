import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { Fragment } from 'react'
import { formatDateRange } from '@/lib/dateHelpers'

const DATE_TOP = 22
const ROW_TOP = [31.5, 45, 58.2, 71.5, 84]
const ROW_HEIGHT = 13.5
const PLAT_LEFT = 24.4
const PLAT_WIDTH = 32.6
const DESSERT_LEFT = 58.7
const DESSERT_WIDTH = 32.6

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  overlay: { position: 'relative', width: '100%', height: '100%' },

  dateBanner: { position: 'absolute', top: `${DATE_TOP}%`, left: '30%', width: '40%', flexDirection: 'row', justifyContent: 'space-between' },
  dateStart: { fontSize: 9, fontWeight: 700, color: '#4A5A45', marginLeft: '14%', fontStyle: 'italic' },
  dateEnd: { fontSize: 9, fontWeight: 700, color: '#4A5A45', marginRight: '8%', fontStyle: 'italic' },

  cell: { position: 'absolute', flexDirection: 'column', alignItems: 'center' },
  cellImage: { width: '100%', height: '80%', borderRadius: 10, objectFit: 'cover' },
  cellImagePlaceholder: { width: '100%', height: '80%', borderRadius: 10, backgroundColor: '#F0EAE0' },
  cellTitlePlat: { fontSize: 7.5, fontWeight: 700, color: '#4A5A45', textAlign: 'center', marginTop: 4 },
  cellTitleDessert: { fontSize: 7.5, fontWeight: 700, color: '#C97064', textAlign: 'center', marginTop: 4 },

  extraPage: { padding: 30, backgroundColor: '#FDFBF6' },
  extraSectionTitle: { fontSize: 14, fontWeight: 700, color: '#4A5A45', marginBottom: 12 },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraCard: { width: '100%', flexDirection: 'row', backgroundColor: '#F0EAE0', borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  extraImage: { width: 60, height: 60, borderRadius: 8, marginRight: 8, objectFit: 'cover' },
  extraImagePlaceholder: { width: 60, height: 60, borderRadius: 8, marginRight: 8, backgroundColor: '#FFFFFF' },
  extraInfo: { flexDirection: 'column', flex: 1 },
  extraCategoryLabel: { fontSize: 7, fontWeight: 700, color: '#8A9A85', marginBottom: 2, textTransform: 'uppercase' },
  extraTitle: { fontSize: 9.5, fontWeight: 700, color: '#3A3532', marginBottom: 2 },
  extraLink: { fontSize: 7, color: '#3A3532', textDecoration: 'underline' },
})

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }

function Cell({
  recipe,
  top,
  left,
  width,
  height,
  kind,
}: {
  recipe: Recipe | undefined
  top: number
  left: number
  width: number
  height: number
  kind: 'plat' | 'dessert'
}) {
  if (!recipe) return null

  const content = (
    <>
      {recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.cellImage} />
      ) : (
        <View style={styles.cellImagePlaceholder} />
      )}
      <Text style={kind === 'plat' ? styles.cellTitlePlat : styles.cellTitleDessert}>{recipe.title}</Text>
    </>
  )

  return (
    <View style={[styles.cell, { top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }]}>
      {recipe.cookidoo_url ? (
        <Link src={recipe.cookidoo_url} style={{ width: '100%', textDecoration: 'none' }}>
          {content}
        </Link>
      ) : (
        content
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

  const entrees = categorizedRecipes.entrees ?? []
  const pains = categorizedRecipes.pains ?? []

  let startLabel = ''
  let endLabel = ''
  if (periodStart) {
    const range = formatDateRange(periodStart, 5)
    const match = range.match(/Du (.+) au (.+)/i)
    if (match) {
      startLabel = match[1]
      endLabel = match[2]
    }
  }

  const extraItems: { recipe: Recipe; label: string }[] = [
    ...entrees.map((r) => ({ recipe: r, label: 'Entrée' })),
    ...pains.map((r) => ({ recipe: r, label: 'Pain' })),
  ]

  return (
    <Document>
      <Page size="A4">
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <View style={styles.overlay}>
          <View style={styles.dateBanner}>
            <Text style={styles.dateStart}>{startLabel}</Text>
            <Text style={styles.dateEnd}>{endLabel}</Text>
          </View>

          {ROW_TOP.map((top, i) => (
            <Fragment key={i}>
              <Cell recipe={plats[i]} top={top} left={PLAT_LEFT} width={PLAT_WIDTH} height={ROW_HEIGHT} kind="plat" />
              <Cell
                recipe={accompaniments[i]}
                top={top}
                left={DESSERT_LEFT}
                width={DESSERT_WIDTH}
                height={ROW_HEIGHT}
                kind="dessert"
              />
            </Fragment>
          ))}
        </View>
      </Page>

      {extraItems.length > 0 && (
        <Page size="A4" style={styles.extraPage}>
          <Text style={styles.extraSectionTitle}>Recettes supplémentaires</Text>
          <View style={styles.extraGrid}>
            {extraItems.map(({ recipe, label }) => (
              <View key={recipe.id} style={styles.extraCard} wrap={false}>
                {recipe.image_url ? (
                  <Image src={recipe.image_url} style={styles.extraImage} />
                ) : (
                  <View style={styles.extraImagePlaceholder} />
                )}
                <View style={styles.extraInfo}>
                  <Text style={styles.extraCategoryLabel}>{label}</Text>
                  <Text style={styles.extraTitle}>{recipe.title}</Text>
                  {recipe.cookidoo_url && (
                    <Link src={recipe.cookidoo_url} style={styles.extraLink}>
                      Voir sur Cookidoo
                    </Link>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  )
}