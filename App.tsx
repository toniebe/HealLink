import { View } from 'react-native';
import React from 'react';
import Router from './src/routes';
import { NavigationContainer } from '@react-navigation/native';

const App = () => {
  return (
    <View>
      <NavigationContainer>
        <Router />
      </NavigationContainer>
    </View>
  );
};

export default App;

// const styles = StyleSheet.create({})
