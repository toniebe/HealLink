import React, {useState} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import {Mail, Lock, User, Apple} from 'lucide-react-native';
import AppTextInput from '../components/atoms/ApptextInputs';
import {post} from '../helper/apiHelper';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface FieldError {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

// ── Password strength ─────────────────────────────────────────────────────────

type StrengthLevel = 'Weak' | 'Fair' | 'Strong' | '';

const getPasswordStrength = (pwd: string): StrengthLevel => {
  if (!pwd) {return '';}
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (pwd.length < 6) {return 'Weak';}
  if (score <= 2) {return 'Fair';}
  return 'Strong';
};

const strengthColor: Record<StrengthLevel, string> = {
  '': '#CCCCCC',
  Weak: '#E05252',
  Fair: '#F5A623',
  Strong: '#27AE60',
};

// ── Social config ─────────────────────────────────────────────────────────────

const SOCIALS = [
  {label: 'Google', color: '#EA4335', text: 'G'},
  {label: 'Facebook', color: '#1877F2', text: 'F'},
  {label: 'Apple', color: '#000000', text: null},
];

// ── Component ─────────────────────────────────────────────────────────────────

const RegisterScreen: React.FC = ({navigation}:any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [successMessage, setSuccessMessage] = useState('');

  const strength = getPasswordStrength(password);

 

  const validate = (): boolean => {
    const newErrors: FieldError = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

  

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 

  const handleRegister = async (): Promise<void> => {
    if (!validate()) {return;}

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    const {data, error} = await post<RegisterResponse>('/auth/register', {
      name,
      email,
      password,
      password_confirmation: confirmPassword,
    } as RegisterPayload);

    setLoading(false);

    if (error) {
      if (error.status === 422) {
        setErrors({email: 'Email is already registered.'});
      } else {
        setErrors({email: error.message || 'Something went wrong.'});
      }
      return;
    }

    setSuccessMessage('Registration successful! Please check your email for verification.');
    console.log('Register berhasil:', data);

    navigation.navigate('Login');
  };



  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">


          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/Healink2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>


          <Text style={styles.title}>Create New Account</Text>


          <AppTextInput
            placeholder="e.g. Budi Setiawan"
            leftIcon={<User size={20} color="#888" />}
            error={errors.name}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <AppTextInput
            placeholder="budisetiawan@email.com"
            leftIcon={<Mail size={20} color="#888" />}
            error={errors.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <AppTextInput
            placeholder="Password"
            isPassword
            leftIcon={<Lock size={20} color="#888" />}
            error={errors.password}
            value={password}
            onChangeText={setPassword}
          />


          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBars}>
                {(['Weak', 'Fair', 'Strong'] as StrengthLevel[]).map(level => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength === 'Weak' && level === 'Weak'
                            ? strengthColor.Weak
                            : strength === 'Fair' && (level === 'Weak' || level === 'Fair')
                            ? strengthColor.Fair
                            : strength === 'Strong'
                            ? strengthColor.Strong
                            : '#E0E0E0',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, {color: strengthColor[strength]}]}>
                Password Strength: {strength}
              </Text>
            </View>
          )}

          <AppTextInput
            placeholder="Confirm Password"
            isPassword
            leftIcon={<Lock size={20} color="#888" />}
            error={errors.confirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Sign Up Now</Text>
            )}
          </TouchableOpacity>


          {successMessage ? (
            <View style={styles.successRow}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}


          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with:</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            {SOCIALS.map(social => (
              <TouchableOpacity
                key={social.label}
                style={styles.socialButton}
                activeOpacity={0.75}>
                <View style={[styles.socialIcon, {backgroundColor: social.color}]}>
                  {social.text ? (
                    <Text style={styles.socialText}>{social.text}</Text>
                  ) : (
                    <Apple size={22} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>


          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

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
    marginBottom: 4,
  },
  logo: {
    width: 200,
    height: 200,
  },

  // Title
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Password Strength
  strengthRow: {
    marginTop: -8,
    marginBottom: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: '#555555',
    flex: 1,
  },
  termsLink: {
    color: TEAL,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#E05252',
    marginBottom: 8,
    marginTop: -4,
  },

  // Register Button
  registerButton: {
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: TEAL,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Success
  successRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27AE60',
    gap: 8,
  },
  successIcon: {
    fontSize: 16,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#27AE60',
    fontWeight: '500',
  },

  // Divider
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

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
  },
  socialButton: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
  socialText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  // Login
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#555555',
  },
  loginLink: {
    fontSize: 14,
    color: TEAL,
    fontWeight: '700',
  },
});

export default RegisterScreen;