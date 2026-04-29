<script>
  /**
   * Guitar type selector — acoustic or electric.
   */

  /** @type {{ value: string, onchange: (type: string) => void }} */
  let { value = 'acoustic', onchange = () => {} } = $props();

  function handleChange(e) {
    onchange(e.target.value);
  }
</script>

<div class="guitar-type-selector">
  <label for="guitar-type-select">Guitar Type</label>
  <select id="guitar-type-select" {value} onchange={handleChange}>
    <option value="acoustic">Acoustic</option>
    <option value="electric">Electric</option>
  </select>
</div>

<style>
  .guitar-type-selector {
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
</style>
