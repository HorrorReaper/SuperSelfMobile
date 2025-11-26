import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import SafeScrollView from './SafeScrollView';

import * as Haptics from 'expo-haptics';
import SafeLinearGradient from './SafeLinearGradient';
import { useDayPlanStore } from '../../stores/dayPlanStore';
import { useTaskStore } from '../../stores/taskStore';

const CATEGORY_ICONS = {
  work: '💼',
  personal: '🏠',
  health: '💪',
  learning: '📚',
  other: '✨',
};

function getPriorityColor(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high':
      return '#f5576c';
    case 'medium':
      return '#FFA726';
    case 'low':
      return '#4CAF50';
  }
}

function getCurrentTimeBlock(timeBlocks: any[]) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return timeBlocks.find(block => 
    block.startTime <= currentTime && block.endTime >= currentTime
  );
}

function getUpcomingTimeBlock(timeBlocks: any[]) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const upcoming = timeBlocks
    .filter(block => block.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  return upcoming[0];
}

export default function TodaysPlan() {
  const { getTodayPlan, toggleTask, getCompletionRate } = useDayPlanStore();
  
  const [plan, setPlan] = useState(getTodayPlan());
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Subscribe to plan updates
  useEffect(() => {
    const unsubscribe = useDayPlanStore.subscribe((state) => {
      const updatedPlan = state.plans.find(p => p.date === todayDate);
      setPlan(updatedPlan);
    });

    return unsubscribe;
  }, [todayDate]);

  const handleTaskToggle = (taskId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    toggleTask(todayDate, taskId);
  };

  if (!plan) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No Plan for Today</Text>
          <Text style={styles.emptyText}>
            Plan your tomorrow in the evening to see it here
          </Text>
        </View>
      </View>
    );
  }

  const completionRate = getCompletionRate(todayDate);
  const completedTasks = plan.tasks.filter(t => t.completed).length;
  const totalTasks = plan.tasks.length;
  const currentBlock = getCurrentTimeBlock(plan.timeBlocks);
  const upcomingBlock = getUpcomingTimeBlock(plan.timeBlocks);

  return (
    <SafeScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Date */}
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.headerTitle}>Today's Plan</Text>
      </View>

      {/* Daily Intention */}
      {plan.intention && (
        <View style={styles.intentionCard}>
          <Text style={styles.intentionLabel}>🎯 Today's Intention</Text>
          <Text style={styles.intentionText}>{plan.intention}</Text>
        </View>
      )}

      {/* Progress Overview */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressPercentage}>{completionRate}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <SafeLinearGradient
            colors={['#667eea', '#764ba2']}
            style={[styles.progressBarFill, { width: `${completionRate}%` }]}
          />
        </View>
        </View>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{completedTasks}</Text>
            <Text style={styles.progressStatLabel}>Completed</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{totalTasks - completedTasks}</Text>
            <Text style={styles.progressStatLabel}>Remaining</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{plan.timeBlocks.length}</Text>
            <Text style={styles.progressStatLabel}>Time Blocks</Text>
          </View>
        </View>
      </View>

      {/* Current/Upcoming Time Block */}
      {(currentBlock || upcomingBlock) && (
        <View style={styles.currentBlockCard}>
          {currentBlock ? (
            <>
              <View style={styles.currentBlockHeader}>
                <Text style={styles.currentBlockLabel}>⏰ NOW</Text>
                <Text style={styles.currentBlockTime}>
                  {currentBlock.startTime} - {currentBlock.endTime}
                </Text>
              </View>
              <View style={styles.currentBlockContent}>
                <Text style={styles.currentBlockIcon}>
                  {CATEGORY_ICONS[currentBlock.category as keyof typeof CATEGORY_ICONS]}
                </Text>
                <Text style={styles.currentBlockTitle}>{currentBlock.title}</Text>
              </View>
              <View style={[styles.currentBlockBar, { backgroundColor: currentBlock.color }]} />
            </>
          ) : upcomingBlock ? (
            <>
              <View style={styles.currentBlockHeader}>
                <Text style={styles.upcomingBlockLabel}>⏭️ NEXT</Text>
                <Text style={styles.currentBlockTime}>
                  {upcomingBlock.startTime} - {upcomingBlock.endTime}
                </Text>
              </View>
              <View style={styles.currentBlockContent}>
                <Text style={styles.currentBlockIcon}>
                  {CATEGORY_ICONS[upcomingBlock.category as keyof typeof CATEGORY_ICONS]}
                </Text>
                <Text style={styles.currentBlockTitle}>{upcomingBlock.title}</Text>
              </View>
              <View style={[styles.currentBlockBar, { backgroundColor: upcomingBlock.color }]} />
            </>
          ) : null}
        </View>
      )}

      {/* Tasks Section */}
      {plan.tasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Tasks</Text>
            <Text style={styles.sectionCount}>
              {completedTasks}/{totalTasks}
            </Text>
          </View>

          <View style={styles.tasksList}>
            {/* High Priority Tasks */}
            {plan.tasks.filter(t => t.priority === 'high').length > 0 && (
              <>
                <Text style={styles.priorityHeader}>🔥 High Priority</Text>
                {plan.tasks
                  .filter(t => t.priority === 'high')
                  .map(task => (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => handleTaskToggle(task.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          task.completed && styles.checkboxCompleted,
                          { borderColor: getPriorityColor(task.priority) },
                        ]}
                      >
                        {task.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      
                      <View style={styles.taskContent}>
                        <Text
                          style={[
                            styles.taskTitle,
                            task.completed && styles.taskTitleCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskXP}> XP</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
              </>
            )}

            {/* Medium Priority Tasks */}
            {plan.tasks.filter(t => t.priority === 'medium').length > 0 && (
              <>
                <Text style={styles.priorityHeader}>📌 Medium Priority</Text>
                {plan.tasks
                  .filter(t => t.priority === 'medium')
                  .map(task => (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => handleTaskToggle(task.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          task.completed && styles.checkboxCompleted,
                          { borderColor: getPriorityColor(task.priority) },
                        ]}
                      >
                        {task.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      
                      <View style={styles.taskContent}>
                        <Text
                          style={[
                            styles.taskTitle,
                            task.completed && styles.taskTitleCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskXP}> XP</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
              </>
            )}

            {/* Low Priority Tasks */}
            {plan.tasks.filter(t => t.priority === 'low').length > 0 && (
              <>
                <Text style={styles.priorityHeader}>📝 Low Priority</Text>
                {plan.tasks
                  .filter(t => t.priority === 'low')
                  .map(task => (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskItem}
                      onPress={() => handleTaskToggle(task.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          task.completed && styles.checkboxCompleted,
                          { borderColor: getPriorityColor(task.priority) },
                        ]}
                      >
                        {task.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      
                      <View style={styles.taskContent}>
                        <Text
                          style={[
                            styles.taskTitle,
                            task.completed && styles.taskTitleCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskXP}> XP</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
              </>
            )}
          </View>
        </View>
      )}

      {/* Time Blocks Timeline */}
      {plan.timeBlocks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          
          <View style={styles.timeline}>
            {plan.timeBlocks
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((block, index) => {
                const isCurrent = currentBlock?.id === block.id;
                const isPast = block.endTime < currentTime.toTimeString().slice(0, 5);
                
                return (
                  <View key={block.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <Text style={[
                        styles.timelineTime,
                        isCurrent && styles.timelineTimeCurrent,
                      ]}>
                        {block.startTime}
                      </Text>
                      <View style={styles.timelineLine}>
                        <View
                          style={[
                            styles.timelineDot,
                            isCurrent && styles.timelineDotCurrent,
                            isPast && styles.timelineDotPast,
                          ]}
                        />
                        {index < plan.timeBlocks.length - 1 && (
                          <View style={styles.timelineConnector} />
                        )}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.timelineBlock,
                        isCurrent && styles.timelineBlockCurrent,
                        isPast && styles.timelineBlockPast,
                        { borderLeftColor: block.color },
                      ]}
                    >
                      <View style={styles.timelineBlockHeader}>
                        <Text style={styles.timelineBlockIcon}>
                          {CATEGORY_ICONS[block.category as keyof typeof CATEGORY_ICONS]}
                        </Text>
                        <Text style={[
                          styles.timelineBlockTitle,
                          isPast && styles.timelineBlockTitlePast,
                        ]}>
                          {block.title}
                        </Text>
                      </View>
                      <Text style={styles.timelineBlockTime}>
                        {block.startTime} - {block.endTime}
                      </Text>
                      <Text style={styles.timelineBlockCategory}>{block.category}</Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      )}
    </SafeScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  intentionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  intentionLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
  },
  intentionText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 24,
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#888',
  },
  progressDivider: {
    width: 1,
    backgroundColor: '#222',
  },
  currentBlockCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    position: 'relative',
    overflow: 'hidden',
  },
  currentBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentBlockLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 1,
  },
  upcomingBlockLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFA726',
    letterSpacing: 1,
  },
  currentBlockTime: {
    fontSize: 12,
    color: '#888',
  },
  currentBlockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentBlockIcon: {
    fontSize: 32,
  },
  currentBlockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  currentBlockBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  tasksList: {
    gap: 8,
  },
  priorityHeader: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  taskXP: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeline: {
    marginTop: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 80,
    paddingRight: 16,
    alignItems: 'flex-end',
  },
  timelineTime: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
  },
  timelineTimeCurrent: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  timelineLine: {
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#444',
  },
  timelineDotCurrent: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineDotPast: {
    backgroundColor: '#444',
    borderColor: '#444',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#222',
    marginTop: 4,
  },
  timelineBlock: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  timelineBlockCurrent: {
    backgroundColor: '#1a1a2e',
    borderColor: '#667eea',
  },
  timelineBlockPast: {
    opacity: 0.5,
  },
  timelineBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timelineBlockIcon: {
    fontSize: 20,
  },
  timelineBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  timelineBlockTitlePast: {
    color: '#888',
  },
  timelineBlockTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  timelineBlockCategory: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
