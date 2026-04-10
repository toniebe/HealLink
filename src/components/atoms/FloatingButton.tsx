import { StyleSheet,  TouchableOpacity,  } from 'react-native';
import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '../../helper/theme';

const FloatingButton = () => {
    const navigation = useNavigation<any>();
  return (
    <TouchableOpacity style={styles.button} onPress={() => {navigation.navigate('Wimbi');}} activeOpacity={0.7}>
      <MessageCircle size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

export default FloatingButton;

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        bottom: 120,
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
