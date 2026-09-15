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

describe('validateProgression — word readiness (words never taught standalone stay ungated)', () => {
  function unit(lessons: Unit['lessons']): Unit {
    return { id: 'u', title: 't', description: '', level: 'A1', lessons };
  }

  it('a produce-tier single word with zero prior exposure is flagged', () => {
    const units_: Unit[] = [unit([{ id: 'l1', title: 'L1', exercises: [translate('pt', 'Obrigado', ['Merci'])] }])];
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

  it('a fixed idiom whose words are never taught standalone is NOT gated (stays a memorized chunk)', () => {
    // "Bis Bald" is introduced directly as a phrase and immediately produced —
    // fine, because "bis" and "bald" never get their own standalone teach
    // exercise anywhere, so they never become tracked/required words.
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            mc('lu', 'Bis Bald', ['Até logo', 'Tchau', 'Olá', 'Obrigado']),
            { type: 'match', id: 'm', pairs: [{ pt: 'Até logo', lu: 'Bis Bald' }] },
            translate('lu', 'Bis Bald', ['Até logo']),
          ],
        },
      ]),
    ];
    assert.deepEqual(validateProgression(units_), []);
  });

  it('a compositional sentence is flagged when its words were never taught standalone, even at teach tier', () => {
    // The real bug the user found: "Et geet mir gutt" shown/tested with
    // "geet"/"gutt" only ever having appeared inside OTHER, unrelated
    // phrases — never taught as their own standalone word.
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            mc('lu', 'gutt', ['bem', 'mal', 'grande', 'triste']), // "gutt" now tracked
            mc('lu', 'Et geet mir gutt', ['Estou bem', 'Tchau', 'Olá', 'Obrigado']), // introduces the phrase
          ],
        },
      ]),
    ];
    const violations = validateProgression(units_);
    // "geet", "mir", and "et" were never taught standalone, so once "gutt" IS
    // tracked, the phrase-teach exercise itself must wait for it — but here
    // "gutt" already has one prior exposure (its own teach), still short of
    // the 2 (teach + practice) required.
    assert.ok(violations.some((v) => v.word === 'gutt' && v.tier === 'teach'));
  });

  it('once every word has 2 standalone exposures, combining them into a new phrase is allowed at any tier', () => {
    const teachAndPractice = (word: string, options: string[]): Exercise[] => [
      mc('lu', word, options),
      { type: 'match', id: `m-${word}`, pairs: [{ pt: options[0], lu: word }] },
    ];
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            ...teachAndPractice('geet', ['vai', 'vem', 'dorme', 'fala']),
            ...teachAndPractice('gutt', ['bem', 'mal', 'grande', 'triste']),
            ...teachAndPractice('et', ['isso', 'eu', 'você', 'nós']),
            ...teachAndPractice('mir', ['para mim', 'nós', 'você', 'eles']),
            // The phrase's own first appearance can be its select-tier
            // exercise directly — no separate "reveal" step is required —
            // but produce still needs the phrase itself to have come up
            // TWICE already (see the next test), so a second appearance
            // (here, a construct-tier orderWords) comes before produce.
            {
              type: 'fillBlank',
              id: 'fb',
              promptLang: 'lu',
              sentence: 'Et geet mir ___',
              translation: 'Estou bem',
              options: ['gutt', 'x', 'y', 'z'],
              correctAnswer: 'gutt',
            },
            {
              type: 'orderWords',
              id: 'ow',
              translation: 'Estou bem',
              words: ['Et', 'geet', 'mir', 'gutt'],
              correctOrder: ['Et', 'geet', 'mir', 'gutt'],
            },
            translate('lu', 'Et geet mir gutt', ['Estou bem']),
          ],
        },
      ]),
    ];
    assert.deepEqual(validateProgression(units_), []);
  });

  it('produce still requires the exact phrase to have appeared once already, even once words are ready', () => {
    const teachAndPractice = (word: string, options: string[]): Exercise[] => [
      mc('lu', word, options),
      { type: 'match', id: `m-${word}`, pairs: [{ pt: options[0], lu: word }] },
    ];
    const units_: Unit[] = [
      unit([
        {
          id: 'l1',
          title: 'L1',
          exercises: [
            ...teachAndPractice('geet', ['vai', 'vem', 'dorme', 'fala']),
            ...teachAndPractice('gutt', ['bem', 'mal', 'grande', 'triste']),
            ...teachAndPractice('et', ['isso', 'eu', 'você', 'nós']),
            ...teachAndPractice('mir', ['para mim', 'nós', 'você', 'eles']),
            // Straight to produce, skipping any prior appearance of the phrase itself.
            translate('lu', 'Et geet mir gutt', ['Estou bem']),
          ],
        },
      ]),
    ];
    const violations = validateProgression(units_);
    assert.equal(violations.length, 1);
    assert.equal(violations[0].word, 'et geet mir gutt');
    assert.equal(violations[0].tier, 'produce');
    assert.equal(violations[0].requiredExposures, 1);
  });

  it('orderWords requires each tile word to be individually ready, not just the phrase', () => {
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
