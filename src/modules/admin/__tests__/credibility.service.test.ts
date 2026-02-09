/**
 * Unit tests for credibility engine: grade mapping, clamp, labels.
 * Run: npx tsx src/modules/admin/__tests__/credibility.service.test.ts
 */
import { clampCredibility, gradeToDelta, gradeToLabel } from '../credibility.service';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// --- gradeToDelta: 90-100 -> +10, 75-89 -> +5, 60-74 -> +2, 40-59 -> -5, 0-39 -> -20
assert(gradeToDelta(100) === 10, '100 -> +10');
assert(gradeToDelta(95) === 10, '95 -> +10');
assert(gradeToDelta(90) === 10, '90 -> +10');
assert(gradeToDelta(89) === 5, '89 -> +5');
assert(gradeToDelta(75) === 5, '75 -> +5');
assert(gradeToDelta(74) === 2, '74 -> +2');
assert(gradeToDelta(60) === 2, '60 -> +2');
assert(gradeToDelta(59) === -5, '59 -> -5');
assert(gradeToDelta(40) === -5, '40 -> -5');
assert(gradeToDelta(39) === -20, '39 -> -20');
assert(gradeToDelta(0) === -20, '0 -> -20');

// --- gradeToLabel
assert(gradeToLabel(100) === 'EXCELLENT', '100 -> EXCELLENT');
assert(gradeToLabel(90) === 'EXCELLENT', '90 -> EXCELLENT');
assert(gradeToLabel(85) === 'GOOD', '85 -> GOOD');
assert(gradeToLabel(75) === 'GOOD', '75 -> GOOD');
assert(gradeToLabel(70) === 'AVERAGE', '70 -> AVERAGE');
assert(gradeToLabel(60) === 'AVERAGE', '60 -> AVERAGE');
assert(gradeToLabel(50) === 'WEAK', '50 -> WEAK');
assert(gradeToLabel(40) === 'WEAK', '40 -> WEAK');
assert(gradeToLabel(20) === 'SPAM', '20 -> SPAM');
assert(gradeToLabel(0) === 'SPAM', '0 -> SPAM');

// --- clamp 0..100
assert(clampCredibility(0) === 0, 'clamp 0');
assert(clampCredibility(50) === 50, 'clamp 50');
assert(clampCredibility(100) === 100, 'clamp 100');
assert(clampCredibility(-10) === 0, 'clamp -10 -> 0');
assert(clampCredibility(150) === 100, 'clamp 150 -> 100');
assert(clampCredibility(50.4) === 50, 'clamp 50.4 -> 50 (round)');
assert(clampCredibility(50.6) === 51, 'clamp 50.6 -> 51 (round)');

console.log('All credibility.service unit tests passed.');
export {};
