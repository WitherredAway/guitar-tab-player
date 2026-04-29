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
const GUITAR_SAMPLES = {
  'A2': 'A2', 'C3': 'C3', 'D#3': 'Ds3', 'F#3': 'Fs3',
  'A3': 'A3', 'C4': 'C4', 'D#4': 'Ds4', 'F#4': 'Fs4',
  'A4': 'A4', 'C5': 'C5',
  'E2': 'E2', 'E3': 'E3', 'E4': 'E4',
  'G2': 'G2', 'G3': 'G3', 'G4': 'G4',
  'B2': 'B2', 'B3': 'B3', 'B4': 'B4',
  'D2': 'D2', 'D3': 'D3', 'D4': 'D4', 'D5': 'D5',
  'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
};

/** Build the sample URL map for a given instrument folder. */
function buildSampleUrls(folder) {
  const urls = {};
  for (const [note, file] of Object.entries(GUITAR_SAMPLES)) {
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
  let onLoadCallback = null;

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

    const folder = type === 'electric' ? 'guitar-electric' : 'guitar-acoustic';
    const { urls, baseUrl } = buildSampleUrls(folder);

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

    // Adjust reverb for guitar type
    if (type === 'electric') {
      reverb.wet.value = 0.25;
    } else {
      reverb.wet.value = 0.15;
    }

    return new Promise((resolve) => {
      sampler = new Tone.Sampler({
        urls,
        baseUrl,
        release: 1.2,
        onload: () => {
          isLoaded = true;
          currentType = type;
          if (onLoadCallback) onLoadCallback();
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
   */
  function playNotes(notes, tuning, duration = 0.5) {
    if (!sampler || !isLoaded) return;

    for (const note of notes) {
      const pitch = fretToPitch(note.openNote, note.fret, note.string, tuning.length);

      switch (note.technique) {
        case 'hammer-on':
          // Hammer-on: slightly softer attack, quick onset
          sampler.triggerAttackRelease(pitch, duration * 0.8, undefined, 0.6);
          break;

        case 'pull-off':
          // Pull-off: softer, slightly shorter
          sampler.triggerAttackRelease(pitch, duration * 0.7, undefined, 0.5);
          break;

        case 'slide-up':
        case 'slide-down': {
          // Slide: start at current fret, glide to target
          if (note.targetFret != null) {
            const targetPitch = fretToPitch(note.openNote, note.targetFret, note.string, tuning.length);
            // Play starting note
            sampler.triggerAttack(pitch, undefined, 0.7);
            // Schedule pitch bend to target
            const slideTime = Math.min(duration * 0.4, 0.2);
            setTimeout(() => {
              if (sampler && isLoaded) {
                sampler.triggerAttack(targetPitch, undefined, 0.65);
              }
            }, slideTime * 1000);
            // Release after full duration
            setTimeout(() => {
              if (sampler && isLoaded) {
                sampler.triggerRelease(pitch);
                sampler.triggerRelease(targetPitch);
              }
            }, duration * 1000);
          } else {
            sampler.triggerAttackRelease(pitch, duration, undefined, 0.7);
          }
          break;
        }

        default:
          // Normal note
          sampler.triggerAttackRelease(pitch, duration, undefined, 0.8);
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

  /** Set a callback for when samples finish loading. */
  function onLoad(cb) {
    onLoadCallback = cb;
    if (isLoaded && cb) cb();
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
    onLoad,
    dispose,
    get isLoaded() { return isLoaded; },
    get currentType() { return currentType; },
  };
}
