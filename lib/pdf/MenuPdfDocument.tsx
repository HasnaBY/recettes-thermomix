import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'
import { formatDayLabel, formatDateRange } from '@/lib/dateHelpers'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FDFBF6' },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  content: { padding: 30 },

  brandName: { fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: '#C9A44C', textAlign: 'center', letterSpacing: 0.5 },
  mainTitle: { fontSize: 20, fontWeight: 700, color: '#3A3532', textAlign: 'center', marginTop: 4, letterSpacing: 2 },
  dateBanner: { backgroundColor: '#C9A44C', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 16, alignSelf: 'center', marginTop: 8 },
  dateBannerText: { fontSize: 9.5, fontWeight: 700, color: '#FDFBF6', letterSpacing: 0.5 },
  tagline: { fontSize: 9, fontStyle: 'italic', color: '#3A3532', opacity: 0.75, textAlign: 'center', marginTop: 8, marginBottom: 16 },

  dayRow: { flexDirection: 'row', marginBottom: 8, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F0EAE0' },
  dayLabelCell: { width: '16%', backgroundColor: '#F0EAE0', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  dayLabelText: { fontSize: 8.5, fontWeight: 700, color: '#3A3532', textAlign: 'center' },
  dayLabelDate: { fontSize: 7, color: '#3A3532', opacity: 0.6, marginTop: 2, textAlign: 'center' },

  itemCell: { width: '42%', flexDirection: 'row', padding: 7, alignItems: 'center' },
  itemCellPlat: { backgroundColor: '#DCEAF0' },
  itemCellDessert: { backgroundColor: '#F6DEE1' },

  iconCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0 },
  iconCirclePlat: { backgroundColor: '#3A3532' },
  iconCircleDessert: { backgroundColor: '#C9A44C' },
  iconCircleText: { fontSize: 8, fontWeight: 700, color: '#FDFBF6' },

  itemImage: { width: 44, height: 44, borderRadius: 6, marginRight: 6, objectFit: 'cover', flexShrink: 0 },
  itemImagePlaceholder: { width: 44, height: 44, borderRadius: 6, marginRight: 6, backgroundColor: '#FFFFFF', flexShrink: 0 },

  itemInfo: { flexDirection: 'column', flex: 1 },
  itemTitle: { fontSize: 8, fontWeight: 700, color: '#3A3532', marginBottom: 2 },
  itemLink: { fontSize: 6.5, color: '#3A3532', textDecoration: 'underline' },

  extraSectionTitle: { fontSize: 12, fontWeight: 700, color: '#3A3532', marginTop: 12, marginBottom: 8 },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraCard: { width: '100%', flexDirection: 'row', backgroundColor: '#F0EAE0', borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  extraImage: { width: 50, height: 50, borderRadius: 8, marginRight: 8, objectFit: 'cover' },
  extraImagePlaceholder: { width: 50, height: 50, borderRadius: 8, marginRight: 8, backgroundColor: '#FFFFFF' },
  extraInfo: { flexDirection: 'column', flex: 1 },
  extraTitle: { fontSize: 9, fontWeight: 700, color: '#3A3532', marginBottom: 2 },

  footer: { position: 'absolute', bottom: 14, left: 30, right: 30, fontSize: 7.5, color: '#3A3532', textAlign: 'center', borderTop: 1, borderTopColor: '#F0EAE0', paddingTop: 5, opacity: 0.7 },
})

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }
type CategorizedRecipes = Record<string, Recipe[]>

function ItemCell({ recipe, kind }: { recipe: Recipe; kind: 'PLAT' | 'DESSERT' | 'BOISSON' }) {
  const isDish = kind === 'PLAT'
  const letter = kind === 'PLAT' ? 'P' : kind === 'DESSERT' ? 'D' : 'B'

  return (
    <View style={[styles.itemCell, isDish ? styles.itemCellPlat : styles.itemCellDessert]}>
      <View style={[styles.iconCircle, isDish ? styles.iconCirclePlat : styles.iconCircleDessert]}>
        <Text style={styles.iconCircleText}>{letter}</Text>
      </View>
      {recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder} />
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{recipe.title}</Text>
        {recipe.cookidoo_url && (
          <Link src={recipe.cookidoo_url} style={styles.itemLink}>
            Voir sur Cookidoo
          </Link>
        )}
      </View>
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
    ? Array.from({ length: dayCount }).map((_, i) => {
        const fullLabel = periodStart ? formatDayLabel(periodStart, i + 1) : ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'][i]
        const [dayName, ...dateParts] = fullLabel.split(' ')
        return {
          dayName,
          dateLabel: dateParts.join(' '),
          plat: plats[i],
          accompaniment: accompaniments[i],
        }
      })
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
              <View key={i} style={styles.dayRow} wrap={false}>
                <View style={styles.dayLabelCell}>
                  <Text style={styles.dayLabelText}>{pair.dayName}</Text>
                  {pair.dateLabel && <Text style={styles.dayLabelDate}>{pair.dateLabel}</Text>}
                </View>
                {pair.plat && <ItemCell recipe={pair.plat} kind="PLAT" />}
                {pair.accompaniment && (
                  <ItemCell recipe={pair.accompaniment.recipe} kind={pair.accompaniment.label} />
                )}
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