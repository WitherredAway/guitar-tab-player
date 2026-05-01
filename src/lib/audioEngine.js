/**
 * Audio engine for guitar tab playback using Tone.js.
 *
 * Provides guitar samplers (acoustic + electric), technique-aware
 * note triggering (hammer-on, pull-off, slides), and transport controls.
 */

import * as Tone from 'tone';
import { fretToPitch } from './tabParser.js';

const SAMPLES_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples';

/**
 * Map of sampled notes for each guitar type.
 * Keys are scientific pitch notation, values are file paths.
 * The Sampler auto-repitches between these anchor samples.
 */
const ACOUSTIC_SAMPLES = {
  'A2': 'A2', 'C3': 'C3', 'D#3': 'Ds3', 'F#3': 'Fs3',
  'A3': 'A3', 'C4': 'C4', 'D#4': 'Ds4', 'F#4': 'Fs4',
  'A4': 'A4', 'C5': 'C5',
  'E2': 'E2', 'E3': 'E3', 'E4': 'E4',
  'G2': 'G2', 'G3': 'G3', 'G4': 'G4',
  'B2': 'B2', 'B3': 'B3', 'B4': 'B4',
  'D2': 'D2', 'D3': 'D3', 'D4': 'D4', 'D5': 'D5',
  'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
};

const ELECTRIC_SAMPLES = {
  'A2': 'A2', 'A3': 'A3', 'A4': 'A4',
  'C3': 'C3', 'C4': 'C4', 'C5': 'C5',
  'C#2': 'Cs2', 'D#3': 'Ds3', 'D#4': 'Ds4',
  'E2': 'E2',
  'F#2': 'Fs2', 'F#3': 'Fs3', 'F#4': 'Fs4',
};

/** Build the sample URL map for a given instrument type. */
function buildSampleUrls(type) {
  const folder = type === 'electric' ? 'guitar-electric' : 'guitar-acoustic';
  const samples = type === 'electric' ? ELECTRIC_SAMPLES : ACOUSTIC_SAMPLES;
  const urls = {};
  for (const [note, file] of Object.entries(samples)) {
    urls[note] = `${file}.mp3`;
  }
  return { urls, baseUrl: `${SAMPLES_BASE}/${folder}/` };
}

/**
 * Create and manage the audio engine.
 *
 * @returns {object} Engine API
 */
/** Timing and volume params per technique — single source of truth. */
const TECHNIQUE_PARAMS = {
  'hammer-on':  { sourceDurMul: 0.6, sourceVol: 0.8, delay: 0.08, targetVol: 0.55 },
  'pull-off':   { sourceDurMul: 0.4, sourceVol: 0.8, delay: 0.08, targetVol: 0.6 },
  'slide-up':   { sourceDurAbs: 0.15, sourceVol: 0.5, delay: 0.1, targetVol: 0.7 },
  'slide-down': { sourceDurAbs: 0.15, sourceVol: 0.5, delay: 0.1, targetVol: 0.7 },
};

export function createAudioEngine() {
  let sampler = null;
  let currentType = 'acoustic';
  let isLoaded = false;

  // Effects chain
  let reverb = null;
  let volume = null;

  /**
   * Initialize or switch the guitar sampler.
   *
   * @param {'acoustic'|'electric'} type
   * @returns {Promise<void>}
   */
  async function loadInstrument(type = 'acoustic') {
    // Ensure audio context is started (browser requires user gesture)
    await Tone.start();

    const { urls, baseUrl } = buildSampleUrls(type);

    // Dispose previous sampler if switching
    if (sampler) {
      sampler.disconnect();
      sampler.dispose();
    }

    isLoaded = false;

    // Set up effects
    if (!reverb) {
      reverb = new Tone.Reverb({ decay: 1.5, wet: 0.15 }).toDestination();
      volume = new Tone.Volume(-6).connect(reverb);
    }

    reverb.wet.value = type === 'electric' ? 0.25 : 0.15;

    return new Promise((resolve) => {
      sampler = new Tone.Sampler({
        urls,
        baseUrl,
        release: 1.2,
        onload: () => {
          isLoaded = true;
          currentType = type;
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load samples:', err);
          resolve();
        },
      }).connect(volume);
    });
  }

  /**
   * Play a single note or chord (array of note events).
   *
   * Technique handling: source notes schedule their target with a tiny delay
   * so hammer-ons, pull-offs, and slides transition seamlessly. Target notes
   * (prevTechnique) are skipped since they were already triggered by the source.
   *
   * @param {object[]} notes - Array of note events from the parser
   * @param {string[]} tuning - Current tuning array (low → high)
   * @param {number} [duration=0.5] - Note duration in seconds
   * @param {number[]} [stringVolumes] - Per-string volume multipliers (0–1)
   */
  function playNotes(notes, tuning, duration = 0.5, stringVolumes) {
    if (!sampler || !isLoaded) return;

    const now = Tone.now();

    for (const note of notes) {
      const pitch = fretToPitch(note.openNote, note.fret, note.string, tuning.length);
      const vol = stringVolumes ? (stringVolumes[note.string] ?? 1) : 1;

      if (note.prevTechnique) {
        // Already triggered from the source — don't replay.
        // But if this note chains to another technique (e.g. the "4" in "2h4p2"),
        // schedule its own target.
        if (note.technique && note.targetFret != null) {
          scheduleTarget(note, now, duration, vol, tuning.length);
        }
        continue;
      }

      const techParams = TECHNIQUE_PARAMS[note.technique];
      if (techParams) {
        const srcDur = techParams.sourceDurAbs ?? duration * techParams.sourceDurMul;
        sampler.triggerAttackRelease(pitch, srcDur, now, techParams.sourceVol * vol);
        if (note.targetFret != null) {
          const targetPitch = fretToPitch(note.openNote, note.targetFret, note.string, tuning.length);
          sampler.triggerAttackRelease(targetPitch, duration, now + techParams.delay, techParams.targetVol * vol);
        }
      } else {
        sampler.triggerAttackRelease(pitch, duration, now, 0.8 * vol);
      }
    }
  }

  /**
   * Schedule a technique target note (used for chained techniques like 2h4p2).
   */
  function scheduleTarget(note, now, duration, vol, totalStrings) {
    const techParams = TECHNIQUE_PARAMS[note.technique];
    if (!techParams || note.targetFret == null) return;
    const targetPitch = fretToPitch(note.openNote, note.targetFret, note.string, totalStrings);
    sampler.triggerAttackRelease(targetPitch, duration, now + techParams.delay, techParams.targetVol * vol);
  }

  /** Stop all currently playing notes. */
  function stopAll() {
    if (sampler && isLoaded) {
      sampler.releaseAll();
    }
  }

  /** Set master volume in dB. 0 = unity, -Infinity = mute. */
  function setVolume(db) {
    if (volume) {
      volume.volume.value = db;
    }
  }

  /** Clean up all audio resources. */
  function dispose() {
    if (sampler) {
      sampler.disconnect();
      sampler.dispose();
      sampler = null;
    }
    if (reverb) {
      reverb.dispose();
      reverb = null;
    }
    if (volume) {
      volume.dispose();
      volume = null;
    }
    isLoaded = false;
  }

  return {
    loadInstrument,
    playNotes,
    stopAll,
    setVolume,
    dispose,
    get isLoaded() { return isLoaded; },
    get currentType() { return currentType; },
  };
}
