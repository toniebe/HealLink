import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { C } from '../../helper/theme';

interface TourTooltipProps {
  title: string;
  description: string;
  step: number;
  total: number;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  title,
  description,
  step,
  total,
  isLast,
  onNext,
  onSkip,
}) => {
  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={styles.stepDots}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step - 1 && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text variant="labelSmall" style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text variant="titleMedium" style={styles.title}>{title}</Text>
      <Text variant="bodySmall" style={styles.description}>{description}</Text>

      {/* Action */}
      <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.8}>
        <Text variant="labelLarge" style={styles.nextText}>
          {isLast ? 'Got it!' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TourTooltip;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    width: 18,
    backgroundColor: C.primary,
  },
  skipText: {
    color: C.textMuted,
    fontWeight: '500',
  },
  title: {
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    color: C.textMuted,
    lineHeight: 20,
    marginBottom: 18,
  },
  nextBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
