import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import SafeLinearGradient from './components/SafeLinearGradient';
import { useRoutineStore } from '../stores/routineStore';

const { width, height } = Dimensions.get('window');

export default function RoutineScreen() {
  const {
    startRoutine,
    getCurrentStep,
    completeStep,
    nextStep,
    previousStep,
    finishRoutine,
    currentStepIndex,
    getActiveTemplate,
    getTodayCompletionRate,
  } = useRoutineStore();

  const template = getActiveTemplate();
  const currentStep = getCurrentStep();
  const completionRate = getTodayCompletionRate();

  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    startRoutine();
  }, []);

  useEffect(() => {
    // Fade in animation when step changes
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
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
  }, [currentStepIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
  };

  const handleCompleteStep = () => {
    if (currentStep) {
      completeStep(currentStep.id);
      handleStopTimer();
      setTimer(0);

      if (template && currentStepIndex === template.steps.length - 1) {
        // Last step - finish routine
        setTimeout(() => {
          finishRoutine();
        }, 500);
      } else {
        // Move to next step
        setTimeout(() => {
          nextStep();
        }, 500);
      }
    }
  };

  const handleSkipStep = () => {
    handleStopTimer();
    setTimer(0);
    nextStep();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGradientColors = () => {
    if (!currentStep) return ['#1a1a1a', '#000'];
    
    const colorMap: Record<string, string[]> = {
      '💧': ['#0099ff', '#001a33'],
      '🧘': ['#9b59b6', '#2c1a3d'],
      '🧠': ['#3498db', '#1a2a3d'],
      '📋': ['#2ecc71', '#1a3d2e'],
      '📝': ['#f39c12', '#3d2e1a'],
    };

    return colorMap[currentStep.icon] || ['#1a1a1a', '#000'];
  };

  if (!template || !currentStep) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No routine template found</Text>
      </View>
    );
  }

  const isLastStep = currentStepIndex === template.steps.length - 1;
  const progress = ((currentStepIndex + 1) / template.steps.length) * 100;

  return (
    <SafeLinearGradient colors={getGradientColors()} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {template.steps.length}
          </Text>
        </View>

        {/* Main Card */}
        <Animated.View
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Icon */}
          <Text style={styles.stepIcon}>{currentStep.icon}</Text>

          {/* Title */}
          <Text style={styles.stepTitle}>{currentStep.title}</Text>

          {/* Description */}
          <Text style={styles.stepDescription}>{currentStep.description}</Text>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            <Text style={styles.timerSubtext}>
              Suggested: {currentStep.duration} min
            </Text>
          </View>

          {/* Timer Controls */}
          {!isTimerRunning ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartTimer}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handleStopTimer}
            >
              <Text style={styles.pauseButtonText}>Pause</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteStep}
            >
              <Text style={styles.completeButtonText}>
                {isLastStep ? '🎉 Finish Routine' : '✓ Complete & Next'}
              </Text>
            </TouchableOpacity>

            {currentStep.isOptional && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipStep}
              >
                <Text style={styles.skipButtonText}>Skip (Optional)</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Navigation Dots */}
        <View style={styles.dotsContainer}>
          {template.steps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.dot,
                index === currentStepIndex && styles.activeDot,
                step.completedToday && styles.completedDot,
              ]}
            />
          ))}
        </View>

        {/* Overall Progress */}
        <View style={styles.overallProgress}>
          <Text style={styles.overallProgressText}>
            Today's Completion: { Math.max(100,Math.round(completionRate))}%
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStepIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={previousStep}
          disabled={currentStepIndex === 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            isLastStep && styles.navButtonDisabled,
          ]}
          onPress={nextStep}
          disabled={isLastStep}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 16,
    minWidth: 200,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 16,
    minWidth: 200,
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  completeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 16,
  },
  skipButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  completedDot: {
    backgroundColor: '#4CAF50',
  },
  overallProgress: {
    alignItems: 'center',
  },
  overallProgressText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
