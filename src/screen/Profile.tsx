import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface, TextInput, Switch} from 'react-native-paper';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Edit3,
  Check,
  X,
  LogOut,
  Shield,
  ChevronRight,
  Bell,
  Lock,
  Camera,
  ImageIcon,
} from 'lucide-react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type Asset,
} from 'react-native-image-picker';
import {useAuth} from '../context/AuthContext';
import {get, put, postFormData} from '../helper/apiHelper';
import {authStore} from '../store/authStore';
import CustomHeader from '../components/molecules/HeaderCustom';
import {C} from '../helper/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  uuid?: string;
  gender?: string;
  dob?: string;
  job?: string;
  phone?: string;
  avatar_path?: string | null;
  bio?: string;
  updated_at?: string;
}

interface UserData {
  uuid: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile: Profile | null;
}

interface UserResponse {
  success: boolean;
  message: string;
  data: UserData;
  meta: {timestamp: string};
}

// ── Gender Options ────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  {value: 'male', label: 'Male', emoji: '👨'},
  {value: 'female', label: 'Female', emoji: '👩'},
  {value: 'other', label: 'Other', emoji: '🧑'},
];

// ── Info Row ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
}> = ({icon, label, value}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <View style={styles.infoContent}>
      <Text variant="labelSmall" style={styles.infoLabel}>{label}</Text>
      <Text
        variant="bodyMedium"
        style={[styles.infoValue, !value && styles.infoPlaceholder]}>
        {value || '—'}
      </Text>
    </View>
  </View>
);

// ── Setting Row ───────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  destructive?: boolean;
}> = ({icon, iconBg, label, subtitle, onPress, rightComponent, destructive}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}>
    <View style={[styles.settingIcon, {backgroundColor: iconBg}]}>{icon}</View>
    <View style={styles.settingContent}>
      <Text
        variant="labelLarge"
        style={[styles.settingLabel, destructive && {color: C.redLight}]}>
        {label}
      </Text>
      {subtitle && (
        <Text variant="labelSmall" style={styles.settingSubtitle}>
          {subtitle}
        </Text>
      )}
    </View>
    {rightComponent ?? (onPress && <ChevronRight size={16} color={C.textMuted} />)}
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const {logout} = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  // local avatar preview (before upload succeeds)
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [job, setJob] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const populateState = (user: UserData) => {
    setUserData(user);
    const p = user.profile;
    setName(user.name ?? '');
    setGender(p?.gender ?? '');
    setDob(p?.dob ? p.dob.split('T')[0] : '');
    setJob(p?.job ?? '');
    setPhone(p?.phone ?? '');
    setBio(p?.bio ?? '');
  };

  // ── Load Profile ──────────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    const cached = authStore.getUser() as UserData | null;
    if (cached) {populateState(cached);}

    setLoading(!cached);
    const {data, error} = await get<UserResponse>('/auth/me');
    setLoading(false);
    if (error || !data?.success) {return;}

    populateState(data.data);
    authStore.setUser(data.data);
  }, []);

  useEffect(() => {loadProfile();}, [loadProfile]);

  // ── Photo Picker ──────────────────────────────────────────────────────────────

  const uploadAsset = async (asset: Asset) => {
    setUploadingPhoto(true);
    setLocalAvatar(asset.uri ?? null);   // optimistic preview

    const form = new FormData();
    form.append('avatar', {
      uri: asset.uri,
      type: asset.type ?? 'image/jpeg',
      name: asset.fileName ?? 'avatar.jpg',
    } as any);

    const {data, error} = await postFormData<UserResponse>('/auth/avatar', form);
    setUploadingPhoto(false);

    if (error || !data?.success) {
      setLocalAvatar(null);              // revert preview on failure
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      return;
    }

    populateState(data.data);
    authStore.setUser(data.data);
    setLocalAvatar(null);
  };

  const handlePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {return;}
    const asset = response.assets?.[0];
    if (asset) {uploadAsset(asset);}
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera(
            {mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800, saveToPhotos: false},
            handlePickerResponse,
          ),
      },
      {
        text: 'Gallery',
        onPress: () =>
          launchImageLibrary(
            {mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800, selectionLimit: 1},
            handlePickerResponse,
          ),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  // ── Save Profile ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    const {data, error} = await put<UserResponse>('/auth/profile', {
      name,
      gender,
      dob: dob ? new Date(dob).toISOString() : undefined,
      job,
      phone,
      bio,
    });
    setSaving(false);

    if (error || !data?.success) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      return;
    }

    populateState(data.data);
    authStore.setUser(data.data);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully.');
  };

  // ── Logout ────────────────────────────────────────────────────────────────────

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
          setIsLoggingOut(false);
        },
      },
    ]);

  // ── Loading gate ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CustomHeader title="Profile" />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const profile = userData?.profile;
  const avatarUri = localAvatar ?? profile?.avatar_path ?? null;
  const initial = userData?.name?.charAt(0)?.toUpperCase() ?? 'U';

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CustomHeader
        title="Profile"
        rightActions={[
          {
            icon: isEditing
              ? <X size={18} color={C.redLight} />
              : <Edit3 size={18} color={C.primary} />,
            onPress: () => {
              if (isEditing) {
                const p = userData?.profile;
                setName(userData?.name ?? '');
                setGender(p?.gender ?? '');
                setDob(p?.dob ? p.dob.split('T')[0] : '');
                setJob(p?.job ?? '');
                setPhone(p?.phone ?? '');
                setBio(p?.bio ?? '');
              }
              setIsEditing(prev => !prev);
            },
          },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleChangePhoto}
            style={styles.avatarWrapper}
            disabled={uploadingPhoto}>
            {avatarUri ? (
              <Image source={{uri: avatarUri}} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}

            {/* active dot */}
            <View
              style={[
                styles.activeIndicator,
                userData?.is_active ? styles.activeOn : styles.activeOff,
              ]}
            />

            {/* camera overlay */}
            <View style={styles.cameraOverlay}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Camera size={18} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* tap hint */}
          <TouchableOpacity
            style={styles.changePhotoRow}
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.7}>
            <ImageIcon size={13} color={C.primary} />
            <Text variant="labelSmall" style={styles.changePhotoText}>
              {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name / role */}
        <View style={styles.nameSection}>
          <Text variant="headlineSmall" style={styles.displayName}>
            {userData?.name ?? 'User'}
          </Text>
          <View style={styles.rolePill}>
            <Text variant="labelSmall" style={styles.roleText}>
              {userData?.role ?? 'Patient'}
            </Text>
          </View>
          <Text variant="labelSmall" style={styles.memberSince}>
            Member since{' '}
            {userData?.created_at
              ? new Date(userData.created_at).toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </Text>
        </View>

        {/* ════════════════ VIEW MODE ════════════════ */}
        {!isEditing ? (
          <>
            <Surface style={styles.card} elevation={1}>
              <Text variant="labelMedium" style={styles.cardSectionTitle}>
                PERSONAL INFORMATION
              </Text>
              <InfoRow
                icon={<Mail size={16} color={C.primary} />}
                label="Email"
                value={userData?.email}
              />
              <View style={styles.separator} />
              <InfoRow
                icon={<Phone size={16} color={C.primary} />}
                label="Phone"
                value={profile?.phone}
              />
              <View style={styles.separator} />
              <InfoRow
                icon={<User size={16} color={C.primary} />}
                label="Gender"
                value={GENDER_OPTIONS.find(g => g.value === profile?.gender)?.label}
              />
              <View style={styles.separator} />
              <InfoRow
                icon={<Calendar size={16} color={C.primary} />}
                label="Date of Birth"
                value={
                  profile?.dob
                    ? new Date(profile.dob).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : undefined
                }
              />
              <View style={styles.separator} />
              <InfoRow
                icon={<Briefcase size={16} color={C.primary} />}
                label="Occupation"
                value={profile?.job}
              />
              {profile?.bio && (
                <>
                  <View style={styles.separator} />
                  <InfoRow
                    icon={<FileText size={16} color={C.primary} />}
                    label="Bio"
                    value={profile.bio}
                  />
                </>
              )}
            </Surface>

            <Surface style={styles.card} elevation={1}>
              <Text variant="labelMedium" style={styles.cardSectionTitle}>
                SETTINGS
              </Text>
              <SettingRow
                icon={<Bell size={16} color="#7B8FD4" />}
                iconBg="#7B8FD420"
                label="Notifications"
                subtitle="Push notifications & alerts"
                rightComponent={
                  <Switch
                    value={notifEnabled}
                    onValueChange={setNotifEnabled}
                    color={C.primary}
                  />
                }
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<Lock size={16} color={C.orange} />}
                iconBg={C.orange + '20'}
                label="Change Password"
                subtitle="Update your password"
                onPress={() =>
                  Alert.alert('Coming Soon', 'This feature is coming soon.')
                }
              />
              <View style={styles.separator} />
              <SettingRow
                icon={<Shield size={16} color={C.primary} />}
                iconBg={C.primary + '20'}
                label="Privacy Policy"
                subtitle="Data sharing & privacy settings"
                onPress={() => Alert.alert('Privacy Policy', 'Coming soon.')}
              />
            </Surface>

            <Surface style={styles.card} elevation={1}>
              <SettingRow
                icon={
                  isLoggingOut ? (
                    <ActivityIndicator size="small" color={C.redLight} />
                  ) : (
                    <LogOut size={16} color={C.redLight} />
                  )
                }
                iconBg={C.redLight + '15'}
                label="Logout"
                onPress={handleLogout}
                destructive
              />
            </Surface>

            <Text variant="labelSmall" style={styles.version}>
              Healink v1.0.0
            </Text>
          </>
        ) : (
          /* ════════════════ EDIT MODE ════════════════ */
          <Surface style={styles.card} elevation={1}>
            <Text variant="labelMedium" style={styles.cardSectionTitle}>
              EDIT PROFILE
            </Text>

            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor={C.primary}
              left={<TextInput.Icon icon={() => <User size={18} color={C.textMuted} />} />}
            />

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              outlineColor="#E0E0E0"
              activeOutlineColor={C.primary}
              left={<TextInput.Icon icon={() => <Phone size={18} color={C.textMuted} />} />}
            />

            <Text variant="labelMedium" style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.genderOption,
                    gender === opt.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => setGender(opt.value)}
                  activeOpacity={0.7}>
                  <Text style={styles.genderEmoji}>{opt.emoji}</Text>
                  <Text
                    variant="labelMedium"
                    style={[
                      styles.genderLabel,
                      gender === opt.value && {color: C.primary, fontWeight: '700'},
                    ]}>
                    {opt.label}
                  </Text>
                  {gender === opt.value && <Check size={14} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Date of Birth (YYYY-MM-DD)"
              value={dob}
              onChangeText={setDob}
              mode="outlined"
              style={styles.input}
              placeholder="1990-01-31"
              outlineColor="#E0E0E0"
              activeOutlineColor={C.primary}
              left={<TextInput.Icon icon={() => <Calendar size={18} color={C.textMuted} />} />}
            />

            <TextInput
              label="Occupation"
              value={job}
              onChangeText={setJob}
              mode="outlined"
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor={C.primary}
              left={<TextInput.Icon icon={() => <Briefcase size={18} color={C.textMuted} />} />}
            />

            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              outlineColor="#E0E0E0"
              activeOutlineColor={C.primary}
              left={<TextInput.Icon icon={() => <FileText size={18} color={C.textMuted} />} />}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}>
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Check size={18} color="#FFF" />
                  <Text variant="titleSmall" style={styles.saveBtnText}>
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Surface>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 8},
  loadingCenter: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  bottomSpacer: {height: 100},

  // ── Avatar
  avatarSection: {alignItems: 'center', paddingTop: 24, paddingBottom: 4},
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarImage: {width: 96, height: 96, borderRadius: 48},
  avatarText: {color: '#FFF', fontSize: 38, fontWeight: '800'},
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  activeOn: {backgroundColor: '#27AE60'},
  activeOff: {backgroundColor: '#CCC'},
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 34,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.primary,
  },
  changePhotoText: {color: C.primary, fontWeight: '600'},

  // ── Name block
  nameSection: {alignItems: 'center', paddingVertical: 12, gap: 6},
  displayName: {fontWeight: '800', color: C.text},
  rolePill: {
    backgroundColor: C.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {color: C.primary, fontWeight: '700'},
  memberSince: {color: C.textMuted},

  // ── Card
  card: {backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12},
  cardSectionTitle: {color: C.textMuted, letterSpacing: 0.8, marginBottom: 12},

  // ── Info Row
  infoRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10},
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {flex: 1},
  infoLabel: {color: C.textMuted, marginBottom: 2},
  infoValue: {color: C.text, fontWeight: '600'},
  infoPlaceholder: {color: '#CCC'},
  separator: {height: 1, backgroundColor: '#F5F5F5'},

  // ── Setting Row
  settingRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12},
  settingIcon: {width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center'},
  settingContent: {flex: 1},
  settingLabel: {fontWeight: '600', color: C.text},
  settingSubtitle: {color: C.textMuted, marginTop: 2},

  // ── Edit form
  input: {marginBottom: 12, backgroundColor: '#FFF'},
  fieldLabel: {color: C.textMuted, marginBottom: 8, marginTop: 4},
  genderRow: {flexDirection: 'row', gap: 10, marginBottom: 12},
  genderOption: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  genderOptionSelected: {backgroundColor: C.primary + '10', borderColor: C.primary},
  genderEmoji: {fontSize: 22},
  genderLabel: {fontSize: 12, color: C.text},

  // ── Save button
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {opacity: 0.7},
  saveBtnText: {color: '#FFF', fontWeight: '700'},

  // ── Version
  version: {color: C.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 16},
});

export default ProfileScreen;
