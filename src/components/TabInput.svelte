<script>
  /**
   * Tab input textarea component.
   * Accepts pasted guitar tablature and emits the raw text on change.
   */

  /** @type {string} */
  let { value = '', oninput = () => {} } = $props();

  const EXAMPLE_TAB = `e|3----5h8-5h8p5\\3-3p0-----------------|------0-------0--------0-------0|
C|----------------------2h4---2p0-2/4-2|2---2---2---2----2---2----2--2--|
G|-------------------------------------|--------------------------------|
C|-------------------------------------|--------------------------------|
G|-------------------------------------|--------------------------------|
C|0--0-----0-----0----0---0-------0----|2-2-----2-2------2-2------2-----|

e|----0h3-0h3p0-----1p0--------|------------------------------------|
C|2-------------2p0-----2p0----|--------0------------0-----------0--|
G|--------------------------2p0|------------------------------------|
C|-----------------------------|--0h2h4---4--4/7-2-2---2p0----------|
G|-----------------------------|---------------------------2p0------|
C|2-2-----2-----2p0------------|0------------0---0-------------0---0|

e|3----5h8-5h8p5\\3-3p0-----------------|------0-------0-------------|
C|----------------------2h4---2p0-2/4-2|2---2---2---2----2p0---0---0|
G|-------------------------------------|----------------------------|
C|-------------------------------------|----------------------------|
G|-------------------------------------|----------------------------|
C|0--0-----0-----0----0---0-------0----|2-2-----2-2------2---2---2--|

e|----0-------0-----0------|----------------------------------|
C|----2/4-----2-----2/4\\2p0|--------0------------0---------0--|
G|0h2-0---0h2-0-----0------|----------------------------------|
C|----2/4-----2-----2/4\\2p0|--0h2h4---4--4/7-2-2---2p0-0------|
G|----0-------0-----0------|----------------------------------|
C|-------------------------|0------------0---0-----------0---0|`;

  function loadExample() {
    value = EXAMPLE_TAB;
    oninput(value);
  }

  function handleInput(e) {
    value = e.target.value;
    oninput(value);
  }
</script>

<div class="tab-input">
  <div class="input-header">
    <label for="tab-textarea">Paste your tablature</label>
    <button class="example-btn" onclick={loadExample}>Load Example</button>
  </div>
  <textarea
    id="tab-textarea"
    {value}
    oninput={handleInput}
    placeholder="Paste guitar tab here...

e|--0--2--3--|
B|-----------|
G|-----------|
D|-----------|
A|-----------|
E|-----------|"
    spellcheck="false"
    autocomplete="off"
  ></textarea>
</div>

<style>
  .tab-input {
    width: 100%;
  }

  .input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .example-btn {
    background: var(--bg-surface);
    color: var(--accent);
    border: 1px solid var(--border);
    padding: 4px 12px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    transition: background 0.2s, border-color 0.2s;
  }

  .example-btn:hover {
    background: var(--bg-surface-hover);
    border-color: var(--accent);
  }

  textarea {
    width: 100%;
    min-height: 200px;
    max-height: 400px;
    background: var(--bg-input);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px;
    font-family: var(--mono);
    font-size: 0.8rem;
    line-height: 1.5;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    white-space: pre;
    overflow-x: auto;
  }

  textarea:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  textarea::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
</style>
