<script lang="ts">
  import { onMount } from "svelte";
  import { open } from "@tauri-apps/plugin-dialog";
  import WorktreeDropdown from "./WorktreeDropdown.svelte";
  import { getTheme, setTheme, type Theme } from "../store";
  import type { Worktree } from "../types";

  let theme: Theme = $state("system");

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute("data-theme", t);
  }

  function cycleTheme() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    theme = next;
    setTheme(next);
    applyTheme(next);
  }

  onMount(() => {
    theme = getTheme();
    applyTheme(theme);
  });

  interface Props {
    repoPath: string;
    worktrees: Worktree[];
    selectedWorktree: Worktree | null;
    loading: boolean;
    refreshing: boolean;
    hasExternalChanges: boolean;
    onLoadRepo: (path: string) => void;
    onSelectWorktree: (worktree: Worktree) => void;
    onCreateWorktree: () => void;
    onDeleteWorktree: (worktree: Worktree) => void;
    onPruneWorktrees: () => void;
    onRefresh: () => void;
  }

  let {
    repoPath = $bindable(),
    worktrees,
    selectedWorktree,
    loading,
    refreshing,
    hasExternalChanges,
    onLoadRepo,
    onSelectWorktree,
    onCreateWorktree,
    onDeleteWorktree,
    onPruneWorktrees,
    onRefresh,
  }: Props = $props();

  async function handleBrowse() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Git Repository",
    });

    if (selected && typeof selected === "string") {
      repoPath = selected;
      onLoadRepo(selected);
    }
  }
</script>

<header class="content-toolbar">
  <div class="toolbar-logo">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
    <span>Woodeye</span>
  </div>

  <div class="repo-section">
    <div class="input-wrapper">
      <svg class="folder-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
      <input
        type="text"
        bind:value={repoPath}
        placeholder="Repository path..."
        disabled={loading}
        onkeydown={(e) => e.key === "Enter" && onLoadRepo(repoPath)}
      />
    </div>
    <button class="browse-btn" onclick={handleBrowse} disabled={loading} title="Browse">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
    </button>
    <button
      class="load-btn"
      onclick={() => onLoadRepo(repoPath)}
      disabled={loading || !repoPath.trim()}
    >
      {#if loading}
        <span class="btn-spinner"></span>
      {:else}
        Load
      {/if}
    </button>
  </div>

  {#if worktrees.length > 0}
    <div class="worktree-section">
      <WorktreeDropdown
        {worktrees}
        {selectedWorktree}
        {onSelectWorktree}
        {onCreateWorktree}
        {onDeleteWorktree}
        {onPruneWorktrees}
        {loading}
      />
    </div>
  {/if}

  <div class="toolbar-actions">
    <button
      class="theme-btn"
      onclick={cycleTheme}
      title={theme === "system" ? "Theme: System" : theme === "light" ? "Theme: Light" : "Theme: Dark"}
    >
      {#if theme === "system"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      {:else if theme === "light"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      {:else}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      {/if}
    </button>
    <button
      class="refresh-btn"
      class:has-changes={hasExternalChanges}
      onclick={onRefresh}
      disabled={refreshing || loading || worktrees.length === 0}
      title={hasExternalChanges ? "Changes detected - click to refresh" : "Refresh"}
    >
      <svg class:spinning={refreshing} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-9-9"/>
        <path d="M21 3v9h-9"/>
      </svg>
    </button>
  </div>
</header>

<style>
  .content-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-md) var(--space-xl);
    background: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border);
    min-height: 60px;
  }

  .toolbar-logo {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--color-text);
    font-weight: 600;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .toolbar-logo svg {
    color: var(--color-primary);
  }

  .repo-section {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
    max-width: 400px;
  }

  .input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .folder-icon {
    position: absolute;
    left: var(--space-sm);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .input-wrapper input {
    width: 100%;
    padding: var(--space-sm) var(--space-sm) var(--space-sm) 32px;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: ui-monospace, monospace;
    transition: border-color 0.15s, background-color 0.15s;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .input-wrapper input::placeholder {
    color: var(--color-text-muted);
  }

  .input-wrapper input:disabled {
    opacity: 0.6;
  }

  .browse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }

  .browse-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .browse-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .load-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.85rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    color: white;
    cursor: pointer;
    transition: opacity 0.15s;
    min-width: 60px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .load-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .load-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .worktree-section {
    flex: 1;
    min-width: 0;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-left: auto;
  }

  .theme-btn,
  .refresh-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  }

  .theme-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .refresh-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .refresh-btn.has-changes {
    color: var(--color-warning);
    border-color: var(--color-warning);
    position: relative;
  }

  .refresh-btn.has-changes::after {
    content: "";
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    background: var(--color-warning);
    border-radius: 50%;
  }

  .refresh-btn .spinning {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
