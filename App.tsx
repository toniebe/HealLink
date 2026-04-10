import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/helper/theme';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpotlightTourProvider, TourStep } from 'react-native-spotlight-tour';
import { TourProvider } from './src/context/TourContext';

const requestNotifeePermission = async () => {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log('Notification permission granted');
  }
};

function App() {
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    requestNotifeePermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SpotlightTourProvider
          steps={tourSteps}
          overlayColor="black"
          overlayOpacity={0.65}
          motion="slide"
          shape={{ type: 'rectangle', padding: 8 }}
          onBackdropPress="stop"
          nativeDriver>
          <TourProvider setSteps={setTourSteps}>
            <AuthProvider>
              <PaperProvider theme={theme}>
                <Router />
              </PaperProvider>
            </AuthProvider>
          </TourProvider>
        </SpotlightTourProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
