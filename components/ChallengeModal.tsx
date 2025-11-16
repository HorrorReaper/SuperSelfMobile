import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Vibration,
} from 'react-native';
import { validateChallengeAnswer } from '../lib/challengeGenerator';
import { ChallengeModalProps } from '../types/componentTypes';


export default function ChallengeModal({
  visible,
  challenge,
  appName,
  onSuccess,
  onFail,
  onSkip,
}: ChallengeModalProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const scaleAnim = useState(new Animated.Value(1))[0];
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (visible && challenge.type === 'breathing' && challenge.duration) {
      setTimeLeft(challenge.duration);
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        }); // Update breathing phase

        // Breathing animation cycle: 4s in, 4s hold, 4s out
        const cycle = (challenge.duration! - timeLeft) % 12;
        if (cycle < 4) {
          setBreathPhase('in');
          animateBreathing(1.3);
        } else if (cycle < 8) {
          setBreathPhase('hold');
          animateBreathing(1.3);
        } else {
          setBreathPhase('out');
          animateBreathing(1);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, challenge]);

  const animateBreathing = (toValue: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration: 3000,
      useNativeDriver: true,
    }).start();
  }; // Atemanimationsfunktion

  const handleSubmit = () => {
    const timeTaken = (Date.now() - startTime) / 1000;
    const isCorrect = validateChallengeAnswer(challenge, userAnswer);

    if (isCorrect) {
      onSuccess();
    } else {
      Vibration.vibrate(500);
      onFail();
    }

    setUserAnswer('');
  }; // Antwort-Handling

  const renderChallengeContent = () => {
    switch (challenge.type) {
      case 'math':
        return (
          <View style={styles.challengeContent}>
            <Text style={styles.challengeQuestion}>{challenge.question}</Text>
            <View style={styles.optionsContainer}>
              {challenge.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    userAnswer === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setUserAnswer(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      userAnswer === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'breathing':
        return (
          <View style={styles.challengeContent}>
            <Text style={styles.breathingTimer}>{timeLeft}s</Text>
            <Animated.View
              style={[
                styles.breathingCircle,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.breathingPhase}>
                {breathPhase === 'in' ? 'Breathe In' : breathPhase === 'hold' ? 'Hold' : 'Breathe Out'}
              </Text>
            </Animated.View>
            <Text style={styles.breathingInstruction}>
              Follow the circle's rhythm
            </Text>
          </View>
        );

      case 'affirmation':
        return (
          <View style={styles.challengeContent}>
            <Text style={styles.affirmationText}>"{challenge.question}"</Text>
            <Text style={styles.affirmationInstruction}>
              Read this affirmation out loud 3 times, then continue
            </Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleSubmit}
            >
              <Text style={styles.completeButtonText}>I've Read It</Text>
            </TouchableOpacity>
          </View>
        );

      case 'why':
        return (
          <View style={styles.challengeContent}>
            <Text style={styles.whyQuestion}>{challenge.question}</Text>
            <TextInput
              style={styles.whyInput}
              placeholder="Type your honest answer..."
              placeholderTextColor="#666"
              multiline
              value={userAnswer}
              onChangeText={setUserAnswer}
              autoFocus
            />
            <Text style={styles.whyHint}>Minimum 10 characters</Text>
          </View>
        );

      case 'pushups':
        return (
          <View style={styles.challengeContent}>
            <Text style={styles.pushupsCount}>{challenge.question}</Text>
            <Text style={styles.pushupsEmoji}>💪</Text>
            <Text style={styles.pushupsInstruction}>
              Do the push-ups, then continue
            </Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleSubmit}
            >
              <Text style={styles.completeButtonText}>Done!</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.blockedBadge}>🚫 BLOCKED</Text>
            <Text style={styles.appName}>{appName}</Text>
          </View>

          <Text style={styles.instruction}>{challenge.instruction}</Text>

          {renderChallengeContent()}

          <View style={styles.footer}>
            {challenge.type !== 'breathing' && (
              <>
                {(challenge.type === 'math' || challenge.type === 'why') && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !userAnswer && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!userAnswer}
                  >
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                  <Text style={styles.skipButtonText}>
                    Skip (counts as violation)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  blockedBadge: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  instruction: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  challengeContent: {
    marginBottom: 24,
  },
  challengeQuestion: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a2e1a',
  },
  optionText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#4CAF50',
  },
  breathingTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 24,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingPhase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  breathingInstruction: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  affirmationText: {
    fontSize: 24,
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 36,
    marginBottom: 24,
  },
  affirmationInstruction: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  whyQuestion: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  whyInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#444',
  },
  whyHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  pushupsCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  pushupsEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginVertical: 20,
  },
  pushupsInstruction: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '500',
  },
});
