<script>
  import { parseTab, identifyTuningPreset } from './lib/tabParser.js';
  import { createAudioEngine } from './lib/audioEngine.js';
  import TabInput from './components/TabInput.svelte';
  import TuningSelector from './components/TuningSelector.svelte';
  import GuitarTypeSelector from './components/GuitarTypeSelector.svelte';
  import PlayerControls from './components/PlayerControls.svelte';
  import TabDisplay from './components/TabDisplay.svelte';
  import StringVolumes from './components/StringVolumes.svelte';

  // State
  let rawTabText = $state('');
  let parsedData = $state({ tuning: [], timeline: [], rawLines: [], totalColumns: 0, colMaps: [] });
  let detectedTuning = $state([]);
  let activeTuning = $state([]);
  let guitarType = $state('acoustic');
  let isPlaying = $state(false);
  let currentIndex = $state(0);
  let speed = $state(1.0);
  let isLoaded = $state(false);
  let isLoading = $state(false);
  let playInterval = $state(null);
  let activePosition = $state(0);
  let stringVolumes = $state([1, 1, 1, 1, 1, 1]);
  let masterVolume = $state(0.8);

  // Audio engine
  const engine = createAudioEngine();

  function handleTabInput(text) {
    rawTabText = text;
    const result = parseTab(text);
    parsedData = result;
    detectedTuning = result.tuning;

    if (result.tuning.length > 0 && activeTuning.length === 0) {
      activeTuning = result.tuning.slice();
    }

    // Resize string volumes to match number of strings
    if (result.tuning.length > 0) {
      stringVolumes = Array.from({ length: result.tuning.length }, (_, i) => stringVolumes[i] ?? 1);
    }

    // Reset playback
    handlePause();
    currentIndex = 0;
    activePosition = 0;

    // Auto-load instrument if not loaded
    if (result.timeline.length > 0 && !isLoaded) {
      loadInstrument(guitarType);
    }
  }

  // Load instrument samples
  async function loadInstrument(type) {
    isLoading = true;
    await engine.loadInstrument(type);
    isLoaded = true;
    isLoading = false;
  }

  // Guitar type change
  async function handleGuitarTypeChange(type) {
    guitarType = type;
    handlePause();
    await loadInstrument(type);
  }

  // Tuning change
  function handleTuningChange(tuning) {
    activeTuning = tuning;
  }

  function timelineIndexAtOrAfter(pos) {
    for (let i = 0; i < parsedData.timeline.length; i++) {
      if (parsedData.timeline[i].position >= pos) return i;
    }
    return parsedData.timeline.length;
  }

  function playAtPosition() {
    const idx = parsedData.timeline.findIndex(c => c.position === activePosition);
    if (idx >= 0) {
      currentIndex = idx;
      engine.playNotes(parsedData.timeline[idx].notes, activeTuning, 0.4, stringVolumes);
    }
  }

  function handlePlay() {
    if (parsedData.timeline.length === 0 || !isLoaded) return;

    // Find the next note at or after current position
    currentIndex = timelineIndexAtOrAfter(activePosition);

    // Restart from beginning if at or past the end
    const lastPos = parsedData.timeline[parsedData.timeline.length - 1].position;
    if (currentIndex >= parsedData.timeline.length || activePosition >= lastPos) {
      currentIndex = 0;
      activePosition = 0;
    }

    isPlaying = true;
    playCurrentAndAdvance();
  }

  function playCurrentAndAdvance() {
    if (!isPlaying || currentIndex >= parsedData.timeline.length) {
      if (currentIndex >= parsedData.timeline.length) {
        isPlaying = false;
      }
      return;
    }

    const column = parsedData.timeline[currentIndex];
    activePosition = column.position;
    const noteDuration = 1.6 / speed;
    engine.playNotes(column.notes, activeTuning, noteDuration, stringVolumes);

    if (currentIndex + 1 >= parsedData.timeline.length) {
      isPlaying = false;
      return;
    }

    const nextColumn = parsedData.timeline[currentIndex + 1];

    // Chain targets: advance cursor at technique speed (synced with audio)
    const isChainStep = nextColumn.notes.every(n => n.isChainTarget || n.prevTechnique);
    if (isChainStep) {
      const chainDelayMs = (nextColumn.notes[0].chainDelay || 0.08) * 1000 / speed;
      currentIndex++;
      playInterval = setTimeout(() => playCurrentAndAdvance(), chainDelayMs);
      return;
    }

    const nextPos = nextColumn.position;
    const gap = nextPos - column.position;
    const totalGapMs = Math.max(240, gap * 200) / speed;
    const stepMs = totalGapMs / gap;

    currentIndex++;

    if (gap <= 1) {
      playInterval = setTimeout(() => playCurrentAndAdvance(), totalGapMs);
    } else {
      let step = 1;
      function advanceStep() {
        if (!isPlaying) return;
        if (step < gap) {
          activePosition = column.position + step;
          step++;
          playInterval = setTimeout(advanceStep, stepMs);
        } else {
          playCurrentAndAdvance();
        }
      }
      playInterval = setTimeout(advanceStep, stepMs);
    }
  }

  function handlePause() {
    isPlaying = false;
    if (playInterval) {
      clearTimeout(playInterval);
      playInterval = null;
    }
    engine.stopAll();
  }

  function seekTo(pos) {
    handlePause();
    activePosition = Math.max(0, Math.min(pos, parsedData.totalColumns - 1));
    playAtPosition();
  }

  function handleSpeedChange(newSpeed) {
    speed = newSpeed;
  }

  function handleVolumeChange(vol) {
    masterVolume = vol;
    const db = vol <= 0 ? -Infinity : 20 * Math.log10(vol);
    engine.setVolume(db);
  }

  function handleStringVolumeChange(index, vol) {
    stringVolumes[index] = vol;
    stringVolumes = stringVolumes;
  }
</script>

<main>
  <header>
    <h1>Guitar Tab Player</h1>
    <p class="subtitle">Paste your guitar tablature and listen to it played back</p>
  </header>

  <div class="content">
    <section class="input-section">
      <TabInput value={rawTabText} oninput={handleTabInput} />

      <div class="settings-row">
        <TuningSelector
          {detectedTuning}
          selectedTuning={activeTuning}
          onchange={handleTuningChange}
        />
        <GuitarTypeSelector
          value={guitarType}
          onchange={handleGuitarTypeChange}
        />
      </div>

      {#if activeTuning.length > 0}
        <StringVolumes
          tuning={activeTuning}
          volumes={stringVolumes}
          onchange={handleStringVolumeChange}
        />
      {/if}

      {#if isLoading}
        <div class="loading-notice">
          <span class="spinner"></span>
          Loading {guitarType} guitar samples...
        </div>
      {/if}
    </section>

    {#if parsedData.rawLines.length > 0}
      <section class="display-section">
        <TabDisplay
          rawLines={parsedData.rawLines}
          {activePosition}
          totalColumns={parsedData.totalColumns}
          colMaps={parsedData.colMaps}
          {isPlaying}
          onseek={seekTo}
          onedit={handleTabInput}
        />
      </section>
    {/if}

    <section class="player-section">
      <PlayerControls
        {isPlaying}
        currentPosition={activePosition}
        totalColumns={parsedData.totalColumns}
        {speed}
        {isLoaded}
        onplay={handlePlay}
        onpause={handlePause}
        onprev={() => seekTo(activePosition - 1)}
        onnext={() => seekTo(activePosition + 1)}
        onfirst={() => seekTo(0)}
        onlast={() => seekTo(parsedData.totalColumns - 1)}
        onspeedchange={handleSpeedChange}
        onseek={seekTo}
        volume={masterVolume}
        onvolumechange={handleVolumeChange}
      />
    </section>
  </div>
</main>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px 160px;
    width: 100%;
  }

  header {
    text-align: center;
    margin-bottom: 32px;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 8px;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 1rem;
    margin: 0;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .input-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .settings-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: start;
  }

  .loading-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--warning);
    padding: 8px 12px;
    background: rgba(240, 212, 160, 0.1);
    border-radius: var(--radius);
    border: 1px solid rgba(240, 212, 160, 0.2);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--warning);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .display-section {
    width: 100%;
  }

  .player-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 24px;
    background: var(--bg);
    border-top: 1px solid var(--border);
    z-index: 100;
  }

  .player-section :global(.player-controls) {
    max-width: 1100px;
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    main {
      padding: 20px 16px 200px;
    }

    h1 {
      font-size: 1.5rem;
    }

    .settings-row {
      grid-template-columns: 1fr;
    }

    .player-section {
      padding: 12px 16px;
    }
  }
</style>
