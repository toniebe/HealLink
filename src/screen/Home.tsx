import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Surface, Badge, ActivityIndicator, ProgressBar } from 'react-native-paper';
import {
  Heart,
  Droplets,
  Activity,
  Moon,
  Scale,
  Search,
  Bell,
  Menu,
  Brain,
} from 'lucide-react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { authStore } from '../store/authStore';
import { C } from '../helper/theme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { get } from '../helper/apiHelper';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScreeningData {
  uuid: string;
  height_cm: string;
  weight_kg: string;
  bmi: string;
  systolic: number;
  diastolic: number;
  phq9_answers: number[];
  phq9_score: number;
  created_at: string;
  updated_at: string;
}

interface SleepEntry {
  uuid: string;
  duration_minutes: number;
  quality_score: string;
  quality_category: string;
  sleep_time: string;
  wake_time: string;
  sleep_date: string;
  created_at: string;
}

interface MentalStatus {
  uuid: string;
  risk_level: string;
  risk_score: string;
  detected_emotion: string;
  summary_note: string;
  contributing_factors: any[];
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const staticHrvData = [
  { value: 42 },
  { value: 48 },
  { value: 45 },
  { value: 55 },
  { value: 50 },
  { value: 58 },
  { value: 52 },
];

const staticHeartRateData = [
  { value: 65, frontColor: C.primary },
  { value: 72, frontColor: C.primary },
  { value: 68, frontColor: C.primary },
  { value: 78, frontColor: C.orange },
  { value: 74, frontColor: C.primary },
  { value: 70, frontColor: C.primary },
  { value: 78, frontColor: C.orange },
];

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) { return { label: 'Underweight', color: C.orange }; }
  if (bmi < 25)   { return { label: 'Normal',      color: '#27AE60' }; }
  if (bmi < 30)   { return { label: 'Overweight',  color: C.orange }; }
  return { label: 'Obesity', color: C.redLight };
};

const getHRVStatus = (hrv: number) => {
  if (hrv >= 50) { return { label: 'Good', color: '#27AE60' }; }
  if (hrv >= 35) { return { label: 'Fair', color: C.orange }; }
  return { label: 'Poor', color: C.redLight };
};

const getBPStatus = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80) { return { label: 'Normal',       color: '#27AE60' }; }
  if (systolic < 130 && diastolic < 80) { return { label: 'Elevated',     color: C.orange }; }
  if (systolic < 140 || diastolic < 90) { return { label: 'High Stage 1', color: '#F5A623' }; }
  return { label: 'High Stage 2', color: C.redLight };
};

const getPHQ9Severity = (score: number) => {
  if (score <= 4)  { return { label: 'Minimal',           color: '#27AE60', bg: '#27AE6015' }; }
  if (score <= 9)  { return { label: 'Mild',              color: C.orange,  bg: C.orange + '15' }; }
  if (score <= 14) { return { label: 'Moderate',          color: '#F5A623', bg: '#F5A62315' }; }
  if (score <= 19) { return { label: 'Moderately Severe', color: C.redLight, bg: C.redLight + '15' }; }
  return { label: 'Severe', color: C.red, bg: C.red + '15' };
};

const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'low':    return '#27AE60';
    case 'medium': return C.orange;
    case 'high':   return C.redLight;
    default:       return C.textMuted;
  }
};

const getLast7Days = () => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ]);
  }
};

const sleepDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Component ──────────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const user = authStore.getUser();
  const navigation = useNavigation<any>();

  const [screening, setScreening] = useState<ScreeningData | null>(null);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [latestMental, setLatestMental] = useState<MentalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const dates = getLast7Days();
    const from = dates[0];
    const to = dates[6];

    const [screeningRes, sleepRes, mentalRes] = await Promise.all([
      get<any>('/screening/latest'),
      get<any>('/sleep/history', { from, to }),
      get<any>('/mental-status/latest'),
    ]);

    if (screeningRes.data?.success) { setScreening(screeningRes.data.data); }
    if (sleepRes.data)              { setSleepHistory(sleepRes.data?.data ?? []); }
    if (mentalRes.data?.success)    { setLatestMental(mentalRes.data.data); }

    setLoading(false);
  }, []);

  useEffect(() => {
    requestPermissions();
    fetchData();
  }, [fetchData]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const bmiNum         = screening ? parseFloat(screening.bmi) : null;
  const bmiCategory    = bmiNum ? getBMICategory(bmiNum) : { label: '—', color: C.textMuted };
  const bmiPercent     = bmiNum ? Math.min(Math.max(((bmiNum - 10) / (40 - 10)) * 100, 0), 100) : 0;
  const bpStat         = screening ? getBPStatus(screening.systolic, screening.diastolic) : null;
  const phqSev         = screening ? getPHQ9Severity(screening.phq9_score) : null;

  const latestHrv      = staticHrvData[staticHrvData.length - 1].value;
  const hrvStatus      = getHRVStatus(latestHrv);

  const avgSleepHours  = sleepHistory.length
    ? (sleepHistory.reduce((a, s) => a + s.duration_minutes, 0) / sleepHistory.length / 60).toFixed(1)
    : null;

  const sleepChartData = sleepHistory.slice(0, 7).map(s => ({
    value: Math.round((s.duration_minutes / 60) * 10) / 10,
    frontColor:
      s.quality_category === 'poor'      ? C.redLight :
      s.quality_category === 'fair'      ? C.orange   :
      s.quality_category === 'excellent' ? '#27AE60'  : '#7B8FD4',
  }));

  const displaySleepDays = sleepHistory.slice(0, 7).map(s =>
    new Date(s.sleep_date).toLocaleDateString('en', { weekday: 'short' }),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              activeOpacity={0.8}
            >
              <Menu size={20} color={C.primary} />
            </TouchableOpacity>
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
          <View style={styles.welcomeRow}>
            <Text variant="bodySmall" style={styles.welcomeText}>Welcome, </Text>
            <Text variant="titleMedium" style={styles.userName}>{user?.name ?? 'User'}</Text>
          </View>
          <Text variant="headlineMedium" style={styles.overviewTitle}>Overview</Text>
          <Text variant="bodySmall" style={styles.overviewSub}>Dashboard Your Health</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={styles.loader} />
        ) : (
          <>
            {/* ══ Heart Rate (static) ═══════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrapper, styles.iconHeart]}>
                  <Heart size={18} color={C.orange} fill={C.orange} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>Heart Rate</Text>
                  <Text variant="labelSmall" style={styles.cardSubtitle}>7 days</Text>
                </View>
                <Text variant="labelSmall" style={[styles.statusBadge, styles.badgeOrange]}>
                  ● 78 BPM
                </Text>
              </View>

              <BarChart
                data={staticHeartRateData}
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
                  <Text variant="labelSmall" style={styles.metricLabel}>Min</Text>
                  <Text variant="titleMedium" style={[styles.metricVal, styles.valPrimary]}>65</Text>
                  <Text variant="labelSmall" style={styles.metricUnit}>bpm</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text variant="labelSmall" style={styles.metricLabel}>Average</Text>
                  <Text variant="titleMedium" style={[styles.metricVal, styles.valOrange]}>72</Text>
                  <Text variant="labelSmall" style={styles.metricUnit}>bpm</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text variant="labelSmall" style={styles.metricLabel}>Max</Text>
                  <Text variant="titleMedium" style={[styles.metricVal, styles.valRed]}>78</Text>
                  <Text variant="labelSmall" style={styles.metricUnit}>bpm</Text>
                </View>
              </View>
            </Surface>

            {/* ══ HRV & Blood Pressure (row) ════════════════════════ */}
            <View style={styles.row}>
              {/* HRV */}
              <Surface style={[styles.card, styles.halfCard]} elevation={1}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrapper, styles.iconPrimary]}>
                    <Activity size={16} color={C.primary} />
                  </View>
                  <Text variant="labelSmall" style={styles.cardTitle}>HRV</Text>
                </View>

                <LineChart
                  data={staticHrvData}
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

                <Text variant="headlineSmall" style={[styles.bigVal, styles.valPrimary]}>
                  {latestHrv}{' '}
                  <Text variant="labelSmall" style={styles.metricUnit}>ms</Text>
                </Text>
                <View style={[styles.pill, { backgroundColor: hrvStatus.color + '20' }]}>
                  <Text variant="labelSmall" style={[styles.pillText, { color: hrvStatus.color }]}>
                    {hrvStatus.label}
                  </Text>
                </View>
              </Surface>

              {/* Blood Pressure */}
              <Surface style={[styles.card, styles.halfCard]} elevation={1}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrapper, styles.iconRed]}>
                    <Droplets size={16} color={C.redLight} />
                  </View>
                  <Text variant="labelSmall" style={styles.cardTitle}>Blood Pressure</Text>
                </View>

                {screening ? (
                  <>
                    <LineChart
                      data={[{ value: screening.systolic }]}
                      data2={[{ value: screening.diastolic }]}
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
                      dataPointsRadius={4}
                      isAnimated
                    />
                    <Text variant="titleLarge" style={styles.bpValue}>
                      {screening.systolic}/{screening.diastolic}
                    </Text>
                    <Text variant="labelSmall" style={styles.metricUnit}>mmHg</Text>
                    {bpStat && (
                      <View style={[styles.pill, { backgroundColor: bpStat.color + '20' }]}>
                        <Text variant="labelSmall" style={[styles.pillText, { color: bpStat.color }]}>
                          {bpStat.label}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.noDataSmall}>
                    <Text variant="labelSmall" style={styles.metricUnit}>No data</Text>
                  </View>
                )}
              </Surface>
            </View>

            {/* ══ Sleep ════════════════════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrapper, styles.iconSleep]}>
                  <Moon size={18} color="#7B8FD4" />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>Sleep Quality</Text>
                  <Text variant="labelSmall" style={styles.cardSubtitle}>Last 7 days</Text>
                </View>
                {avgSleepHours && (
                  <Text variant="labelSmall" style={[styles.statusBadge, styles.badgeSleep]}>
                    ● {avgSleepHours} hrs avg
                  </Text>
                )}
              </View>

              {sleepChartData.length > 0 ? (
                <>
                  <BarChart
                    data={sleepChartData}
                    width={280}
                    height={80}
                    barWidth={26}
                    spacing={12}
                    hideRules
                    hideAxesAndRules
                    barBorderRadius={6}
                    noOfSections={4}
                    maxValue={12}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    isAnimated
                  />
                  <View style={styles.dayLabels}>
                    {(displaySleepDays.length > 0 ? displaySleepDays : sleepDays).map((day, i) => (
                      <Text key={i} variant="labelSmall" style={styles.dayLabel}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text variant="labelSmall" style={styles.metricLabel}>Shortest</Text>
                      <Text variant="titleMedium" style={[styles.metricVal, styles.valRed]}>
                        {(Math.min(...sleepHistory.map(s => s.duration_minutes)) / 60).toFixed(1)}
                      </Text>
                      <Text variant="labelSmall" style={styles.metricUnit}>hrs</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text variant="labelSmall" style={styles.metricLabel}>Average</Text>
                      <Text variant="titleMedium" style={[styles.metricVal, styles.valSleep]}>
                        {avgSleepHours}
                      </Text>
                      <Text variant="labelSmall" style={styles.metricUnit}>hrs</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text variant="labelSmall" style={styles.metricLabel}>Best</Text>
                      <Text variant="titleMedium" style={[styles.metricVal, styles.valGreen]}>
                        {(Math.max(...sleepHistory.map(s => s.duration_minutes)) / 60).toFixed(1)}
                      </Text>
                      <Text variant="labelSmall" style={styles.metricUnit}>hrs</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.noDataBox}>
                  <Text variant="bodySmall" style={styles.noDataText}>No sleep data this week.</Text>
                </View>
              )}
            </Surface>

            {/* ══ BMI ══════════════════════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrapper, styles.iconBmi]}>
                  <Scale size={18} color="#4A7A6A" />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>BMI (Body Mass Index)</Text>
                  <Text variant="labelSmall" style={styles.cardSubtitle}>
                    {screening ? 'From latest screening' : 'No screening data'}
                  </Text>
                </View>
              </View>

              {screening && bmiNum ? (
                <View style={styles.imtRow}>
                  <View style={styles.imtLeft}>
                    <Text variant="displaySmall" style={[styles.imtValue, { color: bmiCategory.color }]}>
                      {screening.bmi}
                    </Text>
                    <Text variant="labelSmall" style={styles.metricUnit}>kg/m²</Text>
                    <View style={[styles.pill, styles.pillTop, { backgroundColor: bmiCategory.color + '20' }]}>
                      <Text variant="labelMedium" style={[styles.pillText, { color: bmiCategory.color }]}>
                        {bmiCategory.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.imtRight}>
                    <View style={styles.bmiScaleWrapper}>
                      <View style={styles.bmiScale}>
                        <View style={[styles.bmiSegment, styles.bmiUnderweight]} />
                        <View style={[styles.bmiSegment, styles.bmiNormal]} />
                        <View style={[styles.bmiSegment, styles.bmiOverweight]} />
                        <View style={[styles.bmiSegment, styles.bmiObese]} />
                      </View>
                      <View style={[styles.bmiIndicator, { left: `${bmiPercent}%` as any }]}>
                        <View style={[styles.bmiDot, { backgroundColor: bmiCategory.color }]} />
                      </View>
                    </View>
                    <View style={styles.bmiLabels}>
                      <Text variant="labelSmall" style={styles.bmiLabelText}>Under</Text>
                      <Text variant="labelSmall" style={styles.bmiLabelText}>Normal</Text>
                      <Text variant="labelSmall" style={styles.bmiLabelText}>Over</Text>
                      <Text variant="labelSmall" style={styles.bmiLabelText}>Obese</Text>
                    </View>
                    <View style={styles.bodyStats}>
                      <View style={styles.bodyStat}>
                        <Text variant="labelSmall" style={styles.metricLabel}>Weight</Text>
                        <Text variant="titleSmall" style={styles.bodyStatVal}>{screening.weight_kg} kg</Text>
                      </View>
                      <View style={styles.bodyStat}>
                        <Text variant="labelSmall" style={styles.metricLabel}>Height</Text>
                        <Text variant="titleSmall" style={styles.bodyStatVal}>{screening.height_cm} cm</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataBox}>
                  <Text variant="bodySmall" style={styles.noDataText}>Complete a screening to see your BMI.</Text>
                </View>
              )}
            </Surface>

            {/* ══ Mental Health (PHQ-9) ════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconWrapper, styles.iconMental]}>
                  <Brain size={18} color="#7B8FD4" />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>Mental Health</Text>
                  <Text variant="labelSmall" style={styles.cardSubtitle}>PHQ-9 Depression Scale</Text>
                </View>
                {phqSev && (
                  <View style={[styles.statusBadgeView, { backgroundColor: phqSev.bg }]}>
                    <Text variant="labelSmall" style={[styles.pillText, { color: phqSev.color }]}>
                      {phqSev.label}
                    </Text>
                  </View>
                )}
              </View>

              {screening ? (
                <View style={styles.phq9Row}>
                  <Text variant="displaySmall" style={[styles.phq9Score, { color: phqSev?.color }]}>
                    {screening.phq9_score}
                  </Text>
                  <View style={styles.phq9Info}>
                    <Text variant="bodySmall" style={styles.metricLabel}>out of 27</Text>
                    <ProgressBar
                      progress={screening.phq9_score / 27}
                      color={phqSev?.color}
                      style={styles.phq9Bar}
                    />
                    <Text variant="labelSmall" style={styles.metricUnit}>
                      {phqSev?.label} severity
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataBox}>
                  <Text variant="bodySmall" style={styles.noDataText}>Complete a screening to see your mental health score.</Text>
                </View>
              )}
            </Surface>

            {/* ══ Mental Status (AI) ═══════════════════════════════════ */}
            {latestMental && (
              <Surface style={styles.card} elevation={1}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrapper, { backgroundColor: getRiskColor(latestMental.risk_level) + '20' }]}>
                    <Brain size={18} color={getRiskColor(latestMental.risk_level)} />
                  </View>
                  <View style={styles.cardTitleGroup}>
                    <Text variant="labelMedium" style={styles.cardTitle}>Mental Status</Text>
                    <Text variant="labelSmall" style={styles.cardSubtitle}>AI Assessment</Text>
                  </View>
                  <View style={[styles.statusBadgeView, { backgroundColor: getRiskColor(latestMental.risk_level) + '20' }]}>
                    <Text variant="labelSmall" style={[styles.pillText, { color: getRiskColor(latestMental.risk_level) }]}>
                      {latestMental.risk_level} risk
                    </Text>
                  </View>
                </View>

                <View style={styles.mentalRow}>
                  <View style={styles.mentalScoreWrap}>
                    <Text variant="headlineMedium" style={[styles.mentalScore, { color: getRiskColor(latestMental.risk_level) }]}>
                      {latestMental.risk_score}
                    </Text>
                    <Text variant="labelSmall" style={styles.metricUnit}>/ 100</Text>
                  </View>
                  <View style={styles.mentalInfo}>
                    {latestMental.detected_emotion ? (
                      <Text variant="bodySmall" style={styles.mentalEmotion}>
                        {latestMental.detected_emotion}
                      </Text>
                    ) : null}
                    {latestMental.summary_note ? (
                      <Text variant="bodySmall" style={styles.mentalNote} numberOfLines={2}>
                        {latestMental.summary_note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Surface>
            )}

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  loader: { marginTop: 60 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: C.redLight,
  },

  sectionHeader: { marginBottom: 16 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { color: C.textMuted },
  userName: { fontWeight: '700', color: C.text },
  overviewTitle: { fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  overviewSub: { color: C.textMuted, marginTop: 2 },

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

  // Icon backgrounds
  iconHeart:   { backgroundColor: C.orangeLight },
  iconPrimary: { backgroundColor: C.primary + '20' },
  iconRed:     { backgroundColor: C.redLight + '20' },
  iconSleep:   { backgroundColor: '#7B8FD420' },
  iconBmi:     { backgroundColor: C.secondary + '60' },
  iconMental:  { backgroundColor: '#7B8FD420' },

  // Badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    fontWeight: '600',
    overflow: 'hidden',
  },
  statusBadgeView: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeOrange: { backgroundColor: C.orangeLight, color: C.orange },
  badgeSleep:  { backgroundColor: '#7B8FD420',   color: '#7B8FD4' },

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

  // Color helpers
  valPrimary: { color: C.primary },
  valOrange:  { color: C.orange },
  valRed:     { color: C.redLight },
  valGreen:   { color: '#27AE60' },
  valSleep:   { color: '#7B8FD4' },

  bigVal: { fontWeight: '800', marginTop: 8 },
  pillText: { fontWeight: '700' },

  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillTop: { marginTop: 6 },

  bpValue: { color: C.redLight, fontWeight: '800', marginTop: 4 },

  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dayLabel: { color: C.textMuted, flex: 1, textAlign: 'center' },

  // BMI
  imtRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  imtLeft: { alignItems: 'flex-start' },
  imtValue: { fontWeight: '900', letterSpacing: -1 },
  imtRight: { flex: 1 },
  bmiScaleWrapper: { position: 'relative', marginBottom: 4 },
  bmiScale: { flexDirection: 'row', height: 10, borderRadius: 6 },
  bmiSegment: { height: 10 },
  bmiUnderweight: {
    flex: 1,
    backgroundColor: C.orange + '80',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  bmiNormal:      { flex: 1.3, backgroundColor: '#27AE6080' },
  bmiOverweight:  { flex: 1,   backgroundColor: C.orange + '80' },
  bmiObese: {
    flex: 1.2,
    backgroundColor: C.redLight + '80',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  bmiIndicator: { position: 'absolute', top: -4, marginLeft: -8 },
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

  // PHQ-9
  phq9Row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  phq9Score: { fontWeight: '900', letterSpacing: -1 },
  phq9Info: { flex: 1, gap: 6 },
  phq9Bar: { height: 8, borderRadius: 4, marginTop: 4 },

  // Mental status AI
  mentalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  mentalScoreWrap: { alignItems: 'center' },
  mentalScore: { fontWeight: '900', letterSpacing: -1 },
  mentalInfo: { flex: 1, gap: 4 },
  mentalEmotion: { color: C.text, fontWeight: '600' },
  mentalNote: { color: C.textMuted, lineHeight: 18 },

  // Empty / no-data
  noDataBox: { paddingVertical: 20, alignItems: 'center' },
  noDataSmall: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  noDataText: { color: C.textMuted },

  bottomSpacer: { height: 100 },
});
