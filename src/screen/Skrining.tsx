import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Surface, TextInput} from 'react-native-paper';
import {
  Scale,
  Droplets,
  Brain,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  RefreshCw,
} from 'lucide-react-native';
import CustomHeader from '../components/molecules/HeaderCustom';
import { C } from '../helper/theme';
import { get, put } from '../helper/apiHelper';


// ── Types ─────────────────────────────────────────────────────────────────────

interface ScreeningData {
  uuid: string;
  height_cm: string;
  weight_kg: string;
  bmi: string;
  systolic: number;
  diastolic: number;
  phq9_answers: number[];
  phq9_score: number;
  created_at: string;
  updated_at: string;
}

interface ScreeningResponse {
  success: boolean;
  message: string;
  data: ScreeningData;
  meta: {timestamp: string};
}

// ── PHQ-9 Questions ───────────────────────────────────────────────────────────

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things, such as reading or watching TV',
  'Moving or speaking so slowly that others could notice, or being restless',
  'Thoughts that you would be better off dead or of hurting yourself',
];

const PHQ9_OPTIONS = [
  {value: 0, label: 'Not at all'},
  {value: 1, label: 'Several days'},
  {value: 2, label: 'More than half the days'},
  {value: 3, label: 'Nearly every day'},
];

const getPHQ9Severity = (score: number) => {
  if (score <= 4)  {return {label: 'Minimal',  color: '#27AE60', bg: '#27AE6015'};}
  if (score <= 9)  {return {label: 'Mild',     color: C.orange,  bg: C.orange + '15'};}
  if (score <= 14) {return {label: 'Moderate', color: '#F5A623', bg: '#F5A62315'};}
  if (score <= 19) {return {label: 'Moderately Severe', color: C.redLight, bg: C.redLight + '15'};}
  return {label: 'Severe', color: C.red, bg: C.red + '15'};
};

const getBPStatus = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80)  {return {label: 'Normal',   color: '#27AE60'};}
  if (systolic < 130 && diastolic < 80)  {return {label: 'Elevated', color: C.orange};}
  if (systolic < 140 || diastolic < 90)  {return {label: 'High Stage 1', color: '#F5A623'};}
  return {label: 'High Stage 2', color: C.redLight};
};

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) {return {label: 'Underweight', color: C.orange};}
  if (bmi < 25)   {return {label: 'Normal',      color: '#27AE60'};}
  if (bmi < 30)   {return {label: 'Overweight',  color: C.orange};}
  return {label: 'Obese', color: C.redLight};
};

// ── Step Config ───────────────────────────────────────────────────────────────

const STEPS = [
  {key: 'body',     label: 'Body Metrics',    icon: Scale},
  {key: 'bp',       label: 'Blood Pressure',  icon: Droplets},
  {key: 'phq9',     label: 'Mental Health',   icon: Brain},
  {key: 'result',   label: 'Results',         icon: CheckCircle},
];

// ── Main Screen ───────────────────────────────────────────────────────────────

const ScreeningScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastScreening, setLastScreening] = useState<ScreeningData | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [phq9Answers, setPhq9Answers] = useState<number[]>(Array(9).fill(0));
  const [currentPhq9, setCurrentPhq9] = useState(0);

  // ── Load Latest ───────────────────────────────────────────────────────────────

  const loadLatest = useCallback(async () => {
    setLoading(true);
    const {data, error} = await get<ScreeningResponse>('/screening/latest');
    setLoading(false);
    if (!error && data?.success) {
      setLastScreening(data.data);
    }
  }, []);

  useEffect(() => {loadLatest();}, [loadLatest]);

  // ── Computed ──────────────────────────────────────────────────────────────────

  const bmi = height && weight
    ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)
    : null;

  const phq9Score = phq9Answers.reduce((a, b) => a + b, 0);
  const phq9Progress = (currentPhq9 + 1) / PHQ9_QUESTIONS.length;

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!height || !weight || !systolic || !diastolic) {
      Alert.alert('Incomplete', 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);

    const {data, error} = await put<ScreeningResponse>('/screening', {
      height_cm: Number(height),
      weight_kg: Number(weight),
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      phq9_answers: phq9Answers,
    });

    setSubmitting(false);

    if (error || !data?.success) {
      Alert.alert('Error', 'Failed to submit screening. Please try again.');
      return;
    }

    setLastScreening(data.data);
    setShowForm(false);
    setCurrentStep(3); // go to result
  };

  // ── Navigation ────────────────────────────────────────────────────────────────

  const goNext = () => {
    if (currentStep === 0 && (!height || !weight)) {
      Alert.alert('Required', 'Please enter your height and weight.');
      return;
    }
    if (currentStep === 1 && (!systolic || !diastolic)) {
      Alert.alert('Required', 'Please enter your blood pressure.');
      return;
    }
    if (currentStep === 2) {
      handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (currentStep === 0) {
      setShowForm(false);
      return;
    }
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // ── Reset Form ────────────────────────────────────────────────────────────────

  const startNew = () => {
    setHeight('');
    setWeight('');
    setSystolic('');
    setDiastolic('');
    setPhq9Answers(Array(9).fill(0));
    setCurrentPhq9(0);
    setCurrentStep(0);
    setShowForm(true);
  };

  // ── Last Screening Result ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CustomHeader title="Health Screening" subtitle="Self Assessment" />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text variant="bodySmall" style={{color: C.textMuted, marginTop: 8}}>
            Loading your screening data... 
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Dashboard (not in form) ───────────────────────────────────────────────────

  if (!showForm) {
    const bmiNum = lastScreening ? parseFloat(lastScreening.bmi) : null;
    const bmiCat = bmiNum ? getBMICategory(bmiNum) : null;
    const phqSev = lastScreening ? getPHQ9Severity(lastScreening.phq9_score) : null;
    const bpStat = lastScreening
      ? getBPStatus(lastScreening.systolic, lastScreening.diastolic)
      : null;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CustomHeader title="Health Screening" subtitle="Self Assessment" />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.dashContent}
          showsVerticalScrollIndicator={false}>

          {lastScreening ? (
            <>
              {/* Last screening date */}
              <View style={styles.lastDateRow}>
                <RefreshCw size={14} color={C.textMuted} />
                <Text variant="labelSmall" style={styles.lastDate}>
                  Last updated:{' '}
                  {new Date(lastScreening.updated_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              </View>

              {/* BMI Card */}
              <Surface style={styles.resultCard} elevation={1}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.resultIcon, {backgroundColor: C.secondary + '60'}]}>
                    <Scale size={18} color="#4A7A6A" />
                  </View>
                  <View style={styles.resultCardTitle}>
                    <Text variant="labelMedium" style={styles.resultTitle}>BMI</Text>
                    <Text variant="labelSmall" style={styles.resultSub}>Body Mass Index</Text>
                  </View>
                  <View style={[styles.resultBadge, {backgroundColor: bmiCat?.color + '20'}]}>
                    <Text variant="labelSmall" style={{color: bmiCat?.color, fontWeight: '700'}}>
                      {bmiCat?.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultRow}>
                  <View style={styles.resultMetric}>
                    <Text variant="labelSmall" style={styles.metricLabel}>BMI</Text>
                    <Text variant="headlineSmall" style={[styles.metricVal, {color: bmiCat?.color}]}>
                      {lastScreening.bmi}
                    </Text>
                  </View>
                  <View style={styles.resultMetric}>
                    <Text variant="labelSmall" style={styles.metricLabel}>Weight</Text>
                    <Text variant="titleLarge" style={styles.metricVal}>
                      {`${lastScreening.weight_kg} kg`}
                    </Text>
                  </View>
                  <View style={styles.resultMetric}>
                    <Text variant="labelSmall" style={styles.metricLabel}>Height</Text>
                    <Text variant="titleLarge" style={styles.metricVal}>
                      {`${lastScreening.height_cm} cm`}
                    </Text>
                  </View>
                </View>
              </Surface>

              {/* Blood Pressure Card */}
              <Surface style={styles.resultCard} elevation={1}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.resultIcon, {backgroundColor: C.redLight + '20'}]}>
                    <Droplets size={18} color={C.redLight} />
                  </View>
                  <View style={styles.resultCardTitle}>
                    <Text variant="labelMedium" style={styles.resultTitle}>Blood Pressure</Text>
                    <Text variant="labelSmall" style={styles.resultSub}>Cardiovascular Health</Text>
                  </View>
                  <View style={[styles.resultBadge, {backgroundColor: bpStat?.color + '20'}]}>
                    <Text variant="labelSmall" style={{color: bpStat?.color, fontWeight: '700'}}>
                      {bpStat?.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultRow}>
                  <View style={styles.resultMetric}>
                    <Text variant="labelSmall" style={styles.metricLabel}>Systolic</Text>
                    <Text variant="headlineSmall" style={[styles.metricVal, {color: C.redLight}]}>
                      {lastScreening.systolic}
                    </Text>
                    <Text variant="labelSmall" style={styles.metricUnit}>mmHg</Text>
                  </View>
                  <View style={styles.bpDivider}>
                    <Text style={styles.bpSlash}>/</Text>
                  </View>
                  <View style={styles.resultMetric}>
                    <Text variant="labelSmall" style={styles.metricLabel}>Diastolic</Text>
                    <Text variant="headlineSmall" style={[styles.metricVal, {color: C.orange}]}>
                      {lastScreening.diastolic}
                    </Text>
                    <Text variant="labelSmall" style={styles.metricUnit}>mmHg</Text>
                  </View>
                </View>
              </Surface>

              {/* PHQ-9 Card */}
              <Surface style={styles.resultCard} elevation={1}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.resultIcon, {backgroundColor: '#7B8FD420'}]}>
                    <Brain size={18} color="#7B8FD4" />
                  </View>
                  <View style={styles.resultCardTitle}>
                    <Text variant="labelMedium" style={styles.resultTitle}>Mental Health</Text>
                    <Text variant="labelSmall" style={styles.resultSub}>PHQ-9 Depression Scale</Text>
                  </View>
                  <View style={[styles.resultBadge, {backgroundColor: phqSev?.bg}]}>
                    <Text variant="labelSmall" style={{color: phqSev?.color, fontWeight: '700'}}>
                      {phqSev?.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.phq9ScoreRow}>
                  <Text variant="displaySmall" style={[styles.phq9Score, {color: phqSev?.color}]}>
                    {lastScreening.phq9_score}
                  </Text>
                  <View style={styles.phq9ScoreInfo}>
                    <Text variant="bodySmall" style={styles.metricLabel}>out of 27</Text>
                    <View style={styles.phq9Progress}>
                      <View style={[styles.phq9ProgressFill, {
                        width: `${(lastScreening.phq9_score / 27) * 100}%` as any,
                        backgroundColor: phqSev?.color,
                      }]} />
                    </View>
                  </View>
                </View>
              </Surface>
            </>
          ) : (
            <View style={styles.noDataWrapper}>
              <Text style={styles.noDataEmoji}>🩺</Text>
              <Text variant="titleMedium" style={styles.noDataTitle}>
                No Screening Data
              </Text>
              <Text variant="bodySmall" style={styles.noDataText}>
                Complete your first health screening to track your wellness journey.
              </Text>
            </View>
          )}

          {/* Start Button */}
          <TouchableOpacity style={styles.startBtn} onPress={startNew} activeOpacity={0.85}>
            <Text variant="titleSmall" style={styles.startBtnText}>
              {lastScreening ? '🔄  Update Screening' : '🩺  Start Screening'}
            </Text>
          </TouchableOpacity>

          <View style={{height: 100}} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════
  // FORM MODE
  // ══════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <ChevronLeft size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.formHeaderCenter}>
          <Text variant="titleSmall" style={styles.formHeaderTitle}>
            {STEPS[currentStep].label}
          </Text>
          <Text variant="labelSmall" style={styles.formHeaderStep}>
            Step {currentStep + 1} of {STEPS.length - 1}
          </Text>
        </View>
        <View style={{width: 40}} />
      </View>

      {/* Step Progress */}
      <View style={styles.stepIndicator}>
        {STEPS.slice(0, 3).map((step, i) => (
          <View key={step.key} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                i < currentStep && styles.stepDotDone,
                i === currentStep && styles.stepDotActive,
              ]}>
              {i < currentStep ? (
                <CheckCircle size={14} color="#FFF" />
              ) : (
                <Text style={[
                  styles.stepNum,
                  i === currentStep && {color: '#FFF'},
                ]}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < 2 && (
              <View style={[styles.stepLine, i < currentStep && styles.stepLineDone]} />
            )}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ── STEP 0: Body Metrics ── */}
          {currentStep === 0 && (
            <View>
              <Surface style={styles.formCard} elevation={1}>
                <View style={styles.formCardHeader}>
                  <View style={[styles.formIcon, {backgroundColor: C.secondary + '60'}]}>
                    <Scale size={20} color="#4A7A6A" />
                  </View>
                  <View>
                    <Text variant="titleSmall" style={styles.formCardTitle}>Body Metrics</Text>
                    <Text variant="labelSmall" style={styles.formCardSub}>
                      Enter your current measurements
                    </Text>
                  </View>
                </View>

                <TextInput
                  label="Height (cm)"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={C.primary}
                  left={<TextInput.Affix text="📏" />}
                  right={<TextInput.Affix text="cm" />}
                />

                <TextInput
                  label="Weight (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={C.primary}
                  left={<TextInput.Affix text="⚖️" />}
                  right={<TextInput.Affix text="kg" />}
                />

                {/* BMI Preview */}
                {bmi && (
                  <View style={[
                    styles.bmiPreview,
                    {backgroundColor: getBMICategory(parseFloat(bmi)).color + '10'},
                  ]}>
                    <Text variant="labelSmall" style={styles.bmiPreviewLabel}>
                      Estimated BMI
                    </Text>
                    <Text
                      variant="headlineMedium"
                      style={[
                        styles.bmiPreviewVal,
                        {color: getBMICategory(parseFloat(bmi)).color},
                      ]}>
                      {bmi}
                    </Text>
                    <Text
                      variant="labelMedium"
                      style={{color: getBMICategory(parseFloat(bmi)).color, fontWeight: '700'}}>
                      {getBMICategory(parseFloat(bmi)).label}
                    </Text>
                  </View>
                )}
              </Surface>
            </View>
          )}

          {/* ── STEP 1: Blood Pressure ── */}
          {currentStep === 1 && (
            <Surface style={styles.formCard} elevation={1}>
              <View style={styles.formCardHeader}>
                <View style={[styles.formIcon, {backgroundColor: C.redLight + '20'}]}>
                  <Droplets size={20} color={C.redLight} />
                </View>
                <View>
                  <Text variant="titleSmall" style={styles.formCardTitle}>Blood Pressure</Text>
                  <Text variant="labelSmall" style={styles.formCardSub}>
                    Measure using a blood pressure monitor
                  </Text>
                </View>
              </View>

              <TextInput
                label="Systolic (upper number)"
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor={C.redLight}
                right={<TextInput.Affix text="mmHg" />}
              />

              <TextInput
                label="Diastolic (lower number)"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor={C.orange}
                right={<TextInput.Affix text="mmHg" />}
              />

              {/* BP Preview */}
              {systolic && diastolic && (
                <View style={[
                  styles.bmiPreview,
                  {backgroundColor: getBPStatus(Number(systolic), Number(diastolic)).color + '10'},
                ]}>
                  <Text variant="titleLarge" style={{
                    color: getBPStatus(Number(systolic), Number(diastolic)).color,
                    fontWeight: '800',
                  }}>
                    {systolic}/{diastolic}
                  </Text>
                  <Text variant="labelSmall" style={styles.bmiPreviewLabel}>mmHg</Text>
                  <Text variant="labelMedium" style={{
                    color: getBPStatus(Number(systolic), Number(diastolic)).color,
                    fontWeight: '700',
                  }}>
                    {getBPStatus(Number(systolic), Number(diastolic)).label}
                  </Text>
                </View>
              )}

              {/* BP Guide */}
              <Surface style={styles.guideCard} elevation={0}>
                <Text variant="labelMedium" style={styles.guideTitle}>Blood Pressure Guide</Text>
                {[
                  {label: 'Normal',       range: '< 120/80',  color: '#27AE60'},
                  {label: 'Elevated',     range: '120-129/<80', color: C.orange},
                  {label: 'High Stage 1', range: '130-139/80-89', color: '#F5A623'},
                  {label: 'High Stage 2', range: '≥ 140/≥ 90', color: C.redLight},
                ].map(g => (
                  <View key={g.label} style={styles.guideRow}>
                    <View style={[styles.guideDot, {backgroundColor: g.color}]} />
                    <Text variant="labelSmall" style={styles.guideLabel}>{g.label}</Text>
                    <Text variant="labelSmall" style={styles.guideRange}>{g.range}</Text>
                  </View>
                ))}
              </Surface>
            </Surface>
          )}

          {/* ── STEP 2: PHQ-9 ── */}
          {currentStep === 2 && (
            <View>
              <View style={[styles.formCard, styles.cardShadow]}>
                <View style={styles.formCardHeader}>
                  <View style={[styles.formIcon, {backgroundColor: '#7B8FD420'}]}>
                    <Brain size={20} color="#7B8FD4" />
                  </View>
                  <View style={styles.phq9HeaderText}>
                    <Text variant="titleSmall" style={styles.formCardTitle}>
                      PHQ-9 Mental Health Assessment
                    </Text>
                    <Text variant="labelSmall" style={styles.formCardSub}>
                      Over the last 2 weeks, how often have you been bothered by:
                    </Text>
                  </View>
                </View>

                {/* Question Progress */}
                <View style={styles.phq9ProgressRow}>
                  <Text variant="labelSmall" style={{color: C.textMuted}}>
                    Question {currentPhq9 + 1} of {PHQ9_QUESTIONS.length}
                  </Text>
                  <Text variant="labelSmall" style={{color: '#7B8FD4', fontWeight: '700'}}>
                    Score: {phq9Score}/27
                  </Text>
                </View>
                {/* Custom progress bar — ProgressBar from paper breaks flex layout on web */}
                <View style={styles.phq9ProgressBar}>
                  <View style={[styles.phq9ProgressFill, {width: `${phq9Progress * 100}%` as any}]} />
                </View>

                {/* Current Question */}
                <View style={styles.phq9Question}>
                  <Text variant="bodyMedium" style={styles.phq9QuestionText}>
                    {PHQ9_QUESTIONS[currentPhq9]}
                  </Text>
                </View>

                {/* Answer Options */}
                <View style={styles.phq9Options}>
                  {PHQ9_OPTIONS.map(opt => {
                    const isSelected = phq9Answers[currentPhq9] === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.phq9Option,
                          isSelected && styles.phq9OptionSelected,
                        ]}
                        onPress={() => {
                          const updated = [...phq9Answers];
                          updated[currentPhq9] = opt.value;
                          setPhq9Answers(updated);
                        }}
                        activeOpacity={0.7}>
                        <View style={[
                          styles.phq9Radio,
                          isSelected && styles.phq9RadioSelected,
                        ]}>
                          {isSelected && <View style={styles.phq9RadioInner} />}
                        </View>
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.phq9OptionText,
                            isSelected && {color: '#7B8FD4', fontWeight: '700'},
                          ]}>
                          {opt.label}
                        </Text>
                        <View style={[
                          styles.phq9ScoreBadge,
                          {backgroundColor: isSelected ? '#7B8FD420' : '#F5F5F5'},
                        ]}>
                          <Text variant="labelSmall" style={{
                            color: isSelected ? '#7B8FD4' : C.textMuted,
                            fontWeight: '700',
                          }}>
                            {opt.value}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* PHQ-9 Navigation */}
                <View style={styles.phq9Nav}>
                  <TouchableOpacity
                    style={[styles.phq9NavBtn, currentPhq9 === 0 && styles.phq9NavBtnDisabled]}
                    onPress={() => setCurrentPhq9(prev => Math.max(prev - 1, 0))}
                    disabled={currentPhq9 === 0}>
                    <ChevronLeft size={18} color={currentPhq9 === 0 ? '#CCC' : C.primary} />
                    <Text variant="labelMedium" style={{
                      color: currentPhq9 === 0 ? '#CCC' : C.primary,
                    }}>Prev</Text>
                  </TouchableOpacity>

                  <View style={styles.phq9Dots}>
                    {PHQ9_QUESTIONS.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.phq9Dot,
                          i === currentPhq9 && styles.phq9DotActive,
                          i < currentPhq9 && styles.phq9DotDone,
                        ]}
                      />
                    ))}
                  </View>

                  {currentPhq9 < PHQ9_QUESTIONS.length - 1 ? (
                    <TouchableOpacity
                      style={styles.phq9NavBtn}
                      onPress={() => setCurrentPhq9(prev => Math.min(prev + 1, PHQ9_QUESTIONS.length - 1))}>
                      <Text variant="labelMedium" style={{color: C.primary}}>Next</Text>
                      <ChevronRight size={18} color={C.primary} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{width: 80}} />
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={{height: 120}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={submitting}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text variant="titleSmall" style={styles.nextBtnText}>
                {currentStep === 2 ? 'Submit Screening' : 'Next'}
              </Text>
              {currentStep < 2 && <ChevronRight size={18} color="#FFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  flex: {flex: 1},
  loadingCenter: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  // Dashboard
  dashContent: {paddingHorizontal: 20, paddingTop: 16},
  lastDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  lastDate: {color: C.textMuted},

  // Result Cards
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCardTitle: {flex: 1},
  resultTitle: {fontWeight: '700', color: C.text},
  resultSub: {color: C.textMuted, marginTop: 2},
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resultMetric: {alignItems: 'center', gap: 2},
  metricLabel: {color: C.textMuted, marginBottom: 2},
  metricVal: {fontWeight: '800', color: C.text},
  metricUnit: {color: C.textMuted},
  bpDivider: {justifyContent: 'center'},
  bpSlash: {fontSize: 28, color: C.textMuted, fontWeight: '300'},

  // PHQ-9 result
  phq9ScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  phq9Score: {fontWeight: '900'},
  phq9ScoreInfo: {flex: 1},
  phq9Progress: {height: 8, borderRadius: 4, marginTop: 8, backgroundColor: '#E0E0E0', overflow: 'hidden'},

  // No data
  noDataWrapper: {alignItems: 'center', paddingTop: 60, paddingHorizontal: 40},
  noDataEmoji: {fontSize: 60, marginBottom: 16},
  noDataTitle: {fontWeight: '700', color: C.text, marginBottom: 8},
  noDataText: {color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 32},

  // Start Button
  startBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {color: '#FFF', fontWeight: '700'},

  // Form Header
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formHeaderCenter: {alignItems: 'center'},
  formHeaderTitle: {fontWeight: '700', color: C.text},
  formHeaderStep: {color: C.textMuted, marginTop: 2},

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepItem: {flexDirection: 'row', alignItems: 'center'},
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  stepDotActive: {backgroundColor: C.primary, borderColor: C.primary},
  stepDotDone: {backgroundColor: '#27AE60', borderColor: '#27AE60'},
  stepNum: {fontSize: 13, fontWeight: '700', color: C.textMuted},
  stepLine: {width: 60, height: 2, backgroundColor: '#E0E0E0'},
  stepLineDone: {backgroundColor: '#27AE60'},

  // Form Content
  formContent: {paddingHorizontal: 20, paddingTop: 16},
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  formIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCardTitle: {fontWeight: '700', color: C.text},
  formCardSub: {color: C.textMuted, marginTop: 2},

  input: {marginBottom: 12, backgroundColor: '#FFF'},

  // BMI Preview
  bmiPreview: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  bmiPreviewLabel: {color: C.textMuted},
  bmiPreviewVal: {fontWeight: '900'},

  // BP Guide
  guideCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  guideTitle: {fontWeight: '700', color: C.text, marginBottom: 10},
  guideRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  guideDot: {width: 10, height: 10, borderRadius: 5},
  guideLabel: {flex: 1, color: C.text, fontWeight: '600'},
  guideRange: {color: C.textMuted},

  // PHQ-9
  phq9HeaderText: {flex: 1},
  phq9ProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phq9ProgressBar: {height: 6, borderRadius: 3, marginBottom: 20, backgroundColor: '#E0E0E0', overflow: 'hidden'},
  phq9ProgressFill: {height: 6, borderRadius: 3, backgroundColor: '#7B8FD4'},
  phq9Question: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7B8FD4',
  },
  phq9QuestionText: {color: C.text, lineHeight: 22},
  phq9Options: {gap: 8},
  phq9Option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  phq9OptionSelected: {
    backgroundColor: '#7B8FD410',
    borderColor: '#7B8FD4',
  },
  phq9Radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phq9RadioSelected: {borderColor: '#7B8FD4'},
  phq9RadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B8FD4',
  },
  phq9OptionText: {flex: 1, color: C.text},
  phq9ScoreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phq9Nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  phq9NavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.primary + '15',
    minWidth: 80,
    justifyContent: 'center',
  },
  phq9NavBtnDisabled: {backgroundColor: '#F5F5F5'},
  phq9Dots: {flexDirection: 'row', gap: 4},
  phq9Dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  phq9DotActive: {backgroundColor: '#7B8FD4', width: 14},
  phq9DotDone: {backgroundColor: '#27AE60'},

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnDisabled: {opacity: 0.7},
  nextBtnText: {color: '#FFF', fontWeight: '700'},
});

export default ScreeningScreen;