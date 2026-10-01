/**
 * Cheap, deterministic checks that run before any model call.
 *
 * - `screenQuery` rejects input that is clearly not a halal/haram lookup:
 *   prompt-injection phrasing, links, code, and keyboard mash.
 * - `cleanQuery` strips characters that can hide instructions or break the
 *   prompt's delimiters (control chars, zero-width / bidi overrides, angle
 *   brackets, braces, backticks).
 *
 * Topic scope ("is this about Islamic permissibility at all?") is decided by
 * the model, which returns `scope: "out"`. The patterns here are kept narrow
 * so a real lookup ("can a Muslim ignore a gift?") is never blocked.
 */

export type ScreenReason = 'injection' | 'not_text' | 'gibberish'

export type ScreenResult = { ok: true } | { ok: false; reason: ScreenReason }

// C0/C1 controls, zero-width chars, bidi embeddings/overrides/isolates, BOM.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g
// Characters that could close or fake the <user_query> delimiter or a JSON/markdown block.
const DELIMITERS = /[<>{}[\]`|\\]/g

function visibleText(input: unknown): string {
  return String(input ?? '')
    .normalize('NFKC')
    .replace(INVISIBLE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The text that is shown back to the user and sent to the model. */
export function cleanQuery(input: unknown): string {
  return visibleText(input).replace(DELIMITERS, ' ').replace(/\s+/g, ' ').trim()
}

const INSTRUCTION_WORDS = '(instructions?|prompts?|guidelines?|directives?|system\\s+message)'

/** Phrasings that try to steer the model rather than ask about an item. EN / AR / DE / FR. */
const INJECTION_PATTERNS: RegExp[] = [
  new RegExp(`\\b(ignore|disregard|forget|override|bypass)\\b.{0,30}\\b${INSTRUCTION_WORDS}`),
  /\b(ignore|disregard|forget)\s+(everything|all|anything)\s+(above|before|previous|prior|else)\b/,
  /\b(ignore|disregard|forget)\s+(the\s+|your\s+)?(above|previous|prior|earlier)\b/,
  /\b(previous|prior|above|your|system)\s+rules\b/,
  /\b(system|developer|hidden)\s+(prompt|instructions?|message)\b/,
  /\b(reveal|show|print|repeat|output|leak|tell me|what are|what is)\b.{0,15}\b(your|the system|system|hidden|initial|original)\s+(prompt|instructions?|rules|configuration|guidelines)\b/,
  /\byou\s+are\s+(now|no\s+longer)\b/,
  /\bpretend\s+(you|to\s+be|that\s+you)\b/,
  /\brole-?play\s+as\b/,
  /\b(jailbreak|dan\s+mode|developer\s+mode|god\s+mode|do\s+anything\s+now)\b/,
  /\bnew\s+(instructions?|persona)\b/,
  /\b(always|must|only)\s+(answer|reply|respond|return|output)\b/,
  /\b(answer|reply|respond|return|output)\s+(only|just|exactly)\b/,
  /\b(set|force)\s+(the\s+)?(verdict|confidence|stance)\b/,
  /\b(verdict|confidence|stance|scope)\s*[:=]/,
  /(^|\s)(system|assistant)\s*:/,
  /<\|?\s*(im_start|im_end|endoftext|system)\b|\b(im_start|im_end|endoftext)\b|\[\/?inst\]|<\/?user_query|#{3,}/,
  // Arabic
  /(تجاهل|تجاهلي|انس|انسى|تخط)[^.]{0,30}(التعليمات|الأوامر|التوجيهات|ما سبق)/,
  /(أنت الآن|انت الآن|من الآن فصاعدا|موجه النظام|تعليمات النظام)/,
  // German
  /\b(ignoriere|vergiss|missachte)\b.{0,30}\b(anweisungen|vorgaben|alles\s+oben)\b/,
  /\b(du\s+bist\s+jetzt|tu\s+so\s+als\s+w[äa]rst\s+du)\b/,
  /\bsystem-?(prompt|anweisung)/,
  // French
  /\b(ignore[rz]?|oublie[rz]?|contourne[rz]?)\b.{0,30}\b(instructions?|consignes?|tout\s+ce\s+qui\s+pr[eé]c[eè]de)\b/,
  /\b(tu\s+es\s+maintenant|vous\s+[eê]tes\s+maintenant|fais\s+semblant\s+d)/,
  /\bprompt\s+syst[eè]me\b/,
]

const LINK_OR_CODE: RegExp[] = [
  /\b(https?|ftp|file|javascript|data):/i,
  /\bwww\.\S+/i,
  /\S+@\S+\.\S+/,
  /\b(function|const|let|var)\s+\w+\s*[=(]/,
  /;\s*(drop|delete|select|insert|update)\s/i,
  /=>|\(\)\s*[;{]/,
]

const VOWELS = /[aeiouyàâäéèêëîïôöùûüÿ]/i
const KEYBOARD_ROWS = ['qwertyuiop', 'qwertzuiop', 'asdfghjkl', 'zxcvbnm', 'yxcvbnm']

/** Five keys in a row from one keyboard row ("asdfg", "werty"). No real word in EN/DE/FR has one. */
function hasKeyboardRun(text: string): boolean {
  const letters = text.replace(/[^a-z]/g, ' ')
  return KEYBOARD_ROWS.some((row) => {
    for (let i = 0; i + 5 <= row.length; i += 1) {
      if (letters.includes(row.slice(i, i + 5))) return true
    }
    return false
  })
}

/** Keyboard runs, one letter repeated 5+ times, or only vowel-less Latin "words" of 6+ letters. */
function looksLikeMash(text: string): boolean {
  if (hasKeyboardRun(text)) return true
  if (/(\p{L})\1{4,}/u.test(text.replace(/\s/g, ''))) return true
  const words = text.split(' ').filter((word) => /^[a-z]{6,}$/.test(word))
  return words.length > 0 && words.every((word) => !VOWELS.test(word))
}

export function screenQuery(input: unknown): ScreenResult {
  const text = visibleText(input)
  const lower = text.toLowerCase()
  if (!/\p{L}/u.test(text)) return { ok: false, reason: 'not_text' }
  if (LINK_OR_CODE.some((pattern) => pattern.test(text))) return { ok: false, reason: 'not_text' }
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(lower))) return { ok: false, reason: 'injection' }
  if (looksLikeMash(lower)) return { ok: false, reason: 'gibberish' }
  return { ok: true }
}
