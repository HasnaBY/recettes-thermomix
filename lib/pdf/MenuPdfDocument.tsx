import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { formatDayLabel, formatDateRange } from '@/lib/dateHelpers'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  content: { padding: 30 },

  brandName: { fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#C9A44C', textAlign: 'center', letterSpacing: 0.5 },
  mainTitle: { fontSize: 24, fontWeight: 700, color: '#3A3532', textAlign: 'center', marginTop: 6, letterSpacing: 2 },
  dateBanner: { backgroundColor: '#C9A44C', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 18, alignSelf: 'center', marginTop: 10 },
  dateBannerText: { fontSize: 10, fontWeight: 700, color: '#FDFBF6', letterSpacing: 0.5 },
  tagline: { fontSize: 10, fontStyle: 'italic', color: '#3A3532', opacity: 0.75, textAlign: 'center', marginTop: 10, marginBottom: 18 },

  dayBlock: { marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0EAE0' },
  dayHeader: { backgroundColor: '#3A3532', paddingVertical: 5, paddingHorizontal: 12 },
  dayHeaderText: { fontSize: 10.5, fontWeight: 700, color: '#FDFBF6', letterSpacing: 1 },
  dayContent: { flexDirection: 'row' },

  itemHalf: { width: '50%', padding: 10, flexDirection: 'column' },
  itemHalfLeft: { backgroundColor: '#DCEAF0' },
  itemHalfRight: { backgroundColor: '#F6DEE1' },

  badge: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8, marginBottom: 6 },
  badgePlat: { backgroundColor: '#3A3532' },
  badgeDessert: { backgroundColor: '#C9A44C' },
  badgeText: { fontSize: 7, fontWeight: 700, color: '#FDFBF6', letterSpacing: 0.5 },

  itemImage: { width: '100%', height: 85, borderRadius: 8, marginBottom: 6, objectFit: 'cover' },
  itemImagePlaceholder: { width: '100%', height: 85, borderRadius: 8, marginBottom: 6, backgroundColor: '#FFFFFF' },
  itemTitle: { fontSize: 9.5, fontWeight: 700, color: '#3A3532', marginBottom: 3 },
  itemLink: { fontSize: 7.5, color: '#3A3532', textDecoration: 'underline' },

  extraSectionTitle: { fontSize: 13, fontWeight: 700, color: '#3A3532', marginTop: 10, marginBottom: 10 },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraCard: { width: '100%', flexDirection: 'row', backgroundColor: '#F0EAE0', borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  extraImage: { width: 62, height: 62, borderRadius: 8, marginRight: 8, objectFit: 'cover' },
  extraImagePlaceholder: { width: 62, height: 62, borderRadius: 8, marginRight: 8, backgroundColor: '#FFFFFF' },
  extraInfo: { flexDirection: 'column', flex: 1 },
  extraTitle: { fontSize: 9.5, fontWeight: 700, color: '#3A3532', marginBottom: 3 },

  footer: { position: 'absolute', bottom: 16, left: 30, right: 30, fontSize: 8, color: '#3A3532', textAlign: 'center', borderTop: 1, borderTopColor: '#F0EAE0', paddingTop: 6, opacity: 0.7 },
})

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }
type CategorizedRecipes = Record<string, Recipe[]>

function ItemCard({ recipe, badgeLabel, side }: { recipe: Recipe; badgeLabel: 'PLAT' | 'DESSERT' | 'BOISSON'; side: 'left' | 'right' }) {
  const badgeStyle = badgeLabel === 'PLAT' ? styles.badgePlat : styles.badgeDessert
  return (
    <View style={[styles.itemHalf, side === 'left' ? styles.itemHalfLeft : styles.itemHalfRight]}>
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{badgeLabel}</Text>
      </View>
      {recipe.cookidoo_url ? (
        <Link src={recipe.cookidoo_url}>
          {recipe.image_url ? <Image src={recipe.image_url} style={styles.itemImage} /> : <View style={styles.itemImagePlaceholder} />}
        </Link>
      ) : recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder} />
      )}
      <Text style={styles.itemTitle}>{recipe.title}</Text>
      {recipe.cookidoo_url && (
        <Link src={recipe.cookidoo_url} style={styles.itemLink}>
          Voir sur Cookidoo
        </Link>
      )}
    </View>
  )
}

export default function MenuPdfDocument({
  categorizedRecipes,
  backgroundImage,
  distributeByDay,
  periodStart,
  tagline,
}: {
  categorizedRecipes: CategorizedRecipes
  backgroundImage: string | null
  distributeByDay: boolean
  periodStart: string | null
  tagline: string
}) {
  const plats = categorizedRecipes.plats ?? []
  const desserts = categorizedRecipes.desserts ?? []
  const boissons = categorizedRecipes.boissons ?? []
  const pains = categorizedRecipes.pains ?? []

  const accompaniments: { recipe: Recipe; label: 'DESSERT' | 'BOISSON' }[] = [
    ...desserts.map((r) => ({ recipe: r, label: 'DESSERT' as const })),
    ...boissons.map((r) => ({ recipe: r, label: 'BOISSON' as const })),
  ]

  const dayCount = distributeByDay ? Math.min(plats.length, 5) : 0
  const dayPairs = distributeByDay
    ? Array.from({ length: dayCount }).map((_, i) => ({
        label: periodStart ? formatDayLabel(periodStart, i + 1) : ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'][i],
        plat: plats[i],
        accompaniment: accompaniments[i],
      }))
    : []

  const usedPlatIds = new Set(dayPairs.map((p) => p.plat?.id).filter(Boolean))
  const usedAccompIds = new Set(dayPairs.map((p) => p.accompaniment?.recipe.id).filter(Boolean))

  const extraItems: Recipe[] = distributeByDay
    ? [
        ...plats.filter((r) => !usedPlatIds.has(r.id)),
        ...desserts.filter((r) => !usedAccompIds.has(r.id)),
        ...boissons.filter((r) => !usedAccompIds.has(r.id)),
        ...pains,
      ]
    : [...plats, ...desserts, ...boissons, ...pains]

  const dateLabel = periodStart
    ? formatDateRange(periodStart, dayCount > 0 ? dayCount : 5)
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4">
        {backgroundImage && <Image src={backgroundImage} style={styles.background} fixed />}

        <View style={styles.content}>
          <Text style={styles.brandName}>With Love, Hasna</Text>
          <Text style={styles.mainTitle}>MENU DE LA SEMAINE</Text>
          <View style={styles.dateBanner}>
            <Text style={styles.dateBannerText}>{dateLabel.toUpperCase()}</Text>
          </View>
          <Text style={styles.tagline}>{tagline}</Text>

          {distributeByDay &&
            dayPairs.map((pair, i) => (
              <View key={i} style={styles.dayBlock} wrap={false}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{pair.label}</Text>
                </View>
                <View style={styles.dayContent}>
                  {pair.plat && <ItemCard recipe={pair.plat} badgeLabel="PLAT" side="left" />}
                  {pair.accompaniment && (
                    <ItemCard recipe={pair.accompaniment.recipe} badgeLabel={pair.accompaniment.label} side="right" />
                  )}
                </View>
              </View>
            ))}

          {extraItems.length > 0 && (
            <>
              <Text style={styles.extraSectionTitle}>
                {distributeByDay ? 'Recettes supplementaires' : 'Recettes du menu'}
              </Text>
              <View style={styles.extraGrid}>
                {extraItems.map((r) => (
                  <View key={r.id} style={styles.extraCard} wrap={false}>
                    {r.image_url ? (
                      <Image src={r.image_url} style={styles.extraImage} />
                    ) : (
                      <View style={styles.extraImagePlaceholder} />
                    )}
                    <View style={styles.extraInfo}>
                      <Text style={styles.extraTitle}>{r.title}</Text>
                      {r.cookidoo_url && (
                        <Link src={r.cookidoo_url} style={styles.itemLink}>
                          Voir sur Cookidoo
                        </Link>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <Text style={styles.footer} fixed>
          Thermomix With Love, Hasna - www.withlovehasna.com
        </Text>
      </Page>
    </Document>
  )
}