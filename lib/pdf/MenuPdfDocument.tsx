import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: '#FDFBF6', fontSize: 10, color: '#3A3532' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, borderBottom: 1.5, borderBottomColor: '#C9A44C', paddingBottom: 12 },
  logo: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },
  headerTextWrap: { flexDirection: 'column', flex: 1 },
  siteName: { fontSize: 16, fontWeight: 700, color: '#3A3532' },
  subtitle: { fontSize: 9, color: '#3A3532', opacity: 0.7, marginTop: 2 },
  cercleLogoSmall: { width: 26, height: 26, borderRadius: 13, marginLeft: 8 },

  categoryBlock: { borderRadius: 10, padding: 12, marginBottom: 14 },
  categoryTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#3A3532' },
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recipeCard: { width: '48%', flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 6, marginBottom: 8, alignItems: 'center' },
  recipeImage: { width: 62, height: 62, borderRadius: 8, marginRight: 8 },
  recipeImagePlaceholder: { width: 62, height: 62, borderRadius: 8, marginRight: 8, backgroundColor: '#FDFBF6' },
  recipeInfo: { flexDirection: 'column', flex: 1 },
  recipeTitle: { fontSize: 9.5, fontWeight: 700, marginBottom: 3, color: '#3A3532' },
  recipeLink: { fontSize: 8, color: '#3A3532', textDecoration: 'underline' },

  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#3A3532', marginTop: 8, marginBottom: 10 },
  shoppingGroupTitle: { fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: '#3A3532' },
  shoppingItem: { fontSize: 9, marginBottom: 2, color: '#3A3532' },

  footer: { position: 'absolute', bottom: 18, left: 28, right: 28, fontSize: 8, color: '#3A3532', textAlign: 'center', borderTop: 1, borderTopColor: '#F0EAE0', paddingTop: 6, opacity: 0.7 },
})

const CATEGORY_STYLES: Record<string, { bg: string; label: string }> = {
  plats: { bg: '#DCEAF0', label: '🍽️ Plats' },
  desserts: { bg: '#F6DEE1', label: '🍰 Desserts / goûters' },
  boissons: { bg: '#E3ECDD', label: '🥤 Boissons' },
  pains: { bg: '#F0EAE0', label: '🍞 Pains' },
}

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null; ingredients: string[] | null }
type CategorizedRecipes = Record<string, Recipe[]>
type ShoppingByRecipe = { recipeTitle: string; items: string[] }[]
type ShoppingByCategory = Record<string, { ingredient: string; recipeTitle: string }[]>

export default function MenuPdfDocument({
  categorizedRecipes,
  shoppingByRecipe,
  shoppingByCategory,
  grouping,
  siteLogo,
  cercleLogo,
}: {
  categorizedRecipes: CategorizedRecipes
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

        {Object.entries(categorizedRecipes).map(([key, recipes]) => {
          if (recipes.length === 0) return null
          const style = CATEGORY_STYLES[key]
          return (
            <View key={key} style={[styles.categoryBlock, { backgroundColor: style.bg }]} wrap={false}>
              <Text style={styles.categoryTitle}>{style.label}</Text>
              <View style={styles.recipeGrid}>
                {recipes.map((r) => (
                  <View key={r.id} style={styles.recipeCard}>
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
              </View>
            </View>
          )
        })}

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