import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Audience } from '../../utils/taxonomy';

type Answer = string;

interface Question {
  id: number;
  question: string;
  options: string[];
}

const womenQuestions: Question[] = [
  {
    id: 1,
    question: 'Which part of your body appears widest?',
    options: ['Shoulders', 'Bust', 'Hips', 'They appear balanced'],
  },
  {
    id: 2,
    question: 'How would you describe your waist?',
    options: ['Very defined', 'Somewhat defined', 'Not very defined', 'Barely visible'],
  },
  {
    id: 3,
    question: 'When you gain weight, where does it show first?',
    options: ['Upper body & bust', 'Midsection / stomach', 'Hips & thighs', 'Evenly everywhere'],
  },
  {
    id: 4,
    question: 'Compare your shoulders to your hips:',
    options: ['Shoulders are broader', 'Hips are broader', 'They are almost equal', 'Hard to tell'],
  },
  {
    id: 5,
    question: 'Your overall body frame looks more:',
    options: ['Curvy', 'Athletic', 'Soft & rounded', 'Straight'],
  },
  {
    id: 6,
    question: 'How do most tops fit you?',
    options: ['Tight at bust', 'Tight at waist', 'Tight at hips', 'Fits evenly but looks boxy'],
  },
];

const menQuestions: Question[] = [
  {
    id: 1,
    question: 'Which area appears broadest on you?',
    options: ['Shoulders', 'Chest', 'Midsection', 'They appear balanced'],
  },
  {
    id: 2,
    question: 'How would you describe your waist relative to your chest?',
    options: ['Much narrower', 'Slightly narrower', 'About the same', 'Wider than chest'],
  },
  {
    id: 3,
    question: 'Where do you notice weight first?',
    options: ['Upper body', 'Stomach', 'Hips / seat', 'Evenly everywhere'],
  },
  {
    id: 4,
    question: 'Compare your shoulders to your hips:',
    options: ['Shoulders are broader', 'Hips are broader', 'They are almost equal', 'Hard to tell'],
  },
  {
    id: 5,
    question: 'Your build looks more:',
    options: ['Athletic / muscular', 'Lean', 'Soft / rounded', 'Straight / slim'],
  },
  {
    id: 6,
    question: 'How do most jackets fit you?',
    options: ['Tight in shoulders', 'Tight in midsection', 'Loose everywhere', 'Balanced overall'],
  },
];

interface UfindQuestionnaireProps {
  isOpen: boolean;
  audience: Audience;
  onClose: () => void;
  onComplete: (bodyShape: string, audience: Audience) => void;
}

export function UfindQuestionnaire({
  isOpen,
  audience,
  onClose,
  onComplete,
}: UfindQuestionnaireProps) {
  const questions = audience === 'men' ? menQuestions : womenQuestions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const calculateWomenShape = (userAnswers: Answer[]): string => {
    const [q1, q2, q3, q4, q5] = userAnswers;
    if (q2 === 'Very defined' && (q4 === 'They are almost equal' || q5 === 'Curvy')) return 'Hourglass';
    if (q1 === 'Hips' || q4 === 'Hips are broader') return 'Pear';
    if (q3 === 'Midsection / stomach' || q2 === 'Not very defined') return 'Apple';
    if (q4 === 'Shoulders are broader') return 'Inverted Triangle';
    if (q5 === 'Athletic') return 'Athletic';
    return 'Rectangle';
  };

  const calculateMenShape = (userAnswers: Answer[]): string => {
    const [q1, q2, q3, q4, q5] = userAnswers;
    if (q5 === 'Athletic / muscular' && q4 === 'Shoulders are broader') return 'Athletic';
    if (q4 === 'Shoulders are broader' && q2 !== 'Wider than chest') return 'Inverted Triangle';
    if (q4 === 'Hips are broader' || q3 === 'Hips / seat') return 'Triangle';
    if (q3 === 'Stomach' || q2 === 'Wider than chest') return 'Oval';
    if (q1 === 'They appear balanced' && q2 === 'Much narrower') return 'Trapezoid';
    return 'Rectangle';
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 180);
      return;
    }

    const bodyShape =
      audience === 'men' ? calculateMenShape(newAnswers) : calculateWomenShape(newAnswers);
    setTimeout(() => onComplete(bodyShape, audience), 250);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-xl p-6 md:p-8"
            >
              <div className="mb-6">
                <p className="text-xs tracking-[0.2em] uppercase text-black/50 mb-2">
                  {audience} · question {currentQuestion + 1}/{questions.length}
                </p>
                <div className="h-1 bg-black/10">
                  <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl mb-6">{question.question}</h2>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left border border-black/15 px-4 py-3 text-sm hover:border-black"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {currentQuestion > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestion((q) => q - 1)}
                  className="mt-6 text-xs tracking-widest uppercase text-black/50"
                >
                  Back
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
