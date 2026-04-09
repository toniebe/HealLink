import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { C } from '../../helper/theme';

const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Video Call
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Video call is only available on the mobile app.
      </Text>
      <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
        Go Back
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 16,
    padding: 24,
  },
  title: {
    color: C.primary,
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: C.primary,
  },
});

export default VideoCallScreen;
