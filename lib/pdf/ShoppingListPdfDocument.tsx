import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

// Zones cliquables invisibles superposées sur le logo et le lien du site déjà dessinés
// dans l'image de fond. À ajuster si le clic ne tombe pas exactement au bon endroit.
const SITE_URL = 'https://www.withlovehasna.com'
const LOGO_LINK = { top: 1, left: 30, width: 40, height: 17 }
const FOOTER_LINK = { top: 96, left: 20, width: 60, height: 3.5 }

// Le fond contient déjà l'entête "LE CERCLE / With Love, Hasna / LISTE DE COURSES"
// donc le contenu texte démarre plus bas, sous ce bandeau.
const CONTENT_TOP_PADDING = 230
const CONTENT_BOTTOM_PADDING = 50

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  invisibleLink: { position: 'absolute', border: 'none' },

  content: { paddingTop: CONTENT_TOP_PADDING, paddingBottom: CONTENT_BOTTOM_PADDING, paddingHorizontal: 34, fontSize: 10, color: '#3A3532' },
  dateText: { fontSize: 8, color: '#3A3532', opacity: 0.6, marginBottom: 14, textAlign: 'right' },
  shoppingGroupTitle: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 5, color: '#3A3532', backgroundColor: '#F0EAE0', padding: 6, borderRadius: 6 },
  shoppingItem: { fontSize: 9.5, marginBottom: 3, color: '#3A3532', paddingLeft: 4 },
})

type ShoppingByRecipe = { recipeTitle: string; items: string[] }[]
type ShoppingByCategory = Record<string, { ingredient: string; recipeTitle: string }[]>

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
  return (
    <Document>
      <Page size="A4">
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

        <View style={styles.content}>
          <Text style={styles.dateText}>Genere le {generatedAt}</Text>

          {grouping === 'recipe'
            ? shoppingByRecipe.map((group, i) => (
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
              ))
            : Object.entries(shoppingByCategory).map(([category, items], i) => (
                <View key={i} wrap={false}>
                  <Text style={styles.shoppingGroupTitle}>{category}</Text>
                  {items.map((item, j) => (
                    <Text key={j} style={styles.shoppingItem}>
                      - {item.ingredient} ({item.recipeTitle})
                    </Text>
                  ))}
                </View>
              ))}
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