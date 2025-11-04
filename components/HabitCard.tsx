import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { HabitCardProps } from '../types/componentTypes';

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle }) => {
  return (
    <TouchableOpacity
      style={[styles.card, habit.completedToday && styles.cardCompleted]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={styles.checkbox}>
          {habit.completedToday && <View style={styles.checkboxFilled} />}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, habit.completedToday && styles.titleCompleted]}>
            {habit.title}
          </Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>🔥 {habit.streak} day streak</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.xp}>+{habit.xpValue} XP</Text>
        {habit.streak > 3 && (
          <Text style={styles.bonus}>+{(habit.streak - 3) * 2} bonus</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompleted: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a2e1a',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  titleCompleted: {
    color: '#4CAF50',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: '#888',
    fontSize: 13,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  xp: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },
  bonus: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
