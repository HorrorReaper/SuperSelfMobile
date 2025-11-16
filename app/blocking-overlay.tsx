import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppBlockingStore } from '../stores/appBlockingStores';
import { ChallengeAttempt, MicroChallenge } from '../types';
import ChallengeModal from '../components/ChallengeModal';

export default function BlockingOverlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const {
    unlockApp,
    recordViolation,
    recordSuccess,
    recordChallengeAttempt,
  } = useAppBlockingStore();

  const [challenge] = useState<MicroChallenge>(
    params.challenge ? JSON.parse(params.challenge as string) : null
  ); //Dieser Zustand speichert die Herausforderung, die dem Benutzer präsentiert wird.
  const appPackage = params.packageName as string;
  const appName = params.appName as string;
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Prevent back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []); // Effekt zum Verhindern der Zurück-Taste

  const handleSuccess = async () => {
    const timeTaken = (Date.now() - startTime) / 1000;

    const attempt: ChallengeAttempt = {
      challengeId: challenge.id,
      appPackage,
      appName,
      timestamp: new Date().toISOString(),
      success: true,
      timeToComplete: timeTaken,
    };

    await recordChallengeAttempt(attempt);
    await recordSuccess();
    await unlockApp(appPackage, challenge.id, 5); // 5 min unlock

    router.back();
  }; // Erfolgshandler

  const handleFail = async () => {
    const timeTaken = (Date.now() - startTime) / 1000;

    const attempt: ChallengeAttempt = {
      challengeId: challenge.id,
      appPackage,
      appName,
      timestamp: new Date().toISOString(),
      success: false,
      timeToComplete: timeTaken,
    };

    await recordChallengeAttempt(attempt);
    await recordViolation();

    router.back();
  }; // Fehlerhandler

  const handleSkip = async () => {
    await recordViolation();
    router.back();
  }; // Überspringen-Handler

  if (!challenge) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ChallengeModal
        visible={true}
        challenge={challenge}
        appName={appName}
        onSuccess={handleSuccess}
        onFail={handleFail}
        onSkip={handleSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
