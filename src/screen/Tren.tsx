import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Activity, Moon, Smile, Brain, Plus, X } from 'lucide-react-native';
import CustomHeader from '../components/molecules/HeaderCustom';
import { C } from '../helper/theme';
import { get, post } from '../helper/apiHelper';

// ── Types ──────────────────────────────────────────────────────────────────────
interface MentalStatus {
  uuid: string;
  risk_level: string;
  risk_score: string;
  detected_emotion: string;
  summary_note: string;
  contributing_factors: any[];
  created_at: string;
}

interface MoodEntry {
  uuid: string;
  emoji: string;
  mood: string;
  note: string;
  journal_date: string;
  created_at: string;
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

const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'low':    return '#27AE60';
    case 'medium': return C.orange;
    case 'high':   return C.redLight;
    default:       return C.textMuted;
  }
};

const getQualityCategory = (score: number): string => {
  if (score <= 3) return 'poor';
  if (score <= 5) return 'fair';
  if (score <= 7) return 'good';
  return 'excellent';
};

const moodScoreMap: Record<string, number> = {
  amazing: 5, happy: 4, good: 4, okay: 3, neutral: 3,
  sad: 2, bad: 2, angry: 1, terrible: 1,
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

const today = () => new Date().toISOString().split('T')[0];

// ── Component ──────────────────────────────────────────────────────────────────
const TrendScreen = () => {
  const { width } = useWindowDimensions();
  const chartWidth = width - 40 - 32 - 16; // screen - h-padding - card-padding - margin

  const [mentalStatuses, setMentalStatuses] = useState<MentalStatus[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Sleep modal
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepDate, setSleepDate] = useState(today);
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [qualityScore, setQualityScore] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const dates = getLast7Days();
    const from = dates[0];
    const to = dates[6];

    const [mentalRes, moodRes, sleepRes] = await Promise.all([
      get<any>('/mental-status'),
      get<any>('/mood', { from, to }),
      get<any>('/sleep/history', { from, to }),
    ]);

    if (mentalRes.data) setMentalStatuses(mentalRes.data?.data ?? []);
    if (moodRes.data)   setMoods(moodRes.data?.data ?? []);
    if (sleepRes.data)  setSleepHistory(sleepRes.data?.data ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSleepSubmit = async () => {
    const score = parseInt(qualityScore, 10);
    if (isNaN(score) || score < 0 || score > 10) {
      Alert.alert('Invalid Input', 'Quality score must be between 0 and 10.');
      return;
    }
    const [sh, sm] = sleepTime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let sleepMins = sh * 60 + sm;
    let wakeMins  = wh * 60 + wm;
    if (wakeMins <= sleepMins) wakeMins += 24 * 60; // next day wake
    const duration = wakeMins - sleepMins;

    setSubmitting(true);
    const res = await post('/sleep', {
      duration_minutes: duration,
      quality_score: score,
      quality_category: getQualityCategory(score),
      sleep_time: sleepTime.length === 5 ? `${sleepTime}:00` : sleepTime,
      wake_time: wakeTime.length === 5 ? `${wakeTime}:00` : wakeTime,
      sleep_date: sleepDate,
    });
    setSubmitting(false);

    if (res.error) {
      Alert.alert('Error', res.error.message);
    } else {
      setShowSleepModal(false);
      fetchData();
    }
  };

  // ── Chart data ───────────────────────────────────────────────────────────────
  const sleepChartData = sleepHistory.slice(0, 7).map(s => ({
    value: Math.round((s.duration_minutes / 60) * 10) / 10,
    frontColor:
      s.quality_category === 'poor'      ? C.redLight :
      s.quality_category === 'fair'      ? C.orange   :
      s.quality_category === 'excellent' ? '#27AE60'  : C.primary,
  }));

  const moodChartData = moods.slice(0, 7).map(m => ({
    value: moodScoreMap[m.mood?.toLowerCase()] ?? 3,
  }));

  const mentalChartData = mentalStatuses.slice(0, 7).map(ms => ({
    value: parseFloat(ms.risk_score) || 0,
  }));

  const latestMental = mentalStatuses[0];

  const avgSleepHours = sleepHistory.length
    ? (sleepHistory.reduce((a, s) => a + s.duration_minutes, 0) / sleepHistory.length / 60).toFixed(1)
    : '—';

  const maxSleepHours = sleepHistory.length
    ? (Math.max(...sleepHistory.map(s => s.duration_minutes)) / 60).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CustomHeader title="Trend" centerTitle showMenu />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={C.primary} style={styles.loadingIndicator} />
        ) : (
          <>
            {/* ══ HRV ══════════════════════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: C.primary + '20' }]}>
                  <Activity size={18} color={C.primary} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>HRV</Text>
                  <Text variant="labelSmall" style={styles.cardSub}>Heart Rate Variability · 7 days</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: C.primary + '20' }]}>
                  <Text variant="labelSmall" style={[styles.pillTextBold, { color: C.primary }]}>
                    {staticHrvData[staticHrvData.length - 1].value} ms
                  </Text>
                </View>
              </View>

              <LineChart
                data={staticHrvData}
                width={chartWidth}
                height={90}
                color={C.primary}
                thickness={2.5}
                hideRules
                hideAxesAndRules
                dataPointsColor={C.primary}
                dataPointsRadius={4}
                isAnimated
                curved
                startFillColor={C.primary + '30'}
                endFillColor={C.primary + '05'}
                areaChart
              />

              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text variant="labelSmall" style={styles.metricLabel}>Min</Text>
                  <Text variant="titleMedium" style={[styles.metricVal, { color: C.redLight }]}>
                    {Math.min(...staticHrvData.map(d => d.value))}
                  </Text>
                  <Text variant="labelSmall" style={styles.metricUnit}>ms</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text variant="labelSmall" style={styles.metricLabel}>Avg</Text>
                  <Text variant="titleMedium" style={[styles.metricVal, { color: C.primary }]}>
                    {Math.round(staticHrvData.reduce((a, d) => a + d.value, 0) / staticHrvData.length)}
                  </Text>
                  <Text variant="labelSmall" style={styles.metricUnit}>ms</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text variant="labelSmall" style={styles.metricLabel}>Max</Text>
                  <Text variant="titleMedium" style={[styles.metricVal, styles.metricValGreen]}>
                    {Math.max(...staticHrvData.map(d => d.value))}
                  </Text>
                  <Text variant="labelSmall" style={styles.metricUnit}>ms</Text>
                </View>
              </View>
            </Surface>

            {/* ══ Sleep ═════════════════════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, styles.sleepIconWrap]}>
                  <Moon size={18} color="#7B8FD4" />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>Sleep</Text>
                  <Text variant="labelSmall" style={styles.cardSub}>Last 7 days</Text>
                </View>
                <TouchableOpacity
                  style={[styles.pill, styles.logBtn]}
                  onPress={() => setShowSleepModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={12} color="#FFF" />
                  <Text variant="labelSmall" style={styles.logBtnText}>Log</Text>
                </TouchableOpacity>
              </View>

              {sleepChartData.length > 0 ? (
                <>
                  <BarChart
                    data={sleepChartData}
                    width={chartWidth}
                    height={90}
                    barWidth={Math.max(18, Math.floor(chartWidth / 9))}
                    spacing={Math.max(10, Math.floor(chartWidth / 14))}
                    hideRules
                    hideAxesAndRules
                    barBorderRadius={6}
                    noOfSections={4}
                    maxValue={12}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    isAnimated
                  />
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text variant="labelSmall" style={styles.metricLabel}>Avg</Text>
                      <Text variant="titleMedium" style={[styles.metricVal, styles.metricValSleep]}>
                        {avgSleepHours}
                      </Text>
                      <Text variant="labelSmall" style={styles.metricUnit}>hrs</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text variant="labelSmall" style={styles.metricLabel}>Best</Text>
                      <Text variant="titleMedium" style={[styles.metricVal, styles.metricValGreen]}>
                        {maxSleepHours}
                      </Text>
                      <Text variant="labelSmall" style={styles.metricUnit}>hrs</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text variant="labelSmall" style={styles.metricLabel}>Records</Text>
                      <Text variant="titleMedium" style={[styles.metricVal, styles.metricValPrimary]}>
                        {sleepHistory.length}
                      </Text>
                      <Text variant="labelSmall" style={styles.metricUnit}>days</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text variant="bodySmall" style={styles.emptyText}>
                    No sleep data yet. Tap Log to add.
                  </Text>
                </View>
              )}
            </Surface>

            {/* ══ Mood ══════════════════════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: C.orange + '20' }]}>
                  <Smile size={18} color={C.orange} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>Mood</Text>
                  <Text variant="labelSmall" style={styles.cardSub}>Last 7 days</Text>
                </View>
              </View>

              {moodChartData.length > 0 ? (
                <>
                  <LineChart
                    data={moodChartData}
                    width={chartWidth}
                    height={90}
                    color={C.orange}
                    thickness={2.5}
                    hideRules
                    hideAxesAndRules
                    dataPointsColor={C.orange}
                    dataPointsRadius={4}
                    isAnimated
                    curved
                    startFillColor={C.orange + '30'}
                    endFillColor={C.orange + '05'}
                    areaChart
                    maxValue={5}
                  />
                  <View style={styles.moodRow}>
                    {moods.slice(0, 7).map((m, i) => (
                      <View key={m.uuid ?? i} style={styles.moodItem}>
                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                        <Text variant="labelSmall" style={styles.metricUnit}>
                          {new Date(m.journal_date).toLocaleDateString('en', { weekday: 'short' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text variant="bodySmall" style={styles.emptyText}>
                    No mood data this week.
                  </Text>
                </View>
              )}
            </Surface>

            {/* ══ Mental Status ═════════════════════════════════════════ */}
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: C.secondary + '60' }]}>
                  <Brain size={18} color="#4A7A6A" />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text variant="labelMedium" style={styles.cardTitle}>Mental Status</Text>
                  <Text variant="labelSmall" style={styles.cardSub}>Risk score trend</Text>
                </View>
                {latestMental && (
                  <View style={[styles.pill, { backgroundColor: getRiskColor(latestMental.risk_level) + '20' }]}>
                    <Text variant="labelSmall" style={[styles.pillTextBold, { color: getRiskColor(latestMental.risk_level) }]}>
                      {latestMental.risk_level}
                    </Text>
                  </View>
                )}
              </View>

              {mentalChartData.length > 0 ? (
                <>
                  <LineChart
                    data={mentalChartData}
                    width={chartWidth}
                    height={90}
                    color={C.redLight}
                    thickness={2.5}
                    hideRules
                    hideAxesAndRules
                    dataPointsColor={C.redLight}
                    dataPointsRadius={4}
                    isAnimated
                    curved
                    startFillColor={C.redLight + '30'}
                    endFillColor={C.redLight + '05'}
                    areaChart
                    maxValue={100}
                  />
                  {latestMental && (
                    <View style={styles.mentalDetail}>
                      <View style={[styles.mentalBadge, { backgroundColor: getRiskColor(latestMental.risk_level) + '15' }]}>
                        <Text variant="labelSmall" style={[styles.pillTextBold, { color: getRiskColor(latestMental.risk_level) }]}>
                          {latestMental.risk_level?.toUpperCase()} RISK · Score {latestMental.risk_score}
                        </Text>
                      </View>
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
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text variant="bodySmall" style={styles.emptyText}>
                    No mental status assessments yet.
                  </Text>
                </View>
              )}
            </Surface>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>

      {/* ══ Sleep Input Modal ═══════════════════════════════════════════ */}
      <Modal
        visible={showSleepModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSleepModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>Log Sleep</Text>
              <TouchableOpacity onPress={() => setShowSleepModal(false)}>
                <X size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text variant="labelSmall" style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={sleepDate}
              onChangeText={setSleepDate}
              placeholder="2024-01-01"
              placeholderTextColor={C.textMuted}
            />

            <Text variant="labelSmall" style={styles.inputLabel}>Sleep Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={sleepTime}
              onChangeText={setSleepTime}
              placeholder="22:00"
              placeholderTextColor={C.textMuted}
            />

            <Text variant="labelSmall" style={styles.inputLabel}>Wake Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={wakeTime}
              onChangeText={setWakeTime}
              placeholder="06:00"
              placeholderTextColor={C.textMuted}
            />

            <Text variant="labelSmall" style={styles.inputLabel}>Quality Score (0–10)</Text>
            <TextInput
              style={styles.input}
              value={qualityScore}
              onChangeText={setQualityScore}
              placeholder="7"
              keyboardType="numeric"
              placeholderTextColor={C.textMuted}
            />

            <View style={styles.qualityHint}>
              {(['poor', 'fair', 'good', 'excellent'] as const).map((q, i) => {
                const colors = [C.redLight, C.orange, C.primary, '#27AE60'];
                const ranges = ['0–3', '4–5', '6–7', '8–10'];
                return (
                  <View key={q} style={[styles.qualityPill, { backgroundColor: colors[i] + '20' }]}>
                    <Text variant="labelSmall" style={[styles.qualityPillText, { color: colors[i] }]}>
                      {ranges[i]} {q}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSleepSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text variant="labelLarge" style={styles.submitBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TrendScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleGroup: { flex: 1 },
  cardTitle: { fontWeight: '700', color: C.text },
  cardSub: { color: C.textMuted, marginTop: 1 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  logBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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

  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  moodItem: { alignItems: 'center', gap: 2 },
  moodEmoji: { fontSize: 20 },

  mentalDetail: { marginTop: 12, gap: 6 },
  mentalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mentalEmotion: { color: C.text, fontWeight: '600' },
  mentalNote: { color: C.textMuted, lineHeight: 18 },

  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontWeight: '700', color: C.text },
  inputLabel: { color: C.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.bg,
  },
  qualityHint: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  qualityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },

  // Generated from inline styles
  loadingIndicator: { marginTop: 60 },
  pillTextBold: { fontWeight: '700' },
  metricValGreen: { color: '#27AE60' },
  metricValPrimary: { color: C.primary },
  sleepIconWrap: { backgroundColor: '#7B8FD420' },
  logBtnText: { color: '#FFF', fontWeight: '700' },
  metricValSleep: { color: '#7B8FD4' },
  emptyText: { color: C.textMuted },
  bottomSpacer: { height: 100 },
  qualityPillText: { fontSize: 10 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontWeight: '700' },
});
