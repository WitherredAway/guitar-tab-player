<script>
  /**
   * Music player controls bar.
   * Play/pause, previous/next chord, speed slider, and progress display.
   */

  /** @type {{
   *   isPlaying: boolean,
   *   currentIndex: number,
   *   totalSteps: number,
   *   speed: number,
   *   isLoaded: boolean,
   *   onplay: () => void,
   *   onpause: () => void,
   *   onprev: () => void,
   *   onnext: () => void,
   *   onspeedchange: (speed: number) => void,
   *   onseek: (index: number) => void,
   * }} */
  let {
    isPlaying = false,
    currentIndex = 0,
    totalSteps = 0,
    speed = 1.0,
    isLoaded = false,
    onplay = () => {},
    onpause = () => {},
    onprev = () => {},
    onnext = () => {},
    onspeedchange = () => {},
    onseek = () => {},
  } = $props();

  let progressPercent = $derived(
    totalSteps > 0 ? (currentIndex / (totalSteps - 1)) * 100 : 0
  );

  function togglePlay() {
    if (isPlaying) {
      onpause();
    } else {
      onplay();
    }
  }

  function handleSpeedChange(e) {
    onspeedchange(parseFloat(e.target.value));
  }

  function handleProgressClick(e) {
    if (totalSteps === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const index = Math.round(percent * (totalSteps - 1));
    onseek(Math.max(0, Math.min(index, totalSteps - 1)));
  }

  function handleKeydown(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onprev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onnext();
        break;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="player-controls" class:disabled={!isLoaded || totalSteps === 0}>
  <!-- Progress bar -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
  <div
    class="progress-bar"
    role="slider"
    tabindex="0"
    aria-valuenow={currentIndex}
    aria-valuemin={0}
    aria-valuemax={totalSteps - 1}
    onclick={handleProgressClick}
  >
    <div class="progress-fill" style="width: {progressPercent}%"></div>
  </div>

  <div class="controls-row">
    <!-- Position display -->
    <div class="position-display">
      <span class="current">{currentIndex + 1}</span>
      <span class="separator">/</span>
      <span class="total">{totalSteps}</span>
    </div>

    <!-- Transport controls -->
    <div class="transport">
      <button
        class="control-btn"
        onclick={onprev}
        disabled={!isLoaded || totalSteps === 0}
        title="Previous (←)"
        aria-label="Previous chord"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <button
        class="control-btn play-btn"
        onclick={togglePlay}
        disabled={!isLoaded || totalSteps === 0}
        title="Play/Pause (Space)"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {#if isPlaying}
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M8 5v14l11-7z" />
          </svg>
        {/if}
      </button>

      <button
        class="control-btn"
        onclick={onnext}
        disabled={!isLoaded || totalSteps === 0}
        title="Next (→)"
        aria-label="Next chord"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6z" />
        </svg>
      </button>
    </div>

    <!-- Speed control -->
    <div class="speed-control">
      <label for="speed-slider">{speed.toFixed(2)}x</label>
      <input
        id="speed-slider"
        type="range"
        min="0.25"
        max="2"
        step="0.05"
        value={speed}
        oninput={handleSpeedChange}
      />
    </div>
  </div>
</div>

<style>
  .player-controls {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 20px;
    width: 100%;
  }

  .player-controls.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: var(--bg-input);
    border-radius: 3px;
    cursor: pointer;
    margin-bottom: 12px;
    overflow: hidden;
    transition: height 0.15s;
  }

  .progress-bar:hover {
    height: 8px;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.1s ease-out;
  }

  .controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .position-display {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 70px;
  }

  .current {
    color: var(--text-heading);
  }

  .separator {
    margin: 0 2px;
  }

  .transport {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-btn {
    background: none;
    border: none;
    color: var(--text);
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }

  .control-btn:hover:not(:disabled) {
    background: var(--bg-surface-hover);
    color: var(--text-heading);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .play-btn {
    background: var(--accent);
    color: white;
    width: 44px;
    height: 44px;
  }

  .play-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    color: white;
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
    justify-content: flex-end;
  }

  .speed-control label {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 42px;
    text-align: right;
  }

  .speed-control input[type='range'] {
    width: 80px;
    accent-color: var(--accent);
    cursor: pointer;
  }

  @media (max-width: 480px) {
    .player-controls {
      padding: 10px 14px;
    }

    .controls-row {
      gap: 8px;
    }

    .position-display {
      display: none;
    }

    .speed-control {
      min-width: 90px;
    }

    .speed-control input[type='range'] {
      width: 60px;
    }
  }
</style>
