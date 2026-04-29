<script>
  /**
   * Visual tab display component.
   * Renders the parsed tab with syntax highlighting and playback position indicator.
   */

  /** @type {{
   *   rawLines: string[][],
   *   currentIndex: number,
   *   activePosition: number,
   *   timeline: object[],
   *   isPlaying: boolean,
   *   onseek: (index: number) => void,
   *   onedit: (text: string) => void,
   * }} */
  let {
    rawLines = [],
    currentIndex = -1,
    activePosition = 0,
    timeline = [],
    isPlaying = false,
    onseek = () => {},
    onedit = () => {},
  } = $props();

  let editing = $state(false);
  let editText = $state('');

  let displayRef = $state(null);

  /**
   * Build a highlighted version of the raw tab text.
   * We map each column position to a timeline index so we can highlight
   * the current column during playback.
   */
  let blocks = $derived.by(() => {
    if (rawLines.length === 0) return [];

    return rawLines.map((blockLines) => {
      return blockLines.map((line) => line);
    });
  });

  // Auto-scroll to keep current position visible
  $effect(() => {
    if (isPlaying && displayRef) {
      const highlighted = displayRef.querySelector('.col-active');
      if (highlighted) {
        highlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  });

  let activeCol = $derived(
    currentIndex < 0 || currentIndex >= timeline.length ? -1 : activePosition
  );

  /**
   * Render a tab line with column highlighting.
   * Characters at the active column position get a highlight class.
   */
  function renderLine(line, blockOffset) {
    if (activeCol < 0) return [{ text: line, active: false }];

    // Find the pipe that starts content
    const pipeIdx = line.indexOf('|');
    if (pipeIdx < 0) return [{ text: line, active: false }];

    const label = line.substring(0, pipeIdx + 1);
    const content = line.substring(pipeIdx + 1);

    // The active column is relative to content (after first |)
    const adjustedCol = activeCol - blockOffset;
    if (adjustedCol < 0 || adjustedCol >= content.length) {
      return [{ text: line, active: false }];
    }

    const segments = [];
    segments.push({ text: label, active: false });
    if (adjustedCol > 0) {
      segments.push({ text: content.substring(0, adjustedCol), active: false });
    }
    const highlightEnd = Math.min(adjustedCol + 1, content.length);
    segments.push({ text: content.substring(adjustedCol, highlightEnd), active: true });
    if (highlightEnd < content.length) {
      segments.push({ text: content.substring(highlightEnd), active: false });
    }

    return segments;
  }

  function handleTabClick(e) {
    if (timeline.length === 0) return;
    const pre = e.currentTarget;
    const rect = pre.getBoundingClientRect();
    const x = e.clientX - rect.left + pre.scrollLeft;

    // Measure actual character width using a temporary span
    const span = document.createElement('span');
    span.textContent = 'M';
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.font = getComputedStyle(pre).font;
    document.body.appendChild(span);
    const charWidth = span.getBoundingClientRect().width;
    span.remove();

    const clickedCol = Math.floor(x / charWidth);
    const firstLine = rawLines[0]?.[0] || '';
    const pipeIdx = firstLine.indexOf('|');
    const contentCol = Math.max(0, clickedCol - (pipeIdx + 1));
    onseek(contentCol);
  }

  function startEditing() {
    editText = rawLines.map(block => block.join('\n')).join('\n\n');
    editing = true;
  }

  function saveEdit() {
    editing = false;
    onedit(editText);
  }

  function cancelEdit() {
    editing = false;
  }
</script>

{#if blocks.length > 0}
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
        {#each blocks as blockLines, blockIdx}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
          <pre class="tab-block" onclick={handleTabClick}>{#each blockLines as line}{#each renderLine(line, 0) as segment}{#if segment.active}<span class="col-active">{segment.text}</span>{:else}{segment.text}{/if}{/each}
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
  }

  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: var(--bg-surface);
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
    transition: background 0.2s, border-color 0.2s;
  }

  .edit-btn:hover {
    background: var(--accent);
    color: #0a0a0a;
    border-color: var(--accent);
  }

  .cancel-btn {
    background: transparent;
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
