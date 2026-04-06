import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {
  MessageCircle,
  TrendingUp,
  BookHeart,
  Bell,
  LogOut,
  ChevronRight,
  X,
  Menu,
  Home,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../store/authStore';
import { C } from '../helper/theme';

import TabNavigator from './TabNavigator';
import AIChatScreen from '../screen/AIChat';
import TrendScreen from '../screen/Tren';
import MoodJournalScreen from '../screen/Journal';
import InsightScreen from '../screen/Insight';
import ProfileScreen from '../screen/Profile';
import { DrawerActions, useNavigation } from '@react-navigation/native';

export type DrawerParamList = {
  MainTab: undefined;
  AIChat: undefined;
  Tren: undefined;
  MoodJournal: undefined;
  Insight: undefined;
  Profile: undefined;
  Settings: undefined;
};

const drawerMenuItems = [
  {
    name: 'MainTab' as keyof DrawerParamList,
    label: 'Home',
    Icon: Home,
    color: C.primary,
  },
  {
    name: 'AIChat' as keyof DrawerParamList,
    label: 'AI Chat',
    Icon: MessageCircle,
    color: C.primary,
  },
  {
    name: 'Tren' as keyof DrawerParamList,
    label: 'Trends & History',
    Icon: TrendingUp,
    color: '#7B8FD4',
  },
  {
    name: 'MoodJournal' as keyof DrawerParamList,
    label: 'Mood Journal',
    Icon: BookHeart,
    color: '#27AE60',
  },
  {
    name: 'Insight' as keyof DrawerParamList,
    label: 'AI Insights',
    Icon: Bell,
    color: C.orange,
  },

];

// ── Custom Drawer Content ─────────────────────────────────────────────────────

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = props => {
  const { logout } = useAuth();
  const user = authStore.getUser();
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const activeRoute = props.state.routeNames[props.state.index];
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigation = useNavigation<any>();
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => props.navigation.closeDrawer()}
      >
        <X size={22} color={C.textMuted} />
      </TouchableOpacity>

      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Section */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => props.navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text variant="titleMedium" style={styles.profileName}>
              {user?.name ?? 'User'}
            </Text>
            <Text variant="labelSmall" style={styles.profileEmail}>
              {user?.email ?? ''}
            </Text>
            <View style={styles.rolePill}>
              <Text variant="labelSmall" style={styles.roleText}>
                {user?.role ?? 'Patient'}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={C.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Menu Label */}
        <Text variant="labelSmall" style={styles.menuSectionLabel}>
          FEATURES
        </Text>

        {/* Menu Items */}
        {drawerMenuItems.map(item => {
          const { Icon } = item;
          const isActive = activeRoute === item.name;

          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => props.navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrapper,
                  {
                    backgroundColor: isActive
                      ? item.color + '25'
                      : item.color + '15',
                  },
                ]}
              >
                <Icon size={18} color={isActive ? item.color : C.textMuted} />
              </View>
              <View style={styles.menuTextGroup}>
                <Text
                  variant="labelLarge"
                  style={[styles.menuLabel, isActive && { color: item.color }]}
                >
                  {item.label}
                </Text>
              </View>
              <ChevronRight
                size={16}
                color={isActive ? item.color : '#DDDDDD'}
              />
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuIconWrapper,
              { backgroundColor: C.redLight + '15' },
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={C.redLight} />
            ) : (
              <LogOut size={18} color={C.redLight} />
            )}
          </View>
          <Text variant="labelLarge" style={styles.logoutLabel}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* App Version */}
      <View style={styles.footer}>
        <Text variant="labelSmall" style={styles.footerText}>
          Healink v1.0.0
        </Text>
      </View>
    </View>
  );
};

// ── Floating Menu Button ──────────────────────────────────────────────────────

export const FloatingMenuButton: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      activeOpacity={0.8}
    >
      <Menu size={20} color={C.primary} />
    </TouchableOpacity>
  );
};

// ── Drawer Navigator ──────────────────────────────────────────────────────────

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerType: 'slide',
        drawerStyle: {
          width: '80%',
          backgroundColor: 'transparent',
        },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="MainTab" component={TabNavigator} />
      <Drawer.Screen name="AIChat" component={AIChatScreen} />
      <Drawer.Screen name="Tren" component={TrendScreen} />
      <Drawer.Screen name="MoodJournal" component={MoodJournalScreen} />
      <Drawer.Screen name="Insight" component={InsightScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: C.primary + '10',
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: '700', color: C.text },
  profileEmail: { color: C.textMuted, marginTop: 2 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: C.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  roleText: { color: C.primary, fontWeight: '700' },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginVertical: 12,
  },

  // Menu
  menuSectionLabel: {
    color: C.textMuted,
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 14,
  },
  menuItemActive: {
    backgroundColor: '#F5F5F5',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextGroup: { flex: 1 },
  menuLabel: { fontWeight: '600', color: C.text },
  menuDesc: { color: C.textMuted, marginTop: 1 },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 14,
  },
  logoutLabel: { fontWeight: '600', color: C.redLight },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  footerText: { color: C.textMuted },

  floatingButton: {
    position: 'absolute',
    top: 56, // sesuaikan dengan safe area
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
});

export default DrawerNavigator;
