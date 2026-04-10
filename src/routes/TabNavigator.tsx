import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { BottomTabBar } from './BottomTab';
import HomeScreen from '../screen/Home';
import TelemedicineScreen from '../screen/Consultation/Telemedicine';
import InsightScreen from '../screen/Insight';


export type TabParamList = {
  Home: undefined;
  TelemedicineHome: undefined;
  Insight: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// ── Tab Navigator ─────────────────────────────────────────────────────────────
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="TelemedicineHome" component={TelemedicineScreen} />
      <Tab.Screen name="Insight" component={InsightScreen} />
      
    </Tab.Navigator>
  );
};

export default TabNavigator;