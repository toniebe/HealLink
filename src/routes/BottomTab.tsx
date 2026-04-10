import React from 'react';
import { Home, Stethoscope, MessageCircle } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../helper/theme';

export const BottomTabBar: React.FC<{ state: any; navigation: any }> = ({
  state,
  navigation,
}) => {
  const tabs = [
    { name: 'Home', icon: Home, label: 'Home' },
    {
      name: 'Wimbi',
      icon: MessageCircle,
      label: 'Wimbi',
    },
    { name: 'TelemedicineHome', icon: Stethoscope, label: 'Telemedicine' },
  ];

  return (
    <View style={tabStyles.container}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tabStyles.tab}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            <View
              style={[
                tabStyles.iconWrapper,
                isFocused && tabStyles.iconWrapperActive,
              ]}
            >
              <Icon
                size={22}
                color={isFocused ? C.primary : '#BBBBBB'}
                strokeWidth={isFocused ? 2.5 : 1.5}
              />
            </View>
            <Text
              style={[
                tabStyles.tabLabel,
                isFocused && tabStyles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: C.primary + '18',
  },
  tabLabel: {
    fontSize: 10,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
});
