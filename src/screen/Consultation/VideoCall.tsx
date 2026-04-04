import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallContent,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-native-sdk';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
} from 'lucide-react-native';
import { C } from '../../helper/theme';
import { authStore } from '../../store/authStore';
import { post } from '../../helper/apiHelper';
import { ConsultationResponse } from '../../types/telemedicineTypes';

const STREAM_API_KEY = 'h8mvv4hyh5tn';
const STREAM_USER_ID = 'ahmad59';
const STREAM_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWhtYWQ1OSIsImlzcyI6Img4bXZ2NGh5aDV0biIsInN1YiI6InVzZXIvYWhtYWQ1OSIsImlhdCI6MTc3NTMxNDc4NiwiZXhwIjoxNzc3OTA2Nzg2fQ.r6ONxN59zOxjgMgOUT4hsujK-m_6fP6p79NHVjcJmPc';
const USE_DEV_TOKEN = false;

/** Generate a Stream dev token (no signature — for testing only). */
const devToken = (userId: string): string => {
  const b64 = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    user_id: userId,
  })}.devToken`;
};
// ══════════════════════════════════════════════════════════════════════════════

// ── Mood Config ───────────────────────────────────────────────────────────────

const moodOptions = [
  { emoji: '😊', label: 'Happy', color: '#27AE60' },
  { emoji: '😌', label: 'Calm', color: C.primary },
  { emoji: '😐', label: 'Neutral', color: C.textMuted },
  { emoji: '😰', label: 'Anxious', color: C.orange },
  { emoji: '😢', label: 'Sad', color: '#5B8DEF' },
];

// ── Notifee Helper ────────────────────────────────────────────────────────────

const triggerCallNotification = async (medicName: string) => {
  try {
    const channelId = await notifee.createChannel({
      id: 'video_call',
      name: 'Video Call',
      importance: AndroidImportance.HIGH,
    });
    await notifee.displayNotification({
      title: '🎥 Video Call Active',
      body: `You are in a video call with ${medicName}`,
      android: {
        channelId,
        ongoing: true,
        pressAction: { id: 'default' },
        actions: [{ title: 'End Call', pressAction: { id: 'end_call' } }],
      },
      ios: { sound: 'default' },
    });
  } catch (e) {
    console.log('Notifee error:', e);
  }
};

// ── Custom Controls ───────────────────────────────────────────────────────────

const CustomControls: React.FC<{ onEndCall: () => void }> = ({ onEndCall }) => {
  const { useMicrophoneState, useCameraState, useSpeakerState } =
    useCallStateHooks();

  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const { camera, isMute: isCamMuted } = useCameraState();
  const { speaker } = useSpeakerState();
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  return (
    <View style={styles.controlRow}>
      {/* Mic */}
      <TouchableOpacity
        style={[styles.controlBtn, isMicMuted && styles.controlBtnOff]}
        onPress={() => microphone.toggle()}
        activeOpacity={0.8}
      >
        {isMicMuted ? (
          <MicOff size={22} color="#FFF" />
        ) : (
          <Mic size={22} color="#FFF" />
        )}
      </TouchableOpacity>

      {/* Camera */}
      <TouchableOpacity
        style={[styles.controlBtn, isCamMuted && styles.controlBtnOff]}
        onPress={() => camera.toggle()}
        activeOpacity={0.8}
      >
        {isCamMuted ? (
          <VideoOff size={22} color="#FFF" />
        ) : (
          <Video size={22} color="#FFF" />
        )}
      </TouchableOpacity>

      {/* Speaker */}
      <TouchableOpacity
        style={[styles.controlBtn, !isSpeakerOn && styles.controlBtnOff]}
        onPress={() => {
          speaker.select(isSpeakerOn ? 'earpiece' : 'speaker');
          setIsSpeakerOn(prev => !prev);
        }}
        activeOpacity={0.8}
      >
        {isSpeakerOn ? (
          <Volume2 size={22} color="#FFF" />
        ) : (
          <VolumeX size={22} color="#FFF" />
        )}
      </TouchableOpacity>

      {/* Chat — placeholder */}
      <TouchableOpacity style={styles.controlBtn} activeOpacity={0.8}>
        <MessageSquare size={22} color="#FFF" />
      </TouchableOpacity>

      {/* End Call */}
      <TouchableOpacity
        style={styles.endCallBtn}
        onPress={onEndCall}
        activeOpacity={0.8}
      >
        <PhoneOff size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

// ── Call Inner ────────────────────────────────────────────────────────────────

const CallInner: React.FC<{
  medicName: string;
  callDuration: number;
  formatDuration: (s: number) => string;
  selectedMood: typeof moodOptions[0];
  showMoodPicker: boolean;
  setSelectedMood: (m: typeof moodOptions[0]) => void;
  setShowMoodPicker: (v: boolean) => void;
  onEndCall: () => void;
}> = ({
  medicName,
  callDuration,
  formatDuration,
  selectedMood,
  showMoodPicker,
  setSelectedMood,
  setShowMoodPicker,
  onEndCall,
}) => {
  const {useCallCallingState} = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onEndCall();
    }
  }, [callingState, onEndCall]);

  return (
    <View style={styles.container}>

      {/* Stream Video UI — pakai default UI tanpa override controls */}
      <CallContent onHangupCallHandler={onEndCall} />

      {/* ── Top Overlay — di atas CallContent ── */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.callInfo}>
          <Text variant="titleSmall" style={styles.callDoctorName}>
            {medicName}
          </Text>
          <Text variant="labelSmall" style={styles.callTimer}>
            {formatDuration(callDuration)}
          </Text>
          <View style={styles.connectedBadge}>
            <View style={[
              styles.connectedDot,
              {backgroundColor: callingState === CallingState.JOINED ? '#27AE60' : C.orange},
            ]} />
            <Text variant="labelSmall" style={styles.connectedText}>
              {callingState === CallingState.JOINED ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>

        {/* Mood Indicator */}
        <TouchableOpacity
          style={[styles.moodIndicator, {borderColor: selectedMood.color}]}
          onPress={() => setShowMoodPicker(!showMoodPicker)}
          activeOpacity={0.8}>
          <Text style={styles.moodEmoji}>{selectedMood.emoji}</Text>
          <View>
            <Text variant="labelSmall" style={styles.moodLabel}>Mood</Text>
            <Text variant="labelMedium" style={[styles.moodValue, {color: selectedMood.color}]}>
              {selectedMood.label}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Mood Picker */}
      {showMoodPicker && (
        <View style={styles.moodPicker}>
          {moodOptions.map(mood => (
            <TouchableOpacity
              key={mood.label}
              style={[
                styles.moodOption,
                selectedMood.label === mood.label && {backgroundColor: mood.color + '20'},
              ]}
              onPress={() => {
                setSelectedMood(mood);
                setShowMoodPicker(false);
              }}>
              <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
              <Text variant="labelMedium" style={[styles.moodOptionLabel, {color: mood.color}]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { consultationId, medic } = route.params;

  const user = authStore.getUser();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMood, setSelectedMood] = useState(moodOptions[0]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Format Duration ───────────────────────────────────────────────────────────

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Init Stream ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const streamClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: STREAM_USER_ID,
            name: 'Ahmad',
          },
          token: STREAM_TOKEN,
        });

        const callId = `development_8e66d1c6-8ecb-453c-ae24-bea0a6b47c29`;
        const streamCall = streamClient.call('default', callId);

        await streamCall.join({ create: true });

        setClient(streamClient);
        setCall(streamCall);
        setLoading(false);

        // Timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        // Notifikasi
        await triggerCallNotification(medic?.name ?? 'Doctor');
      } catch (e: any) {
        console.log('Stream error code:', e?.code);
        console.log('Stream error message:', e?.message);
        console.log('Stream error full:', JSON.stringify(e));
        Alert.alert('Error', `Code: ${e?.code}\nMessage: ${e?.message}`);
        navigation.goBack();
      }
    };

    init();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      notifee.cancelAllNotifications();
    };
  }, []);

  // ── End Call ──────────────────────────────────────────────────────────────────

  const handleEndCall = useCallback(async () => {
    Alert.alert('End Call', 'Are you sure you want to end this consultation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: async () => {
          try {
            await call?.leave();
            await post<ConsultationResponse>(
              `/consultations/${consultationId}/complete`,
              {},
            );
            await client?.disconnectUser();
            await notifee.cancelAllNotifications();
          } catch (e) {
            console.log('End call error:', e);
          }
          navigation.goBack();
        },
      },
    ]);
  }, [call, client, consultationId, navigation]);

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Joining call...
        </Text>
      </View>
    );
  }

  if (!client || !call) {
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallInner
          medicName={medic?.name ?? 'Dr. —'}
          callDuration={callDuration}
          formatDuration={formatDuration}
          selectedMood={selectedMood}
          showMoodPicker={showMoodPicker}
          setSelectedMood={setSelectedMood}
          setShowMoodPicker={setShowMoodPicker}
          onEndCall={handleEndCall}
        />
      </StreamCall>
    </StreamVideo>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: 'rgba(255,255,255,0.7)' },

  // Main
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // Top Overlay
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 100,
  },
  callInfo: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  callDoctorName: { color: '#FFF', fontWeight: '700' },
  callTimer: { color: 'rgba(255,255,255,0.7)' },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  connectedDot: { width: 7, height: 7, borderRadius: 4 },
  connectedText: { color: 'rgba(255,255,255,0.8)' },

  // Mood Indicator
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  moodEmoji: { fontSize: 20 },
  moodLabel: { color: 'rgba(255,255,255,0.6)' },
  moodValue: { fontWeight: '700' },

  // Mood Picker
  moodPicker: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 130 : 110,
    right: 16,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 16,
    padding: 8,
    zIndex: 200,
    gap: 4,
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  moodOptionEmoji: { fontSize: 20 },
  moodOptionLabel: { fontWeight: '600' },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  endCallBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  stopLabel: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});

export default VideoCallScreen;
