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
    return { tuning: [], timeline: [], rawLines: [] };
  }

  // Detect tuning from the first block's string labels
  const tuning = blocks[0].labels.slice();

  // Merge consecutive blocks with the same number of strings into one
  const merged = mergeBlocks(blocks);

  // Parse each merged block into timeline events and concatenate
  let timeline = [];
  const rawLines = [];

  for (const block of merged) {
    const blockEvents = parseBlock(block, tuning);
    const offset = timeline.length;
    for (const event of blockEvents) {
      event.position += offset;
    }
    timeline = timeline.concat(blockEvents);
    rawLines.push(block.lines);
  }

  // Group timeline into columns (simultaneous events at same position)
  const grouped = groupByPosition(timeline);

  return { tuning, timeline: grouped, rawLines };
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

  for (const line of allLines) {
    const trimmed = line.trim();
    if (isTabLine(trimmed)) {
      current.push(trimmed);
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
        return l + nextLine.substring(pipeIdx + 1);
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
 * Check if a line looks like a tab string line.
 * Must have a label prefix followed by | and content.
 */
function isTabLine(line) {
  return /^[A-Ga-g][#b]?\|/.test(line);
}

/**
 * Build a block object from an array of raw tab lines.
 */
function buildBlock(lines) {
  const labels = [];
  const contents = [];

  for (const line of lines) {
    const pipeIdx = line.indexOf('|');
    const label = line.substring(0, pipeIdx).trim();
    const content = line.substring(pipeIdx + 1);
    labels.push(label);
    contents.push(content);
  }

  // Tab lines are typically written top-to-bottom = highest string to lowest.
  // We reverse so index 0 = lowest string (matching standard music convention).
  labels.reverse();
  contents.reverse();

  return { labels, contents, lines };
}

/**
 * Parse a single block into a flat array of timeline events.
 * Reads column by column across all strings.
 */
function parseBlock(block, tuning) {
  const { contents } = block;
  const numStrings = contents.length;
  const maxLen = Math.max(...contents.map(s => s.length));
  const events = [];
  let pos = 0;

  // We'll track the position in actual "columns" which map to time steps.
  // Each character position is one time unit.
  for (let col = 0; col < maxLen; col++) {
    // Check if this column has any fret numbers
    let hasContent = false;
    for (let s = 0; s < numStrings; s++) {
      const ch = contents[s][col] || '-';
      if (/\d/.test(ch)) {
        hasContent = true;
        break;
      }
    }

    if (!hasContent) {
      // Check for measure separator
      if (contents.every(c => (c[col] || '') === '|')) {
        // measure boundary, just increment position
      }
      pos++;
      continue;
    }

    // Parse each string at this column
    for (let s = 0; s < numStrings; s++) {
      const line = contents[s];
      const ch = line[col] || '-';

      if (!/\d/.test(ch)) continue;

      // Read full fret number (could be multi-digit like 10, 12)
      let fretStr = ch;
      let endCol = col + 1;
      while (endCol < line.length && /\d/.test(line[endCol])) {
        fretStr += line[endCol];
        endCol++;
      }

      const fret = parseInt(fretStr, 10);

      // Look for technique marker AFTER the fret number
      const technique = detectTechnique(line, endCol);

      // Look for technique marker BEFORE this fret (means this note is the TARGET)
      const prevTechnique = detectPrevTechnique(line, col);

      const event = {
        position: pos,
        string: s,
        fret,
        technique: prevTechnique || technique,
        openNote: tuning[s] || (block.labels[s]),
      };

      // For techniques, find the connected fret
      if (technique) {
        const nextFret = findNextFret(line, endCol);
        if (nextFret !== null) {
          event.targetFret = nextFret;
        }
      }
      if (prevTechnique) {
        const prevFret = findPrevFret(line, col);
        if (prevFret !== null) {
          event.fromFret = prevFret;
        }
      }

      events.push(event);
    }

    pos++;
  }

  return events;
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
