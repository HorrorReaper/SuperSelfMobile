import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useJournalStore } from '../stores/journalStore';
import { JournalAnswer } from '../types/index';
import SafeSlider from './components/SafeSlider';

export default function JournalScreen() {
  const {
    getActiveQuestions,
    getTodayEntry,
    saveEntry,
    getStreak,
  } = useJournalStore();

  const questions = getActiveQuestions();
  const todayEntry = getTodayEntry();
  const streak = getStreak();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Load existing answers if entry exists
    if (todayEntry) {
      const answerMap: Record<string, any> = {};
      todayEntry.answers.forEach((a) => {
        answerMap[a.questionId] = a.answer;
      });
      setAnswers(answerMap);
    }
  }, [todayEntry]);

  useEffect(() => {
    // Animate when question changes
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    };
  }, [currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSave();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSave = () => {
    const journalAnswers: Omit<JournalAnswer, 'answeredAt'>[] = Object.entries(
      answers
    ).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    saveEntry(journalAnswers);

    Alert.alert(
      '✨ Journal Saved!',
      `Great reflection! You're on a ${streak + 1} day streak.`,
      [{ text: 'Done', onPress: () => setCurrentQuestionIndex(0) }]
    );
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const answer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder={currentQuestion.placeholder || 'Type your answer...'}
            placeholderTextColor="#666"
            value={answer || ''}
            onChangeText={(text) =>
              handleAnswerChange(currentQuestion.id, text)
            }
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />
        );

      case 'scale':
        return (
          <View style={styles.scaleContainer}>
            <Text style={styles.scaleValue}>
              {answer || currentQuestion.scaleMin || 1}
            </Text>
            <SafeSlider
              style={styles.slider}
              minimumValue={currentQuestion.scaleMin || 1}
              maximumValue={currentQuestion.scaleMax || 10}
              step={1}
              value={answer || currentQuestion.scaleMin || 1}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestion.id, value)
              }
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#333"
              thumbTintColor="#4CAF50"
            />
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabel}>
                {currentQuestion.scaleMin || 1}
              </Text>
              <Text style={styles.scaleLabel}>
                {currentQuestion.scaleMax || 10}
              </Text>
            </View>
          </View>
        );

      case 'boolean':
        return (
          <View style={styles.booleanContainer}>
            <TouchableOpacity
              style={[
                styles.booleanButton,
                answer === true && styles.booleanButtonActive,
              ]}
              onPress={() => handleAnswerChange(currentQuestion.id, true)}
            >
              <Text
                style={[
                  styles.booleanButtonText,
                  answer === true && styles.booleanButtonTextActive,
                ]}
              >
                ✓ Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.booleanButton,
                answer === false && styles.booleanButtonActive,
              ]}
              onPress={() => handleAnswerChange(currentQuestion.id, false)}
            >
              <Text
                style={[
                  styles.booleanButtonText,
                  answer === false && styles.booleanButtonTextActive,
                ]}
              >
                × No
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'multiselect':
        return (
          <View style={styles.multiselectContainer}>
            {currentQuestion.options?.map((option) => {
              const selected = (answer || []).includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.multiselectOption,
                    selected && styles.multiselectOptionActive,
                  ]}
                  onPress={() => {
                    const current = answer || [];
                    const updated = selected
                      ? current.filter((o: string) => o !== option)
                      : [...current, option];
                    handleAnswerChange(currentQuestion.id, updated);
                  }}
                >
                  <Text
                    style={[
                      styles.multiselectOptionText,
                      selected && styles.multiselectOptionTextActive,
                    ]}
                  >
                    {selected ? '✓ ' : ''}
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>
            No journal questions configured.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Morning Journal</Text>
          <Text style={styles.headerStreak}>🔥 {streak} day streak</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>

        {/* Question Card */}
        <Animated.View
          style={[
            styles.questionCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {currentQuestion.category.toUpperCase()}
            </Text>
          </View>

          {/* Question */}
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {/* Input */}
          <View style={styles.inputContainer}>{renderQuestionInput()}</View>
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestionIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              !answers[currentQuestion?.id] && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!answers[currentQuestion?.id]}
          >
            <Text style={styles.navButtonPrimaryText}>
              {isLastQuestion ? 'Save Journal ✓' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
          <Text style={styles.skipButtonText}>Skip Question</Text>
        </TouchableOpacity>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {questions.map((q, index) => (
            <View
              key={q.id}
              style={[
                styles.dot,
                index === currentQuestionIndex && styles.activeDot,
                answers[q.id] && styles.answeredDot,
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerStreak: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700',
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
    lineHeight: 32,
  },
  inputContainer: {
    minHeight: 150,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#333',
  },
  scaleContainer: {
    alignItems: 'center',
  },
  scaleValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  scaleLabel: {
    fontSize: 14,
    color: '#888',
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
  },
  booleanButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  booleanButtonText: {
    fontSize: 18,
    color: '#888',
    fontWeight: '600',
  },
  booleanButtonTextActive: {
    color: '#4CAF50',
  },
  multiselectContainer: {
    gap: 12,
  },
  multiselectOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  multiselectOptionActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  multiselectOptionText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  multiselectOptionTextActive: {
    color: '#4CAF50',
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
  },
  navButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  activeDot: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  answeredDot: {
    backgroundColor: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});
