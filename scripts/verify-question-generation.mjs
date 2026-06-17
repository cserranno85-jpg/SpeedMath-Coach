import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(repoRoot, '.codex-logs', 'verify-question-generation');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const transpileSource = async (relativeSource, outFile, rewriteImports = (source) => source) => {
  const sourcePath = path.join(repoRoot, relativeSource);
  const source = rewriteImports(await fs.readFile(sourcePath, 'utf8'));
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });

  const errors = output.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error) ?? [];
  assert(errors.length === 0, `TypeScript transpile failed for ${relativeSource}`);
  await fs.writeFile(path.join(outDir, outFile), output.outputText);
};

const withRandomSequence = (values, fn) => {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
};

await fs.mkdir(outDir, { recursive: true });
await transpileSource('src/types.ts', 'types.js');
await transpileSource('src/utils/mathGenerator.ts', 'mathGenerator.js', (source) =>
  source.replace(/from ['"]\.\.\/types['"]/g, "from './types.js'")
);

const cacheBust = `?t=${Date.now()}`;
const types = await import(`${pathToFileURL(path.join(outDir, 'types.js')).href}${cacheBust}`);
const math = await import(`${pathToFileURL(path.join(outDir, 'mathGenerator.js')).href}${cacheBust}`);

const { Difficulty, Operation } = types;
const { generateProblem, getNextAdaptiveDifficulty } = math;

assert(typeof generateProblem === 'function', 'generateProblem export is missing');
assert(typeof getNextAdaptiveDifficulty === 'function', 'getNextAdaptiveDifficulty export is missing');

const onlyOperation = (selectedOperation) =>
  Object.fromEntries(Object.values(Operation).map((operation) => [operation, operation === selectedOperation]));

const expectedAnswer = (problem) => {
  switch (problem.operation) {
    case Operation.ADDITION:
      return problem.num1 + problem.num2;
    case Operation.SUBTRACTION:
      return problem.num1 - problem.num2;
    case Operation.MULTIPLICATION:
      return problem.num1 * problem.num2;
    case Operation.DIVISION:
      return problem.num1 / problem.num2;
    default:
      throw new Error(`Unknown operation ${problem.operation}`);
  }
};

const assertFiniteInteger = (value, label, problem) => {
  assert(Number.isFinite(value), `${label} must be finite: ${JSON.stringify(problem)}`);
  assert(Number.isInteger(value), `${label} must be an integer: ${JSON.stringify(problem)}`);
};

const assertValidProblem = (problem, selectedOperation) => {
  assert(problem && typeof problem === 'object', `Problem must be an object: ${problem}`);
  assert(problem.operation === selectedOperation, `Generated wrong operation: ${JSON.stringify(problem)}`);
  assertFiniteInteger(problem.num1, 'num1', problem);
  assertFiniteInteger(problem.num2, 'num2', problem);
  assertFiniteInteger(problem.correctAnswer, 'correctAnswer', problem);
  assert(problem.num2 !== 0 || problem.operation !== Operation.DIVISION, `Division by zero: ${JSON.stringify(problem)}`);
  assert(problem.correctAnswer === expectedAnswer(problem), `Incorrect answer: ${JSON.stringify(problem)}`);
  if (problem.operation === Operation.DIVISION) {
    assert(problem.num1 % problem.num2 === 0, `Division must be exact: ${JSON.stringify(problem)}`);
  }
};

const assertBeginnerProblem = (problem, operation) => {
  assertValidProblem(problem, operation);
  switch (operation) {
    case Operation.ADDITION:
      assert(problem.correctAnswer >= 0 && problem.correctAnswer <= 9, `Beginner addition answer out of range: ${JSON.stringify(problem)}`);
      break;
    case Operation.SUBTRACTION:
      assert(problem.correctAnswer >= 0 && problem.correctAnswer <= 9, `Beginner subtraction answer out of range: ${JSON.stringify(problem)}`);
      break;
    case Operation.MULTIPLICATION:
      assert(problem.num1 >= 0 && problem.num1 <= 5, `Beginner multiplication factor too hard: ${JSON.stringify(problem)}`);
      assert(problem.num2 >= 0 && problem.num2 <= 5, `Beginner multiplication factor too hard: ${JSON.stringify(problem)}`);
      assert(problem.correctAnswer <= 25, `Beginner multiplication answer too large: ${JSON.stringify(problem)}`);
      break;
    case Operation.DIVISION:
      assert(problem.num2 >= 1 && problem.num2 <= 5, `Beginner division divisor too hard: ${JSON.stringify(problem)}`);
      assert(problem.correctAnswer >= 0 && problem.correctAnswer <= 5, `Beginner division quotient too hard: ${JSON.stringify(problem)}`);
      assert(problem.num1 <= 25, `Beginner division dividend too large: ${JSON.stringify(problem)}`);
      break;
  }
};

const deterministicAddition = withRandomSequence([0, 0, 0], () =>
  generateProblem(Difficulty.BEGINNER, onlyOperation(Operation.ADDITION))
);
assert(deterministicAddition.correctAnswer === 0, `Beginner addition should support 0 answers: ${JSON.stringify(deterministicAddition)}`);

const deterministicSubtraction = withRandomSequence([0, 0, 0], () =>
  generateProblem(Difficulty.BEGINNER, onlyOperation(Operation.SUBTRACTION))
);
assert(deterministicSubtraction.correctAnswer === 0, `Beginner subtraction should support 0 answers: ${JSON.stringify(deterministicSubtraction)}`);

for (const operation of Object.values(Operation)) {
  for (const difficulty of Object.values(Difficulty)) {
    for (let i = 0; i < 1200; i += 1) {
      const problem = generateProblem(difficulty, onlyOperation(operation));
      assertValidProblem(problem, operation);
      if (difficulty === Difficulty.BEGINNER) {
        assertBeginnerProblem(problem, operation);
      }
    }
  }
}

const stableDifficulty = getNextAdaptiveDifficulty({
  adaptiveDifficulty: false,
  currentDifficulty: Difficulty.BEGINNER,
  streak: 99,
  timeSpentSeconds: 0.5,
});
assert(stableDifficulty.nextDifficulty === Difficulty.BEGINNER, 'Non-progressive mode must keep difficulty stable');
assert(stableDifficulty.shouldResetStreak === false, 'Non-progressive mode must not reset streak for a hidden ramp');

let ramp = { nextDifficulty: Difficulty.BEGINNER, shouldResetStreak: false };
for (let i = 0; i < 12; i += 1) {
  ramp = getNextAdaptiveDifficulty({
    adaptiveDifficulty: true,
    currentDifficulty: ramp.nextDifficulty,
    streak: 3,
    timeSpentSeconds: 1.5,
  });
}
assert(ramp.nextDifficulty === Difficulty.MASTER, `Adaptive ramp should be bounded at MASTER: ${JSON.stringify(ramp)}`);

console.log('Question generation verification passed.');
