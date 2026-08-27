import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: '#FDFBF6', fontSize: 10, color: '#3A3532' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottom: 1, borderBottomColor: '#F0EAE0', paddingBottom: 12 },
  logo: { width: 45, height: 45, borderRadius: 22, marginRight: 10 },
  headerTextWrap: { flexDirection: 'column', flex: 1 },
  siteName: { fontSize: 15, fontWeight: 700, color: '#3A3532' },
  subtitle: { fontSize: 9, color: '#3A3532', opacity: 0.7, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#3A3532', marginTop: 14, marginBottom: 8 },
  recipeCard: { flexDirection: 'row', marginBottom: 8, border: 1, borderColor: '#F0EAE0', borderRadius: 6, padding: 8, alignItems: 'center' },
  recipeImage: { width: 50, height: 50, borderRadius: 6, marginRight: 10 },
  recipeImagePlaceholder: { width: 50, height: 50, borderRadius: 6, marginRight: 10, backgroundColor: '#F6DEE1' },
  recipeInfo: { flexDirection: 'column', flex: 1 },
  recipeTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 2, color: '#3A3532' },
  recipeLink: { fontSize: 8.5, color: '#3A3532', textDecoration: 'underline' },
  shoppingGroupTitle: { fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: '#3A3532' },
  shoppingItem: { fontSize: 9, marginBottom: 2, color: '#3A3532' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 8, color: '#3A3532', textAlign: 'center', borderTop: 1, borderTopColor: '#F0EAE0', paddingTop: 6, opacity: 0.7 },
  cercleLogoSmall: { width: 22, height: 22, borderRadius: 11, marginLeft: 8 },
})

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null; ingredients: string[] | null }
type ShoppingByRecipe = { recipeTitle: string; items: string[] }[]
type ShoppingByCategory = Record<string, { ingredient: string; recipeTitle: string }[]>

export default function MenuPdfDocument({
  recipes,
  shoppingByRecipe,
  shoppingByCategory,
  grouping,
  siteLogo,
  cercleLogo,
}: {
  recipes: Recipe[]
  shoppingByRecipe: ShoppingByRecipe
  shoppingByCategory: ShoppingByCategory
  grouping: 'recipe' | 'category'
  siteLogo: string | null
  cercleLogo: string | null
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {siteLogo && <Image src={siteLogo} style={styles.logo} />}
          <View style={styles.headerTextWrap}>
            <Text style={styles.siteName}>Thermomix With Love, Hasna</Text>
            <Text style={styles.subtitle}>Ton menu personnalisé — Le Cercle With Love</Text>
          </View>
          {cercleLogo && <Image src={cercleLogo} style={styles.cercleLogoSmall} />}
        </View>

        <Text style={styles.sectionTitle}>🍽️ Recettes du menu</Text>
        {recipes.map((r) => (
          <View key={r.id} style={styles.recipeCard} wrap={false}>
            {r.image_url ? (
              <Image src={r.image_url} style={styles.recipeImage} />
            ) : (
              <View style={styles.recipeImagePlaceholder} />
            )}
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeTitle}>{r.title}</Text>
              {r.cookidoo_url && (
                <Link src={r.cookidoo_url} style={styles.recipeLink}>
                  Voir sur Cookidoo
                </Link>
              )}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>🛒 Liste de courses</Text>

        {grouping === 'recipe'
          ? shoppingByRecipe.map((group, i) => (
              <View key={i} wrap={false}>
                <Text style={styles.shoppingGroupTitle}>{group.recipeTitle}</Text>
                {group.items.length === 0 ? (
                  <Text style={styles.shoppingItem}>Aucun ingrédient renseigné.</Text>
                ) : (
                  group.items.map((item, j) => (
                    <Text key={j} style={styles.shoppingItem}>
                      • {item}
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
                    • {item.ingredient} ({item.recipeTitle})
                  </Text>
                ))}
              </View>
            ))}

        <Text style={styles.footer} fixed>
          Thermomix With Love, Hasna — www.withlovehasna.com
        </Text>
      </Page>
    </Document>
  )
}