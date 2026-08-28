import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: '#FDFBF6', fontSize: 10, color: '#3A3532' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, borderBottom: 1.5, borderBottomColor: '#C9A44C', paddingBottom: 12 },
  logo: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },
  headerTextWrap: { flexDirection: 'column', flex: 1 },
  siteName: { fontSize: 16, fontWeight: 700, color: '#3A3532' },
  subtitle: { fontSize: 9, color: '#3A3532', opacity: 0.7, marginTop: 2 },
  dateText: { fontSize: 8, color: '#3A3532', opacity: 0.6, marginTop: 12, marginBottom: 14, textAlign: 'right' },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#3A3532', marginBottom: 12 },
  shoppingGroupTitle: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 5, color: '#3A3532', backgroundColor: '#F0EAE0', padding: 6, borderRadius: 6 },
  shoppingItem: { fontSize: 9.5, marginBottom: 3, color: '#3A3532', paddingLeft: 4 },
  footer: { position: 'absolute', bottom: 18, left: 28, right: 28, fontSize: 8, color: '#3A3532', textAlign: 'center', borderTop: 1, borderTopColor: '#F0EAE0', paddingTop: 6, opacity: 0.7 },
})

type ShoppingByRecipe = { recipeTitle: string; items: string[] }[]
type ShoppingByCategory = Record<string, { ingredient: string; recipeTitle: string }[]>

export default function ShoppingListPdfDocument({
  shoppingByRecipe,
  shoppingByCategory,
  grouping,
  siteLogo,
  generatedAt,
}: {
  shoppingByRecipe: ShoppingByRecipe
  shoppingByCategory: ShoppingByCategory
  grouping: 'recipe' | 'category'
  siteLogo: string | null
  generatedAt: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {siteLogo && <Image src={siteLogo} style={styles.logo} />}
          <View style={styles.headerTextWrap}>
            <Text style={styles.siteName}>Thermomix With Love, Hasna</Text>
            <Text style={styles.subtitle}>Liste de courses</Text>
          </View>
        </View>

        <Text style={styles.dateText}>Genere le {generatedAt}</Text>

        <Text style={styles.sectionTitle}>Liste de courses</Text>

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

        <Text style={styles.footer} fixed>
          Thermomix With Love, Hasna - www.withlovehasna.com
        </Text>
      </Page>
    </Document>
  )
}