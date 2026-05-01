/**
 * Guitar tablature parser.
 *
 * Parses raw tab text into a structured timeline of musical events,
 * detecting tuning, fret numbers, and techniques (hammer-on, pull-off,
 * slide up/down).
 */

/** Well-known tuning presets keyed by their string notes (low → high). */
export const TUNING_PRESETS = {
  'Standard':  ['E', 'A', 'D', 'G', 'B', 'e'],
  'Drop D':    ['D', 'A', 'D', 'G', 'B', 'e'],
  'DADGAD':    ['D', 'A', 'D', 'G', 'A', 'D'],
  'Open G':    ['D', 'G', 'D', 'G', 'B', 'D'],
  'Open D':    ['D', 'A', 'D', 'F#', 'A', 'D'],
  'Open E':    ['E', 'B', 'E', 'G#', 'B', 'E'],
  'Open A':    ['E', 'A', 'E', 'A', 'C#', 'E'],
  'Half Step Down': ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'eb'],
};

/**
 * Note names for converting (tuning note + fret) → pitch.
 * Covers the chromatic scale.
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Default octave assignments for standard tuning (low E2 → high E4).
 * Maps common open-string note names to their MIDI-style note+octave.
 */
const BASE_NOTES = {
  'C':  'C3', 'C#': 'C#3', 'Db': 'Db3',
  'D':  'D3', 'D#': 'D#3', 'Eb': 'Eb3',
  'E':  'E2', 'F':  'F2',  'F#': 'F#2', 'Gb': 'Gb2',
  'G':  'G2', 'G#': 'G#2', 'Ab': 'Ab2',
  'A':  'A2', 'A#': 'A#2', 'Bb': 'Bb2',
  'B':  'B2',
  // Lowercase variants indicate higher octave strings
  'e':  'E4', 'b':  'B3', 'g':  'G3',
  'd':  'D3', 'a':  'A2',
};

/**
 * Convert a note name to its semitone index (0–11).
 * Handles sharps, flats, and case-insensitive matching.
 */
function noteToSemitone(note) {
  const normalized = note.charAt(0).toUpperCase() + note.slice(1);
  // Handle flats by converting to enharmonic sharp
  const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  const lookup = flatMap[normalized] || normalized;
  return NOTE_NAMES.indexOf(lookup);
}

/**
 * Given an open string note (e.g. "E") and a fret number,
 * return the resulting pitch in scientific notation (e.g. "E4").
 *
 * @param {string} openNote - The string's open note label from tuning
 * @param {number} fret - Fret number (0 = open)
 * @param {number} stringIndex - Index of the string (0 = lowest/thickest)
 * @param {number} totalStrings - Total number of strings
 * @returns {string} Pitch in scientific notation
 */
export function fretToPitch(openNote, fret, stringIndex, totalStrings) {
  // Determine base note with octave
  let baseNote = BASE_NOTES[openNote];
  if (!baseNote) {
    // Assign octave based on string position (lower strings = lower octave)
    const octave = stringIndex < totalStrings / 2 ? 2 : 3;
    baseNote = openNote.charAt(0).toUpperCase() + openNote.slice(1) + octave;
  }

  const notePart = baseNote.replace(/\d+$/, '');
  const octave = parseInt(baseNote.match(/\d+$/)[0], 10);
  const baseSemitone = noteToSemitone(notePart);

  const totalSemitones = baseSemitone + fret;
  const newNoteIndex = ((totalSemitones % 12) + 12) % 12;
  const octaveShift = Math.floor(totalSemitones / 12) - Math.floor(baseSemitone / 12);

  return NOTE_NAMES[newNoteIndex] + (octave + octaveShift);
}

/**
 * Parse a raw tablature string into structured data.
 *
 * @param {string} rawText - The raw tab text
 * @returns {{ tuning: string[], timeline: object[], rawLines: string[][] }}
 */
export function parseTab(rawText) {
  const blocks = extractBlocks(rawText);
  if (blocks.length === 0) {
    return { tuning: [], timeline: [], rawLines: [], totalColumns: 0, colMaps: [] };
  }

  // Detect tuning from the first block's string labels, or default to standard
  const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'e'];
  let tuning = blocks[0].labels.slice();
  if (tuning.every(l => l === '')) {
    tuning = STANDARD_TUNING.slice(0, tuning.length);
    for (const block of blocks) {
      block.labels = tuning.slice();
    }
  }

  // Merge consecutive blocks with the same number of strings into one
  const merged = mergeBlocks(blocks);

  let timeline = [];
  const rawLines = [];
  const colMaps = [];
  let positionOffset = 0;

  for (const block of merged) {
    const { events: blockEvents, totalPositions, posToCol } = parseBlock(block, tuning);
    for (const event of blockEvents) {
      event.position += positionOffset;
    }
    timeline = timeline.concat(blockEvents);
    rawLines.push(block.lines);
    colMaps.push({ posToCol, offset: positionOffset, totalPositions });
    positionOffset += totalPositions;
  }

  const grouped = groupByPosition(timeline);

  return { tuning, timeline: grouped, rawLines, totalColumns: positionOffset, colMaps };
}

/**
 * Identify the tuning preset name that matches detected labels, if any.
 *
 * @param {string[]} tuning - Detected tuning labels (low → high)
 * @returns {string|null} Preset name or null
 */
export function identifyTuningPreset(tuning) {
  for (const [name, notes] of Object.entries(TUNING_PRESETS)) {
    if (notes.length === tuning.length && notes.every((n, i) => n === tuning[i])) {
      return name;
    }
  }
  return null;
}

/**
 * Extract tab blocks from raw text. Each block is a group of consecutive
 * lines that look like tab strings (e.g. "e|---3---5---|").
 */
function extractBlocks(rawText) {
  const allLines = rawText.split('\n');
  const blocks = [];
  let current = [];
  let currentIsLabeled = false;

  for (const line of allLines) {
    const trimmed = line.trim();
    const cleaned = cleanTabLine(trimmed);
    if (isTabLine(cleaned)) {
      const isLabeled = /^[A-Ga-g][#b]?\|/.test(cleaned);

      // Split when transitioning between labeled and unlabeled lines
      if (current.length > 0 && isLabeled !== currentIsLabeled) {
        blocks.push(buildBlock(current));
        current = [];
      }

      current.push(cleaned);
      currentIsLabeled = isLabeled;
    } else {
      if (current.length > 0) {
        blocks.push(buildBlock(current));
        current = [];
      }
    }
  }
  if (current.length > 0) {
    blocks.push(buildBlock(current));
  }

  return blocks;
}

/**
 * Merge consecutive blocks that have the same number of strings into one
 * continuous block by concatenating their contents side by side.
 */
function mergeBlocks(blocks) {
  if (blocks.length <= 1) return blocks;

  const result = [];
  let current = {
    labels: blocks[0].labels.slice(),
    contents: blocks[0].contents.slice(),
    lines: blocks[0].lines.slice(),
  };

  for (let i = 1; i < blocks.length; i++) {
    const next = blocks[i];

    if (current.labels.length === next.labels.length) {
      current.contents = current.contents.map((c, j) => c + next.contents[j]);
      current.lines = current.lines.map((l, j) => {
        const nextLine = next.lines[j];
        const pipeIdx = nextLine.indexOf('|');
        if (pipeIdx === -1) return l + nextLine;
        if (pipeIdx === 0) return l + nextLine.substring(1);
        const prefix = nextLine.substring(0, pipeIdx).trim();
        if (/^[A-Ga-g][#b]?$/.test(prefix)) return l + nextLine.substring(pipeIdx + 1);
        return l + nextLine;
      });
    } else {
      result.push(current);
      current = {
        labels: next.labels.slice(),
        contents: next.contents.slice(),
        lines: next.lines.slice(),
      };
    }
  }
  result.push(current);

  return result;
}

/**
 * Strip trailing non-tab text from a line (e.g. "| repeat from *" → "|").
 * Keeps content after the last pipe only if it consists of valid tab characters.
 */
function cleanTabLine(line) {
  const lastPipe = line.lastIndexOf('|');
  if (lastPipe === -1) return line;

  const afterLastPipe = line.substring(lastPipe + 1).trim();
  if (!afterLastPipe || /^[\d\-hpHP\/\\~*xXsS.]+$/.test(afterLastPipe)) {
    return line;
  }
  return line.substring(0, lastPipe + 1);
}

/**
 * Check if a line looks like a tab string line.
 * Matches labeled lines (e.g. "e|---0---|"), unlabeled lines starting with
 * a pipe (e.g. "|---0---|"), and unlabeled lines without a leading pipe
 * (e.g. "--------|---------|" as found in some tab pastes).
 */
function isTabLine(line) {
  const cleaned = cleanTabLine(line);
  if (/^[A-Ga-g][#b]?\|/.test(cleaned)) return true;
  if (/^\|[\d\-hpHP\/\\|~*xXsS .]+\|?$/.test(cleaned)) return true;
  if (cleaned.includes('|') && /^[\d\-hpHP\/\\~*xXsS .]+(?:\|[\d\-hpHP\/\\~*xXsS .]*)+\|?$/.test(cleaned)) return true;
  return false;
}

/**
 * Build a block object from an array of raw tab lines.
 */
function buildBlock(lines) {
  const labels = [];
  const contents = [];

  for (const line of lines) {
    const pipeIdx = line.indexOf('|');
    if (pipeIdx > 0 && /^[A-Ga-g][#b]?$/.test(line.substring(0, pipeIdx).trim())) {
      labels.push(line.substring(0, pipeIdx).trim());
      contents.push(line.substring(pipeIdx + 1));
    } else if (pipeIdx === 0) {
      labels.push('');
      contents.push(line.substring(1));
    } else {
      labels.push('');
      contents.push(line);
    }
  }

  // Tab lines are typically written top-to-bottom = highest string to lowest.
  // We reverse so index 0 = lowest string (matching standard music convention).
  labels.reverse();
  contents.reverse();

  return { labels, contents, lines };
}

/** Delay (in seconds) for each technique transition. */
const TECHNIQUE_DELAY = {
  'hammer-on':  0.08,
  'pull-off':   0.10,
  'slide-up':   0.10,
  'slide-down': 0.10,
};

/**
 * Build technique chains by linking consecutive technique notes on the same
 * string. The chain source gets a `techniqueChain` array, and each chain
 * member gets `isChainTarget = true` with a `chainDelay` (seconds).
 */
function buildTechniqueChains(events) {
  const byString = new Map();
  for (const e of events) {
    if (!byString.has(e.string)) byString.set(e.string, []);
    byString.get(e.string).push(e);
  }

  for (const stringEvents of byString.values()) {
    stringEvents.sort((a, b) => a.position - b.position);
    for (let i = 0; i < stringEvents.length; i++) {
      const src = stringEvents[i];
      if (!src.technique || src.prevTechnique) continue;

      const chain = [];
      let j = i + 1;
      while (j < stringEvents.length && stringEvents[j].prevTechnique) {
        const member = stringEvents[j];
        const prevTech = member.prevTechnique;
        chain.push({ fret: member.fret, technique: prevTech });
        member.isChainTarget = true;
        member.chainDelay = TECHNIQUE_DELAY[prevTech] || 0.08;
        j++;
      }
      if (chain.length > 0) {
        src.techniqueChain = chain;
      }
    }
  }
}

/**
 * Check if a character is a technique marker (h, p, /, \).
 */
function isTechniqueChar(ch) {
  return ch === 'h' || ch === 'p' || ch === '/' || ch === '\\';
}

/**
 * Parse a single block into a flat array of timeline events.
 * Reads column by column across all strings.
 *
 * Column classification:
 * - Digit on any string → note column (creates events, increments position)
 * - All dashes/pipes → empty gap column (increments position)
 * - Technique markers only → skipped entirely (no position increment)
 */
function parseBlock(block, tuning) {
  const { contents } = block;
  const numStrings = contents.length;
  const maxLen = Math.max(...contents.map(s => s.length));
  const events = [];
  const posToCol = [];
  let pos = 0;

  // Track columns consumed by multi-digit frets per string
  const consumed = new Array(numStrings).fill(0);

  for (let col = 0; col < maxLen; col++) {
    let hasDigit = false;
    let hasTechnique = false;

    for (let s = 0; s < numStrings; s++) {
      if (col < consumed[s]) continue;
      const ch = contents[s][col] || '-';
      if (/\d/.test(ch)) {
        hasDigit = true;
        break;
      }
      if (isTechniqueChar(ch)) {
        hasTechnique = true;
      }
    }

    // Skip technique-only columns entirely (no position increment)
    if (!hasDigit && hasTechnique) continue;

    posToCol[pos] = col;

    if (!hasDigit) {
      pos++;
      continue;
    }

    for (let s = 0; s < numStrings; s++) {
      if (col < consumed[s]) continue;
      const line = contents[s];
      const ch = line[col] || '-';

      if (!/\d/.test(ch)) continue;

      let fretStr = ch;
      let endCol = col + 1;
      while (endCol < line.length && /\d/.test(line[endCol])) {
        fretStr += line[endCol];
        endCol++;
      }
      consumed[s] = endCol;

      const fret = parseInt(fretStr, 10);
      const technique = detectTechnique(line, endCol);
      const prevTechnique = detectPrevTechnique(line, col);

      const event = {
        position: pos,
        string: s,
        fret,
        technique: technique || null,
        prevTechnique: prevTechnique || null,
        openNote: tuning[s] || (block.labels[s]),
      };

      if (technique) {
        const nextFret = findNextFret(line, endCol);
        if (nextFret !== null) {
          event.targetFret = nextFret;
        }
      }

      events.push(event);
    }

    pos++;
  }

  buildTechniqueChains(events);

  return { events, totalPositions: pos, posToCol };
}

/**
 * Detect technique marker after a fret number.
 */
function detectTechnique(line, idx) {
  if (idx >= line.length) return null;
  const ch = line[idx];
  switch (ch) {
    case 'h': return 'hammer-on';
    case 'p': return 'pull-off';
    case '/': return 'slide-up';
    case '\\': return 'slide-down';
    default: return null;
  }
}

/**
 * Detect technique marker before a fret number (this note is the target).
 */
function detectPrevTechnique(line, idx) {
  if (idx <= 0) return null;
  const ch = line[idx - 1];
  switch (ch) {
    case 'h': return 'hammer-on';
    case 'p': return 'pull-off';
    case '/': return 'slide-up';
    case '\\': return 'slide-down';
    default: return null;
  }
}

/**
 * Find the next fret number after a technique marker.
 */
function findNextFret(line, idx) {
  // Skip the technique character
  let i = idx + 1;
  while (i < line.length && !/\d/.test(line[i]) && line[i] !== '-' && line[i] !== '|') {
    i++;
  }
  if (i < line.length && /\d/.test(line[i])) {
    let fretStr = '';
    while (i < line.length && /\d/.test(line[i])) {
      fretStr += line[i];
      i++;
    }
    return parseInt(fretStr, 10);
  }
  return null;
}

/**
 * Find the previous fret number before a technique marker.
 */
function findPrevFret(line, idx) {
  // Go back past the technique character
  let i = idx - 2;
  // Collect digits going backward
  let digits = '';
  while (i >= 0 && /\d/.test(line[i])) {
    digits = line[i] + digits;
    i--;
  }
  return digits.length > 0 ? parseInt(digits, 10) : null;
}

/**
 * Group events by their position into columns (simultaneous notes).
 * Returns an array of columns, each containing an array of events.
 */
function groupByPosition(events) {
  const map = new Map();
  for (const e of events) {
    if (!map.has(e.position)) {
      map.set(e.position, []);
    }
    map.get(e.position).push(e);
  }

  // Sort by position and return as array
  const sorted = [...map.entries()].sort((a, b) => a[0] - b[0]);
  return sorted.map(([position, notes]) => ({ position, notes }));
}
