import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '../../helper/theme';
import { AttachStep } from 'react-native-spotlight-tour';

const FloatingButton = () => {
  const navigation = useNavigation<any>();

  // index 4: wimbi tour step (static, never changes)
  // AbsolutePosition is on AttachStep's style so the wrapper View is correctly positioned
  return (
    <AttachStep index={4} style={styles.wrapper}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate('Wimbi');
        }}
        activeOpacity={0.7}
      >
        <MessageCircle size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </AttachStep>
  );
};

export default FloatingButton;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  button: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: C.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
