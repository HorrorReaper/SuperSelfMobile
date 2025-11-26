import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SafeScrollView from './components/SafeScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../stores/userStore';
import { useTaskStore } from '../stores/taskStore';
import { XPBar } from '../components/XPBar';
import { TaskCard } from '../components/TaskCard';
import { HabitCard } from '../components/HabitCard';
import { useChallengeStore } from '../stores/challengeStore';
import TodaysPlan from './components/TodaysPlan';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, initializeUser, addXP } = useUserStore();
  const { habits, getTodayPlan, toggleTask, toggleHabit, initializeStore } = useTaskStore();
  const { getCurrentChallenge, initializeChallenges, progress } = useChallengeStore();
const currentChallenge = getCurrentChallenge();

  useEffect(() => {
    initializeUser();
    initializeStore();
    initializeChallenges();
  }, []);

  const todayPlan = getTodayPlan();

  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 20);

  return (
    <View style={styles.container}>
      <SafeScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>SuperSelf</Text>
        <Text style={styles.subheader}>Day {profile.journeyDay} of 30</Text>

        <XPBar currentXP={profile.currentXP} />

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
        {currentChallenge && (
  <TouchableOpacity
    style={styles.challengeCard}
    onPress={() => router.push('/challenge')}
  >
    <View style={styles.challengeHeader}>
      <Text style={styles.challengeDay}>Day {progress.currentDay} Challenge</Text>
      {!currentChallenge.completed && <Text style={styles.newBadge}>NEW</Text>}
    </View>
    <Text style={styles.challengeTitle}>{currentChallenge.title}</Text>
    <Text style={styles.challengeMission} numberOfLines={2}>
      {currentChallenge.mission}
    </Text>
    <View style={styles.challengeFooter}>
      <Text style={styles.challengeReward}>+{currentChallenge.xpReward} XP</Text>
      <Text style={styles.challengeCTA}>
        {currentChallenge.completed ? '✓ Completed' : 'View Mission →'}
      </Text>
    </View>
  </TouchableOpacity>
)}
        <TodaysPlan />
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/plan')}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {todayPlan.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id, (xp) => addXP(xp, 'task'))}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habits</Text>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() => toggleHabit(habit.id, (xp) => addXP(xp, 'habit'))}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => router.push('/redeem')}
        >
          <Text style={styles.redeemButtonText}>💎 Redeem XP</Text>
        </TouchableOpacity>
        <TouchableOpacity 
  onPress={() => router.push('/morning-hub')}
  style={styles.morningButton}
>
  <Text style={styles.morningButtonText}>🌅 Morning Ritual</Text>
</TouchableOpacity>

        <TouchableOpacity
          style={[styles.reflectButton, { marginBottom: bottomPad } ]}
          onPress={() => router.push('/reflect')}
        >
          <Text style={styles.reflectButtonText}>
            {todayPlan.reflectionCompleted ? '✅ Reflection Done' : '📝 Evening Reflection'}
          </Text>
        </TouchableOpacity>
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
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  redeemButton: {
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  reflectButton: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  reflectButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  challengeCard: {
  backgroundColor: '#1e1e1e',
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  borderLeftWidth: 4,
  borderLeftColor: '#4CAF50',
},
challengeHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
challengeDay: {
  fontSize: 12,
  color: '#4CAF50',
  fontWeight: '600',
  textTransform: 'uppercase',
},
newBadge:{
backgroundColor: '#4CAF50',
color: '#000',
fontSize: 10,
fontWeight: '700',
paddingHorizontal: 8,
paddingVertical: 2,
borderRadius: 4,
},
challengeTitle: {
fontSize: 18,
fontWeight: '700',
color: '#fff',
marginBottom: 8,
},
challengeMission: {
fontSize: 14,
color: '#aaa',
lineHeight: 20,
marginBottom: 12,
},
challengeFooter: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
challengeReward: {
fontSize: 14,
color: '#4CAF50',
fontWeight: '600',
},
challengeCTA: {
fontSize: 14,
color: '#888',
fontWeight: '500',
},
morningButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  morningButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
