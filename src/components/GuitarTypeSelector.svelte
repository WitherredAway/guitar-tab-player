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
</style>
