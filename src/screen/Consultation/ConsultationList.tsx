// src/screen/Consultation/ConsultationList.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface} from 'react-native-paper';
import {ArrowLeft, Clock, User} from 'lucide-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {get} from '../../helper/apiHelper';
import {C} from '../../helper/theme';
import { Consultation, ConsultationListResponse, statusConfig } from '../../types/telemedicineTypes';

const STATUS_TABS = [
  {key: 'scheduled', label: 'Upcoming'},
  {key: 'ongoing',   label: 'Ongoing'},
  {key: 'completed', label: 'Done'},
  {key: 'cancelled', label: 'Cancelled'},
];

const ConsultationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState(route.params?.status ?? 'scheduled');
  const [data, setData] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {data: res} = await get<ConsultationListResponse>('/consultations', {
      status: activeTab,
    });
    if (res?.success) {setData(res.data);}
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {load();}, [load]);

  const renderItem = ({item}: {item: Consultation}) => {
    const status = statusConfig[item.status] ?? statusConfig.scheduled;
    const medic = item.medic as any;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ConsultationDetail', {consultationId: item.uuid})}
        activeOpacity={0.75}>
        <Surface style={styles.card} elevation={1}>
          <View style={styles.avatarWrapper}>
            <User size={20} color={C.primary} />
          </View>
          <View style={styles.info}>
            <Text variant="titleSmall" style={styles.name}>{medic?.name ?? 'Dr. —'}</Text>
            <Text variant="labelSmall" style={styles.spec}>{medic?.specialty ?? '—'}</Text>
            <View style={styles.timeRow}>
              <Clock size={11} color={C.textMuted} />
              <Text variant="labelSmall" style={styles.time}>
                {new Date(item.scheduled_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                })}{' · '}
                {new Date(item.scheduled_at).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusPill, {backgroundColor: status.bg}]}>
            <Text variant="labelSmall" style={[styles.statusText, {color: status.color}]}>
              {status.label}
            </Text>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>My Consultations</Text>
        <View style={{width: 40}} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text
              variant="labelMedium"
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No consultations found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {fontWeight: '700', color: C.text},
  tabRow: {
    flexDirection: 'row', backgroundColor: '#FFF',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F5F5F5',
  },
  tabActive: {backgroundColor: C.primary},
  tabText: {color: C.textMuted, fontWeight: '600'},
  tabTextActive: {color: '#FFF'},
  list: {padding: 16, gap: 10},
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatarWrapper: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  info: {flex: 1},
  name: {fontWeight: '700', color: C.text},
  spec: {color: C.textMuted, marginTop: 2},
  timeRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4},
  time: {color: C.textMuted},
  statusPill: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20},
  statusText: {fontWeight: '700', fontSize: 11},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyEmoji: {fontSize: 40, marginBottom: 12},
  emptyText: {color: C.textMuted},
});

export default ConsultationListScreen;