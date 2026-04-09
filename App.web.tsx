import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Router from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/helper/theme';

function App() {
  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <PaperProvider theme={theme}>
            <Router />
          </PaperProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default App;
