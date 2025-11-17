import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useRoutineStore } from '../../stores/routineStore';
import { useJournalStore } from '../../stores/journalStore';
import { useDayPlanStore } from '../../stores/dayPlanStore';


const { width } = Dimensions.get('window');

export default function MorningHubScreen() {
  const routineCompletion = useRoutineStore((s) => s.getTodayCompletionRate());
  const routineStreak = useRoutineStore((s) => s.getStreak());
  const journalStreak = useJournalStore((s) => s.getStreak());
  const todayEntry = useJournalStore((s) => s.getTodayEntry());
  const tomorrowPlan = useDayPlanStore((s) => s.getTomorrowPlan());

  const cards = [
    {
      id: 'routine',
      title: 'Morning Routine',
      icon: '🌅',
      description: 'Step-by-step morning flow',
      route: '/routine',
      stats: `${Math.round(routineCompletion)}% • ${routineStreak} day streak`,
      color: '#FF6B6B',
    },
    {
      id: 'planning',
      title: 'Day Planning',
      icon: '📅',
      description: 'Plan tomorrow, win today',
      route: '/planning',
      stats: tomorrowPlan
        ? `${tomorrowPlan.tasks.length} tasks planned`
        : 'No plan yet',
      color: '#4ECDC4',
    },
    {
      id: 'journal',
      title: 'Morning Journal',
      icon: '📝',
      description: 'Reflect and set intentions',
      route: '/journal',
      stats: todayEntry
        ? `Completed • ${journalStreak} day streak`
        : `${journalStreak} day streak`,
      color: '#95E1D3',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning! 🌞</Text>
          <Text style={styles.subtitle}>
            Your morning ritual awaits
          </Text>
        </View>
        

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{routineStreak}</Text>
            <Text style={styles.statLabel}>Routine Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{journalStreak}</Text>
            <Text style={styles.statLabel}>Journal Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {tomorrowPlan?.tasks.length || 0}
            </Text>
            <Text style={styles.statLabel}>Tasks Planned</Text>
          </View>
        </View>

        {/* Main Cards */}
        <View style={styles.cardsContainer}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.card, { borderLeftColor: card.color }]}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDescription}>{card.description}</Text>
                </View>
              </View>
              <Text style={styles.cardStats}>{card.stats}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Motivational Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            "The way you start your day determines how well you live your day."
          </Text>
          <Text style={styles.quoteAuthor}>— Robin Sharma</Text>
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
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
  },
  cardStats: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '600',
  },
  quoteContainer: {
    backgroundColor: '#111',
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD93D',
  },
  quote: {
    fontSize: 16,
    color: '#ddd',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
});
