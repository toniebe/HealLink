import React, { createRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screen/SplashScreen';
import RegisterScreen from '../screen/Register';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import LoginScreen from '../screen/Login';
import DrawerNavigator from './DrawerNavigator';
import ConsultationDetailScreen from '../screen/Consultation/ConsultationDetail';
import BookConsultationScreen from '../screen/Consultation/BookConsultation';
import VideoCallScreen from '../screen/Consultation/VideoCall';
import ConsultationListScreen from '../screen/Consultation/ConsultationList';
import AIChatScreen from '../screen/AIChat';
import FloatingButton from '../components/atoms/FloatingButton';

export const navigationRef =
  createRef<NavigationContainerRef<RootStackParamList>>();

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  ConsultationList: { status?: string } | undefined;
  ConsultationDetail: { consultationId: string };
  BookConsultation: undefined;
  VideoCall: { consultationId: string; medic: any };
  Wimbi: undefined;
};


const withFloatingButton = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <>
      <Component {...props} />
      <FloatingButton />
    </>
  );
}


const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="Main" component={withFloatingButton(DrawerNavigator)} />
        <Stack.Screen
          name="ConsultationDetail"
          component={withFloatingButton(ConsultationDetailScreen)}
        />
        <Stack.Screen
          name="BookConsultation"
          component={withFloatingButton(BookConsultationScreen)}
        />
        <Stack.Screen
          name="VideoCall"
          component={VideoCallScreen}
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="ConsultationList"
          component={withFloatingButton(ConsultationListScreen)}
        />
        <Stack.Screen name="Wimbi" component={AIChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
