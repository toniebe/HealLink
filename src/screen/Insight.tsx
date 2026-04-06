import React, {useCallback, useEffect, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, Surface, Text} from 'react-native-paper';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Droplets,
  Heart,
  Info,
  Moon,
  Scale,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {useNavigation} from '@react-navigation/native';
import {get} from '../helper/apiHelper';
import {C} from '../helper/theme';
import CustomHeader from '../components/molecules/HeaderCustom';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScreeningData {
  uuid: string;
  height_cm: string;
  weight_kg: string;
  bmi: string;
  systolic: number;
  diastolic: number;
  phq9_score: number;
  created_at: string;
}

interface SleepEntry {
  duration_minutes: number;
  quality_category: string;
  sleep_date: string;
}

interface MentalStatus {
  risk_level: string;
  risk_score: string;
  detected_emotion: string;
  summary_note: string;
}

type AlertLevel = 'critical' | 'warning' | 'good' | 'info';

interface InsightCard {
  id: string;
  level: AlertLevel;
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  tip: string;
  action?: string;
  onAction?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getLast7Days = () => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const alertColors: Record<AlertLevel, {bg: string; border: string; icon: string; label: string}> = {
  critical: {bg: '#FFF0F0', border: '#AE2448', icon: '#AE2448', label: 'Critical'},
  warning:  {bg: '#FFF8EE', border: '#F5A623', icon: '#F5A623', label: 'Warning'},
  good:     {bg: '#F0FBF5', border: '#27AE60', icon: '#27AE60', label: 'Good'},
  info:     {bg: '#F0F4FF', border: '#7B8FD4', icon: '#7B8FD4', label: 'Info'},
};

const AlertIcon: React.FC<{level: AlertLevel; size?: number}> = ({level, size = 18}) => {
  const color = alertColors[level].icon;
  if (level === 'critical') { return <AlertTriangle size={size} color={color} />; }
  if (level === 'warning')  { return <AlertTriangle size={size} color={color} />; }
  if (level === 'good')     { return <CheckCircle   size={size} color={color} />; }
  return <Info size={size} color={color} />;
};

const sendInsightNotification = async (title: string, body: string) => {
  try {
    const channelId = await notifee.createChannel({
      id: 'insight',
      name: 'Health Insights',
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      title,
      body,
      android: {channelId, pressAction: {id: 'default'}},
      ios: {sound: 'default'},
    });
  } catch (e) {
    console.log('Notifee insight error:', e);
  }
};

// ── Component ──────────────────────────────────────────────────────────────────

const InsightScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [screening,    setScreening]    = useState<ScreeningData | null>(null);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [mentalStatus, setMentalStatus] = useState<MentalStatus | null>(null);
  const [loading,      setLoading]      = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const dates = getLast7Days();
    const [screenRes, sleepRes, mentalRes] = await Promise.all([
      get<any>('/screening/latest'),
      get<any>('/sleep/history', {from: dates[0], to: dates[6]}),
      get<any>('/mental-status/latest'),
    ]);
    if (screenRes.data?.success) { setScreening(screenRes.data.data); }
    if (sleepRes.data?.data)     { setSleepHistory(sleepRes.data.data); }
    if (mentalRes.data?.success) { setMentalStatus(mentalRes.data.data); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Build insight cards ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!screening && !mentalStatus) { return; }

    // Trigger push notifications for critical findings
    const bmi    = screening ? parseFloat(screening.bmi) : null;
    const phq9   = screening?.phq9_score ?? null;
    const risk   = mentalStatus?.risk_level?.toLowerCase();
    const avgMin = sleepHistory.length
      ? sleepHistory.reduce((a, s) => a + s.duration_minutes, 0) / sleepHistory.length
      : null;

    if (risk === 'high') {
      sendInsightNotification(
        '⚠️ Mental Health Alert',
        'Your AI mental health assessment shows a high-risk level. Consider booking a consultation.',
      );
    } else if (phq9 !== null && phq9 >= 15) {
      sendInsightNotification(
        '⚠️ PHQ-9 Score Alert',
        `Your depression score is ${phq9}/27 (${phq9 >= 20 ? 'Severe' : 'Moderately Severe'}). Please reach out to a professional.`,
      );
    } else if (bmi !== null && bmi >= 30) {
      sendInsightNotification(
        '⚠️ BMI Alert',
        `Your BMI of ${bmi.toFixed(1)} falls in the Obesity range. A consultation may help.`,
      );
    } else if (avgMin !== null && avgMin < 360) {
      sendInsightNotification(
        '💤 Sleep Alert',
        `You're averaging ${(avgMin / 60).toFixed(1)} hrs of sleep. Aim for 7–9 hrs for better mental health.`,
      );
    }
  }, [screening, mentalStatus, sleepHistory]);

  // ── Derive cards ─────────────────────────────────────────────────────────────

  const insights: InsightCard[] = [];

  // Mental risk card
  if (mentalStatus) {
    const risk  = mentalStatus.risk_level?.toLowerCase();
    const score = parseFloat(mentalStatus.risk_score ?? '0');
    const level: AlertLevel =
      risk === 'high'   ? 'critical' :
      risk === 'medium' ? 'warning'  : 'good';

    insights.push({
      id: 'mental',
      level,
      icon: <Brain size={20} color={alertColors[level].icon} />,
      title: 'Mental Status',
      value: `${score}/100 · ${mentalStatus.risk_level} Risk`,
      description: mentalStatus.summary_note || `Detected emotion: ${mentalStatus.detected_emotion || '—'}`,
      tip: risk === 'high'
        ? 'Consider booking a consultation with a mental health professional.'
        : risk === 'medium'
        ? 'Practice mindfulness and monitor your mood daily.'
        : 'Keep maintaining healthy habits and stay consistent.',
      action: risk !== 'low' ? 'Book Consultation' : undefined,
      onAction: () => navigation.navigate('BookConsultation'),
    });
  }

  // PHQ-9 card
  if (screening) {
    const phq = screening.phq9_score;
    const level: AlertLevel =
      phq >= 20 ? 'critical' :
      phq >= 10 ? 'warning'  :
      phq >= 5  ? 'info'     : 'good';
    const severity =
      phq >= 20 ? 'Severe' :
      phq >= 15 ? 'Moderately Severe' :
      phq >= 10 ? 'Moderate' :
      phq >= 5  ? 'Mild'    : 'Minimal';

    insights.push({
      id: 'phq9',
      level,
      icon: <Brain size={20} color={alertColors[level].icon} />,
      title: 'Depression Scale (PHQ-9)',
      value: `Score ${phq}/27 · ${severity}`,
      description:
        phq >= 15
          ? 'Your PHQ-9 score suggests significant depressive symptoms. Professional support is recommended.'
          : phq >= 10
          ? 'Moderate depressive symptoms detected. Consider speaking with a therapist.'
          : phq >= 5
          ? 'Mild depressive symptoms. Monitor your mood and maintain healthy routines.'
          : 'Minimal depressive symptoms. You\'re doing well!',
      tip:
        phq >= 10
          ? 'Talking to someone can help. A therapist or counselor is a great first step.'
          : 'Engage in physical activity and maintain social connections.',
    });
  }

  // Sleep card
  if (sleepHistory.length > 0) {
    const avgMin   = sleepHistory.reduce((a, s) => a + s.duration_minutes, 0) / sleepHistory.length;
    const avgHrs   = avgMin / 60;
    const poorDays = sleepHistory.filter(s => s.quality_category === 'poor').length;
    const level: AlertLevel =
      avgHrs < 5    ? 'critical' :
      avgHrs < 6.5  ? 'warning'  :
      avgHrs <= 9   ? 'good'     : 'info';

    insights.push({
      id: 'sleep',
      level,
      icon: <Moon size={20} color={alertColors[level].icon} />,
      title: 'Sleep Quality',
      value: `${avgHrs.toFixed(1)} hrs avg · ${poorDays} poor night${poorDays !== 1 ? 's' : ''}`,
      description:
        avgHrs < 6
          ? 'You\'re getting less than the recommended 7–9 hours. Sleep deprivation affects mental health significantly.'
          : avgHrs > 9
          ? 'Oversleeping can also signal mood issues. Try to stick to a consistent schedule.'
          : `Good sleep duration! ${poorDays > 2 ? 'But quality could improve.' : 'Quality is also tracking well.'}`,
      tip:
        avgHrs < 6
          ? 'Set a consistent bedtime and limit screen time 1 hour before sleep.'
          : 'Maintain your sleep routine — it\'s one of the best mental health tools you have.',
    });
  } else {
    insights.push({
      id: 'sleep',
      level: 'info',
      icon: <Moon size={20} color={alertColors.info.icon} />,
      title: 'Sleep Quality',
      value: 'No data this week',
      description: 'Log your sleep to get personalized insights about your rest quality.',
      tip: 'Track your sleep regularly for better mental health insights.',
    });
  }

  // BMI card
  if (screening) {
    const bmi  = parseFloat(screening.bmi);
    const level: AlertLevel =
      bmi >= 30         ? 'critical' :
      bmi >= 25         ? 'warning'  :
      bmi < 18.5        ? 'warning'  : 'good';
    const category =
      bmi >= 30   ? 'Obesity' :
      bmi >= 25   ? 'Overweight' :
      bmi < 18.5  ? 'Underweight' : 'Normal';

    insights.push({
      id: 'bmi',
      level,
      icon: <Scale size={20} color={alertColors[level].icon} />,
      title: 'Body Mass Index',
      value: `${bmi.toFixed(1)} kg/m² · ${category}`,
      description:
        bmi >= 30
          ? 'Obesity is associated with higher risk of depression and anxiety. Physical health and mental health are closely linked.'
          : bmi >= 25
          ? 'Being overweight can affect energy levels and mood. Small lifestyle changes can make a big difference.'
          : bmi < 18.5
          ? 'Being underweight may indicate nutritional deficiencies that affect mood and cognitive function.'
          : 'Your BMI is in the healthy range. Keep up with balanced nutrition and exercise.',
      tip:
        bmi >= 25 || bmi < 18.5
          ? 'Consider speaking with a nutritionist or your doctor about a healthy target weight.'
          : 'Maintain your current healthy weight with regular activity and balanced meals.',
    });
  }

  // Blood Pressure card
  if (screening) {
    const {systolic, diastolic} = screening;
    const level: AlertLevel =
      systolic >= 140 || diastolic >= 90 ? 'critical' :
      systolic >= 130 || diastolic >= 85 ? 'warning'  :
      systolic < 90                      ? 'warning'  : 'good';
    const bpLabel =
      systolic >= 140 || diastolic >= 90 ? 'High Stage 2' :
      systolic >= 130                    ? 'High Stage 1' :
      systolic >= 120                    ? 'Elevated'     : 'Normal';

    insights.push({
      id: 'bp',
      level,
      icon: <Droplets size={20} color={alertColors[level].icon} />,
      title: 'Blood Pressure',
      value: `${systolic}/${diastolic} mmHg · ${bpLabel}`,
      description:
        systolic >= 130
          ? 'Elevated blood pressure is linked to chronic stress and anxiety. Monitor it regularly.'
          : 'Your blood pressure is in a healthy range. Stress management helps keep it that way.',
      tip:
        systolic >= 130
          ? 'Reduce salt intake, exercise regularly, and practice stress-reducing techniques like deep breathing.'
          : 'Keep managing stress well — it\'s one of the biggest contributors to blood pressure changes.',
    });
  }

  // HRV card (static)
  const hrv = 52;
  const hrvLevel: AlertLevel = hrv >= 50 ? 'good' : hrv >= 35 ? 'warning' : 'critical';
  insights.push({
    id: 'hrv',
    level: hrvLevel,
    icon: <Activity size={20} color={alertColors[hrvLevel].icon} />,
    title: 'Heart Rate Variability',
    value: `${hrv} ms · ${hrv >= 50 ? 'Good' : hrv >= 35 ? 'Fair' : 'Poor'}`,
    description:
      hrv >= 50
        ? 'Good HRV indicates your body is recovering well and handling stress effectively.'
        : hrv >= 35
        ? 'Fair HRV — your nervous system may be under some stress. Rest and recovery can help.'
        : 'Low HRV suggests high stress or poor recovery. Prioritize sleep and relaxation.',
    tip:
      hrv < 50
        ? 'Deep breathing exercises and regular sleep can improve your HRV over time.'
        : 'Continue with regular exercise and good sleep to maintain healthy HRV.',
  });

  // ── Summary counts ────────────────────────────────────────────────────────────

  const criticalCount = insights.filter(i => i.level === 'critical').length;
  const warningCount  = insights.filter(i => i.level === 'warning').length;
  const goodCount     = insights.filter(i => i.level === 'good').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CustomHeader title="Insights" centerTitle showMenu />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* ── Summary Banner ── */}
        <Surface style={styles.summaryBanner} elevation={1}>
          <View style={styles.summaryLeft}>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              Health Overview
            </Text>
            <Text variant="bodySmall" style={styles.summarySubtitle}>
              Based on your latest data
            </Text>
          </View>
          <View style={styles.summaryCountsRow}>
            {criticalCount > 0 && (
              <View style={[styles.countChip, styles.countCritical]}>
                <Text style={styles.countChipText}>{criticalCount} Critical</Text>
              </View>
            )}
            {warningCount > 0 && (
              <View style={[styles.countChip, styles.countWarning]}>
                <Text style={styles.countChipText}>{warningCount} Warning</Text>
              </View>
            )}
            {goodCount > 0 && (
              <View style={[styles.countChip, styles.countGood]}>
                <Text style={styles.countChipText}>{goodCount} Good</Text>
              </View>
            )}
          </View>
        </Surface>

        {/* ── Legend ── */}
        <View style={styles.legendRow}>
          {(['critical', 'warning', 'good', 'info'] as AlertLevel[]).map(lvl => (
            <View key={lvl} style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: alertColors[lvl].icon}]} />
              <Text variant="labelSmall" style={styles.legendLabel}>
                {alertColors[lvl].label}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={styles.loader} />
        ) : (
          <>
            {/* ── Insight Cards ── */}
            {insights
              .sort((a, b) => {
                const order = {critical: 0, warning: 1, info: 2, good: 3};
                return order[a.level] - order[b.level];
              })
              .map(card => {
                const theme = alertColors[card.level];
                return (
                  <Surface
                    key={card.id}
                    style={[styles.card, {borderLeftColor: theme.border, backgroundColor: theme.bg}]}
                    elevation={1}>

                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardIconWrap, {backgroundColor: theme.border + '20'}]}>
                        {card.icon}
                      </View>
                      <View style={styles.cardTitleGroup}>
                        <Text variant="labelMedium" style={styles.cardTitle}>
                          {card.title}
                        </Text>
                        <Text variant="labelSmall" style={[styles.cardValue, {color: theme.border}]}>
                          {card.value}
                        </Text>
                      </View>
                      <View style={[styles.levelBadge, {backgroundColor: theme.border + '20'}]}>
                        <AlertIcon level={card.level} size={12} />
                        <Text style={[styles.levelBadgeText, {color: theme.border}]}>
                          {theme.label}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text variant="bodySmall" style={styles.cardDescription}>
                      {card.description}
                    </Text>

                    {/* Tip */}
                    <View style={[styles.tipBox, {backgroundColor: theme.border + '12'}]}>
                      <TrendingUp size={13} color={theme.border} />
                      <Text variant="labelSmall" style={[styles.tipText, {color: theme.border}]}>
                        {card.tip}
                      </Text>
                    </View>

                    {/* Action button */}
                    {card.action && card.onAction && (
                      <TouchableOpacity
                        style={[styles.actionBtn, {borderColor: theme.border}]}
                        onPress={card.onAction}
                        activeOpacity={0.8}>
                        <Text style={[styles.actionBtnText, {color: theme.border}]}>
                          {card.action}
                        </Text>
                        <ChevronRight size={14} color={theme.border} />
                      </TouchableOpacity>
                    )}
                  </Surface>
                );
              })}

            {/* ── Quick Stats Row ── */}
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Quick Stats
            </Text>
            <View style={styles.statsRow}>
              <Surface style={styles.statCard} elevation={1}>
                <Heart size={16} color={C.orange} fill={C.orange} />
                <Text variant="titleMedium" style={[styles.statValue, {color: C.orange}]}>72</Text>
                <Text variant="labelSmall" style={styles.statLabel}>BPM avg</Text>
              </Surface>
              <Surface style={styles.statCard} elevation={1}>
                <Activity size={16} color={C.primary} />
                <Text variant="titleMedium" style={[styles.statValue, {color: C.primary}]}>{hrv}</Text>
                <Text variant="labelSmall" style={styles.statLabel}>HRV ms</Text>
              </Surface>
              <Surface style={styles.statCard} elevation={1}>
                <Moon size={16} color="#7B8FD4" />
                <Text variant="titleMedium" style={[styles.statValue, styles.valSleep]}>
                  {sleepHistory.length > 0
                    ? (sleepHistory.reduce((a, s) => a + s.duration_minutes, 0) / sleepHistory.length / 60).toFixed(1)
                    : '—'}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>hrs sleep</Text>
              </Surface>
              {screening && (
                <Surface style={styles.statCard} elevation={1}>
                  <TrendingDown size={16} color={C.redLight} />
                  <Text variant="titleMedium" style={[styles.statValue, {color: C.redLight}]}>
                    {screening.phq9_score}
                  </Text>
                  <Text variant="labelSmall" style={styles.statLabel}>PHQ-9</Text>
                </Surface>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    {flex: 1, backgroundColor: C.bg},
  scroll:  {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 12},
  loader:  {marginTop: 60},

  // Summary banner
  summaryBanner: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft:     {flex: 1},
  summaryTitle:    {color: '#FFF', fontWeight: '700'},
  summarySubtitle: {color: 'rgba(255,255,255,0.7)', marginTop: 2},
  summaryCountsRow: {gap: 6, alignItems: 'flex-end'},
  countChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countCritical: {backgroundColor: '#AE244840'},
  countWarning:  {backgroundColor: '#F5A62340'},
  countGood:     {backgroundColor: '#27AE6040'},
  countChipText: {color: '#FFF', fontSize: 10, fontWeight: '700'},

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot:  {width: 8, height: 8, borderRadius: 4},
  legendLabel: {color: C.textMuted},

  // Section title
  sectionTitle: {fontWeight: '700', color: C.text, marginBottom: 10, marginTop: 4},

  // Insight cards
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    gap: 10,
  },
  cardHeader:    {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  cardIconWrap:  {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleGroup: {flex: 1},
  cardTitle:      {fontWeight: '700', color: C.text},
  cardValue:      {fontWeight: '600', marginTop: 2},
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  levelBadgeText: {fontSize: 10, fontWeight: '700'},
  cardDescription: {color: C.text, lineHeight: 18, opacity: 0.8},
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 10,
  },
  tipText: {flex: 1, lineHeight: 17, fontWeight: '600'},
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 2,
  },
  actionBtnText: {fontWeight: '700', fontSize: 13},

  // Quick stats
  statsRow: {flexDirection: 'row', gap: 10, flexWrap: 'wrap'},
  statCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {fontWeight: '800'},
  statLabel: {color: C.textMuted, textAlign: 'center'},
  valSleep:  {color: '#7B8FD4'},

  bottomSpacer: {height: 100},
});

export default InsightScreen;
