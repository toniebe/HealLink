import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { EyeClosed,EyeIcon } from 'lucide-react-native';



interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}




const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  labelStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const hasError = Boolean(error);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>

      {label ? (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      ) : null}

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          hasError && styles.inputWrapperError,
        ]}>

        {leftIcon ? (
          <View style={styles.leftIconWrapper}>{leftIcon}</View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (isPassword || rightIcon) ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          placeholderTextColor="#AAAAAA"
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconWrapper}
            onPress={() => setShowPassword(prev => !prev)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            {showPassword ? (
              <EyeIcon size={20} color="#888" />
            ) : (
              <EyeClosed size={20} color="#888" />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        ) : null}

      </View>
    </View>
  );
};



const TEAL = '#2A8FA0';
const ERROR = '#E05252';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    marginBottom: 4,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputWrapperFocused: {
    borderColor: TEAL,
    shadowColor: TEAL,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: ERROR,
    backgroundColor: '#FFF5F5',
  },

  // Input
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    marginLeft: 10,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },

  // Icons
  leftIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  eyeIconText: {
    fontSize: 18,
    color: '#888888',
  },
});

export default AppTextInput;