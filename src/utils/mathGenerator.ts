import { Difficulty, Operation, MathProblem } from '../types';

export const generateProblem = (
  difficulty: Difficulty,
  allowedOperations: Record<Operation, boolean>
): MathProblem => {
  // Determine available operations
  const ops = Object.keys(allowedOperations).filter(
    (op) => allowedOperations[op as Operation]
  ) as Operation[];

  // Fallback to addition if none selected
  const operation = ops.length > 0
    ? ops[Math.floor(Math.random() * ops.length)]
    : Operation.ADDITION;

  let num1 = 0;
  let num2 = 0;
  let correctAnswer = 0;

  let range = [1, 5];
  if (difficulty === Difficulty.BEGINNER) range = [1, 5];
  else if (difficulty === Difficulty.NOVICE) range = [2, 9];
  else if (difficulty === Difficulty.EASY) range = [5, 15];
  else if (difficulty === Difficulty.MEDIUM) range = [10, 30];
  else if (difficulty === Difficulty.HARD) range = [20, 100];
  else if (difficulty === Difficulty.EXPERT) range = [50, 200];
  else if (difficulty === Difficulty.MASTER) range = [100, 500];

  const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  if (operation === Operation.ADDITION) {
    if (difficulty === Difficulty.BEGINNER) {
       num1 = getRandomInt(1, 8);
       num2 = getRandomInt(1, 9 - num1); // Ensure answer <= 9
    } else {
       num1 = getRandomInt(range[0], range[1]);
       num2 = getRandomInt(range[0], range[1]);
    }
    correctAnswer = num1 + num2;
  } else if (operation === Operation.SUBTRACTION) {
    if (difficulty === Difficulty.BEGINNER) {
       num1 = getRandomInt(2, 9);
       num2 = getRandomInt(1, num1 - 1);
    } else {
       num1 = getRandomInt(range[0] * 2, range[1] * 2);
       num2 = getRandomInt(range[0], num1 - 1); // Ensure positive result for simplicity
    }
    correctAnswer = num1 - num2;
  } else if (operation === Operation.MULTIPLICATION) {
    // scale down range for multiplication so it's not too crazy
    const multRange =
      difficulty === Difficulty.BEGINNER ? [1, 3] :
      difficulty === Difficulty.NOVICE ? [2, 4] :
      difficulty === Difficulty.EASY ? [2, 6] :
      difficulty === Difficulty.MEDIUM ? [3, 9] :
      difficulty === Difficulty.HARD ? [4, 15] : 
      difficulty === Difficulty.EXPERT ? [10, 30] : [20, 50];
    
    if (difficulty === Difficulty.BEGINNER) {
       num1 = getRandomInt(1, 3);
       num2 = getRandomInt(1, Math.floor(9 / num1)); // answer <= 9
    } else {
       num1 = getRandomInt(multRange[0], multRange[1]);
       num2 = getRandomInt(multRange[0], multRange[1]);
    }
    correctAnswer = num1 * num2;
  } else if (operation === Operation.DIVISION) {
     const divRange =
      difficulty === Difficulty.BEGINNER ? [1, 3] :
      difficulty === Difficulty.NOVICE ? [2, 4] :
      difficulty === Difficulty.EASY ? [2, 6] :
      difficulty === Difficulty.MEDIUM ? [3, 9] :
      difficulty === Difficulty.HARD ? [4, 15] :
      difficulty === Difficulty.EXPERT ? [10, 30] : [20, 50];
      
      if (difficulty === Difficulty.BEGINNER) {
         correctAnswer = getRandomInt(1, 3);
         num2 = getRandomInt(1, Math.floor(9 / correctAnswer)); // Ensures num1 <= 9
      } else {
         num2 = getRandomInt(divRange[0], divRange[1]);
         correctAnswer = getRandomInt(divRange[0], divRange[1]);
      }
      num1 = num2 * correctAnswer; // Ensure clean division
  }

  return {
    num1,
    num2,
    operation,
    correctAnswer
  };
};

export const getOperationSymbol = (operation: Operation) => {
  switch (operation) {
    case Operation.ADDITION: return '+';
    case Operation.SUBTRACTION: return '-';
    case Operation.MULTIPLICATION: return '×';
    case Operation.DIVISION: return '÷';
  }
};
