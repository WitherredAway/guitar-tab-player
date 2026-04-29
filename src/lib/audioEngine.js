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
   * @param {object[]} notes - Array of note events from the parser
   * @param {string[]} tuning - Current tuning array (low → high)
   * @param {number} [duration=0.5] - Note duration in seconds
   * @param {number[]} [stringVolumes] - Per-string volume multipliers (0–1)
   */
  function playNotes(notes, tuning, duration = 0.5, stringVolumes) {
    if (!sampler || !isLoaded) return;

    for (const note of notes) {
      const pitch = fretToPitch(note.openNote, note.fret, note.string, tuning.length);
      const vol = stringVolumes ? (stringVolumes[note.string] ?? 1) : 1;

      switch (note.technique) {
        case 'hammer-on':
          sampler.triggerAttackRelease(pitch, duration * 0.8, undefined, 0.6 * vol);
          break;

        case 'pull-off':
          sampler.triggerAttackRelease(pitch, duration * 0.7, undefined, 0.5 * vol);
          break;

        case 'slide-up':
        case 'slide-down': {
          // Play a brief source note that quickly fades, giving a slide feel.
          // The target note plays normally at its own position in the timeline.
          const slideDur = Math.min(duration * 0.3, 0.15);
          sampler.triggerAttackRelease(pitch, slideDur, undefined, 0.4 * vol);
          break;
        }

        default:
          sampler.triggerAttackRelease(pitch, duration, undefined, 0.8 * vol);
          break;
      }
    }
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
