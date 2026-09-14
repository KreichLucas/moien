import { units } from './units';
import { Unit } from '../types/content';

/**
 * Common Luxembourgish function words (pronouns, articles, basic verbs,
 * connectors) that show up inside longer sentences but are never taught
 * as standalone vocabulary exercises.
 */
const LU_FUNCTION_WORDS: Record<string, string> = {
  ech: 'eu',
  du: 'tu / você',
  hien: 'ele',
  hatt: 'ela / ele (neutro)',
  mir: 'nós',
  dir: 'vós / vocês',
  si: 'ela / eles',
  ass: 'é / está',
  sinn: 'ser / estar',
  hunn: 'ter / têm',
  ginn: 'ir / vamos',
  net: 'não',
  a: 'e',
  an: 'em / no',
  am: 'no (em + dem)',
  op: 'em / sobre',
  mat: 'com',
  fir: 'para',
  vun: 'de',
  zu: 'a / para',
  wéi: 'como',
  wat: 'o que',
  wou: 'onde',
  wann: 'quando / se',
  well: 'porque',
  dat: 'isso / aquilo',
  dëst: 'isto',
  deen: 'aquele',
  eng: 'uma',
  en: 'um',
  de: 'o',
  hu: 'têm',
  all: 'todo / cada',
  vill: 'muito',
  gär: 'com prazer / gostar',
  scho: 'já',
  nach: 'ainda',
  hei: 'aqui',
  do: 'ali / lá',
  mäi: 'meu',
  meng: 'minha',
  eis: 'nosso(a) / nos',
  heeschen: 'chamar-se',
  gudden: 'bom',
  owend: 'noite / entardecer',
  schaffen: 'trabalhar',
  heem: 'para casa / lar',
  géif: 'gostaria (condicional)',
  gutt: 'bom',
  muss: 'preciso / deve',
  zum: 'ao / para o',
  goen: 'ir',
  sichen: 'procurar',
  gi: 'vou (forma curta de ginn)',
  sech: 'se (reflexivo)',
  huet: 'tem / há',
  trennen: 'separar',
  zesummen: 'juntos',
  ännert: 'muda',
  séier: 'rápido',
  kontrakt: 'contrato',
  wiisst: 'cresce',
  molt: 'pinta',
  biller: 'quadros',
  alles: 'tudo',
  allem: 'tudo (forma dativa)',
  gëff: 'dou',
  bescht: 'melhor',
  aus: 'de / fora',
  den: 'os (artigo dativo)',
  ae: 'olhos',
  dem: 'o (artigo dativo)',
  sënn: 'sentido / mente',
  vollgas: 'acelerador total',
  et: 'isso / ele (impessoal)',
  get: 'fica / é (forma de gëtt)',
  keen: 'nenhum',
  esou: 'tão',
  waarm: 'quente',
  giess: 'comido',
  gekacht: 'cozido',
  interessi: 'interesse',
  mussen: 'precisamos / devemos',
  "kompromëss": 'compromisso / meio-termo',
  fannen: 'encontrar',
  ufank: 'começo',
  schwéier: 'difícil',
};

/** The same function words, reversed, for when you're producing the Luxembourgish answer. */
const PT_FUNCTION_WORDS: Record<string, string> = {
  eu: 'ech',
  você: 'du',
  tu: 'du',
  ele: 'hien',
  ela: 'hatt / si',
  nós: 'mir',
  vós: 'dir',
  vocês: 'dir',
  eles: 'si',
  elas: 'si',
  não: 'net',
  e: 'a',
  em: 'an',
  no: 'am',
  na: 'an der',
  com: 'mat',
  para: 'fir',
  de: 'vun',
  como: 'wéi',
  onde: 'wou',
  quando: 'wann',
  porque: 'well',
  isso: 'dat',
  isto: 'dëst',
  uma: 'eng',
  um: 'en',
  o: 'de',
  a: 'd',
  todo: 'all',
  toda: 'all',
  muito: 'vill',
  já: 'scho',
  ainda: 'nach',
  aqui: 'hei',
  ali: 'do',
  meu: 'mäi',
  minha: 'meng',
  nosso: 'eis',
  chamar: 'heeschen',
  bom: 'gutt',
  boa: 'gudden',
  noite: 'owend',
  trabalhar: 'schaffen',
  casa: 'heem',
  preciso: 'muss',
  ir: 'goen',
  procurar: 'sichen',
  rápido: 'séier',
  contrato: 'kontrakt',
  juntos: 'zesummen',
  tempo: 'Zäit',
  cura: 'heelt',
  tudo: 'alles',
};

export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^d['’]/, '')
    .replace(/[.,!?;:'"’()]/g, '')
    .trim();
}

/**
 * Strips a leading Luxembourgish article ("de", "den", "d'", "en", "eng")
 * from a vocabulary prompt like "de Papp" or "d'Mamm", so a card that
 * teaches a noun together with its article still counts as a single word
 * for glossary purposes and the bare noun stays tappable inside sentences.
 */
function stripLeadingArticle(text: string): string {
  return text.trim().replace(/^(d['’]|den|de|eng|en|e)\s+/i, '');
}

interface Glossaries {
  luToPt: Record<string, string>;
  ptToLu: Record<string, string>;
}

/**
 * Builds Luxembourgish<->Portuguese word glossaries from every exercise
 * that already teaches a single word explicitly (translate, multiple
 * choice or match), so the "tap a word for its meaning" hint never shows
 * a translation that wasn't already vetted somewhere in the course.
 */
export function buildGlossaries(units: Unit[]): Glossaries {
  const luToPt: Record<string, string> = { ...LU_FUNCTION_WORDS };
  const ptToLu: Record<string, string> = { ...PT_FUNCTION_WORDS };

  const addLu = (word: string, meaning: string) => {
    const key = normalizeWord(word);
    if (key && !luToPt[key]) luToPt[key] = meaning;
  };
  const addPt = (word: string, meaning: string) => {
    const key = normalizeWord(word);
    if (key && !ptToLu[key]) ptToLu[key] = meaning;
  };

  // A vocabulary card teaches a noun together with its article (e.g. "de Papp",
  // "d'Mamm"), but the tap-to-translate glossary is keyed by the bare word as
  // it appears inside sentences ("Papp"). Stripping the article here lets
  // both the card itself and any later sentence mentioning the same noun
  // resolve to the same glossary entry.
  const isSingleLuWord = (text: string) => !stripLeadingArticle(text).includes(' ');
  const luKey = (text: string) => stripLeadingArticle(text);

  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.exercises.forEach((exercise) => {
        if (exercise.type === 'translate') {
          const ptPromptSingle = !exercise.prompt.trim().includes(' ');
          if (exercise.promptLang === 'lu' && isSingleLuWord(exercise.prompt)) {
            addLu(luKey(exercise.prompt), exercise.acceptedAnswers[0]);
          }
          if (exercise.promptLang === 'pt' && ptPromptSingle && isSingleLuWord(exercise.acceptedAnswers[0])) {
            addPt(exercise.prompt, exercise.acceptedAnswers[0]);
          }
        }
        if (exercise.type === 'multipleChoice') {
          const ptPromptSingle = !exercise.prompt.trim().includes(' ');
          const answer = exercise.options[exercise.correctIndex];
          if (exercise.promptLang === 'lu' && isSingleLuWord(exercise.prompt)) {
            addLu(luKey(exercise.prompt), answer);
          }
          if (exercise.promptLang === 'pt' && ptPromptSingle && isSingleLuWord(answer)) {
            addPt(exercise.prompt, answer);
          }
        }
        if (exercise.type === 'match') {
          exercise.pairs.forEach((pair) => {
            if (isSingleLuWord(pair.lu)) addLu(luKey(pair.lu), pair.pt);
            if (!pair.pt.trim().includes(' ')) addPt(pair.pt, pair.lu);
          });
        }
      });
    });
  });

  return { luToPt, ptToLu };
}

const { luToPt, ptToLu } = buildGlossaries(units);
export const GLOSSARY_LU_TO_PT = luToPt;
export const GLOSSARY_PT_TO_LU = ptToLu;
