import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface} from 'react-native-paper';
import {
  ArrowLeft,
  Video,
  X,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  User,
  Shield,
} from 'lucide-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {get, patch, } from '../../helper/apiHelper';
import {C} from '../../helper/theme';
import { Consultation, ConsultationResponse, statusConfig } from '../../types/telemedicineTypes';

// ── Notifee Helper ────────────────────────────────────────────────────────────

const sendLocalNotification = async (title: string, body: string) => {
  try {
    const channelId = await notifee.createChannel({
      id: 'consultation',
      name: 'Consultation',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title,
      body,
      android: {channelId, pressAction: {id: 'default'}},
      ios: {sound: 'default'},
    });
  } catch (e) {
    console.log('Notifee error:', e);
  }
};

// ── Checklist Item ────────────────────────────────────────────────────────────

const CheckItem: React.FC<{label: string}> = ({label}) => (
  <View style={styles.checkItem}>
    <CheckCircle size={16} color={C.primary} />
    <Text variant="bodySmall" style={styles.checkLabel}>
      {label}
    </Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const ConsultationDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {consultationId} = route.params;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Load Detail ───────────────────────────────────────────────────────────────

  const loadDetail = useCallback(async () => {
    const {data, error} = await get<ConsultationResponse>(
      `/consultations/${consultationId}`,
    );
    setLoading(false);
    if (!error && data?.success) {
      setConsultation(data.data);
    }
  }, [consultationId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!consultation) {return;}
    setActionLoading('start');

    // const {data, error} = await patch<ConsultationResponse>(
    //   `/consultations/${consultation.uuid}/start`,
    //   {},
    // );

    // setActionLoading(null);

    // if (error || !data?.success) {
    //   Alert.alert('Error', 'Failed to start consultation.');
    //   return;
    // }

    await sendLocalNotification(
      '🎥 Consultation Started',
      `Your consultation has started. Tap to join the video call.`,
    );

    

    // Navigate to video call
    navigation.navigate('VideoCall', {
      consultationId: consultation.uuid,
      medic: consultation.medic,
      consultation: consultation,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this consultation?',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes, Cancel', style: 'destructive', onPress: confirmCancel},
      ],
    );
  };

  const confirmCancel = async () => {
    if (!consultation) {return;}
    setActionLoading('cancel');

    const {data, error} = await patch<ConsultationResponse>(
      `/consultations/${consultation.uuid}/cancel`,
      {},
    );

    setActionLoading(null);

    if (error || !data?.success) {
      Alert.alert('Error', 'Failed to cancel consultation.');
      return;
    }

    await sendLocalNotification(
      '❌ Consultation Cancelled',
      'Your consultation has been cancelled.',
    );

    setConsultation(data.data);
  };

  const handleComplete = async () => {
    if (!consultation) {return;}
    setActionLoading('complete');

    const {data, error} = await patch<ConsultationResponse>(
      `/consultations/${consultation.uuid}/complete`,
      {},
    );

    setActionLoading(null);

    if (error || !data?.success) {
      Alert.alert('Error', 'Failed to complete consultation.');
      return;
    }

    await sendLocalNotification(
      '✅ Consultation Completed',
      'Your consultation has been completed successfully.',
    );

    setConsultation(data.data);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!consultation) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <Text variant="bodyMedium" style={{color: C.textMuted}}>
            Consultation not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const medic = consultation.medic as any;
  const status = statusConfig[consultation.status] ?? statusConfig.pending;
  const scheduledDate = new Date(consultation.scheduled_at);

  const canStart = consultation.status === 'pending';
  const canCancel = consultation.status === 'pending';
  const canComplete = consultation.status === 'ongoing';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          Consultation Detail
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Doctor Card ── */}
        <Surface style={styles.doctorCard} elevation={1}>
          <View style={styles.doctorCardTop}>
            <View style={styles.doctorAvatar}>
              <User size={28} color={C.primary} />
            </View>
            <View style={styles.doctorInfo}>
              <Text variant="titleMedium" style={styles.doctorName}>
                {medic?.name ?? 'Dr. —'}
              </Text>
              <Text variant="labelSmall" style={styles.doctorSpec}>
                {medic?.specialty ?? '—'}
              </Text>
              <View style={[styles.statusPill, {backgroundColor: status.bg}]}>
                <Text variant="labelSmall" style={[styles.statusText, {color: status.color}]}>
                  {status.label}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* ── Info Cards Row ── */}
        <View style={styles.infoRow}>
          <Surface style={[styles.infoCard, {flex: 1}]} elevation={1}>
            <Shield size={16} color={C.primary} />
            <Text variant="labelSmall" style={styles.infoLabel}>Confirmation Code</Text>
            <Text variant="titleSmall" style={styles.infoValue}>
              #{consultation.uuid.slice(0, 8).toUpperCase()}
            </Text>
          </Surface>
          <Surface style={[styles.infoCard, {flex: 1}]} elevation={1}>
            <Calendar size={16} color={C.orange} />
            <Text variant="labelSmall" style={styles.infoLabel}>Schedule</Text>
            <Text variant="titleSmall" style={styles.infoValue}>
              {scheduledDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </Surface>
          <Surface style={[styles.infoCard, {flex: 1}]} elevation={1}>
            <Clock size={16} color='#7B8FD4' />
            <Text variant="labelSmall" style={styles.infoLabel}>Time</Text>
            <Text variant="titleSmall" style={styles.infoValue}>
              {scheduledDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Surface>
        </View>

        {/* ── Notes ── */}
        {consultation.notes ? (
          <Surface style={styles.notesCard} elevation={1}>
            <View style={styles.noteHeader}>
              <FileText size={16} color={C.primary} />
              <Text variant="labelMedium" style={styles.noteTitle}>Notes</Text>
            </View>
            <Text variant="bodySmall" style={styles.noteText}>
              {consultation.notes}
            </Text>
          </Surface>
        ) : null}

        {/* ── Preparation Checklist ── */}
        <Surface style={styles.checklistCard} elevation={1}>
          <Text variant="titleSmall" style={styles.checklistTitle}>
            Preparation Before Consultation
          </Text>
          <CheckItem label="Ensure stable internet connection" />
          <CheckItem label="Find a quiet and private location" />
          <CheckItem label="Prepare your health documents" />
          <CheckItem label="Test your camera and microphone" />
        </Surface>

        {/* ── Actions ── */}
        <View style={styles.actionsWrapper}>
          {/* {canStart && (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleStart}
              disabled={actionLoading === 'start'}
              activeOpacity={0.85}>
              {actionLoading === 'start' ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Video size={18} color="#FFF" />
                  <Text variant="titleSmall" style={styles.startBtnText}>
                    Start Consultation
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )} */}

          {canStart || canComplete && (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleStart}
              disabled={actionLoading === 'start'}
              activeOpacity={0.85}>
              {actionLoading === 'start' ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Video size={18} color="#FFF" />
                  <Text variant="titleSmall" style={styles.startBtnText}>
                    Start Consultation
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canComplete && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleComplete}
              disabled={actionLoading === 'complete'}
              activeOpacity={0.85}>
              {actionLoading === 'complete' ? (
                <ActivityIndicator color={C.primary} size="small" />
              ) : (
                <>
                  <CheckCircle size={18} color={C.primary} />
                  <Text variant="titleSmall" style={styles.completeBtnText}>
                    Complete Consultation
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={actionLoading === 'cancel'}
              activeOpacity={0.85}>
              {actionLoading === 'cancel' ? (
                <ActivityIndicator color={C.redLight} size="small" />
              ) : (
                <>
                  <X size={18} color={C.redLight} />
                  <Text variant="titleSmall" style={styles.cancelBtnText}>
                    Cancel Consultation
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 12},
  loadingCenter: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {fontWeight: '700', color: C.text},

  // Doctor Card
  doctorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  doctorCardTop: {flexDirection: 'row', alignItems: 'center', gap: 14},
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.primary + '30',
  },
  doctorInfo: {flex: 1},
  doctorName: {fontWeight: '700', color: C.text},
  doctorSpec: {color: C.textMuted, marginTop: 2, marginBottom: 8},
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {fontWeight: '700', fontSize: 11},

  // Info Cards
  infoRow: {flexDirection: 'row', gap: 10, marginBottom: 12},
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    gap: 6,
  },
  infoLabel: {color: C.textMuted, marginTop: 2},
  infoValue: {fontWeight: '700', color: C.text},

  // Notes
  notesCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10},
  noteTitle: {fontWeight: '700', color: C.text},
  noteText: {color: C.textMuted, lineHeight: 20},

  // Checklist
  checklistCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  checklistTitle: {fontWeight: '700', color: C.text, marginBottom: 4},
  checkItem: {flexDirection: 'row', alignItems: 'center', gap: 10},
  checkLabel: {color: C.text, flex: 1},

  // Actions
  actionsWrapper: {gap: 10},
  startBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
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
  startBtnText: {color: '#FFF', fontWeight: '700'},
  completeBtn: {
    backgroundColor: C.primary + '15',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  completeBtnText: {color: C.primary, fontWeight: '700'},
  cancelBtn: {
    backgroundColor: C.redLight + '10',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.redLight,
  },
  cancelBtnText: {color: C.redLight, fontWeight: '700'},
});

export default ConsultationDetailScreen;