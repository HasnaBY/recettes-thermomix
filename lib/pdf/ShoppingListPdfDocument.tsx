import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'
const LOGO_LINK = { top: 1, left: 30, width: 40, height: 17 }
const FOOTER_LINK = { top: 96, left: 20, width: 60, height: 3.5 }

const HEADER_SPACE = 260
const FOOTER_SPACE = 90

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  invisibleLink: { position: 'absolute', border: 'none' },
  headerSpacer: { height: HEADER_SPACE },

  content: { paddingHorizontal: 34, paddingBottom: FOOTER_SPACE, fontSize: 10, color: '#3A3532' },
  dateText: { fontSize: 8, color: '#3A3532', opacity: 0.6, marginBottom: 14, textAlign: 'right' },

  columnsRow: { flexDirection: 'row', gap: 20 },
  column: { width: '48%' },

  shoppingGroupTitle: { fontSize: 10.5, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#3A3532', backgroundColor: '#F0EAE0', padding: 5, borderRadius: 6 },
  shoppingItem: { fontSize: 8.5, marginBottom: 2.5, color: '#3A3532', paddingLeft: 4 },
})

type ShoppingByRecipe = { recipeTitle: string; items: string[] }[]
type ShoppingByCategory = Record<string, { ingredient: string; recipeTitle: string }[]>

// Répartit une liste de blocs entre deux colonnes en équilibrant approximativement
// le nombre total de lignes (titre + items) de chaque côté, plutôt qu'un simple
// découpage pair/impair qui laisserait une colonne bien plus longue que l'autre.
function splitIntoColumns<T extends { lines: number }>(blocks: T[]): [T[], T[]] {
  const left: T[] = []
  const right: T[] = []
  let leftLines = 0
  let rightLines = 0

  blocks.forEach((block) => {
    if (leftLines <= rightLines) {
      left.push(block)
      leftLines += block.lines
    } else {
      right.push(block)
      rightLines += block.lines
    }
  })

  return [left, right]
}

export default function ShoppingListPdfDocument({
  shoppingByRecipe,
  shoppingByCategory,
  grouping,
  backgroundImage,
  generatedAt,
}: {
  shoppingByRecipe: ShoppingByRecipe
  shoppingByCategory: ShoppingByCategory
  grouping: 'recipe' | 'category'
  backgroundImage: string | null
  generatedAt: string
}) {
  let leftColumn: React.ReactNode[] = []
  let rightColumn: React.ReactNode[] = []

  if (grouping === 'recipe') {
    const blocks = shoppingByRecipe.map((group, i) => ({
      key: i,
      lines: 1 + Math.max(group.items.length, 1),
      render: () => (
        <View key={i} wrap={false}>
          <Text style={styles.shoppingGroupTitle}>{group.recipeTitle}</Text>
          {group.items.length === 0 ? (
            <Text style={styles.shoppingItem}>Aucun ingredient renseigne.</Text>
          ) : (
            group.items.map((item, j) => (
              <Text key={j} style={styles.shoppingItem}>
                - {item}
              </Text>
            ))
          )}
        </View>
      ),
    }))
    const [left, right] = splitIntoColumns(blocks)
    leftColumn = left.map((b) => b.render())
    rightColumn = right.map((b) => b.render())
  } else {
    const blocks = Object.entries(shoppingByCategory).map(([category, items], i) => ({
      key: i,
      lines: 1 + items.length,
      render: () => (
        <View key={i} wrap={false}>
          <Text style={styles.shoppingGroupTitle}>{category}</Text>
          {items.map((item, j) => (
            <Text key={j} style={styles.shoppingItem}>
              - {item.ingredient} ({item.recipeTitle})
            </Text>
          ))}
        </View>
      ),
    }))
    const [left, right] = splitIntoColumns(blocks)
    leftColumn = left.map((b) => b.render())
    rightColumn = right.map((b) => b.render())
  }

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

          <View style={styles.columnsRow}>
            <View style={styles.column}>{leftColumn}</View>
            <View style={styles.column}>{rightColumn}</View>
          </View>
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