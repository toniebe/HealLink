import React, {  } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screen/SplashScreen';
import RegisterScreen from '../screen/Register';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screen/Login';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
MainTab: undefined; 
};

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash" 
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
       <Stack.Screen name="MainTab" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
