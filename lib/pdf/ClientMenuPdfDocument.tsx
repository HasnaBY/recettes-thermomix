import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer'

const SITE_URL = 'https://www.withlovehasna.com'
const LOGO_LINK = { top: 1, left: 30, width: 40, height: 17 }
const FOOTER_LINK = { top: 96, left: 20, width: 60, height: 3.5 }

// Réserve l'espace de l'entête décoratif ("LE CERCLE / With Love, Hasna / TON MENU")
// sur CHAQUE page générée, pas seulement la première.
const HEADER_SPACE = 250
const FOOTER_SPACE = 60

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  invisibleLink: { position: 'absolute', border: 'none' },
  headerSpacer: { height: HEADER_SPACE },

  content: { paddingHorizontal: 34, paddingBottom: FOOTER_SPACE, fontSize: 10, color: '#3A3532' },
  dateText: { fontSize: 8, color: '#3A3532', opacity: 0.6, marginBottom: 14, textAlign: 'right' },

  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, marginBottom: 10, alignItems: 'center' },
  cardImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10, objectFit: 'cover' },
  cardImagePlaceholder: { width: 60, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: '#F0EAE0' },
  cardInfo: { flexDirection: 'column', flex: 1 },
  cardBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7, marginBottom: 4 },
  cardBadgePlat: { backgroundColor: '#3A3532' },
  cardBadgeAccomp: { backgroundColor: '#C9A44C' },
  cardBadgeText: { fontSize: 6.5, fontWeight: 700, color: '#FDFBF6' },
  cardTitle: { fontSize: 9.5, fontWeight: 700, color: '#3A3532', marginBottom: 2 },
  cardLink: { fontSize: 7, color: '#3A3532', textDecoration: 'underline' },

  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#4A5A45', marginTop: 6, marginBottom: 8 },
})

type Recipe = { id: string; title: string; image_url: string | null; cookidoo_url: string | null }

function RecipeCard({ recipe, kind }: { recipe: Recipe; kind: 'plat' | 'accomp' }) {
  const badgeStyle = kind === 'plat' ? styles.cardBadgePlat : styles.cardBadgeAccomp
  const badgeLabel = kind === 'plat' ? 'PLAT' : 'ACCOMPAGNEMENT'

  return (
    <View style={styles.card} wrap={false}>
      {recipe.image_url ? (
        <Image src={recipe.image_url} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
      <View style={styles.cardInfo}>
        <View style={[styles.cardBadge, badgeStyle]}>
          <Text style={styles.cardBadgeText}>{badgeLabel}</Text>
        </View>
        <Text style={styles.cardTitle}>{recipe.title}</Text>
        {recipe.cookidoo_url && (
          <Link src={recipe.cookidoo_url} style={styles.cardLink}>
            Voir sur Cookidoo
          </Link>
        )}
      </View>
    </View>
  )
}

export default function ClientMenuPdfDocument({
  orderedPlats,
  orderedAccompaniments,
  backgroundImage,
  generatedAt,
}: {
  orderedPlats: Recipe[]
  orderedAccompaniments: Recipe[]
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

        <View style={styles.headerSpacer} fixed />

        <View style={styles.content}>
          <Text style={styles.dateText}>Genere le {generatedAt}</Text>

          {orderedPlats.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Plats</Text>
              {orderedPlats.map((r) => (
                <RecipeCard key={r.id} recipe={r} kind="plat" />
              ))}
            </>
          )}

          {orderedAccompaniments.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Accompagnements</Text>
              {orderedAccompaniments.map((r) => (
                <RecipeCard key={r.id} recipe={r} kind="accomp" />
              ))}
            </>
          )}
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