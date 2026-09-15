import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { units } from '../content/units';
import { Exercise, Unit } from '../types/content';
import { tierOf, validateProgression } from './curriculumValidator';

function mc(promptLang: 'lu' | 'pt', prompt: string, options: string[], correctIndex = 0): Exercise {
  return { type: 'multipleChoice', id: 'x', promptLang, prompt, options, correctIndex };
}
function translate(promptLang: 'lu' | 'pt', prompt: string, answers: string[]): Exercise {
  return { type: 'translate', id: 'x', promptLang, prompt, acceptedAnswers: answers };
}

describe('tierOf', () => {
  it('multipleChoice is always teach, regardless of direction', () => {
    assert.equal(tierOf(mc('lu', 'Moien', ['Olá'])), 'teach');
    assert.equal(tierOf(mc('pt', 'Olá', ['Moien'])), 'teach');
  });

  it('match is always teach', () => {
    assert.equal(tierOf({ type: 'match', id: 'x', pairs: [{ pt: 'Olá', lu: 'Moien' }] }), 'teach');
  });

  it('translate of a single LU word into PT is teach (comprehension, low stakes)', () => {
    assert.equal(tierOf(translate('lu', 'Moien', ['Olá'])), 'teach');
  });

  it('translate of a single word FROM PT into LU is produce (must type the foreign word from scratch)', () => {
    assert.equal(tierOf(translate('pt', 'Olá', ['Moien'])), 'produce');
  });

  it('translate of a multi-word phrase is produce in EITHER direction', () => {
    assert.equal(tierOf(translate('lu', 'Et geet mir gutt', ['Estou bem'])), 'produce');
    assert.equal(tierOf(translate('pt', 'Estou bem', ['Et geet mir gutt'])), 'produce');
  });

  it('fillBlank is select', () => {
    assert.equal(
      tierOf({ type: 'fillBlank', id: 'x', promptLang: 'lu', sentence: 'Et geet mir ___', translation: '', options: ['gutt'], correctAnswer: 'gutt' }),
      'select'
    );
  });

  it('orderWords is construct', () => {
    assert.equal(tierOf({ type: 'orderWords', id: 'x', translation: '', words: ['Moien'], correctOrder: ['Moien'] }), 'construct');
  });
});

describe('validateProgression', () => {
  function unit(lessons: Unit['lessons']): Unit {
    return { id: 'u', title: 't', description: '', level: 'A1', lessons };
  }

  it('flags a word tested at produce tier with zero prior exposure', () => {
    const units_: Unit[] = [
      unit([{ id: 'l1', title: 'L1', exercises: [translate('pt', 'Obrigado', ['Merci'])] }]),
    ];
    const violations = validateProgression(units_);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].word, 'merci');
    assert.equal(violations[0].tier, 'produce');
  });

  it('does not flag a word introduced via multipleChoice first, then produced', () => {
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            mc('lu', 'Merci', ['Obrigado', 'Tchau', 'Sim', 'Não']),
            mc('pt', 'Obrigado', ['Merci', 'Äddi', 'Jo', 'Neen']),
            translate('pt', 'Obrigado', ['Merci']),
          ],
        },
      ]),
    ];
    assert.deepEqual(validateProgression(units_), []);
  });

  it('flags a phrase produced (either direction) before it had a teach-tier exposure', () => {
    const units_: Unit[] = [
      unit([{ id: 'l1', title: 'L1', exercises: [translate('lu', 'Et geet mir gutt', ['Estou bem'])] }]),
    ];
    const violations = validateProgression(units_);
    assert.ok(violations.some((v) => v.word === 'geet'));
    assert.ok(violations.some((v) => v.word === 'gutt'));
  });

  it('ignores grammar/function words entirely (never flagged, never required)', () => {
    const units_: Unit[] = [unit([{ id: 'l1', title: 'L1', exercises: [translate('pt', 'Eu', ['Ech'])] }])];
    // "ech" is a grammar word, so even a cold produce-tier exercise for it raises no violation.
    assert.deepEqual(validateProgression(units_), []);
  });

  it('a fillBlank whose fixed sentence text contains a never-seen content word is flagged', () => {
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            { type: 'fillBlank', id: 'x', promptLang: 'lu', sentence: 'Ech si midd, ___', translation: '', options: ['Entschëllegt'], correctAnswer: 'Entschëllegt' },
          ],
        },
      ]),
    ];
    const violations = validateProgression(units_);
    assert.ok(violations.some((v) => v.word === 'midd'));
  });

  it('orderWords needs 2 prior exposures, not just 1', () => {
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            mc('lu', 'Moien', ['Olá', 'Tchau', 'Sim', 'Não']),
            { type: 'orderWords', id: 'x', translation: '', words: ['Moien'], correctOrder: ['Moien'] },
          ],
        },
      ]),
    ];
    const violations = validateProgression(units_);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].requiredExposures, 2);
    assert.equal(violations[0].actualExposures, 1);
  });

  it('exposure carries across lessons and across units, in authored order', () => {
    const units_: Unit[] = [
      unit([{ id: 'l1', title: 'L1', exercises: [mc('lu', 'Moien', ['Olá', 'Tchau', 'Sim', 'Não'])] }]),
      unit([{ id: 'l2', title: 'L2', exercises: [mc('lu', 'Moien', ['Olá', 'Tchau', 'Sim', 'Não'])] }]),
    ];
    const violations = validateProgression(units_);
    assert.deepEqual(violations, []);
  });

  it('the real A1 content (Saudações) has zero progression violations', () => {
    const a1 = units.filter((u) => u.level === 'A1');
    const saudacoes = a1.filter((u) => u.id === 'a1-obj1');
    const violations = validateProgression(saudacoes);
    assert.deepEqual(violations, [], `Unexpected violations: ${JSON.stringify(violations, null, 2)}`);
  });
});
