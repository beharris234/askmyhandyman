import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const BRAND = {
  clay: "#0D5C4E",
  sand: "#FAF7F2",
  amber: "#D97706",
  ink: "#1A2A30",
  stone: "#5A6B72",
  moss: "#E8EFE9",
};

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>Foothold</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.pill}>Coming soon</Text>
          <Text style={styles.title}>
            Lasting ground for your <Text style={styles.titleAccent}>GLP-1 journey.</Text>
          </Text>
          <Text style={styles.subtitle}>
            The companion built for every dose — and the days you're off it.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What we're building</Text>
          {[
            "Dose-cycle tracking + side-effect logging",
            "Injection-site rotation (body map)",
            "Doctor-ready PDF reports",
            "Pharmacy shortage tracker",
            "Off-ramp support for maintenance",
          ].map((item) => (
            <View key={item} style={styles.row}>
              <View style={styles.bullet} />
              <Text style={styles.rowText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          v0.1.0 · Scaffold only — features coming online soon.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.sand },
  container: { padding: 24, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.clay },
  logoText: { fontSize: 22, fontWeight: "600", color: BRAND.clay },
  hero: { marginTop: 40 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: BRAND.moss,
    color: BRAND.clay,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: { marginTop: 16, fontSize: 36, lineHeight: 40, fontWeight: "600", color: BRAND.ink },
  titleAccent: { color: BRAND.clay },
  subtitle: { marginTop: 16, fontSize: 17, lineHeight: 25, color: BRAND.stone },
  card: {
    marginTop: 32,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(13,92,78,0.12)",
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: BRAND.ink, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND.amber, marginTop: 8 },
  rowText: { flex: 1, fontSize: 15, lineHeight: 22, color: BRAND.stone },
  footnote: { marginTop: 32, textAlign: "center", fontSize: 12, color: BRAND.stone },
});
