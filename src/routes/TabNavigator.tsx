import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { BottomTabBar } from './BottomTab';
import HomeScreen from '../screen/Home';
import SkriningScreen from '../screen/Skrining';
import TelemedicineScreen from '../screen/Telemedicine';
import ProfileScreen from '../screen/Profile';




// ── Tab Param List ────────────────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Screening: undefined;
  Telemedicine: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// ── Tab Navigator ─────────────────────────────────────────────────────────────
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Screening" component={SkriningScreen} />
      <Tab.Screen name="Telemedicine" component={TelemedicineScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      
    </Tab.Navigator>
  );
};

export default TabNavigator;