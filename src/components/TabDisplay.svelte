<script>
  /**
   * Visual tab display with column highlighting, click-to-seek, and inline editing.
   */

  /** @type {{
   *   rawLines: string[][],
   *   activePosition: number,
   *   totalColumns: number,
   *   colMaps: Array<{posToCol: number[], offset: number, totalPositions: number}>,
   *   isPlaying: boolean,
   *   onseek: (position: number) => void,
   *   onedit: (text: string) => void,
   *   onuiclick: () => void,
   * }} */
  let {
    rawLines = [],
    activePosition = -1,
    totalColumns = 0,
    colMaps = [],
    isPlaying = false,
    onseek = () => {},
    onedit = () => {},
    onuiclick = () => {},
  } = $props();

  let editing = $state(false);
  let editText = $state('');
  let displayRef = $state(null);

  let hasContent = $derived(rawLines.length > 0 && rawLines.some(b => b.length > 0));

  // Auto-scroll to keep highlighted column visible
  $effect(() => {
    if (isPlaying && displayRef) {
      const el = displayRef.querySelector('.col-active');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  /**
   * Get the character column and visual width for the active position within
   * a given block index. Width covers multi-digit frets so the highlight
   * spans e.g. both characters of "12".
   */
  function getActiveCol(blockIndex) {
    if (activePosition < 0 || !colMaps[blockIndex]) return { col: -1, width: 1 };
    const map = colMaps[blockIndex];
    const localPos = activePosition - map.offset;
    if (localPos < 0 || localPos >= map.totalPositions) return { col: -1, width: 1 };
    const col = map.posToCol[localPos] ?? -1;
    const width = map.posToWidth?.[localPos] ?? 1;
    return { col, width };
  }

  /**
   * Split a tab line into segments: [before-highlight, highlight, after-highlight].
   */
  function renderLine(line, blockIndex) {
    const { col, width } = getActiveCol(blockIndex);
    if (col < 0) return [{ text: line, active: false }];

    const pipeIdx = line.indexOf('|');
    if (pipeIdx < 0) return [{ text: line, active: false }];

    const label = line.substring(0, pipeIdx + 1);
    const content = line.substring(pipeIdx + 1);
    const contentCol = col;

    if (contentCol < 0 || contentCol >= content.length) return [{ text: line, active: false }];

    const endCol = Math.min(contentCol + Math.max(1, width), content.length);

    const segments = [{ text: label, active: false }];
    if (contentCol > 0) segments.push({ text: content.substring(0, contentCol), active: false });
    segments.push({ text: content.substring(contentCol, endCol), active: true });
    if (endCol < content.length) segments.push({ text: content.substring(endCol), active: false });
    return segments;
  }

  function handleTabClick(e, blockIndex) {
    if (totalColumns === 0 || !colMaps[blockIndex]) return;
    const pre = e.currentTarget;
    const x = e.clientX - pre.getBoundingClientRect().left + pre.scrollLeft;

    // Measure monospace char width
    const span = document.createElement('span');
    span.textContent = 'M';
    span.style.cssText = `visibility:hidden;position:absolute;font:${getComputedStyle(pre).font}`;
    document.body.appendChild(span);
    const charWidth = span.getBoundingClientRect().width;
    span.remove();

    const clickedCharCol = Math.floor(x / charWidth);
    const firstLine = rawLines[blockIndex]?.[0] || '';
    const pipeIdx = firstLine.indexOf('|');
    const contentCol = clickedCharCol - (pipeIdx + 1);

    // Reverse-lookup: find the position whose character column is closest
    const map = colMaps[blockIndex];
    let bestPos = 0;
    for (let p = 0; p < map.totalPositions; p++) {
      if (map.posToCol[p] <= contentCol) bestPos = p;
    }
    onseek(Math.max(0, Math.min(map.offset + bestPos, totalColumns - 1)));
  }

  function startEditing() {
    onuiclick();
    editText = rawLines.map(block => block.join('\n')).join('\n\n');
    editing = true;
  }

  function saveEdit() {
    onuiclick();
    editing = false;
    onedit(editText);
  }

  function cancelEdit() {
    onuiclick();
    editing = false;
  }

  let hasSelection = $derived(activePosition >= 0 && totalColumns > 0);

  function findBlockAndCol() {
    for (let i = 0; i < colMaps.length; i++) {
      const map = colMaps[i];
      const localPos = activePosition - map.offset;
      if (localPos >= 0 && localPos < map.totalPositions) {
        const contentCol = map.posToCol[localPos] ?? -1;
        return { blockIndex: i, contentCol };
      }
    }
    return null;
  }

  function spanAt(content, col) {
    if (col < 0 || col >= content.length) return [col, col];
    const ch = content[col];
    if (/\d/.test(ch)) {
      let start = col;
      while (start > 0 && /\d/.test(content[start - 1])) start--;
      let end = col;
      while (end + 1 < content.length && /\d/.test(content[end + 1])) end++;
      return [start, end + 1];
    }
    return [col, col + 1];
  }

  function getBlockContents(block, contentCol) {
    const parts = [];
    for (const line of block) {
      const pipeIdx = line.indexOf('|');
      if (pipeIdx < 0) { parts.push(null); continue; }
      const content = line.substring(pipeIdx + 1);
      const [start, end] = spanAt(content, contentCol);
      parts.push({ label: line.substring(0, pipeIdx + 1), content, start, end });
    }
    return parts;
  }

  function removeColumn() {
    onuiclick();
    const info = findBlockAndCol();
    if (!info || info.contentCol < 0) return;
    const { blockIndex, contentCol } = info;
    const newLines = rawLines.map((block, bi) => {
      if (bi !== blockIndex) return block;
      const parts = getBlockContents(block, contentCol);
      const maxWidth = Math.max(...parts.map(p => p ? p.end - p.start : 0));
      return block.map((line, li) => {
        const p = parts[li];
        if (!p || contentCol >= p.content.length) return line;
        const removeEnd = Math.min(p.start + maxWidth, p.content.length);
        return p.label + p.content.substring(0, p.start) + p.content.substring(removeEnd);
      });
    });
    onedit(newLines.map(block => block.join('\n')).join('\n\n'));
  }

  function insertColumn() {
    onuiclick();
    const info = findBlockAndCol();
    if (!info || info.contentCol < 0) return;
    const { blockIndex, contentCol } = info;
    const newLines = rawLines.map((block, bi) => {
      if (bi !== blockIndex) return block;
      const parts = getBlockContents(block, contentCol);
      const maxEnd = Math.max(...parts.map(p => p ? p.end : 0));
      return block.map((line, li) => {
        const p = parts[li];
        if (!p) return line;
        const insertAt = Math.min(maxEnd, p.content.length);
        return p.label + p.content.substring(0, insertAt) + '-' + p.content.substring(insertAt);
      });
    });
    onedit(newLines.map(block => block.join('\n')).join('\n\n'));
  }
</script>

{#if hasContent}
  <div class="tab-display" bind:this={displayRef}>
    <div class="tab-header">
      <span class="tab-label">Tab</span>
      <div class="tab-header-right">
        {#if isPlaying}
          <span class="playing-indicator">Playing</span>
        {/if}
        {#if editing}
          <button class="edit-btn" onclick={saveEdit}>Save</button>
          <button class="edit-btn cancel-btn" onclick={cancelEdit}>Cancel</button>
        {:else}
          <button class="edit-btn col-btn" onclick={removeColumn} disabled={!hasSelection} title="Remove selected column">− Col</button>
          <button class="edit-btn col-btn" onclick={insertColumn} disabled={!hasSelection} title="Insert empty column after selected">+ Col</button>
          <button class="edit-btn" onclick={startEditing}>Edit</button>
        {/if}
      </div>
    </div>
    <div class="tab-content">
      {#if editing}
        <textarea
          class="tab-edit-textarea"
          bind:value={editText}
        ></textarea>
      {:else}
        {#each rawLines as blockLines, blockIndex}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
          <pre class="tab-block" onclick={(e) => handleTabClick(e, blockIndex)}>{#each blockLines as line}{#each renderLine(line, blockIndex) as segment}{#if segment.active}<span class="col-active">{segment.text}</span>{:else}{segment.text}{/if}{/each}
{/each}</pre>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .tab-display {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow);
    backdrop-filter: var(--surface-blur, none);
    -webkit-backdrop-filter: var(--surface-blur, none);
  }

  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: var(--surface-bg, var(--bg-surface));
    border-bottom: 1px solid var(--border);
  }

  .tab-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .tab-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .edit-btn {
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--bg-surface-hover);
    color: var(--text-heading);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--btn-shadow, none);
  }

  .edit-btn:hover {
    background: var(--accent);
    color: #0a0a0a;
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .edit-btn:active {
    transform: translateY(1px) scale(0.95);
    box-shadow: var(--btn-shadow-active, none);
  }

  .cancel-btn {
    background: transparent;
  }

  .col-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .col-btn:disabled:hover {
    background: var(--bg-surface-hover);
    color: var(--text-heading);
    border-color: var(--border);
  }

  .tab-edit-textarea {
    width: 100%;
    min-height: 200px;
    background: var(--bg-input);
    color: var(--text);
    border: none;
    font-family: var(--mono);
    font-size: 0.8rem;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    padding: 0;
    white-space: pre;
    overflow-x: auto;
  }

  .playing-indicator {
    font-size: 0.75rem;
    color: var(--success);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .playing-indicator::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .tab-content {
    padding: 16px;
    overflow-x: auto;
    background: var(--bg-input);
  }

  .tab-block {
    font-family: var(--mono);
    font-size: 0.8rem;
    line-height: 1.6;
    color: var(--text);
    margin: 0 0 16px;
    white-space: pre;
    tab-size: 4;
    cursor: pointer;
  }

  .tab-block:last-child {
    margin-bottom: 0;
  }

  .col-active {
    background: var(--accent);
    color: #0a0a0a;
    border-radius: 2px;
    padding: 0 1px;
  }

  @media (max-width: 640px) {
    .tab-content {
      padding: 12px;
    }

    .tab-block {
      font-size: 0.7rem;
    }
  }
</style>
