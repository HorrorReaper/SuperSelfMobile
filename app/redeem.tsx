import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../stores/userStore';
import { canRedeem } from '../lib/xpEconomy';
import { REDEMPTION_CONFIG } from '../constants/config';
import { RedemptionTimer } from '../components/RedemptionTimer';
import { AppState } from 'react-native';
import { useAppBlockingStore } from '../stores/appBlockingStores';

export default function RedeemScreen() {
  const router = useRouter();
  const { profile, redeemXP, getTodayRedeemed } = useUserStore();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionMinutes, setRedemptionMinutes] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const deductXP = (amount: number, minutes: number) => {
    redeemXP(amount, minutes);
  };
  const {
  currentSession,
  isBlocking,
  startBlockingSession,
  endBlockingSession,
  getActiveBlockedApps,
  initializeBlocking,
} = useAppBlockingStore();

useEffect(() => {
  initializeBlocking();
}, []);

  const todayRedeemed = getTodayRedeemed();

const handleRedeem = async (minutes: number, xpCost: number) => {
  if (profile.currentXP < xpCost) {
    Alert.alert('Insufficient XP', 'You don\'t have enough XP to redeem this');
    return;
  }

  const blockedApps = getActiveBlockedApps();
  
  Alert.alert(
    'Start Redemption?',
    `This will:\n• Deduct ${xpCost} XP\n• Give you ${minutes} minutes\n• Block ${blockedApps.length} apps`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          deductXP(xpCost, minutes);
          await startBlockingSession(minutes, xpCost);
          setTimeRemaining(minutes * 60);
          setIsActive(true);
        },
      },
    ]
  );
}; // Diese Funktion behandelt die Einlöse-Logik und zeigt eine Bestätigungsaufforderung an.

  if (isRedeeming) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enjoy your break! 🎉</Text>
        <RedemptionTimer
          durationMinutes={redemptionMinutes}
          onComplete={() => {
            setIsRedeeming(false);
            router.back();
          }}
        />
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => {
            setIsRedeeming(false);
            router.back();
          }}
        >
          <Text style={styles.endButtonText}>End Early</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEnd = async () => {
  setIsActive(false);
  setTimeRemaining(0);
  await endBlockingSession();
  router.back();
};

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Redeem XP</Text>
      <Text style={styles.subtitle}>Current XP: {profile.currentXP}</Text>
      <Text style={styles.subtitle}>
        Redeemed today: {todayRedeemed}/{REDEMPTION_CONFIG.MAX_MINUTES_PER_DAY} min
      </Text>
      {isBlocking && currentSession && (
  <View style={styles.blockingBanner}>
    <Text style={styles.blockingTitle}>🚫 Apps Currently Blocked</Text>
    <Text style={styles.blockingText}>
      {getActiveBlockedApps().map(app => app.appName).join(', ')}
    </Text>
    {currentSession.violations > 0 && (
      <Text style={styles.violationText}>
        ⚠️ {currentSession.violations} violation{currentSession.violations > 1 ? 's' : ''} detected
      </Text>
    )}
  </View>
)}

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleRedeem(10, 30)}
        >
          <Text style={styles.optionTime}>10 min</Text>
          <Text style={styles.optionCost}>30 XP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleRedeem(20, 60)}
        >
          <Text style={styles.optionTime}>20 min</Text>
          <Text style={styles.optionCost}>60 XP</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.settingsLink}
  onPress={() => router.push('/blocking-settings')}
>
  <Text style={styles.settingsLinkText}>⚙️ Configure Blocked Apps</Text>
</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  options: {
    marginTop: 40,
  },
  optionCard: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  optionTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionCost: {
    fontSize: 18,
    color: '#9C27B0',
    marginTop: 8,
  },
  endButton: {
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#888',
    alignItems: 'center',
  },
  endButtonText: {
    color: '#888',
    fontSize: 16,
  },
  blockingBanner: {
  backgroundColor: '#2a1a1a',
  padding: 16,
  borderRadius: 12,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#FF5252',
},
blockingTitle: {
  color: '#FF5252',
  fontSize: 14,
  fontWeight: '600',
  marginBottom: 8,
},
blockingText: {
  color: '#aaa',
  fontSize: 13,
  lineHeight: 20,
},
violationText: {
  color: '#FF9800',
  fontSize: 13,
  marginTop: 8,
  fontWeight: '500',
},
settingsLink: {
  padding: 16,
  alignItems: 'center',
  marginBottom: 20,
},
settingsLinkText: {
  color: '#4CAF50',
  fontSize: 15,
  fontWeight: '500',
},
});
