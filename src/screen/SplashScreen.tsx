import {Image, StyleSheet, View} from 'react-native';
import React, {useEffect} from 'react';
import {useAuth} from '../context/AuthContext';

const SplashScreen = ({navigation}: any) => {
  const {isAuthenticated} = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Healink2.png')}
        style={{width: 200, height: 200}}
        resizeMode="contain"
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF6F7',
  },
});