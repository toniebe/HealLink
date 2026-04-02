import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Surface, Avatar, Badge } from 'react-native-paper';
import {
  Heart,
  Droplets,
  Activity,
  Moon,
  Scale,
  Search,
  Bell,
  Menu,
} from 'lucide-react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { authStore } from '../store/authStore';
import { C } from '../helper/theme';
import { DrawerActions, useNavigation } from '@react-navigation/native';

// Heart Rate data (7 hari)
const heartRateData = [
  { value: 65, frontColor: C.primary },
  { value: 72, frontColor: C.primary },
  { value: 68, frontColor: C.primary },
  { value: 78, frontColor: C.orange },
  { value: 74, frontColor: C.primary },
  { value: 70, frontColor: C.primary },
  { value: 78, frontColor: C.orange },
];

// HRV data (ms)
const hrvData = [
  { value: 42 },
  { value: 48 },
  { value: 45 },
  { value: 55 },
  { value: 50 },
  { value: 58 },
  { value: 52 },
];

// Tidur data (jam per hari)
const sleepData = [
  { value: 6.5, frontColor: '#7B8FD4' },
  { value: 7.2, frontColor: '#7B8FD4' },
  { value: 5.8, frontColor: C.redLight },
  { value: 8.0, frontColor: '#7B8FD4' },
  { value: 7.5, frontColor: '#7B8FD4' },
  { value: 6.0, frontColor: C.redLight },
  { value: 7.8, frontColor: '#7B8FD4' },
];

// Tekanan Darah data
const systolicData = [
  { value: 120 },
  { value: 125 },
  { value: 118 },
  { value: 122 },
  { value: 128 },
  { value: 119 },
  { value: 125 },
];
const diastolicData = [
  { value: 80 },
  { value: 82 },
  { value: 78 },
  { value: 84 },
  { value: 85 },
  { value: 79 },
  { value: 83 },
];

// ── Sleep Stage Labels ─────────────────────────────────────────────────────────
const sleepDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// ── Helper ────────────────────────────────────────────────────────────────────
const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) {
    return { label: 'Underweight', color: C.orange };
  }
  if (bmi < 25) {
    return { label: 'Normal', color: '#27AE60' };
  }
  if (bmi < 30) {
    return { label: 'Overweight', color: C.orange };
  }
  return { label: 'Obesity', color: C.redLight };
};

const getHRVStatus = (hrv: number): { label: string; color: string } => {
  if (hrv >= 50) {
    return { label: 'Good', color: '#27AE60' };
  }
  if (hrv >= 35) {
    return { label: 'Fair', color: C.orange };
  }
  return { label: 'Poor', color: C.redLight };
};

const menuItems = [
  { label: 'AI Chat', icon: '💬', screen: 'AIChat', color: C.primary },
  { label: 'Screening', icon: '📋', screen: 'Skrining', color: C.orange },
  { label: 'Trends', icon: '📈', screen: 'Tren', color: '#7B8FD4' },
  {
    label: 'Mood Journal',
    icon: '😊',
    screen: 'MoodJournal',
    color: '#27AE60',
  },
  { label: 'AI Insights', icon: '🔔', screen: 'Insight', color: C.secondary },
  {
    label: 'Telemedicine',
    icon: '📹',
    screen: 'Telemedicine',
    color: C.redLight,
  },
];

const HomeScreen: React.FC = () => {
  const user = authStore.getUser();
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const navigation = useNavigation<any>();

  const bmi = 22.4;
  const bmiCategory = getBMICategory(bmi);
  const hrv = 52;
  const hrvStatus = getHRVStatus(hrv);
  const bmiPercent = ((bmi - 10) / (40 - 10)) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              activeOpacity={0.8}
            >
              <Menu size={20} color={C.primary} />
            </TouchableOpacity>

            <Avatar.Text
              size={46}
              label={initial}
              style={{ backgroundColor: C.primary }}
              labelStyle={{ color: '#FFF', fontWeight: '700' }}
            />
            <View>
              <Text variant="bodySmall" style={styles.welcomeText}>
                Welcome 👋
              </Text>
              <Text variant="titleMedium" style={styles.userName}>
                {user?.name ?? 'User'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
              <Search size={20} color={C.text} />
            </TouchableOpacity>
            <View>
              <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                <Bell size={20} color={C.text} />
              </TouchableOpacity>
              <Badge style={styles.notifBadge} size={10} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="headlineMedium" style={styles.overviewTitle}>
            Overview
          </Text>
          <Text variant="bodySmall" style={styles.overviewSub}>
            Dashboard Your Health
          </Text>
        </View>

        {/* ══════════════════════════════════════════
            CARD 1 — Heart Rate
        ══════════════════════════════════════════ */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrapper,
                { backgroundColor: C.orangeLight },
              ]}
            >
              <Heart size={18} color={C.orange} fill={C.orange} />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text variant="labelMedium" style={styles.cardTitle}>
                Heart Rate
              </Text>
              <Text variant="labelSmall" style={styles.cardSubtitle}>
                7 days ago
              </Text>
            </View>
            <Text
              variant="labelSmall"
              style={[
                styles.statusBadge,
                { backgroundColor: C.orangeLight, color: C.orange },
              ]}
            >
              ● 78 BPM
            </Text>
          </View>

          <BarChart
            data={heartRateData}
            width={280}
            height={80}
            barWidth={26}
            spacing={12}
            hideRules
            hideAxesAndRules
            barBorderRadius={6}
            noOfSections={3}
            maxValue={100}
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
          />

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>
                Min
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.metricVal, { color: C.primary }]}
              >
                65
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                bpm
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>
                Average
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.metricVal, { color: C.orange }]}
              >
                72
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                bpm
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>
                Max
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.metricVal, { color: C.redLight }]}
              >
                78
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                bpm
              </Text>
            </View>
          </View>
        </Surface>

        {/* ══════════════════════════════════════════
            CARD 2 — HRV & Tekanan Darah (Row)
        ══════════════════════════════════════════ */}
        <View style={styles.row}>
          {/* HRV Card */}
          <Surface style={[styles.card, styles.halfCard]} elevation={1}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconWrapper,
                  { backgroundColor: C.primary + '20' },
                ]}
              >
                <Activity size={16} color={C.primary} />
              </View>
              <Text variant="labelSmall" style={styles.cardTitle}>
                HRV
              </Text>
            </View>

            <LineChart
              data={hrvData}
              width={110}
              height={55}
              color={C.primary}
              thickness={2}
              hideRules
              hideAxesAndRules
              dataPointsColor={C.primary}
              dataPointsRadius={3}
              isAnimated
              curved
              startFillColor={C.primary + '30'}
              endFillColor={C.primary + '05'}
              areaChart
            />

            <Text
              variant="headlineSmall"
              style={[styles.bigVal, { color: C.primary }]}
            >
              {hrv}{' '}
              <Text variant="labelSmall" style={styles.metricUnit}>
                ms
              </Text>
            </Text>
            <View
              style={[styles.pill, { backgroundColor: hrvStatus.color + '20' }]}
            >
              <Text
                variant="labelSmall"
                style={{ color: hrvStatus.color, fontWeight: '700' }}
              >
                {hrvStatus.label}
              </Text>
            </View>
          </Surface>

          {/* Tekanan Darah Card */}
          <Surface style={[styles.card, styles.halfCard]} elevation={1}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconWrapper,
                  { backgroundColor: C.redLight + '20' },
                ]}
              >
                <Droplets size={16} color={C.redLight} />
              </View>
              <Text variant="labelSmall" style={styles.cardTitle}>
                Tekanan Darah
              </Text>
            </View>

            <LineChart
              data={systolicData}
              data2={diastolicData}
              width={110}
              height={55}
              color={C.redLight}
              color2={C.orange}
              thickness={2}
              thickness2={2}
              hideRules
              hideAxesAndRules
              dataPointsColor={C.redLight}
              dataPointsColor2={C.orange}
              dataPointsRadius={3}
              isAnimated
              curved
            />

            <Text
              variant="titleLarge"
              style={{ color: C.redLight, fontWeight: '800', marginTop: 4 }}
            >
              125/83
            </Text>
            <Text variant="labelSmall" style={styles.metricUnit}>
              mmHg
            </Text>
            <View style={[styles.pill, { backgroundColor: '#FFF0D6' }]}>
              <Text
                variant="labelSmall"
                style={{ color: C.orange, fontWeight: '700' }}
              >
                Normal Tinggi
              </Text>
            </View>
          </Surface>
        </View>

        {/* ══════════════════════════════════════════
            CARD 3 — Tidur (Grafik Batang)
        ══════════════════════════════════════════ */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.cardIconWrapper, { backgroundColor: '#7B8FD420' }]}
            >
              <Moon size={18} color="#7B8FD4" />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text variant="labelMedium" style={styles.cardTitle}>
                Sleep Quality
              </Text>
              <Text variant="labelSmall" style={styles.cardSubtitle}>
                7 days ago
              </Text>
            </View>
            <Text
              variant="labelSmall"
              style={[
                styles.statusBadge,
                { backgroundColor: '#7B8FD420', color: '#7B8FD4' },
              ]}
            >
              ● 7.2 jam
            </Text>
          </View>

          <BarChart
            data={sleepData}
            width={280}
            height={80}
            barWidth={26}
            spacing={12}
            hideRules
            hideAxesAndRules
            barBorderRadius={6}
            noOfSections={4}
            maxValue={10}
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
            showXAxisIndices
            xAxisIndicesColor="transparent"
          />

          {/* Day labels */}
          <View style={styles.dayLabels}>
            {sleepDays.map(day => (
              <Text key={day} variant="labelSmall" style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>
                Shortest
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.metricVal, { color: C.redLight }]}
              >
                5.8
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                hours
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>
                Average
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.metricVal, { color: '#7B8FD4' }]}
              >
                7.2
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                hours
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>
                Max
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.metricVal, { color: '#27AE60' }]}
              >
                8.0
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                hours
              </Text>
            </View>
          </View>
        </Surface>

        {/* ══════════════════════════════════════════
            CARD 4 — IMT (Indeks Massa Tubuh)
        ══════════════════════════════════════════ */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrapper,
                { backgroundColor: C.secondary + '60' },
              ]}
            >
              <Scale size={18} color="#4A7A6A" />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text variant="labelMedium" style={styles.cardTitle}>
                BMI (Body Mass Index)
              </Text>
              <Text variant="labelSmall" style={styles.cardSubtitle}>
                Based on profile data
              </Text>
            </View>
          </View>

          <View style={styles.imtRow}>
            <View style={styles.imtLeft}>
              <Text
                variant="displaySmall"
                style={[styles.imtValue, { color: bmiCategory.color }]}
              >
                {bmi}
              </Text>
              <Text variant="labelSmall" style={styles.metricUnit}>
                kg/m²
              </Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: bmiCategory.color + '20', marginTop: 6 },
                ]}
              >
                <Text
                  variant="labelMedium"
                  style={{ color: bmiCategory.color, fontWeight: '700' }}
                >
                  {bmiCategory.label}
                </Text>
              </View>
            </View>

            <View style={styles.imtRight}>
              {/* BMI Scale Bar */}
              <View style={styles.bmiScaleWrapper}>
                <View style={styles.bmiScale}>
                  <View
                    style={[
                      styles.bmiSegment,
                      {
                        flex: 1,
                        backgroundColor: C.orange + '80',
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bmiSegment,
                      { flex: 1.3, backgroundColor: '#27AE6080' },
                    ]}
                  />
                  <View
                    style={[
                      styles.bmiSegment,
                      { flex: 1, backgroundColor: C.orange + '80' },
                    ]}
                  />
                  <View
                    style={[
                      styles.bmiSegment,
                      {
                        flex: 1.2,
                        backgroundColor: C.redLight + '80',
                        borderTopRightRadius: 6,
                        borderBottomRightRadius: 6,
                      },
                    ]}
                  />
                </View>
                {/* Indicator */}
                <View
                  style={[
                    styles.bmiIndicator,
                    { left: `${bmiPercent}%` as any },
                  ]}
                >
                  <View
                    style={[
                      styles.bmiDot,
                      { backgroundColor: bmiCategory.color },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.bmiLabels}>
                <Text variant="labelSmall" style={styles.bmiLabelText}>
                  Underweight
                </Text>
                <Text variant="labelSmall" style={styles.bmiLabelText}>
                  Normal
                </Text>
                <Text variant="labelSmall" style={styles.bmiLabelText}>
                  Overweight
                </Text>
                <Text variant="labelSmall" style={styles.bmiLabelText}>
                  Obesity
                </Text>
              </View>

              <View style={styles.bodyStats}>
                <View style={styles.bodyStat}>
                  <Text variant="labelSmall" style={styles.metricLabel}>
                    Weight
                  </Text>
                  <Text variant="titleSmall" style={styles.bodyStatVal}>
                    68 kg
                  </Text>
                </View>
                <View style={styles.bodyStat}>
                  <Text variant="labelSmall" style={styles.metricLabel}>
                    Height
                  </Text>
                  <Text variant="titleSmall" style={styles.bodyStatVal}>
                    174 cm
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Features
        </Text>
        <View style={styles.menuGrid}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { backgroundColor: item.color + '15' }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrapper,
                  { backgroundColor: item.color + '25' },
                ]}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text
                variant="labelSmall"
                style={[styles.menuLabel, { color: item.color }]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { color: C.textMuted },
  userName: { fontWeight: '700', color: C.text },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    backgroundColor: C.card,
    borderRadius: 20,
    margin: 0,
    padding: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: C.redLight,
  },

  sectionHeader: { marginBottom: 16 },
  overviewTitle: { fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  overviewSub: { color: C.textMuted, marginTop: 2 },
  sectionTitle: {
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    marginTop: 4,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  halfCard: { flex: 1, marginBottom: 0 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleGroup: { flex: 1 },
  cardTitle: { fontWeight: '700', color: C.text },
  cardSubtitle: { color: C.textMuted, marginTop: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    fontWeight: '600',
    overflow: 'hidden',
  },

  metricRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: '#F0F0F0' },
  metricLabel: { color: C.textMuted, marginBottom: 2 },
  metricVal: { fontWeight: '800' },
  metricUnit: { color: C.textMuted },

  bigVal: { fontWeight: '800', marginTop: 8 },

  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },

  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dayLabel: { color: C.textMuted, flex: 1, textAlign: 'center' },

  imtRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  imtLeft: { alignItems: 'flex-start' },
  imtValue: { fontWeight: '900', letterSpacing: -1 },
  imtRight: { flex: 1 },
  bmiScaleWrapper: { position: 'relative', marginBottom: 4 },
  bmiScale: { flexDirection: 'row', height: 10, borderRadius: 6 },
  bmiSegment: { height: 10 },
  bmiIndicator: {
    position: 'absolute',
    top: -4,
    marginLeft: -8,
  },
  bmiDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bmiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  bmiLabelText: { color: C.textMuted, fontSize: 9 },
  bodyStats: { flexDirection: 'row', gap: 16 },
  bodyStat: {},
  bodyStatVal: { fontWeight: '700', color: C.text },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  menuItem: {
    width: '30%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  menuIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: { fontSize: 24 },
  menuLabel: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
});

export default HomeScreen;
