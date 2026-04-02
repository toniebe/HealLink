import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { post } from '../helper/apiHelper';
import AppTextInput from '../components/atoms/ApptextInputs';
import { Mail, Lock, AppleIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStore } from '../store/authStore';



interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      uuid: string;
      name: string;
      email: string;
      role: string;
      is_active: boolean;
      created_at: string;
      profile: any[];
    };
    token: string;
  };
  meta: {
    timestamp: string;
  };
}

interface FieldError {
  email?: string;
  password?: string;
}

const SOCIALS: {
  label: string;
  color: string;
  initial: string | React.ReactNode;
}[] = [
  { label: 'Google', color: '#EA4335', initial: 'G' },
  { label: 'Facebook', color: '#1877F2', initial: 'F' },
  {
    label: 'Apple',
    color: '#000000',
    initial: <AppleIcon size={20} color="#FFF" />,
  },
];


const LoginScreen: React.FC = ({ navigation }: any) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldError>({});

  const validate = (): boolean => {
    const newErrors: FieldError = {};

    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    }

    if (!password.trim()) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleLogin = async (): Promise<void> => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    const { data, error } = await post<LoginResponse>('/auth/login', {
      email: email,
      password,
    } as LoginPayload);

    setLoading(false);

    if (error) {
      if (error.status === 404) {
        setErrors({ email: 'Email tidak ditemukan.' });
      } else if (error.status === 401) {
        setErrors({ password: 'Kata sandi salah. Coba lagi atau reset.' });
      } else {
        setErrors({ password: error.message || 'Terjadi kesalahan.' });
      }
      return;
    }

    if (data?.success && data.data.token) {
      authStore.setToken(data.data.token);
      authStore.setUser(data.data.user);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }

  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/Healink2.png')}
              style={{ width: 200, height: 200 }}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppTextInput
              label="Email"
              placeholder="contoh@email.com"
              leftIcon={<Mail size={20} color="#888" />}
              error={errors.email}
              value={email}
              onChangeText={text => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppTextInput
              label="Password"
              placeholder="Password"
              isPassword
              leftIcon={<Lock size={20} color="#888" />}
              error={errors.password}
              value={password}
              onChangeText={text => setPassword(text)}
            />
          </View>

          <TouchableOpacity style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>Forget Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or login with:</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            {SOCIALS.map(social => (
              <TouchableOpacity
                key={social.label}
                style={styles.socialButton}
                activeOpacity={0.75}
              >
                <View
                  style={[styles.socialIcon, { backgroundColor: social.color }]}
                >
                  <Text style={styles.socialInitial}>
                    {social.initial || <AppleIcon size={20} color="#FFF" />}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const TEAL = '#2A8FA0';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF6F7',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 32,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4EEF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 36,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: TEAL,
    letterSpacing: 0.5,
  },

  fieldGroup: {
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
    color: '#E05252',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222222',
  },
  inputError: {
    borderColor: '#E05252',
    backgroundColor: '#FFF0F0',
  },


  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222222',
  },
  eyeButton: {
    paddingLeft: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },


  forgotWrapper: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#666666',
  },

 
  loginButton: {
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

 
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 13,
    color: '#888888',
  },


  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
  },
  socialButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#555555',
  },
  registerLink: {
    fontSize: 14,
    color: TEAL,
    fontWeight: '700',
  },
});

export default LoginScreen;
