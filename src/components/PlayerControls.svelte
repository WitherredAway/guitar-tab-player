<script>
  /**
   * Music player controls bar.
   * Play/pause, previous/next chord, speed slider, and progress display.
   */

  /** @type {{
   *   isPlaying: boolean,
   *   currentPosition: number,
   *   totalColumns: number,
   *   speed: number,
   *   isLoaded: boolean,
   *   onplay: () => void,
   *   onpause: () => void,
   *   onprev: () => void,
   *   onnext: () => void,
   *   onfirst: () => void,
   *   onlast: () => void,
   *   onspeedchange: (speed: number) => void,
   *   onseek: (position: number) => void,
   *   volume: number,
   *   onvolumechange: (volume: number) => void,
   * }} */
  let {
    isPlaying = false,
    currentPosition = 0,
    totalColumns = 0,
    speed = 1.0,
    isLoaded = false,
    onplay = () => {},
    onpause = () => {},
    onprev = () => {},
    onnext = () => {},
    onfirst = () => {},
    onlast = () => {},
    onspeedchange = () => {},
    onseek = () => {},
    volume = 0.8,
    onvolumechange = () => {},
  } = $props();

  // A speed of 0 (or negative) makes playback timing collapse to Infinity
  // and stalls the transport, so we enforce the same minimum the slider uses.
  const MIN_SPEED = 0.1;

  let progressPercent = $derived(
    totalColumns > 1 ? (currentPosition / (totalColumns - 1)) * 100 : 0
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

  function handleSpeedInput(e) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= MIN_SPEED) {
      onspeedchange(val);
    }
  }

  function handleSpeedBlur(e) {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || val < MIN_SPEED) {
      onspeedchange(speed);
      e.target.value = speed.toFixed(2);
    }
  }

  function decrementSpeed() {
    const newSpeed = Math.max(MIN_SPEED, Math.round((speed - 0.1) * 100) / 100);
    onspeedchange(newSpeed);
  }

  function incrementSpeed() {
    const newSpeed = Math.round((speed + 0.1) * 100) / 100;
    onspeedchange(newSpeed);
  }

  function handleVolumeInput(e) {
    onvolumechange(parseFloat(e.target.value));
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

<div class="player-controls" class:disabled={!isLoaded || totalColumns === 0}>
  <!-- Progress bar -->
  <input
    type="range"
    class="styled-slider progress-slider"
    min="0"
    max={Math.max(totalColumns - 1, 0)}
    value={currentPosition}
    oninput={(e) => onseek(parseInt(e.target.value))}
    aria-label="Playback position"
    style="background: linear-gradient(to right, var(--accent) {progressPercent}%, var(--bg-input) {progressPercent}%);"
  />

  <div class="controls-row">
    <!-- Position display -->
    <div class="position-display">
      <span class="current">{totalColumns > 0 ? currentPosition + 1 : '-'}</span>
      <span class="separator">/</span>
      <span class="total">{totalColumns}</span>
    </div>

    <!-- Transport controls -->
    <div class="transport">
      <button
        class="control-btn"
        onclick={onfirst}
        disabled={!isLoaded || totalColumns === 0}
        title="First"
        aria-label="Go to first"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <button
        class="control-btn"
        onclick={onprev}
        disabled={!isLoaded || totalColumns === 0}
        title="Previous (←)"
        aria-label="Previous chord"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 6l-8 6 8 6V6zm8 0l-8 6 8 6V6z" />
        </svg>
      </button>

      <button
        class="control-btn play-btn"
        onclick={togglePlay}
        disabled={!isLoaded || totalColumns === 0}
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
        disabled={!isLoaded || totalColumns === 0}
        title="Next (→)"
        aria-label="Next chord"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M4 6l8 6-8 6V6zm8 0l8 6-8 6V6z" />
        </svg>
      </button>

      <button
        class="control-btn"
        onclick={onlast}
        disabled={!isLoaded || totalColumns === 0}
        title="Last"
        aria-label="Go to last"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6z" />
        </svg>
      </button>
    </div>

    <!-- Right side: speed + volume -->
    <div class="right-controls">
      <div class="speed-control">
        <input
          class="speed-input"
          type="text"
          value={speed.toFixed(2)}
          oninput={handleSpeedInput}
          onblur={handleSpeedBlur}
          aria-label="Speed multiplier"
        />
        <span class="speed-x">x</span>
        <button class="speed-btn" onclick={decrementSpeed} aria-label="Decrease speed">-</button>
        <input
          id="speed-slider"
          type="range"
          class="styled-slider"
          min="0.1"
          max="4"
          step="0.05"
          value={Math.min(4, speed)}
          oninput={handleSpeedChange}
          style="background: linear-gradient(to right, var(--accent) {((Math.min(4, speed) - 0.1) / 3.9 * 100)}%, var(--bg-input) {((Math.min(4, speed) - 0.1) / 3.9 * 100)}%);"
        />
        <button class="speed-btn" onclick={incrementSpeed} aria-label="Increase speed">+</button>
      </div>

      <div class="volume-control">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" class="volume-icon">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5z" />
        </svg>
        <input
          type="range"
          class="styled-slider master-volume-slider"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          oninput={handleVolumeInput}
          aria-label="Master volume"
          style="background: linear-gradient(to right, var(--accent) {(volume * 100)}%, var(--bg-input) {(volume * 100)}%);"
        />
      </div>
    </div>
  </div>
</div>

<style>
  .player-controls {
    background: var(--surface-bg, var(--bg-surface));
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 20px;
    width: 100%;
    box-shadow: var(--shadow);
    backdrop-filter: var(--surface-blur, none);
    -webkit-backdrop-filter: var(--surface-blur, none);
  }

  .player-controls.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .progress-slider {
    width: 100%;
    margin-bottom: 12px;
  }

  .controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .position-display, .right-controls {
    flex: 1;
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: flex-end;
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
    background: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: var(--btn-shadow, none);
  }

  .control-btn:hover:not(:disabled) {
    background: var(--bg-surface-hover);
    color: var(--text-heading);
    transform: translateY(-1px);
  }

  .control-btn:active:not(:disabled) {
    transform: translateY(1px) scale(0.95);
    box-shadow: var(--btn-shadow-active, none);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .play-btn {
    background: var(--accent);
    color: var(--play-btn-text, #0a0a0a);
    width: 44px;
    height: 44px;
    box-shadow: var(--play-shadow, 0 2px 8px var(--accent-glow));
  }

  .play-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    color: var(--play-btn-text, #0a0a0a);
    box-shadow: var(--play-shadow-hover, 0 4px 16px var(--accent-glow));
    transform: translateY(-2px);
  }

  .play-btn:active:not(:disabled) {
    transform: translateY(1px) scale(0.93);
    box-shadow: var(--play-shadow-active, 0 1px 4px var(--accent-glow));
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
  }

  .speed-input {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--text-heading);
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 4px;
    width: 42px;
    padding: 2px 4px;
    text-align: right;
    outline: none;
  }

  .speed-input:focus {
    border-color: var(--border-focus);
  }

  .speed-x {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .speed-btn {
    background: var(--bg-surface-hover);
    border: 1px solid var(--border);
    color: var(--text-heading);
    width: 24px;
    height: 24px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
    box-shadow: var(--btn-shadow, none);
  }

  .speed-btn:hover {
    background: var(--bg-surface);
    color: var(--text-heading);
    border-color: var(--border-focus);
    transform: translateY(-1px);
  }

  .speed-btn:active {
    transform: translateY(1px) scale(0.93);
    box-shadow: var(--btn-shadow-active, none);
  }

  .speed-control input[type='range'] {
    width: 80px;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .volume-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .master-volume-slider {
    width: 60px;
  }

  @media (max-width: 600px) {
    .player-controls {
      padding: 10px 14px;
    }

    .controls-row {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .position-display {
      order: 3;
      flex: 0 0 auto;
      text-align: center;
    }

    .transport {
      order: 1;
      flex: 0 0 100%;
      justify-content: center;
    }

    .right-controls {
      order: 2;
      flex: 0 0 auto;
      flex-wrap: wrap;
      justify-content: center;
    }

    .speed-control {
      min-width: auto;
    }

    .speed-control input[type='range'] {
      width: 60px;
    }
  }
</style>
