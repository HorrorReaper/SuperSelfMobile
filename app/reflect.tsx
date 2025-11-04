import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../stores/taskStore';
import { useUserStore } from '../stores/userStore';

export default function ReflectionScreen() {
  const router = useRouter();
  const { getTodayPlan, submitReflection } = useTaskStore();
  const { profile, incrementStreak } = useUserStore();
  const [reflectionText, setReflectionText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);

  const todayPlan = getTodayPlan(); // Holt den heutigen Plan aus dem Store

  useEffect(() => {
    if (todayPlan.reflectionText) {
      setReflectionText(todayPlan.reflectionText);
    } // Vorbefüllung, wenn bereits eine Reflexion existiert
  }, []);

  const moods = [
    { emoji: '😁', label: 'Great' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Tough' },
    { emoji: '😫', label: 'Struggle' },
  ]; 

  const energyLevels = [1, 2, 3, 4, 5];

  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('Missing Info', 'Please select your mood for today');
      return;
    }

    if (selectedEnergy === null) {
      Alert.alert('Missing Info', 'Please rate your energy level');
      return;
    }

    const fullReflection = `Mood: ${selectedMood} Energy: ${selectedEnergy}/5 Notes: ${reflectionText || 'No additional notes'}`.trim();

    await submitReflection(fullReflection); // Speichert die Reflexion im Store
    
    if (!todayPlan.reflectionCompleted) {
      await incrementStreak();
    }

    Alert.alert(
      '✅ Reflection Saved!',
      `Great work today! You're on day ${profile.currentStreak + 1} of your streak.`,
      [
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const completedTasks = todayPlan.tasks.filter((t) => t.completed).length; // Anzahl der abgeschlossenen Aufgaben
  const totalTasks = todayPlan.tasks.length; // Gesamtanzahl der Aufgaben
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0; // Prozentsatz der abgeschlossenen Aufgaben

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Evening Reflection</Text>
        <Text style={styles.subheader}>
          Take a moment to reflect on your day and lock in your progress
        </Text>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(completionRate)}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{todayPlan.xpEarned || 0}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
          </View>
        </View>

        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How did today feel?</Text>
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[
                  styles.moodCard,
                  selectedMood === mood.label && styles.moodCardSelected,
                ]}
                onPress={() => setSelectedMood(mood.label)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Energy Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy level</Text>
          <View style={styles.energyGrid}>
            {energyLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.energyButton,
                  selectedEnergy === level && styles.energyButtonSelected,
                ]}
                onPress={() => setSelectedEnergy(level)}
              >
                <Text
                  style={[
                    styles.energyText,
                    selectedEnergy === level && styles.energyTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reflection Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reflection (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            What went well? What could you improve tomorrow?
          </Text>
          <TextInput
            style={styles.reflectionInput}
            placeholder="Share your thoughts..."
            placeholderTextColor="#666"
            value={reflectionText}
            onChangeText={setReflectionText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Prompts */}
        <View style={styles.promptsSection}>
          <Text style={styles.promptsTitle}>💭 Reflection Prompts</Text>
          <Text style={styles.promptText}>• What am I proud of today?</Text>
          <Text style={styles.promptText}>• What challenged me?</Text>
          <Text style={styles.promptText}>• What will I do differently tomorrow?</Text>
          <Text style={styles.promptText}>• What am I grateful for?</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            todayPlan.reflectionCompleted && styles.submitButtonCompleted,
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {todayPlan.reflectionCompleted ? '✅ Update Reflection' : '🎯 Complete Day'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  summaryCard: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a2e1a',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    color: '#fff',
    fontSize: 12,
  },
  energyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  energyButton: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  energyButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a2e1a',
  },
  energyText: {
    color: '#888',
    fontSize: 20,
    fontWeight: '600',
  },
  energyTextSelected: {
    color: '#4CAF50',
  },
  reflectionInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#333',
  },
  promptsSection: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  promptsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  promptText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonCompleted: {
    backgroundColor: '#2e7d32',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
