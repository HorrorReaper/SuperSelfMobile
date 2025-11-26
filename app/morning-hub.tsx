import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import SafeScrollView from './components/SafeScrollView';
import { useRouter } from 'expo-router';
import SafeLinearGradient from './components/SafeLinearGradient';
import { useRoutineStore } from '../stores/routineStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useJournalStore } from '../stores/journalStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Motivational quotes that rotate daily
const QUOTES = [
  { text: "Win the morning, win the day.", author: "Tim Ferriss" },
  { text: "The way you start your day determines how well you live your day.", author: "Robin Sharma" },
  { text: "Every morning is a fresh beginning.", author: "Joel Osteen" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
];

export default function MorningHub() {
  const router = useRouter();
  const { getTodayCompletionRate, getStreak: getRoutineStreak } = useRoutineStore();
  const { getTomorrowPlan } = useDayPlanStore();
  const { getStreak: getJournalStreak, getTodayEntry } = useJournalStore();

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;

  const routineCompletion = getTodayCompletionRate();
  const routineStreak = getRoutineStreak();
  const journalStreak = getJournalStreak();
  const tomorrowPlan = getTomorrowPlan();
  const todayJournal = getTodayEntry();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get daily quote
  const getDailyQuote = () => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  };

  const quote = getDailyQuote();

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger card animations
    Animated.stagger(150, [
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCardPress = (route: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(route as any);
  };

  const cards = [
    {
      id: 'routine',
      title: 'Morning Routine',
      icon: '🌅',
      description: 'Start your day mindfully',
      gradient: ['#667eea', '#764ba2'],
      route: '/routine',
      stats: `${Math.min(Math.round(routineCompletion), 100)}% Complete`,
      streak: routineStreak,
      completed: routineCompletion >= 100,
      animValue: card1Anim,
    },
    {
      id: 'planning',
      title: 'Plan Tomorrow',
      icon: '📋',
      description: 'Win before the day starts',
      gradient: ['#f093fb', '#f5576c'],
      route: '/planning',
      stats: tomorrowPlan ? `${tomorrowPlan.tasks.length} tasks` : 'Not planned',
      streak: 0,
      completed: !!tomorrowPlan,
      animValue: card2Anim,
    },
    {
      id: 'journal',
      title: 'Morning Journal',
      icon: '📝',
      description: 'Reflect and set intentions',
      gradient: ['#4facfe', '#00f2fe'],
      route: '/journal',
      stats: todayJournal ? 'Completed' : 'Not started',
      streak: journalStreak,
      completed: !!todayJournal,
      animValue: card3Anim,
    },
  ];

  const totalCompletion = cards.filter(c => c.completed).length;
  const allCompleted = totalCompletion === cards.length;

  return (
    <View style={styles.container}>
      <SafeScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.headerTitle}>Your Morning Ritual</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Animated.View>

        {/* Quote of the day */}
        <Animated.View 
          style={[
            styles.quoteCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.quoteIcon}>💭</Text>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </Animated.View>

        {/* Overall Progress */}
        <Animated.View 
          style={[
            styles.progressCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            {allCompleted && (
              <Text style={styles.completedAll}>🎉 All Done!</Text>
            )}
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { width: `${(totalCompletion / cards.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {totalCompletion}/{cards.length}
            </Text>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <Text style={styles.progressIcon}>🔥</Text>
              </View>
              <Text style={styles.progressValue}>{routineStreak}</Text>
              <Text style={styles.progressLabel}>Day Streak</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <Text style={styles.progressIcon}>✓</Text>
              </View>
              <Text style={styles.progressValue}>{Math.min(Math.round(routineCompletion), 100)}%</Text>
              <Text style={styles.progressLabel}>Routine</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <Text style={styles.progressIcon}>📊</Text>
              </View>
              <Text style={styles.progressValue}>{journalStreak}</Text>
              <Text style={styles.progressLabel}>Journal</Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Cards */}
        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <Animated.View
              key={card.id}
              style={{
                opacity: card.animValue,
                transform: [
                  {
                    scale: card.animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => handleCardPress(card.route)}
                activeOpacity={0.85}
              >
                <SafeLinearGradient
                  colors={card.gradient}
                  style={styles.card}
                >
                  {/* Glassmorphism overlay */}
                  <View style={styles.cardGlass} />
                  
                  {/* Top section */}
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconContainer}>
                      <Text style={styles.cardIcon}>{card.icon}</Text>
                    </View>
                    {card.completed && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedIcon}>✓</Text>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDescription}>{card.description}</Text>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.cardStats}>
                      <Text style={styles.cardStatsText}>{card.stats}</Text>
                      {card.streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakText}>🔥 {card.streak}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardArrow}>
                      <Text style={styles.cardArrowText}>→</Text>
                    </View>
                  </View>
                </SafeLinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Tips Section */}
        <Animated.View 
          style={[
            styles.tipsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsTitle}>Pro Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Complete your routine before checking your phone
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Plan tomorrow the night before for a stress-free morning
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Journal consistently to track your personal growth
              </Text>
            </View>
          </View>
        </Animated.View>
      </SafeScrollView>
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
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
  },
  quoteCard: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  quoteIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  progressCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  completedAll: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    minWidth: 40,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#222',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressIcon: {
    fontSize: 20,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    padding: 24,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 28,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    marginVertical: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flex: 1,
    gap: 8,
  },
  cardStatsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  streakBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  streakText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  cardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '300',
  },
  tipsContainer: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tipsIcon: {
    fontSize: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
  },
  tipBullet: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
});
