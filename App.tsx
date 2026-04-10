import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/helper/theme';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const requestNotifeePermission = async () => {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log('Notification permission granted');
  }
};

function App() {
  useEffect(() => {
    requestNotifeePermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PaperProvider theme={theme}>
            <Router />
          </PaperProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
