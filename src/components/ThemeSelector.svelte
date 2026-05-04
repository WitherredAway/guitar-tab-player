<script>
  /** @type {{ currentTheme: string, onchange: (theme: string) => void }} */
  let { currentTheme = 'neumorphic', onchange = () => {} } = $props();

  const themes = [
    { id: 'neumorphic', label: 'Neumorphic', svg: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>' },
    { id: 'glassmorphic', label: 'Glass', svg: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
    { id: 'cyberpunk', label: 'Cyberpunk', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
    { id: 'retro', label: 'Retro', svg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>' },
    { id: 'midnight', label: 'Midnight', svg: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' },
  ];
</script>

<nav class="theme-nav">
  <div class="theme-buttons">
    {#each themes as theme}
      <button
        class="theme-btn"
        class:active={currentTheme === theme.id}
        onclick={() => onchange(theme.id)}
        title={theme.label}
        aria-label={`Switch to ${theme.label} theme`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
          {@html theme.svg}
        </svg>
        <span class="theme-label">{theme.label}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .theme-nav {
    display: flex;
    justify-content: center;
    padding: 8px 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .theme-buttons {
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

  .theme-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-family: var(--sans);
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
  }

  .theme-btn:hover {
    color: var(--text-heading);
    background: var(--bg-surface-hover);
  }

  .theme-btn.active {
    color: var(--play-btn-text, #0a0a0a);
    background: var(--accent);
    box-shadow: 0 2px 8px var(--accent-glow);
  }

  .theme-label {
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .theme-buttons {
      gap: 2px;
      padding: 3px;
    }

    .theme-btn {
      padding: 6px 8px;
    }

    .theme-label {
      display: none;
    }
  }
</style>
