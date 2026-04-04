import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/helper/theme';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useEffect } from 'react';

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
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <Router />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
