<script>
  /** @type {{
   *   tuning: string[],
   *   volumes: number[],
   *   onchange: (index: number, volume: number) => void,
   * }} */
  let {
    tuning = [],
    volumes = [],
    onchange = () => {},
  } = $props();

  let displayLabels = $derived(
    tuning.length > 0 ? [...tuning].reverse() : []
  );

  let displayVolumes = $derived(
    volumes.length > 0 ? [...volumes].reverse() : []
  );

  function handleChange(displayIndex, value) {
    const realIndex = volumes.length - 1 - displayIndex;
    onchange(realIndex, parseFloat(value));
  }
</script>

{#if tuning.length > 0}
  <div class="string-volumes">
    <span class="section-label">String Volumes</span>
    <div class="sliders">
      {#each displayLabels as label, i}
        <div class="slider-row">
          <span class="string-label">{label}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={displayVolumes[i] ?? 1}
            oninput={(e) => handleChange(i, e.target.value)}
            class="volume-slider"
          />
          <span class="volume-value">{Math.round((displayVolumes[i] ?? 1) * 100)}%</span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .string-volumes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .sliders {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .slider-row {
    display: grid;
    grid-template-columns: 28px 1fr 40px;
    align-items: center;
    gap: 8px;
  }

  .string-label {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: center;
    font-weight: 600;
  }

  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: var(--bg-input);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    transition: height 0.15s;
  }

  .volume-slider:hover {
    height: 8px;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: var(--accent);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }

  .volume-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: var(--accent);
    border-radius: 50%;
    border: none;
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }

  .volume-value {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-align: right;
    font-family: var(--mono);
  }

  @media (max-width: 640px) {
    .slider-row {
      grid-template-columns: 24px 1fr 36px;
      gap: 6px;
    }
  }
</style>
