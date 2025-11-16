import { Alert } from 'react-native';
import { AFFIRMATIONS, WHY_QUESTIONS } from '../constants/blocking';
import { MicroChallenge, UnblockChallengeType } from '../types';



function generateMathChallenge(): MicroChallenge {
  Alert.alert('Generating Math Challenge', 'Generating a math challenge');
  const operations = [
    { symbol: '+', fn: (a: number, b: number) => a + b },
    { symbol: '-', fn: (a: number, b: number) => a - b },
    { symbol: '×', fn: (a: number, b: number) => a * b },
  ];

  const difficulty = Math.random();
  
  let num1: number, num2: number, operation;

  if (difficulty < 0.4) {
    // Easy
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    operation = operations[Math.floor(Math.random() * 2)]; // + or -
  } else if (difficulty < 0.7) {
    // Medium
    num1 = Math.floor(Math.random() * 50) + 10;
    num2 = Math.floor(Math.random() * 50) + 10;
    operation = operations[Math.floor(Math.random() * operations.length)];
  } else {
    // Hard
    num1 = Math.floor(Math.random() * 100) + 20;
    num2 = Math.floor(Math.random() * 50) + 10;
    operation = operations[2]; // multiplication
  }

  const correctAnswer = operation.fn(num1, num2);
  const wrongAnswer1 = correctAnswer + Math.floor(Math.random() * 10) + 1;
  const wrongAnswer2 = correctAnswer - Math.floor(Math.random() * 10) - 1;
  const wrongAnswer3 = correctAnswer + Math.floor(Math.random() * 20) - 10;

  const options = [
    correctAnswer.toString(),
    wrongAnswer1.toString(),
    wrongAnswer2.toString(),
    wrongAnswer3.toString(),
  ].sort(() => Math.random() - 0.5);

  return {
    id: `math_${Date.now()}`,
    type: 'math',
    question: `${num1} ${operation.symbol} ${num2} = ?`,
    answer: correctAnswer,
    options,
    instruction: 'Solve this problem to continue',
  };
} // Funktion zum Generieren einer mathematischen Herausforderung

function generateBreathingChallenge(): MicroChallenge {
  Alert.alert('Generating Breathing Challenge', 'Generating a breathing challenge');
  const durations = [10, 15, 20];
  const duration = durations[Math.floor(Math.random() * durations.length)];

  return {
    id: `breathing_${Date.now()}`,
    type: 'breathing',
    duration,
    instruction: `Take ${duration} seconds to breathe deeply`,
  };
}   // Funktion zum Generieren einer Atemübung-Herausforderung

function generateAffirmationChallenge(): MicroChallenge {
  Alert.alert('Generating Affirmation Challenge', 'Generating an affirmation challenge');
  const affirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

  return {
    id: `affirmation_${Date.now()}`,
    type: 'affirmation',
    question: affirmation,
    instruction: 'Read this affirmation out loud 3 times',
  };
} // Funktion zum Generieren einer Affirmations-Herausforderung

function generateWhyChallenge(): MicroChallenge {
  Alert.alert('Generating Why Challenge', 'Generating a why challenge');
  const question = WHY_QUESTIONS[Math.floor(Math.random() * WHY_QUESTIONS.length)];

  return {
    id: `why_${Date.now()}`,
    type: 'why',
    question,
    instruction: 'Answer honestly before continuing',
  };
} // Funktion zum Generieren einer Warum-Herausforderung

function generatePushupsChallenge(): MicroChallenge {
  Alert.alert('Generating Push-ups Challenge', 'Generating a push-ups challenge');
  const counts = [5, 10, 15];
  const count = counts[Math.floor(Math.random() * counts.length)];

  return {
    id: `pushups_${Date.now()}`,
    type: 'pushups',
    question: `${count} push-ups`,
    instruction: `Do ${count} push-ups to unlock`,
  };
} // Funktion zum Generieren einer Push-up Herausforderung

export function generateRandomChallenge(): MicroChallenge {
  Alert.alert('Generating Challenge', 'Generating a random challenge for the blocked app');
  const challengeTypes: UnblockChallengeType[] = ['math', 'breathing', 'affirmation', 'why', 'pushups'];
  const weights = [0.4, 0.2, 0.2, 0.1, 0.1]; // Math is most common
  
  const random = Math.random();
  let cumulative = 0;
  let selectedType: UnblockChallengeType = 'math';

  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      selectedType = challengeTypes[i];
      break;
    }
  }

  switch (selectedType) {
    case 'math':
      return generateMathChallenge();
    case 'breathing':
      return generateBreathingChallenge();
    case 'affirmation':
      return generateAffirmationChallenge();
    case 'why':
      return generateWhyChallenge();
    case 'pushups':
      return generatePushupsChallenge();
    default:
      return generateMathChallenge();
  }
} // Funktion zum Generieren einer zufälligen Herausforderung

export function validateChallengeAnswer(
  challenge: MicroChallenge,
  userAnswer: string | number
): boolean {
  switch (challenge.type) {
    case 'math':
      return Number(userAnswer) === Number(challenge.answer);
    case 'breathing':
    case 'affirmation':
    case 'pushups':
      // These are time/action-based, automatically pass
      return true;
    case 'why':
      // Must provide some answer (at least 10 characters)
      return typeof userAnswer === 'string' && userAnswer.trim().length >= 10;
    default:
      return false;
  }
} // Funktion zum Validieren der Antwort einer Herausforderung
