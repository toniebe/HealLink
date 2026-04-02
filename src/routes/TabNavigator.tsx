import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';




// ── Placeholder screens ───────────────────────────────────────────────────────
import {View, Text, StyleSheet} from 'react-native';
import { BottomTabBar } from './BottomTab';
import HomeScreen from '../screen/Home';

const PlaceholderScreen = ({title}: {title: string}) => (
  <View style={placeholder.container}>
    <Text style={placeholder.text}>{title}</Text>
  </View>
);

const placeholder = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5'},
  text: {fontSize: 18, fontWeight: '700', color: '#72BAA9'},
});

// ── Tab Param List ────────────────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Records: undefined;
  Screening: undefined;
  Doctor: undefined;
  Hospital: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// ── Tab Navigator ─────────────────────────────────────────────────────────────
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Records"
        children={() => <PlaceholderScreen title="Records" />}
      />
      <Tab.Screen
        name="Screening"
        children={() => <PlaceholderScreen title="Health Screening" />}
      />
      <Tab.Screen
        name="Doctor"
        children={() => <PlaceholderScreen title="Find Doctor" />}
      />
      <Tab.Screen
        name="Hospital"
        children={() => <PlaceholderScreen title="Hospital" />}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;