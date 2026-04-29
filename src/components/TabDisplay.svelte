<script>
  /**
   * Visual tab display component.
   * Renders the parsed tab with syntax highlighting and playback position indicator.
   */

  /** @type {{
   *   rawLines: string[][],
   *   currentIndex: number,
   *   timeline: object[],
   *   isPlaying: boolean,
   * }} */
  let {
    rawLines = [],
    currentIndex = -1,
    timeline = [],
    isPlaying = false,
  } = $props();

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

  /**
   * Map a timeline index to its approximate column position in the raw text.
   * This helps us highlight the correct column during playback.
   */
  function getActiveColumn() {
    if (currentIndex < 0 || currentIndex >= timeline.length) return -1;
    return timeline[currentIndex]?.position ?? -1;
  }

  let activeCol = $derived(getActiveColumn());

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
    // Highlight a small window around the active column
    const highlightEnd = Math.min(adjustedCol + 2, content.length);
    segments.push({ text: content.substring(adjustedCol, highlightEnd), active: true });
    if (highlightEnd < content.length) {
      segments.push({ text: content.substring(highlightEnd), active: false });
    }

    return segments;
  }
</script>

{#if blocks.length > 0}
  <div class="tab-display" bind:this={displayRef}>
    <div class="tab-header">
      <span class="tab-label">Tab</span>
      {#if isPlaying}
        <span class="playing-indicator">Playing</span>
      {/if}
    </div>
    <div class="tab-content">
      {#each blocks as blockLines, blockIdx}
        <pre class="tab-block">{#each blockLines as line}{#each renderLine(line, 0) as segment}{#if segment.active}<span class="col-active">{segment.text}</span>{:else}{segment.text}{/if}{/each}
{/each}</pre>
      {/each}
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
  }

  .tab-block:last-child {
    margin-bottom: 0;
  }

  .col-active {
    background: var(--accent);
    color: #1a1625;
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
