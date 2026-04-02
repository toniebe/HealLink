import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/helper/theme';

function App() {
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
