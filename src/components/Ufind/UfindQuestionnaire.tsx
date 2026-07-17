import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

type Answer = string;

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    question: 'Which part of your body appears widest?',
    options: ['Shoulders', 'Bust', 'Hips', 'They appear balanced']
  },
  {
    id: 2,
    question: 'How would you describe your waist?',
    options: ['Very defined', 'Somewhat defined', 'Not very defined', 'Barely visible']
  },
  {
    id: 3,
    question: 'When you gain weight, where does it show first?',
    options: ['Upper body & bust', 'Midsection / stomach', 'Hips & thighs', 'Evenly everywhere']
  },
  {
    id: 4,
    question: 'Compare your shoulders to your hips:',
    options: ['Shoulders are broader', 'Hips are broader', 'They are almost equal', 'Hard to tell']
  },
  {
    id: 5,
    question: 'Your overall body frame looks more:',
    options: ['Curvy', 'Athletic', 'Soft & rounded', 'Straight']
  },
  {
    id: 6,
    question: 'How do most tops fit you?',
    options: ['Tight at bust', 'Tight at waist', 'Tight at hips', 'Fits evenly but looks boxy']
  }
];

interface UfindQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (bodyShape: string) => void;
}

export function UfindQuestionnaire({ isOpen, onClose, onComplete }: UfindQuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setDirection('forward');
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 200);
    } else {
      // Calculate body shape based on answers (simplified logic)
      const bodyShape = calculateBodyShape(newAnswers);
      setTimeout(() => {
        onComplete(bodyShape);
      }, 300);
    }
  };

  const calculateBodyShape = (userAnswers: Answer[]): string => {
    // Simplified body shape calculation logic
    const [q1, q2, q3, q4, q5] = userAnswers;
    
    if (q2 === 'Very defined' && (q4 === 'They are almost equal' || q5 === 'Curvy')) {
      return 'Hourglass';
    } else if (q1 === 'Hips' || q4 === 'Hips are broader') {
      return 'Pear';
    } else if (q3 === 'Midsection / stomach' || q2 === 'Not very defined') {
      return 'Apple';
    } else if (q4 === 'Shoulders are broader') {
      return 'Inverted Triangle';
    } else if (q5 === 'Athletic') {
      return 'Athletic';
    } else {
      return 'Rectangle';
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setDirection('backward');
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
          />

          {/* Questionnaire Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-neutral-50 to-stone-100 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between">
                <button
                  onClick={currentQuestion > 0 ? goBack : onClose}
                  className="text-xs tracking-widest hover:opacity-60 transition-opacity uppercase"
                >
                  {currentQuestion > 0 ? '← Back' : '✕ Close'}
                </button>
                <div className="text-xs tracking-widest text-black/40">
                  {currentQuestion + 1} / {questions.length}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-black/5">
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question Content */}
              <div className="p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: direction === 'forward' ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction === 'forward' ? -50 : 50 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <h2 
                      className="mb-12 text-center"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', lineHeight: '1.3' }}
                    >
                      {questions[currentQuestion].question}
                    </h2>

                    <div className="space-y-4">
                      {questions[currentQuestion].options.map((option, index) => (
                        <motion.button
                          key={option}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(option)}
                          className="w-full p-5 bg-white hover:bg-neutral-50 rounded-2xl text-left transition-all shadow-sm hover:shadow-md"
                        >
                          <span className="tracking-wide">{option}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
