import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'
const LOGO_LINK = { top: 1, left: 30, width: 40, height: 17 }
const FOOTER_LINK = { top: 96, left: 20, width: 60, height: 3.5 }

// Réserve toujours l'espace de l'entête décoratif (logo + "LISTE DE COURSES") en haut
// de CHAQUE page, pas seulement la première — c'est ça qui manquait.
const HEADER_SPACE = 260
const FOOTER_SPACE = 60

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  invisibleLink: { position: 'absolute', border: 'none' },

  // Espace réservé en haut de page, vide, pour laisser voir l'entête du fond.
  headerSpacer: { height: HEADER_SPACE },

  content: { paddingHorizontal: 34, paddingBottom: FOOTER_SPACE, fontSize: 10, color: '#3A3532' },
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

        {/* Bloc vide, répété en haut de CHAQUE page, qui pousse le contenu sous l'entête du fond */}
        <View style={styles.headerSpacer} fixed />

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