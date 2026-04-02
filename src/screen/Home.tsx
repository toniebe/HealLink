import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Heart,
  Droplets,
  Wind,
  Search,
  Bell,

} from 'lucide-react-native';
import {BarChart, LineChart} from 'react-native-gifted-charts';
import {authStore} from '../store/authStore';
import { C } from '../helper/theme';




// ── Mock Data ─────────────────────────────────────────────────────────────────
const heartRateData = [
  {value: 65, frontColor: C.primary},
  {value: 72, frontColor: C.primary},
  {value: 68, frontColor: C.primary},
  {value: 78, frontColor: C.orange},
  {value: 74, frontColor: C.primary},
  {value: 70, frontColor: C.primary},
  {value: 78, frontColor: C.orange},
];

const bloodPressureData = [
  {value: 120},
  {value: 125},
  {value: 118},
  {value: 122},
  {value: 125},
  {value: 119},
];

const o2Data = [
  {value: 96},
  {value: 97},
  {value: 98},
  {value: 97},
  {value: 98},
  {value: 98},
];

const HomeScreen: React.FC = () => {
  
  const user = authStore.getUser();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome 👋</Text>
              <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={18} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={18} color={C.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Overview Title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.overviewTitle}>Overview</Text>
          <Text style={styles.overviewSub}>Health Dashboard</Text>
        </View>

        {/* ── Heart Rate Card ── */}
        <View style={styles.card}>
          <View style={styles.heartRateTop}>
            <View style={styles.heartIconWrapper}>
              <Heart size={20} color={C.orange} fill={C.orange} />
            </View>
            <View style={styles.heartRateRight}>
              <Text style={styles.bpmBadge}>● 78 BPM</Text>
              <BarChart
                data={heartRateData}
                width={160}
                height={60}
                barWidth={14}
                spacing={6}
                hideRules
                hideAxesAndRules
                barBorderRadius={4}
                noOfSections={3}
                maxValue={100}
                yAxisThickness={0}
                xAxisThickness={0}
                isAnimated
              />
            </View>
          </View>
          <Text style={styles.metricLabel}>Heart Rate</Text>
          <Text style={styles.metricValue}>78 bpm</Text>
        </View>

        {/* ── Blood & O2 Row ── */}
        <View style={styles.row}>
          {/* Blood Pressure */}
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.metricHeader}>
              <Droplets size={16} color={C.redLight} />
              <Text style={styles.metricLabelSmall}>Blood Status</Text>
            </View>
            <LineChart
              data={bloodPressureData}
              width={100}
              height={50}
              hideDataPoints={false}
              color={C.redLight}
              thickness={2}
              hideRules
              hideAxesAndRules
              dataPointsColor={C.redLight}
              dataPointsRadius={3}
              isAnimated
              curved
            />
            <Text style={styles.metricValueSmall}>
              <Text style={{color: C.redLight}}>125/85</Text>
            </Text>
            <Text style={styles.metricUnit}>mmHg</Text>
          </View>

          {/* O2 Saturation */}
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.metricHeader}>
              <Wind size={16} color={C.primary} />
              <Text style={styles.metricLabelSmall}>O₂ Saturation</Text>
            </View>
            <LineChart
              data={o2Data}
              width={100}
              height={50}
              hideDataPoints={false}
              color={C.primary}
              thickness={2}
              hideRules
              hideAxesAndRules
              dataPointsColor={C.primary}
              dataPointsRadius={3}
              isAnimated
              curved
            />
            <Text style={styles.metricValueSmall}>
              <Text style={{color: C.primary}}>98%</Text>
            </Text>
          </View>
        </View>

        {/* ── Patient Card ── */}
        <View style={[styles.card, styles.patientCard]}>
          <View style={styles.patientTop}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>JW</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientInfoLabel}>Name</Text>
              <Text style={styles.patientInfoValue}>{user?.name ?? 'Jackson Wang'}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientInfoLabel}>Age</Text>
              <Text style={styles.patientInfoValue}>42</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.patientBottom}>
            <View style={styles.patientDetail}>
              <Text style={styles.patientDetailLabel}>Patient ID</Text>
              <Text style={styles.patientDetailValue}>#RM-00852</Text>
            </View>
            <View style={styles.patientDetail}>
              <Text style={styles.patientDetailLabel}>Checkup date</Text>
              <Text style={styles.patientDetailValue}>May 15, 2025</Text>
            </View>
          </View>
          <View style={styles.complaintRow}>
            <Text style={styles.patientDetailLabel}>Primary Complaint</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.row}>
          {[
            {label: 'Health\nScreening', color: C.primary, icon: '🩺'},
            {label: 'Find\nDoctor', color: C.orange, icon: '👨‍⚕️'},
            {label: 'My\nRecords', color: C.secondary, icon: '📋'},
            {label: 'Emergency', color: C.redLight, icon: '🚨'},
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.quickAction, {backgroundColor: item.color + '20'}]}>
              <Text style={styles.quickActionIcon}>{item.icon}</Text>
              <Text style={[styles.quickActionLabel, {color: item.color}]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  welcomeText: {
    fontSize: 13,
    color: C.textMuted,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: '#FFF',
  },

  // Section
  sectionHeader: {
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  overviewSub: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    marginTop: 4,
  },

  // Cards
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  halfCard: {
    flex: 1,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  // Heart Rate
  heartRateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heartIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartRateRight: {
    alignItems: 'flex-end',
  },
  bpmBadge: {
    fontSize: 12,
    color: C.orange,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: C.textMuted,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginTop: 2,
  },

  // Small metrics
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabelSmall: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  metricValueSmall: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  // Patient Card
  patientCard: {
    marginBottom: 20,
  },
  patientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A7A6A',
  },
  patientInfo: {
    flex: 1,
  },
  patientInfoLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  patientInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  patientBottom: {
    flexDirection: 'row',
    gap: 24,
  },
  patientDetail: {
    flex: 1,
  },
  patientDetailLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 2,
  },
  patientDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  complaintRow: {
    marginTop: 10,
  },

  // Quick Actions
  quickAction: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
});



export default HomeScreen;