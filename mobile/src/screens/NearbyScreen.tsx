import { StyleSheet, Text, View } from "react-native"
import { Card, SoftBox, cardStyles } from "../components/Card"
import { AppIcon } from "../components/Icon"
import { IconBadge } from "../components/IconBadge"
import { Screen, SectionTitle } from "../components/Screen"
import { NearbyPromo, formatCurrency } from "../data/capsa-data"
import { colors } from "../theme"

interface NearbyScreenProps {
  nearbyPromos: NearbyPromo[]
}

export function NearbyScreen({ nearbyPromos }: NearbyScreenProps) {
  const bestPromo = nearbyPromos[0]

  return (
    <Screen title="Cerca">
      <Card>
        <View style={cardStyles.row}>
          <View style={styles.flex}>
            <Text style={styles.muted}>Mejor decision cercana</Text>
            <Text style={styles.hero}>{bestPromo?.place ?? "Sin promos activas"}</Text>
            <Text style={styles.body}>
              {bestPromo ? `${bestPromo.distance} / ${bestPromo.category}` : "La base no tiene promociones vigentes para hoy."}
            </Text>
          </View>
          <IconBadge icon="map-pin" size={52} backgroundColor={colors.primary} color="#06120c" />
        </View>
        <SoftBox style={styles.bestBox}>
          <Text style={styles.bestTitle}>{bestPromo ? `${bestPromo.benefit} con ${bestPromo.card}` : "Sin recomendacion"}</Text>
          <Text style={styles.body}>{bestPromo?.reason ?? "Cargá promociones vigentes en CapsaAI."}</Text>
        </SoftBox>
      </Card>

      <SectionTitle title="Promociones detectadas" aside="Radio 800 m" />
      <View style={styles.stack}>
        {nearbyPromos.map((promo) => (
          <Card key={promo.place}>
            <View style={cardStyles.row}>
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{promo.place}</Text>
                <Text style={styles.bodySmall}>{promo.distance} / {promo.category}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{promo.benefit}</Text>
              </View>
            </View>

            <SoftBox style={styles.recoBox}>
              <AppIcon name="sparkles" color={colors.primary} size={18} />
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>Usar {promo.card}</Text>
                <Text style={styles.bodySmall}>{promo.reason}</Text>
              </View>
            </SoftBox>

            <View style={styles.savingRow}>
              <View style={styles.row}>
                <AppIcon name="navigation" color={colors.muted} size={16} />
                <Text style={styles.body}>Ahorro estimado</Text>
              </View>
              <Text style={styles.saving}>{formatCurrency(promo.saving)}</Text>
            </View>
          </Card>
        ))}
        {nearbyPromos.length === 0 ? (
          <Card>
            <Text style={styles.body}>No hay promociones vigentes en la base de datos para la fecha actual.</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stack: {
    gap: 10,
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  bodySmall: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  hero: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  bestBox: {
    marginTop: 16,
    gap: 5,
  },
  bestTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  badge: {
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  recoBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  saving: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
})
