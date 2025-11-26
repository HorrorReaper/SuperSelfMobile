import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import SafeScrollView from './components/SafeScrollView';
import { useDayPlanStore, TimeBlock, Task } from '../stores/dayPlanStore';
import * as Haptics from 'expo-haptics';

const CATEGORY_COLORS = {
  work: '#667eea',
  personal: '#f093fb',
  health: '#4CAF50',
  learning: '#FFA726',
  other: '#78909C',
};

const CATEGORY_ICONS = {
  work: '💼',
  personal: '🏠',
  health: '💪',
  learning: '📚',
  other: '✨',
};

export default function MorningPlanning() {
  const {
    getTomorrowPlan,
    createOrUpdatePlan,
    addTimeBlock,
    removeTimeBlock,
    addTask,
    toggleTask,
    removeTask,
  } = useDayPlanStore();

  const [tomorrowDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [plan, setPlan] = useState(getTomorrowPlan());
  const [intention, setIntention] = useState(plan?.intention || '');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Block form state
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockCategory, setBlockCategory] = useState<keyof typeof CATEGORY_COLORS>('work');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Refresh plan whenever store changes
  useEffect(() => {
    const updatedPlan = getTomorrowPlan();
    setPlan(updatedPlan);
    console.log('Plan updated:', updatedPlan);
  }, [getTomorrowPlan]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useDayPlanStore.subscribe((state) => {
      const updatedPlan = state.plans.find(p => p.date === tomorrowDate);
      setPlan(updatedPlan);
    });

    return unsubscribe;
  }, [tomorrowDate]);

  const handleSaveIntention = () => {
    if (!intention.trim()) {
      Alert.alert('Error', 'Please enter an intention for tomorrow');
      return;
    }
    
    createOrUpdatePlan(tomorrowDate, intention);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Success', 'Intention saved!');
  };

  const handleAddTimeBlock = () => {
    if (!blockTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the time block');
      return;
    }

    if (!plan) {
      createOrUpdatePlan(tomorrowDate, intention || 'My day plan');
    }

    const newBlock: Omit<TimeBlock, 'id'> = {
      title: blockTitle,
      startTime: blockStartTime,
      endTime: blockEndTime,
      category: blockCategory,
      color: CATEGORY_COLORS[blockCategory],
    };

    addTimeBlock(tomorrowDate, newBlock);

    // Reset form
    setBlockTitle('');
    setBlockStartTime('09:00');
    setBlockEndTime('10:00');
    setBlockCategory('work');
    setShowBlockModal(false);

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!plan) {
      createOrUpdatePlan(tomorrowDate, intention || 'My day plan');
    }

    const newTask: Omit<Task, 'id'> = {
      title: taskTitle,
      completed: false,
      priority: taskPriority,
    };

    console.log('Adding task:', newTask);
    addTask(tomorrowDate, newTask);

    // Reset form
    setTaskTitle('');
    setTaskPriority('medium');
    setShowTaskModal(false);

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    Alert.alert(
      'Delete Time Block',
      'Are you sure you want to delete this time block?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeTimeBlock(tomorrowDate, blockId);
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTask = (taskId: string) => {
    removeTask(tomorrowDate, taskId);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleTask = (taskId: string) => {
    toggleTask(tomorrowDate, taskId);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const tomorrowDateFormatted = new Date(tomorrowDate + 'T00:00:00');

  return (
    <View style={styles.container}>
      <SafeScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Plan Tomorrow</Text>
          <Text style={styles.headerSubtitle}>
            {tomorrowDateFormatted.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Intention Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Intention</Text>
          <Text style={styles.sectionDescription}>
            What's your main focus for tomorrow?
          </Text>
          <TextInput
            style={styles.intentionInput}
            placeholder="e.g., Be present and productive"
            placeholderTextColor="#666"
            value={intention}
            onChangeText={setIntention}
            multiline
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveIntention}>
            <Text style={styles.saveButtonText}>Save Intention</Text>
          </TouchableOpacity>
        </View>

        {/* Time Blocks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏰ Time Blocks</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowBlockModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Block</Text>
            </TouchableOpacity>
          </View>

          {plan?.timeBlocks && plan.timeBlocks.length > 0 ? (
            <View style={styles.blocksList}>
              {plan.timeBlocks
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block) => (
                  <View
                    key={block.id}
                    style={[styles.blockItem, { borderLeftColor: block.color }]}
                  >
                    <View style={styles.blockContent}>
                      <View style={styles.blockHeader}>
                        <Text style={styles.blockIcon}>
                          {CATEGORY_ICONS[block.category]}
                        </Text>
                        <Text style={styles.blockTitle}>{block.title}</Text>
                      </View>
                      <Text style={styles.blockTime}>
                        {block.startTime} - {block.endTime}
                      </Text>
                      <Text style={styles.blockCategory}>{block.category}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBlock(block.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No time blocks yet</Text>
              <Text style={styles.emptySubtext}>
                Add blocks to structure your day
              </Text>
            </View>
          )}
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Tasks</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowTaskModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          {plan?.tasks && plan.tasks.length > 0 ? (
            <View style={styles.tasksList}>
              {plan.tasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <TouchableOpacity
                    onPress={() => handleToggleTask(task.id)}
                    style={styles.taskCheckbox}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        task.completed && styles.checkboxCompleted,
                      ]}
                    >
                      {task.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>

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
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(task.priority) },
                        ]}
                      >
                        <Text style={styles.priorityText}>{task.priority}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task.id)}
                    style={styles.taskDeleteButton}
                  >
                    <Text style={styles.taskDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Add tasks to accomplish tomorrow</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        {plan && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 Tomorrow's Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{plan.timeBlocks.length}</Text>
                <Text style={styles.summaryLabel}>Time Blocks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{plan.tasks.length}</Text>
                <Text style={styles.summaryLabel}>Tasks</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>
                  {plan.tasks.filter(t => t.priority === 'high').length}
                </Text>
                <Text style={styles.summaryLabel}>High Priority</Text>
              </View>
            </View>
          </View>
        )}
      </SafeScrollView>

      {/* Add Time Block Modal */}
      <Modal
        visible={showBlockModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBlockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Time Block</Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Deep Work Session"
              placeholderTextColor="#666"
              value={blockTitle}
              onChangeText={setBlockTitle}
            />

            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  placeholderTextColor="#666"
                  value={blockStartTime}
                  onChangeText={setBlockStartTime}
                />
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor="#666"
                  value={blockEndTime}
                  onChangeText={setBlockEndTime}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>).map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          blockCategory === cat ? CATEGORY_COLORS[cat] : '#222',
                      },
                    ]}
                    onPress={() => setBlockCategory(cat)}
                  >
                    <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: blockCategory === cat ? '#fff' : '#888' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBlockModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddTimeBlock}
              >
                <Text style={styles.confirmButtonText}>Add Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Task</Text>

            <Text style={styles.inputLabel}>Task Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Review project proposal"
              placeholderTextColor="#666"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(['high', 'medium', 'low'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor:
                        taskPriority === priority
                          ? getPriorityColor(priority)
                          : '#222',
                    },
                  ]}
                  onPress={() => setTaskPriority(priority)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      { color: taskPriority === priority ? '#fff' : '#888' },
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTaskModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddTask}
              >
                <Text style={styles.confirmButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    marginBottom: 32,
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
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  intentionInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#222',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  blocksList: {
    gap: 12,
  },
  blockItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockContent: {
    flex: 1,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  blockIcon: {
    fontSize: 20,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  blockTime: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  blockCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskCheckbox: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#667eea',
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
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDeleteButton: {
    padding: 8,
  },
  taskDeleteText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: '30%',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#222',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
