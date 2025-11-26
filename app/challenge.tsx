import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SafeScrollView from './components/SafeScrollView';
import { useRouter } from 'expo-router';
import { useChallengeStore } from '../stores/challengeStore';
import { useUserStore } from '../stores/userStore';
import { DailyChallenge } from '../types';


export default function ChallengeScreen() {
  const router = useRouter(); // Navigation hook
  const { progress, getCurrentChallenge, completeChallenge, initializeChallenges } = useChallengeStore();
  const { addXP } = useUserStore();
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallenge | null>(null);

  useEffect(() => {
    initializeChallenges();
  }, []); // Initialisiert den Challenge-Store beim Laden des Bildschirms

  useEffect(() => {
    setCurrentChallenge(getCurrentChallenge());
  }, [progress.currentDay]); // Aktualisiert die aktuelle Herausforderung, wenn sich der aktuelle Tag ändert

  const handleComplete = () => {
    if (!currentChallenge) return;

    Alert.alert(
      'Complete Challenge?',
      `Did you complete today's mission?\n\n"${currentChallenge.mission}"`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, I Did It!',
          style: 'default',
          onPress: async () => {
            await completeChallenge(currentChallenge.day);
            addXP(currentChallenge.xpReward, `day_${currentChallenge.day}_challenge`);
            
            Alert.alert(
              '🎉 Challenge Complete!',
              `Amazing work! +${currentChallenge.xpReward} XP earned.\n\nDay ${currentChallenge.day + 1} is now unlocked!`,
              [{ text: 'Continue', onPress: () => setCurrentChallenge(getCurrentChallenge()) }]
            );
          },
        },
      ]
    );
  };// Behandelt die Vervollständigung der aktuellen Herausforderung

  const getCategoryColor = (category: DailyChallenge['category']) => {
    const colors = {
      mindset: '#9C27B0',
      health: '#4CAF50',
      productivity: '#2196F3',
      social: '#FF9800',
      habits: '#F44336',
    };
    return colors[category];
  }; // Gibt die Farbe basierend auf der Kategorie der Herausforderung zurück

  const getCategoryIcon = (category: DailyChallenge['category']) => {
    const icons = {
      mindset: '🧠',
      health: '💪',
      productivity: '⚡',
      social: '🤝',
      habits: '🔄',
    };
    return icons[category];
  }; // Gibt das Symbol basierend auf der Kategorie der Herausforderung zurück

  const completedCount = progress.challenges.filter((c) => c.completed).length; // Anzahl der abgeschlossenen Herausforderungen
  const progressPercentage = (completedCount / 30) * 100; // Fortschritt in Prozent

  if (!currentChallenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading challenge...</Text>
      </View>
    );
  } // Zeigt einen Ladebildschirm an, wenn die aktuelle Herausforderung noch nicht geladen ist

  return (
    <View style={styles.container}>
      <SafeScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Progress Header */}
        <View style={styles.progressSection}>
          <Text style={styles.journeyTitle}>30-Day Challenge</Text>
          <Text style={styles.dayCounter}>
            Day {progress.currentDay} of 30
          </Text>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          
          <Text style={styles.progressText}>
            {completedCount} days completed • {30 - completedCount} to go
          </Text>
        </View>

        {/* Today's Challenge Card */}
        <View style={styles.challengeCard}>
          <View style={styles.categoryBadge} >
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(currentChallenge.category)}
            </Text>
            <Text style={[styles.categoryText, { color: getCategoryColor(currentChallenge.category) }]}>
              {currentChallenge.category.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.challengeTitle}>{currentChallenge.title}</Text>
          <Text style={styles.challengeDescription}>{currentChallenge.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>TODAY'S MISSION</Text>
          <View style={styles.missionBox}>
            <Text style={styles.missionText}>{currentChallenge.mission}</Text>
          </View>

          <Text style={styles.sectionLabel}>TIPS FOR SUCCESS</Text>
          {currentChallenge.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}

          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>Complete for +{currentChallenge.xpReward} XP</Text>
          </View>
        </View>

        {/* Complete Button */}
        {!currentChallenge.completed ? (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>✓ Mark as Complete</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>✅ Challenge Completed!</Text>
            <Text style={styles.completedSubtext}>
              Come back tomorrow for Day {progress.currentDay + 1}
            </Text>
          </View>
        )}

        {/* Challenge Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Your Journey</Text>
          {progress.challenges.slice(0, progress.currentDay + 2).map((challenge) => (
            <View
              key={challenge.day}
              style={[
                styles.timelineItem,
                challenge.day === progress.currentDay && styles.timelineItemCurrent,
                challenge.completed && styles.timelineItemCompleted,
                !challenge.unlockedAt && styles.timelineItemLocked,
              ]}
            >
              <View style={styles.timelineIconContainer}>
                {challenge.completed ? (
                  <Text style={styles.timelineIcon}>✅</Text>
                ) : challenge.day === progress.currentDay ? (
                  <Text style={styles.timelineIcon}>📍</Text>
                ) : !challenge.unlockedAt ? (
                  <Text style={styles.timelineIcon}>🔒</Text>
                ) : (
                  <Text style={styles.timelineIcon}>⭕</Text>
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDay}>Day {challenge.day}</Text>
                <Text
                  style={[
                    styles.timelineTitle,
                    !challenge.unlockedAt && styles.timelineTitleLocked,
                  ]}
                >
                  {!challenge.unlockedAt ? '???' : challenge.title}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  progressSection: {
    marginBottom: 24,
  },
  journeyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dayCounter: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#888',
  },
  challengeCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  challengeDescription: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 12,
  },
  missionBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: 20,
  },
  missionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    color: '#4CAF50',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
  },
  rewardBadge: {
    backgroundColor: '#1a2e1a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  rewardText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  completedBanner: {
    backgroundColor: '#1a2e1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  completedSubtext: {
    color: '#888',
    fontSize: 14,
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 8,
  },
  timelineItemCurrent: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#1a2e1a',
  },
  timelineItemCompleted: {
    opacity: 0.6,
  },
  timelineItemLocked: {
    opacity: 0.3,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    fontSize: 24,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDay: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  timelineTitleLocked: {
    color: '#666',
  },
});
