import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/routes';
import { AuthProvider } from './src/context/AuthContext';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
