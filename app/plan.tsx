import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import SafeScrollView from './components/SafeScrollView';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../stores/taskStore';
import { TaskCard } from '../components/TaskCard';

export default function PlanScreen() {
  const router = useRouter();
  const { getTodayPlan, addTask, toggleTask } = useTaskStore();
  const [taskInput, setTaskInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const todayPlan = getTodayPlan();

  const handleAddTask = async () => {
    if (!taskInput.trim()) {
      Alert.alert('Empty Task', 'Please enter a task description');
      return;
    }

    await addTask(taskInput.trim()); // Fügt die neue Aufgabe dem Store hinzu
    setTaskInput('');
    setIsAdding(false);
  }; // Fügt eine neue Aufgabe hinzu

  const suggestedTasks = [
    '🏃‍♂️ 30 min workout',
    '📖 Read 20 pages',
    '💧 Drink 2L water',
    '🧘‍♀️ 10 min meditation',
    '📝 Journal for 10 min',
    '🥗 Eat healthy meals',
    '😴 Sleep before 11pm',
    '📱 No phone first hour',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Plan Your Day</Text>
        <Text style={styles.subheader}>
          What are the 3-5 most important things you want to accomplish today?
        </Text>

        {/* Current Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tasks ({todayPlan.tasks.length})</Text>
          {todayPlan.tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>
                Add tasks below to start earning XP
              </Text>
            </View>
          ) : (
            todayPlan.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id, () => {})}
              />
            ))
          )}
        </View>

        {/* Add Task Section */}
        {isAdding ? (
          <View style={styles.addSection}>
            <TextInput
              style={styles.input}
              placeholder="What do you want to accomplish?"
              placeholderTextColor="#666"
              value={taskInput}
              onChangeText={setTaskInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddTask}
            />
            <View style={styles.addActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setTaskInput('');
                  setIsAdding(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddTask}>
                <Text style={styles.saveButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAdding(true)}
          >
            <Text style={styles.addButtonText}>+ Add Custom Task</Text>
          </TouchableOpacity>
        )}

        {/* Suggested Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <Text style={styles.sectionSubtitle}>
            Tap to add common self-improvement tasks
          </Text>
          <View style={styles.suggestedGrid}>
            {suggestedTasks.map((task, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedCard}
                onPress={() => addTask(task)}
              >
                <Text style={styles.suggestedText}>{task}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Planning Tips</Text>
          <Text style={styles.tipText}>• Keep it realistic (3-5 tasks max)</Text>
          <Text style={styles.tipText}>• Be specific and actionable</Text>
          <Text style={styles.tipText}>• Focus on high-impact activities</Text>
          <Text style={styles.tipText}>• Schedule time for each task</Text>
        </View>

        <View style={{ height: 40 }} />
      </SafeScrollView>
    </KeyboardAvoidingView>
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
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#1e1e1e',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
  },
  addSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  addActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestedCard: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  suggestedText: {
    color: '#fff',
    fontSize: 14,
  },
  tipsSection: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});
