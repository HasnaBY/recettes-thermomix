import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { Fragment } from 'react'
import { formatDateRange } from '@/lib/dateHelpers'

const DATE_TOP = 22
const ROW_TOP = [31.5, 45, 58.2, 71.5, 86]
const ROW_HEIGHT = 13.5
const PLAT_LEFT = 24.4
const PLAT_WIDTH = 32.6
const DESSERT_LEFT = 58.7
const DESSERT_WIDTH = 32.6

// Zones cliquables invisibles superposées sur les éléments déjà présents dans l'image de fond.
// À ajuster si le lien ne tombe pas exactement sur le logo/texte selon ton fond.
const SITE_URL = 'https://www.withlovehasna.com'
const LOGO_LINK = { top: 1, left: 30, width: 40, height: 18 }
const FOOTER_LINK = { top: 96.5, left: 20, width: 60, height: 3.5 }

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  overlay: { position: 'relative', width: '100%', height: '100%' },

  dateBanner: { position: 'absolute', top: `${DATE_TOP}%`, left: '32%', width: '40%', flexDirection: 'row', justifyContent: 'space-between' },
  dateStart: { fontSize: 9, fontWeight: 700, color: '#4A5A45', marginLeft: '14%', fontStyle: 'italic' },
  dateEnd: { fontSize: 9, fontWeight: 700, color: '#4A5A45', marginRight: '8%', fontStyle: 'italic' },

  cell: { position: 'absolute', flexDirection: 'column', alignItems: 'center' },
  cellImage: { width: '100%', height: '80%', borderRadius: 10, objectFit: 'cover' },
  cellImagePlaceholder: { width: '100%', height: '80%', borderRadius: 10, backgroundColor: '#F0EAE0' },
  cellTitlePlat: { fontSize: 7.5, fontWeight: 700, color: '#4A5A45', textAlign: 'center', marginTop: 4 },
  cellTitleAccomp: { fontSize: 7.5, fontWeight: 700, color: '#C97064', textAlign: 'center', marginTop: 4 },

  invisibleLink: { position: 'absolute' },
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
  kind: 'plat' | 'accomp'
}) {
  if (!recipe) return null

  const content = (
    <>
      {recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.cellImage} />
      ) : (
        <View style={styles.cellImagePlaceholder} />
      )}
      <Text style={kind === 'plat' ? styles.cellTitlePlat : styles.cellTitleAccomp}>{recipe.title}</Text>
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

  const accompaniments: Recipe[] = [
    ...(categorizedRecipes.desserts ?? []),
    ...(categorizedRecipes.boissons ?? []),
    ...(categorizedRecipes.entrees ?? []),
    ...(categorizedRecipes.pains ?? []),
  ]

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

  return (
    <Document>
      <Page size="A4">
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <View style={styles.overlay}>
          {/* Zone cliquable invisible sur le logo/nom de marque en haut */}
          <Link
            src={SITE_URL}
            style={[
              styles.invisibleLink,
              {
                top: `${LOGO_LINK.top}%`,
                left: `${LOGO_LINK.left}%`,
                width: `${LOGO_LINK.width}%`,
                height: `${LOGO_LINK.height}%`,
              },
            ]}
          >
            <Text> </Text>
          </Link>

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
                kind="accomp"
              />
            </Fragment>
          ))}

          {/* Zone cliquable invisible sur "www.WithLoveHasna.com" en bas */}
          <Link
            src={SITE_URL}
            style={[
              styles.invisibleLink,
              {
                top: `${FOOTER_LINK.top}%`,
                left: `${FOOTER_LINK.left}%`,
                width: `${FOOTER_LINK.width}%`,
                height: `${FOOTER_LINK.height}%`,
              },
            ]}
          >
            <Text> </Text>
          </Link>
        </View>
      </Page>
    </Document>
  )
}