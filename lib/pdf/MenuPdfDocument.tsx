import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { Fragment } from 'react'

import { formatDateRange } from '@/lib/dateHelpers'

// Recalibré à partir du visuel : la ligne "DU ___ AU ___" est plus haute que le bandeau
// précédent, et chaque ligne de jour est plus basse et plus grande que l'estimation initiale.
const DATE_TOP = 22.0
const ROW_TOP = [28.4, 41.0, 53.6, 66.2, 78.8]
const ROW_HEIGHT = 10.8
const PLAT_LEFT = 23.4
const PLAT_WIDTH = 33.6
const DESSERT_LEFT = 58.7
const DESSERT_WIDTH = 32.6


const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  overlay: { position: 'relative', width: '100%', height: '100%' },

  dateBanner: { position: 'absolute', top: `${DATE_TOP}%`, left: '18%', width: '64%', flexDirection: 'row', justifyContent: 'space-between' },
  dateStart: { fontSize: 9, fontWeight: 700, color: '#3A3532', marginLeft: '14%' },
  dateEnd: { fontSize: 9, fontWeight: 700, color: '#3A3532', marginRight: '8%' },

  cell: { position: 'absolute', flexDirection: 'column', alignItems: 'center' },
  cellDebugBorder: { borderWidth: 1.5, borderColor: '#FF0000', borderStyle: 'dashed' },
  cellDebugLabel: { fontSize: 7, color: '#FF0000', fontWeight: 700, marginBottom: 2 },
  cellImage: { width: '100%', height: '80%', borderRadius: 8, objectFit: 'cover' },
  cellImagePlaceholder: { width: '100%', height: '80%', borderRadius: 8, backgroundColor: '#E0E0E0' },
  cellTitle: { fontSize: 7.5, fontWeight: 700, color: '#3A3532', textAlign: 'center', marginTop: 4 },
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
  const content = (
    <>
      {recipe?.image_url ? (
        <Image src={recipe.image_url} style={styles.cellImage} />
      ) : (
        <View style={styles.cellImagePlaceholder} />
      )}
      {recipe && <Text style={styles.cellTitle}>{recipe.title}</Text>}
    </>
  )

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
      ) : recipe.cookidoo_url ? (
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
  debug = false,
}: {
  categorizedRecipes: Record<string, Recipe[]>
  backgroundImage: string | null
  periodStart: string | null
  debug?: boolean
}) {
  const plats = categorizedRecipes.plats ?? []
  const accompaniments: Recipe[] = [...(categorizedRecipes.desserts ?? []), ...(categorizedRecipes.boissons ?? [])]

  let startLabel = ''
  let endLabel = ''
  if (periodStart) {
    const range = formatDateRange(periodStart, 5) // "Du X au Y"
    const match = range.match(/Du (.+) au (.+)/i)
    if (match) {
      startLabel = match[1]
      endLabel = match[2]
    }
  }

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

        <View style={styles.overlay}>
          <View style={[styles.dateBanner, debug ? { borderWidth: 1, borderColor: 'blue' } : {}]}>
            <Text style={styles.dateStart}>{startLabel}</Text>
            <Text style={styles.dateEnd}>{endLabel}</Text>
          </View>

          {ROW_TOP.map((top, i) => (
            <Fragment key={i}>
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
            </Fragment>
          ))}
        </View>
      </Page>
    </Document>
  )
}
