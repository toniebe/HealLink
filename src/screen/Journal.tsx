import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface, TextInput} from 'react-native-paper';
import {BookOpen, Send, ChevronLeft, ChevronRight, Clock} from 'lucide-react-native';
import {get, post} from '../helper/apiHelper';
import CustomHeader from '../components/molecules/HeaderCustom';
import {C} from '../helper/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type MoodKey = 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';

interface JournalEntry {
  uuid: string;
  emoji: string;
  mood: string;
  note: string;
  journal_date: string;
  created_at: string;
}

interface JournalResponse {
  success: boolean;
  message: string;
  data: JournalEntry[];
  meta: {
    timestamp: string;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface PostMoodResponse {
  success: boolean;
  message: string;
  data: JournalEntry;
}

// ── Mood Config ───────────────────────────────────────────────────────────────

const MOODS: {key: MoodKey; emoji: string; label: string; color: string; bg: string}[] = [
  {key: 'very_bad',  emoji: '😞', label: 'Very Bad',  color: '#AE2448', bg: '#AE244815'},
  {key: 'bad',       emoji: '😕', label: 'Bad',       color: '#F5A623', bg: '#F5A62315'},
  {key: 'neutral',   emoji: '😐', label: 'Neutral',   color: '#888888', bg: '#88888815'},
  {key: 'good',      emoji: '😊', label: 'Good',      color: '#72BAA9', bg: '#72BAA915'},
  {key: 'very_good', emoji: '😄', label: 'Very Good', color: '#4CAF50', bg: '#4CAF5015'},
];

const getMoodConfig = (moodKey: string) =>
  MOODS.find(m => m.key === moodKey) ?? MOODS[2];

// ── Date helpers ──────────────────────────────────────────────────────────────

const toDateStr = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD

const formatDisplayDate = (d: Date) =>
  d.toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// ── Mood Selector ─────────────────────────────────────────────────────────────

const MoodSelector: React.FC<{
  selected: MoodKey | null;
  onSelect: (m: MoodKey) => void;
}> = ({selected, onSelect}) => (
  <View style={moodStyles.row}>
    {MOODS.map(m => {
      const active = selected === m.key;
      return (
        <TouchableOpacity
          key={m.key}
          style={[moodStyles.item, active && {backgroundColor: m.bg, borderColor: m.color}]}
          onPress={() => onSelect(m.key)}
          activeOpacity={0.75}>
          <Text style={[moodStyles.emoji, active && moodStyles.emojiActive]}>{m.emoji}</Text>
          <Text
            variant="labelSmall"
            style={[moodStyles.label, active && moodStyles.labelActive, active && {color: m.color}]}>
            {m.label}
          </Text>
          {active && <View style={[moodStyles.dot, {backgroundColor: m.color}]} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

const moodStyles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8},
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  emoji: {fontSize: 24},
  emojiActive: {transform: [{scale: 1.15}]},
  label: {fontSize: 10, color: C.textMuted, textAlign: 'center'},
  labelActive: {fontWeight: '700'},
  dot: {width: 6, height: 6, borderRadius: 3, marginTop: 2},
});

// ── History Entry Card ────────────────────────────────────────────────────────

const EntryCard: React.FC<{entry: JournalEntry}> = ({entry}) => {
  const mood = getMoodConfig(entry.mood);
  return (
    <Surface style={entryStyles.card} elevation={1}>
      <View style={entryStyles.header}>
        <View style={[entryStyles.emojiBox, {backgroundColor: mood.bg}]}>
          <Text style={entryStyles.emoji}>{entry.emoji || mood.emoji}</Text>
        </View>
        <View style={entryStyles.meta}>
          <Text variant="labelMedium" style={[entryStyles.moodLabel, {color: mood.color}]}>
            {mood.label}
          </Text>
          <View style={entryStyles.dateRow}>
            <Clock size={11} color={C.textMuted} />
            <Text variant="labelSmall" style={entryStyles.date}>
              {formatShortDate(entry.journal_date)} · {formatTime(entry.created_at)}
            </Text>
          </View>
        </View>
      </View>
      {!!entry.note && (
        <Text variant="bodySmall" style={entryStyles.note} numberOfLines={3}>
          {entry.note}
        </Text>
      )}
    </Surface>
  );
};

const entryStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8},
  emojiBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {fontSize: 24},
  meta: {flex: 1},
  moodLabel: {fontWeight: '700', marginBottom: 3},
  dateRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  date: {color: C.textMuted},
  note: {color: C.text, lineHeight: 20, marginTop: 2},
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const MoodJournalScreen: React.FC = () => {
  // ── Date navigation
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isToday = toDateStr(selectedDate) === toDateStr(new Date());

  // ── Create entry state
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── History state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch history ─────────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) {setLoadingHistory(true);}

    // Build start-of-day and end-of-day for the selected date
    const from = new Date(selectedDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(selectedDate);
    to.setHours(23, 59, 59, 999);

    const {data, error} = await get<JournalResponse>('/mood', {
      from: from.toISOString(),
      to: to.toISOString(),
    });
    setLoadingHistory(false);
    setRefreshing(false);

    if (error || !data?.success) {return;}
    setEntries(data.data);
  }, [selectedDate]);

  useEffect(() => {fetchHistory();}, [fetchHistory]);

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please choose how you are feeling.');
      return;
    }

    setSubmitting(true);

    const moodConfig = getMoodConfig(selectedMood);
    const trimmedNote = note.trim();

    const {data, error} = await post<PostMoodResponse>('/mood', {
      emoji: moodConfig.emoji,
      mood: selectedMood,
      ...(trimmedNote ? {note: trimmedNote} : {}),
      journal_date: selectedDate.toISOString(),
    });

    setSubmitting(false);

    if (error || !data?.success) {
      Alert.alert('Error', 'Failed to save journal. Please try again.');
      return;
    }

    // Reset form & refresh list
    setSelectedMood(null);
    setNote('');
    fetchHistory(true);
    Alert.alert('Saved!', 'Your mood has been logged.');
  };

  // ── Date nav ──────────────────────────────────────────────────────────────────

  const goBack = () => setSelectedDate(prev => addDays(prev, -1));
  const goForward = () => {
    if (!isToday) {setSelectedDate(prev => addDays(prev, 1));}
  };

  const moodConfig = selectedMood ? getMoodConfig(selectedMood) : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CustomHeader title="Mood Journal" centerTitle showMenu />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {setRefreshing(true); fetchHistory();}}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }>

        {/* ── Date Navigator ── */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={goBack} style={styles.navBtn} activeOpacity={0.7}>
            <ChevronLeft size={20} color={C.primary} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text variant="titleMedium" style={styles.dateText}>
              {isToday ? 'Today' : formatDisplayDate(selectedDate)}
            </Text>
            {isToday && (
              <Text variant="labelSmall" style={styles.dateSub}>
                {formatDisplayDate(selectedDate)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={goForward}
            style={[styles.navBtn, isToday && styles.navBtnDisabled]}
            activeOpacity={isToday ? 1 : 0.7}
            disabled={isToday}>
            <ChevronRight size={20} color={isToday ? '#DDD' : C.primary} />
          </TouchableOpacity>
        </View>

        {/* ── New Entry Card ── */}
        <Surface style={styles.card} elevation={1}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <BookOpen size={18} color={C.primary} />
            </View>
            <Text variant="titleSmall" style={styles.cardTitle}>
              How are you feeling?
            </Text>
          </View>

          {/* Selected mood banner */}
          {moodConfig && (
            <View style={[styles.moodBanner, {backgroundColor: moodConfig.bg}]}>
              <Text style={styles.moodBannerEmoji}>{moodConfig.emoji}</Text>
              <Text variant="labelMedium" style={[styles.moodBannerLabel, {color: moodConfig.color}]}>
                {moodConfig.label}
              </Text>
            </View>
          )}

          {/* Emoji selector */}
          <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />

          {/* Note input */}
          <View style={styles.noteSection}>
            <Text variant="labelMedium" style={styles.noteLabel}>
              Write a note  <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="What's on your mind today…"
              style={styles.noteInput}
              outlineColor="#E8E8E8"
              activeOutlineColor={C.primary}
              contentStyle={styles.noteContent}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!selectedMood || submitting) && styles.submitBtnDisabled,
              moodConfig && {backgroundColor: moodConfig.color, shadowColor: moodConfig.color},
            ]}
            onPress={handleSubmit}
            disabled={!selectedMood || submitting}
            activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Send size={16} color="#FFF" />
                <Text variant="titleSmall" style={styles.submitText}>
                  Log Mood
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Surface>

        {/* ── History ── */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text variant="titleSmall" style={styles.historyTitle}>
              {isToday ? "Today's Entries" : `Entries for ${toDateStr(selectedDate)}`}
            </Text>
            {entries.length > 0 && (
              <View style={styles.countPill}>
                <Text variant="labelSmall" style={styles.countText}>{entries.length}</Text>
              </View>
            )}
          </View>

          {loadingHistory ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : entries.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text variant="titleSmall" style={styles.emptyTitle}>No entries yet</Text>
              <Text variant="bodySmall" style={styles.emptySubtitle}>
                Log how you feel above to start tracking your mood.
              </Text>
            </Surface>
          ) : (
            <FlatList
              data={entries}
              keyExtractor={item => item.uuid}
              renderItem={({item}) => <EntryCard entry={item} />}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 12},
  bottomSpacer: {height: 100},

  // Date nav
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {backgroundColor: '#F0F0F0'},
  dateCenter: {flex: 1, alignItems: 'center'},
  dateText: {fontWeight: '700', color: C.text},
  dateSub: {color: C.textMuted, marginTop: 2},

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {fontWeight: '700', color: C.text},

  // Mood banner
  moodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  moodBannerEmoji: {fontSize: 22},
  moodBannerLabel: {fontWeight: '700', fontSize: 14},

  // Note
  noteSection: {marginTop: 16},
  noteLabel: {color: C.textMuted, marginBottom: 8},
  optional: {color: '#BBB', fontWeight: '400'},
  noteInput: {backgroundColor: '#FAFAFA'},
  noteContent: {paddingTop: 10, minHeight: 90, textAlignVertical: 'top'},

  // Submit
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {color: '#FFF', fontWeight: '700'},

  // History
  historySection: {marginBottom: 8},
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyTitle: {fontWeight: '700', color: C.text},
  countPill: {
    backgroundColor: C.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {color: C.primary, fontWeight: '700'},
  historyLoading: {paddingVertical: 32, alignItems: 'center'},

  // Empty
  emptyCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {fontSize: 40, marginBottom: 4},
  emptyTitle: {fontWeight: '700', color: C.text},
  emptySubtitle: {color: C.textMuted, textAlign: 'center', lineHeight: 20},
});

export default MoodJournalScreen;
