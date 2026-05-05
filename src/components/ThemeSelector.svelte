<script>
  /** @type {{ currentStyle: string, currentColor: string, onstylechange: (style: string) => void, oncolorchange: (color: string) => void }} */
  let { currentStyle = 'neumorphic', currentColor = 'lavender', onstylechange = () => {}, oncolorchange = () => {} } = $props();

  const styles = [
    { id: 'neumorphic', label: 'Neumorphic', svg: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>' },
    { id: 'glassmorphic', label: 'Glass', svg: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
    { id: 'simple', label: 'Simple', svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' },
  ];

  const colors = [
    { id: 'lavender', label: 'Lavender', swatch: '#a78bfa' },
    { id: 'midnight', label: 'Midnight', swatch: '#d4bbff' },
    { id: 'cyberpunk', label: 'Cyberpunk', swatch: '#00ffcc' },
    { id: 'retro', label: 'Retro', swatch: '#e8a040' },
    { id: 'ocean', label: 'Ocean', swatch: '#38bdf8' },
    { id: 'rose', label: 'Rose', swatch: '#f472b6' },
  ];
</script>

<nav class="theme-nav">
  <div class="selector-group">
    <div class="selector-row style-buttons">
      {#each styles as style}
        <button
          class="style-btn"
          class:active={currentStyle === style.id}
          onclick={() => onstylechange(style.id)}
          title={style.label}
          aria-label={`Switch to ${style.label} style`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            {@html style.svg}
          </svg>
          <span class="btn-label">{style.label}</span>
        </button>
      {/each}
    </div>
    <div class="selector-row color-buttons">
      {#each colors as color}
        <button
          class="color-btn"
          class:active={currentColor === color.id}
          onclick={() => oncolorchange(color.id)}
          title={color.label}
          aria-label={`Switch to ${color.label} color`}
        >
          <span class="color-swatch" style="background: {color.swatch}"></span>
          <span class="btn-label">{color.label}</span>
        </button>
      {/each}
    </div>
  </div>
</nav>

<style>
  .theme-nav {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }

  .selector-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }

  .selector-row {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    backdrop-filter: var(--surface-blur);
    -webkit-backdrop-filter: var(--surface-blur);
  }

  .style-btn, .color-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.7rem;
    font-family: var(--sans);
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
  }

  .style-btn:hover, .color-btn:hover {
    color: var(--text-heading);
    background: var(--bg-surface-hover);
    transform: translateY(-1px);
  }

  .style-btn:active, .color-btn:active {
    transform: translateY(1px) scale(0.95);
  }

  .style-btn.active, .color-btn.active {
    color: var(--play-btn-text, #0a0a0a);
    background: var(--accent);
    box-shadow: 0 2px 8px var(--accent-glow);
  }

  .btn-label {
    font-weight: 500;
  }

  .color-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .selector-row {
      gap: 2px;
      padding: 3px;
    }

    .style-btn, .color-btn {
      padding: 5px 6px;
    }

    .btn-label {
      display: none;
    }
  }
</style>
