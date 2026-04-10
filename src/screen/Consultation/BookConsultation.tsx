import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface} from 'react-native-paper';
import {ArrowLeft, User, Check, Calendar, Clock, Search} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {ConsultationResponse, MedicUser, MedicsListResponse} from '../../types/telemedicineTypes';
import {get, post} from '../../helper/apiHelper';
import {C} from '../../helper/theme';

// ── Time Slots ────────────────────────────────────────────────────────────────

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 7; h <= 17; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();


const generateDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const availableDates = generateDates();

// ── Notifee ───────────────────────────────────────────────────────────────────

const sendBookingNotification = async (medicName: string, scheduledAt: string) => {
  const channelId = await notifee.createChannel({
    id: 'booking',
    name: 'Booking',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: '📅 Consultation Booked!',
    body: `Your consultation with ${medicName} has been scheduled for ${scheduledAt}`,
    android: {channelId, pressAction: {id: 'default'}},
    ios: {sound: 'default'},
  });
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const BookConsultationScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [medics, setMedics] = useState<MedicUser[]>([]);
  const [medicsLoading, setMedicsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedMedic, setSelectedMedic] = useState<MedicUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(availableDates[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchMedics = useCallback(async (q: string) => {
    setMedicsLoading(true);
    const params: Record<string, any> = {};
    if (q.trim()) { params.search = q.trim(); }
    const {data, error} = await get<MedicsListResponse>('/medics', params);
    setMedicsLoading(false);
    if (!error && data?.success) {
      setMedics(data.data);
    }
  }, []);

  useEffect(() => {
    fetchMedics('');
  }, [fetchMedics]);

  const onSearchChange = (text: string) => {
    setSearch(text);
    setSelectedMedic(null);
    if (searchTimer.current) { clearTimeout(searchTimer.current); }
    searchTimer.current = setTimeout(() => fetchMedics(text), 400);
  };

  const handleBook = async () => {
    if (!selectedMedic) {
      Alert.alert('Select Doctor', 'Please select a doctor first.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot.');
      return;
    }

    setLoading(true);

    const [hour, minute] = selectedTime.split(':');
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(Number(hour), Number(minute), 0, 0);

    const {data, error} = await post<ConsultationResponse>('/consultations', {
      medic_id: selectedMedic.uuid,
      scheduled_at: scheduledAt.toISOString(),
    });

    setLoading(false);

    if (error || !data?.success) {
      Alert.alert('Error', 'Failed to book consultation. Please try again.');
      return;
    }

    const formattedDate = scheduledAt.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    await sendBookingNotification(
      selectedMedic.name,
      `${formattedDate} at ${selectedTime}`,
    );

    Alert.alert(
      '✅ Booked!',
      `Consultation with ${selectedMedic.name} has been scheduled.`,
      [{text: 'OK', onPress: () => navigation.goBack()}],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          New Consultation
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Step 1 — Select Doctor ── */}
        <Text variant="titleSmall" style={styles.stepTitle}>
          1. Select Doctor
        </Text>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Search size={16} color={C.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={onSearchChange}
          />
        </View>

        {medicsLoading ? (
          <ActivityIndicator color={C.primary} style={styles.medicsLoader} />
        ) : (
          <View style={styles.medicGrid}>
            {medics.map(medic => {
              const isSelected = selectedMedic?.uuid === medic.uuid;
              const available = medic.is_active;
              return (
                <TouchableOpacity
                  key={medic.uuid}
                  style={[
                    styles.medicCard,
                    isSelected && styles.medicCardSelected,
                    !available && styles.medicCardDisabled,
                  ]}
                  onPress={() => available && setSelectedMedic(medic)}
                  activeOpacity={available ? 0.75 : 1}>
                  <View style={styles.medicAvatar}>
                    <User size={22} color={isSelected ? '#FFF' : C.primary} />
                  </View>
                  <Text
                    variant="labelMedium"
                    style={[styles.medicName, isSelected && styles.textWhite]}
                    numberOfLines={2}>
                    {medic.name}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={[styles.medicSpec, isSelected && styles.textWhiteMuted]}>
                    {medic.role}
                  </Text>

                  <View style={[
                    styles.availBadge,
                    available ? styles.availBadgeOn : styles.availBadgeOff,
                  ]}>
                    <Text
                      variant="labelSmall"
                      style={available ? styles.availTextOn : styles.availTextOff}>
                      {available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <Check size={12} color={C.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            {medics.length === 0 && (
              <Text variant="bodySmall" style={styles.emptyText}>
                No doctors found.
              </Text>
            )}
          </View>
        )}

        {/* ── Step 2 — Select Date ── */}
        <Text variant="titleSmall" style={styles.stepTitle}>
          2. Select Date
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}>
          {availableDates.map((date, i) => {
            const isSelected =
              date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.75}>
                <Text
                  variant="labelSmall"
                  style={[styles.dateDay, isSelected && {color: '#FFF'}]}>
                  {date.toLocaleDateString('en-US', {weekday: 'short'})}
                </Text>
                <Text
                  variant="titleMedium"
                  style={[styles.dateNum, isSelected && {color: '#FFF'}]}>
                  {date.getDate()}
                </Text>
                <Text
                  variant="labelSmall"
                  style={[styles.dateMon, isSelected && {color: 'rgba(255,255,255,0.8)'}]}>
                  {date.toLocaleDateString('en-US', {month: 'short'})}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Step 3 — Select Time ── */}
        <Text variant="titleSmall" style={styles.stepTitle}>
          3. Select Time
        </Text>
        <View style={styles.timeGrid}>
          {timeSlots.map(time => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.75}>
                <Text
                  variant="labelMedium"
                  style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Summary ── */}
        {selectedMedic && selectedTime && (
          <Surface style={styles.summaryCard} elevation={1}>
            <Text variant="titleSmall" style={styles.summaryTitle}>
              Booking Summary
            </Text>
            <View style={styles.summaryRow}>
              <User size={15} color={C.primary} />
              <Text variant="bodySmall" style={styles.summaryText}>
                {selectedMedic.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Calendar size={15} color={C.orange} />
              <Text variant="bodySmall" style={styles.summaryText}>
                {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Clock size={15} color='#7B8FD4' />
              <Text variant="bodySmall" style={styles.summaryText}>
                {selectedTime}
              </Text>
            </View>
          </Surface>
        )}

        <View style={{height: 120}} />
      </ScrollView>

      {/* ── Book Button ── */}
      <View style={styles.bookBtnWrapper}>
        <TouchableOpacity
          style={[
            styles.bookBtn,
            (!selectedMedic || !selectedTime) && styles.bookBtnDisabled,
          ]}
          onPress={handleBook}
          disabled={!selectedMedic || !selectedTime || loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text variant="titleSmall" style={styles.bookBtnText}>
              Book Consultation
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 16},

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

  // Steps
  stepTitle: {fontWeight: '700', color: C.text, marginBottom: 12, marginTop: 8},

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {marginRight: 8},
  searchInput: {flex: 1, color: C.text, fontSize: 14},

  // Medic Grid
  medicsLoader: {marginVertical: 24},
  medicGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20},
  emptyText: {color: C.textMuted, padding: 8},
  textWhite: {color: '#FFF'},
  textWhiteMuted: {color: 'rgba(255,255,255,0.8)'},
  availBadgeOn: {backgroundColor: '#27AE6020'},
  availBadgeOff: {backgroundColor: '#88888820'},
  availTextOn: {color: '#27AE60', fontWeight: '700' as const, fontSize: 10},
  availTextOff: {color: '#888888', fontWeight: '700' as const, fontSize: 10},
  medicCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medicCardSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  medicCardDisabled: {opacity: 0.5},
  medicAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicName: {
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  medicSpec: {color: C.textMuted, textAlign: 'center', fontSize: 11},
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Date
  dateRow: {gap: 10, paddingBottom: 4, marginBottom: 20},
  dateChip: {
    width: 60,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dateChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  dateDay: {color: C.textMuted, fontWeight: '600'},
  dateNum: {fontWeight: '800', color: C.text},
  dateMon: {color: C.textMuted},

  // Time
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20},
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  timeChipSelected: {
    backgroundColor: C.primary + '15',
    borderColor: C.primary,
  },
  timeText: {color: C.text, fontWeight: '600'},
  timeTextSelected: {color: C.primary, fontWeight: '700'},

  // Summary
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  summaryTitle: {fontWeight: '700', color: C.text, marginBottom: 4},
  summaryRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  summaryText: {color: C.text},

  // Book Button
  bookBtnWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnDisabled: {
    backgroundColor: C.primary + '50',
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: {color: '#FFF', fontWeight: '700'},
});

export default BookConsultationScreen;