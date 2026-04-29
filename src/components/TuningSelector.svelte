<script>
  /**
   * Tuning dropdown selector.
   * Shows auto-detected tuning (if present), presets, and a custom option.
   */
  import { TUNING_PRESETS, identifyTuningPreset } from '../lib/tabParser.js';

  /** @type {{ detectedTuning: string[], selectedTuning: string[], onchange: (tuning: string[]) => void }} */
  let { detectedTuning = [], selectedTuning = [], onchange = () => {} } = $props();

  const NOTE_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  let selectedPreset = $state('auto');
  let customTuning = $state(['E', 'A', 'D', 'G', 'B', 'E']);
  let showCustom = $state(false);

  // Build dropdown options
  let options = $derived.by(() => {
    const opts = [];

    if (detectedTuning.length > 0) {
      const presetName = identifyTuningPreset(detectedTuning);
      const label = presetName
        ? `${presetName} (${detectedTuning.join(' ')}) — Auto-detected`
        : `${detectedTuning.join(' ')} — Auto-detected`;
      opts.push({ value: 'auto', label });
    }

    for (const [name, notes] of Object.entries(TUNING_PRESETS)) {
      opts.push({ value: name, label: `${name} (${notes.join(' ')})` });
    }

    opts.push({ value: 'custom', label: 'Custom...' });

    return opts;
  });

  function handlePresetChange(e) {
    selectedPreset = e.target.value;

    if (selectedPreset === 'auto') {
      showCustom = false;
      onchange(detectedTuning.slice());
    } else if (selectedPreset === 'custom') {
      showCustom = true;
      onchange(customTuning.slice());
    } else {
      showCustom = false;
      const preset = TUNING_PRESETS[selectedPreset];
      if (preset) onchange(preset.slice());
    }
  }

  function handleCustomStringChange(index, e) {
    customTuning[index] = e.target.value;
    customTuning = [...customTuning];
    onchange(customTuning.slice());
  }

  // When detected tuning changes, auto-select it
  $effect(() => {
    if (detectedTuning.length > 0 && selectedPreset === 'auto') {
      onchange(detectedTuning.slice());
    }
  });
</script>

<div class="tuning-selector">
  <label for="tuning-select">Tuning</label>
  <select id="tuning-select" value={selectedPreset} onchange={handlePresetChange}>
    {#each options as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>

  {#if showCustom}
    <div class="custom-tuning">
      {#each customTuning as note, i}
        <div class="string-select">
          <span class="string-label">{customTuning.length - i}</span>
          <select
            value={note}
            onchange={(e) => handleCustomStringChange(i, e)}
          >
            {#each NOTE_OPTIONS as n}
              <option value={n}>{n}</option>
            {/each}
          </select>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tuning-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  select {
    background: var(--bg-input);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 8px 12px;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
    cursor: pointer;
  }

  select:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .custom-tuning {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 8px 0;
  }

  .string-select {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .string-label {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .string-select select {
    padding: 4px 6px;
    font-size: 0.8rem;
    min-width: 50px;
  }
</style>
