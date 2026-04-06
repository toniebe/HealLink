import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface} from 'react-native-paper';
import {
  Video,
  Calendar,
  ChevronRight,
  Clock,
  Plus,
  MessageSquare,
  FileText,
  User,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {get} from '../../helper/apiHelper';
import {authStore} from '../../store/authStore';
import {C} from '../../helper/theme';

import CustomHeader from '../../components/molecules/HeaderCustom';
import { Consultation, ConsultationListResponse, statusConfig } from '../../types/telemedicineTypes';

// ── Navigation Type ───────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<any>;

// ── Quick Action Config ───────────────────────────────────────────────────────

const quickActions = [
  {label: 'New\nSchedule',  icon: Plus,         color: C.primary,  screen: 'BookConsultation'},
  {label: 'My\nList',       icon: FileText,     color: '#7B8FD4',  screen: 'ConsultationList'},
  {label: 'Messages',       icon: MessageSquare,color: '#27AE60',  screen: 'ConsultationList'},
  {label: 'Profile',        icon: User,         color: C.orange,   screen: 'ConsultationList'},
];

// ── Consultation Card ─────────────────────────────────────────────────────────

const ConsultationCard: React.FC<{
  item: Consultation;
  onPress: () => void;
}> = ({item, onPress}) => {
  const status = statusConfig[item.status] ?? statusConfig.scheduled;
  const medic = item.medic as any;
  const scheduledDate = new Date(item.scheduled_at);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={styles.consultCard} elevation={1}>
        {/* Avatar */}
        <View style={styles.consultAvatarWrapper}>
          <View style={styles.consultAvatar}>
            <User size={22} color={C.primary} />
          </View>
          {item.status === 'ongoing' && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.consultInfo}>
          <Text variant="titleSmall" style={styles.consultName} numberOfLines={1}>
            {medic?.name ?? 'Dr. —'}
          </Text>
          <Text variant="labelSmall" style={styles.consultSpecialty}>
            {medic?.specialty ?? '—'}
          </Text>
          <View style={styles.consultMeta}>
            <Clock size={11} color={C.textMuted} />
            <Text variant="labelSmall" style={styles.consultTime}>
              {scheduledDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              · {scheduledDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Status & Arrow */}
        <View style={styles.consultRight}>
          <View style={[styles.statusPill, {backgroundColor: status.bg}]}>
            <Text variant="labelSmall" style={[styles.statusText, {color: status.color}]}>
              {status.label}
            </Text>
          </View>
          <ChevronRight size={16} color={C.textMuted} style={{marginTop: 8}} />
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const TelemedicineScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const user = authStore.getUser();

  const [upcoming, setUpcoming] = useState<Consultation[]>([]);
  const [recent, setRecent] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [upcomingRes, recentRes] = await Promise.all([
      get<ConsultationListResponse>('/consultations',{status:'pending'}),
      get<ConsultationListResponse>('/consultations',{status:'completed'}),
    ]);

    if (upcomingRes.data?.success) {setUpcoming(upcomingRes.data.data);}
    if (recentRes.data?.success) {setRecent(recentRes.data.data.slice(0, 3));}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {loadData();}, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const nextConsult = upcoming[0];
  const nextMedic = nextConsult?.medic as any;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CustomHeader
        title="Teleconsultation"
        subtitle={`Hello, ${user?.name ?? 'User'} 👋`}
        rightActions={[
          {
            icon: <Plus size={18} color={C.primary} />,
            onPress: () => navigation.navigate('BookConsultation'),
          },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
        }>

        {/* ── Hero Card — Next Consultation ── */}
        <Surface style={styles.heroCard} elevation={2}>
          <View style={styles.heroTop} >
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text variant="labelSmall" style={styles.heroBadgeText}>
                Online
              </Text>
            </View>
            <Video size={20} color={C.primary} />
          </View>

          {nextConsult ? (
            <>
              <Text variant="labelSmall" style={styles.heroLabel}>
                Next Consultation
              </Text>
              <View style={styles.heroDoctor}>
                <View style={styles.heroDoctorAvatar}>
                  <User size={24} color={C.primary} />
                </View>
                <View>
                  <Text variant="titleMedium" style={styles.heroDoctorName}>
                    {nextMedic?.name ?? 'Dr. —'}
                  </Text>
                  <Text variant="labelSmall" style={styles.heroDoctorSpec}>
                    {nextMedic?.specialty ?? '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.heroMeta}>
                <Calendar size={13} color={C.textMuted} />
                <Text variant="labelSmall" style={styles.heroMetaText}>
                  {new Date(nextConsult.scheduled_at).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' · '}
                  {new Date(nextConsult.scheduled_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() =>
                  navigation.navigate('ConsultationDetail', {
                    consultationId: nextConsult.uuid,
                  })
                }
                activeOpacity={0.85}>
                <Video size={16} color="#FFF" />
                <Text variant="labelLarge" style={styles.startButtonText}>
                  Start Video Call
                </Text>
              </TouchableOpacity>
            </>
          ) : loading ? (
            <ActivityIndicator color={C.primary} style={{marginTop: 20}} />
          ) : (
            <View style={styles.noConsult}>
              <Text variant="bodyMedium" style={styles.noConsultText}>
                No upcoming consultation
              </Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => navigation.navigate('BookConsultation')}>
                <Text variant="labelMedium" style={styles.bookNowText}>
                  Book Now
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Surface>

        {/* ── Quick Actions ── */}
        <View style={styles.quickRow}>
          {quickActions.map(item => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.quickItem, {backgroundColor: item.color + '15'}]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}>
                <View style={[styles.quickIcon, {backgroundColor: item.color + '25'}]}>
                  <Icon size={18} color={item.color} />
                </View>
                <Text variant="labelSmall" style={[styles.quickLabel, {color: item.color}]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Upcoming Consultations ── */}
        <View style={styles.sectionRow}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Upcoming
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ConsultationList')}>
            <Text variant="labelMedium" style={styles.seeAll}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{marginTop: 12}} />
        ) : upcoming.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No upcoming consultations
            </Text>
          </Surface>
        ) : (
          upcoming.slice(0, 3).map(item => (
            <ConsultationCard
              key={item.uuid}
              item={item}
              onPress={() =>
                navigation.navigate('ConsultationDetail', {
                  consultationId: item.uuid,
                })
              }
            />
          ))
        )}

        {/* ── Recent ── */}
        {recent.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                History
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ConsultationList', {status: 'completed'})
                }>
                <Text variant="labelMedium" style={styles.seeAll}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            {recent.map(item => (
              <ConsultationCard
                key={item.uuid}
                item={item}
                onPress={() =>
                  navigation.navigate('ConsultationDetail', {
                    consultationId: item.uuid,
                  })
                }
              />
            ))}
          </>
        )}

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 16},

  // Hero
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27AE6015',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#27AE60',
  },
  heroBadgeText: {color: '#27AE60', fontWeight: '700'},
  heroLabel: {color: C.textMuted, marginBottom: 10},
  heroDoctor: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12},
  heroDoctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.primary + '40',
  },
  heroDoctorName: {fontWeight: '700', color: C.text},
  heroDoctorSpec: {color: C.textMuted, marginTop: 2},
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 10,
  },
  heroMetaText: {color: C.textMuted},
  startButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {color: '#FFF', fontWeight: '700'},
  noConsult: {alignItems: 'center', paddingVertical: 20},
  noConsultText: {color: C.textMuted, marginBottom: 12},
  bookNowBtn: {
    backgroundColor: C.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookNowText: {color: C.primary, fontWeight: '700'},

  // Quick Actions
  quickRow: {flexDirection: 'row', gap: 10, marginBottom: 20},
  quickItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {fontWeight: '600', textAlign: 'center', fontSize: 10, lineHeight: 14},

  // Section
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {fontWeight: '700', color: C.text},
  seeAll: {color: C.primary, fontWeight: '600'},

  // Consult Card
  consultCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consultAvatarWrapper: {position: 'relative'},
  consultAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  consultInfo: {flex: 1},
  consultName: {fontWeight: '700', color: C.text},
  consultSpecialty: {color: C.textMuted, marginTop: 2},
  consultMeta: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4},
  consultTime: {color: C.textMuted},
  consultRight: {alignItems: 'flex-end'},
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {fontWeight: '700', fontSize: 11},

  // Empty
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyEmoji: {fontSize: 32, marginBottom: 8},
  emptyText: {color: C.textMuted},
});

export default TelemedicineScreen;