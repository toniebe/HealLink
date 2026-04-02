import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {Text} from 'react-native-paper';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import {Menu} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from '../../helper/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RightAction {
  icon: React.ReactNode;
  onPress: () => void;
  badge?: boolean;
}

interface CustomHeaderProps {
  title?: string;
  subtitle?: string;
  showMenu?: boolean;
  rightActions?: RightAction[];
  centerTitle?: boolean;
  backgroundColor?: string;
  containerStyle?: ViewStyle;
  leftComponent?: React.ReactNode; // override kiri sepenuhnya
}

// ── Component ─────────────────────────────────────────────────────────────────

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
  showMenu = true,
  rightActions = [],
  centerTitle = false,
  backgroundColor = C.card,
  containerStyle,
  leftComponent,
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top + 8,
        },
        containerStyle,
      ]}>

      <View style={styles.leftSection}>
        {leftComponent ? (
          leftComponent
        ) : showMenu ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            activeOpacity={0.7}>
            <Menu size={20} color={C.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <View
        style={[
          styles.titleSection,
          centerTitle && styles.titleSectionCenter,
        ]}>
        {title ? (
          <Text
            variant="titleMedium"
            style={styles.title}
            numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            variant="labelSmall"
            style={styles.subtitle}
            numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        {rightActions.map((action, index) => (
          <View key={index} style={styles.rightActionWrapper}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={action.onPress}
              activeOpacity={0.7}>
              {action.icon}
            </TouchableOpacity>
            {action.badge && <View style={styles.badge} />}
          </View>
        ))}

        {rightActions.length === 0 && <View style={styles.iconPlaceholder} />}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Left
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },

  // Title
  titleSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  titleSectionCenter: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: C.text,
  },
  subtitle: {
    color: C.textMuted,
    marginTop: 1,
  },

  // Right
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  rightActionWrapper: {
    position: 'relative',
  },

  // Icon Button
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },

  // Badge
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.redLight,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
});

export default CustomHeader;