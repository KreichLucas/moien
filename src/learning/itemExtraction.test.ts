import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { units } from '../content/units';
import { Unit } from '../types/content';
import { buildItemRegistry, hasExerciseVariety, itemIdsForExercise } from './itemExtraction';

const FIXTURE_UNITS: Unit[] = [
  {
    id: 'f1',
    title: 'Fixture',
    description: '',
    level: 'A1',
    lessons: [
      {
        id: 'f1-l1',
        title: 'L1',
        exercises: [
          { type: 'multipleChoice', id: 'f1-l1-e1', promptLang: 'lu', prompt: 'de Papp', options: ['Pai', 'Mãe'], correctIndex: 0 },
          { type: 'translate', id: 'f1-l1-e2', promptLang: 'pt', prompt: 'Pai', acceptedAnswers: ['de Papp'] },
          { type: 'match', id: 'f1-l1-e3', pairs: [{ pt: 'Mãe', lu: "d'Mamm" }, { pt: 'Casa', lu: "d'Haus" }] },
          { type: 'fillBlank', id: 'f1-l1-e4', promptLang: 'lu', sentence: 'Ech ___ hei', translation: '', options: ['sinn'], correctAnswer: 'sinn' },
          {
            type: 'translate',
            id: 'f1-l1-e5',
            promptLang: 'lu',
            prompt: 'Dëst ass eng laang Kompleet Sätz mat vill Wierder',
            acceptedAnswers: ['frase longa'],
          },
        ],
      },
    ],
  },
];

describe('buildItemRegistry — synthetic fixture', () => {
  const registry = buildItemRegistry(FIXTURE_UNITS);

  it('unifies the same word across a multipleChoice and a translate exercise', () => {
    const item = registry.items['word:papp'];
    assert.ok(item, 'expected word:papp to exist');
    assert.deepEqual(item!.sourceExerciseIds.sort(), ['f1-l1-e1', 'f1-l1-e2']);
    assert.equal(item!.kind, 'word');
  });

  it('gives each match pair its own item, keyed by exerciseId#index', () => {
    const mamm = registry.items['word:mamm'];
    const haus = registry.items['word:haus'];
    assert.ok(mamm && haus);
    assert.deepEqual(mamm!.sourceExerciseIds, ['f1-l1-e3#0']);
    assert.deepEqual(haus!.sourceExerciseIds, ['f1-l1-e3#1']);
  });

  it('treats a fillBlank correctAnswer as a word item', () => {
    assert.ok(registry.items['word:sinn']);
  });

  it('falls back to a phrase item for a multi-word translate exercise', () => {
    const phraseId = 'phrase:f1-l1-e5';
    assert.ok(registry.items[phraseId]);
    assert.equal(registry.items[phraseId].kind, 'phrase');
  });

  it('itemIdsForExercise resolves the right item(s) for each exercise type', () => {
    assert.deepEqual(itemIdsForExercise(FIXTURE_UNITS[0].lessons[0].exercises[0], registry), ['word:papp']);
    const matchIds = itemIdsForExercise(FIXTURE_UNITS[0].lessons[0].exercises[2], registry);
    assert.deepEqual(matchIds.sort(), ['word:haus', 'word:mamm'].sort());
  });

  it('hasExerciseVariety is true only for items with more than one source exercise', () => {
    assert.equal(hasExerciseVariety(registry, 'word:papp'), true);
    assert.equal(hasExerciseVariety(registry, 'word:mamm'), false);
  });

  it('an itemIds override on an exercise takes precedence over auto-derivation', () => {
    const overridden: Unit[] = [
      {
        ...FIXTURE_UNITS[0],
        lessons: [
          {
            id: 'f2-l1',
            title: 'L1',
            exercises: [
              {
                type: 'orderWords',
                id: 'f2-l1-e1',
                translation: '',
                words: ['de', 'Papp'],
                correctOrder: ['de', 'Papp'],
                itemIds: ['word:papp'],
              },
            ],
          },
        ],
      },
    ];
    const r = buildItemRegistry(overridden);
    assert.ok(r.items['word:papp']);
    assert.deepEqual(r.items['word:papp'].sourceExerciseIds, ['f2-l1-e1']);
  });
});

describe('buildItemRegistry — real course content (smoke test)', () => {
  it('runs against the full units.ts corpus without throwing and produces no duplicate item registrations for the same ref', () => {
    const registry = buildItemRegistry(units);
    const allItems = Object.values(registry.items);
    assert.ok(allItems.length > 100, 'expected a substantial number of extracted items');

    for (const item of allItems) {
      const unique = new Set(item.sourceExerciseIds);
      assert.equal(unique.size, item.sourceExerciseIds.length, `duplicate source ref on ${item.id}`);
    }
  });

  it('every exercise in the corpus resolves to at least one item', () => {
    const registry = buildItemRegistry(units);
    let missing = 0;
    units.forEach((unit) =>
      unit.lessons.forEach((lesson) =>
        lesson.exercises.forEach((exercise) => {
          if (itemIdsForExercise(exercise, registry).length === 0) missing++;
        })
      )
    );
    assert.equal(missing, 0);
  });
});
