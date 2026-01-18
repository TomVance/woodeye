<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import type { BranchInfo, CreateWorktreeOptions } from "../types";

  interface Props {
    branches: BranchInfo[];
    mainWorktreePath: string;
    onClose: () => void;
    onCreate: (options: CreateWorktreeOptions) => Promise<void>;
  }

  let { branches, mainWorktreePath, onClose, onCreate }: Props = $props();

  type BranchMode = "new" | "existing" | "detached";

  let path = $state("");
  let branchMode: BranchMode = $state("new");
  let newBranchName = $state("");
  let selectedBranch = $state("");
  let commitIsh = $state("");
  let creating = $state(false);
  let error = $state("");

  // Filter out already checked-out branches for the dropdown
  let availableBranches = $derived(
    branches.filter((b) => !b.is_checked_out)
  );

  // Auto-generate path based on branch name
  $effect(() => {
    const parentDir = mainWorktreePath.substring(0, mainWorktreePath.lastIndexOf("/"));
    const repoName = mainWorktreePath.substring(mainWorktreePath.lastIndexOf("/") + 1);

    let suffix = "";
    if (branchMode === "new" && newBranchName) {
      suffix = newBranchName.replace(/[^a-zA-Z0-9-_]/g, "-");
    } else if (branchMode === "existing" && selectedBranch) {
      suffix = selectedBranch.replace(/[^a-zA-Z0-9-_]/g, "-");
    } else if (branchMode === "detached" && commitIsh) {
      suffix = commitIsh.substring(0, 8);
    }

    if (suffix) {
      path = `${parentDir}/${repoName}-${suffix}`;
    }
  });

  async function handleBrowse() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Worktree Location",
    });

    if (selected && typeof selected === "string") {
      path = selected;
    }
  }

  async function handleCreate() {
    if (!path.trim()) {
      error = "Path is required";
      return;
    }

    if (branchMode === "new" && !newBranchName.trim()) {
      error = "Branch name is required";
      return;
    }

    if (branchMode === "existing" && !selectedBranch) {
      error = "Please select a branch";
      return;
    }

    creating = true;
    error = "";

    try {
      const options: CreateWorktreeOptions = {
        path: path.trim(),
        new_branch: branchMode === "new" ? newBranchName.trim() : null,
        commit_ish:
          branchMode === "existing"
            ? selectedBranch
            : branchMode === "detached"
            ? commitIsh.trim() || "HEAD"
            : null,
        detach: branchMode === "detached",
      };

      await onCreate(options);
      onClose();
    } catch (e) {
      error = String(e);
    } finally {
      creating = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">
    <div class="dialog-header">
      <h2 id="dialog-title">Create Worktree</h2>
      <button class="close-btn" onclick={onClose} disabled={creating} aria-label="Close dialog">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="dialog-body">
      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="form-group">
        <label for="path">Worktree Path</label>
        <div class="path-input">
          <input
            id="path"
            type="text"
            bind:value={path}
            placeholder="/path/to/worktree"
            disabled={creating}
          />
          <button class="browse-btn" onclick={handleBrowse} disabled={creating}>
            Browse
          </button>
        </div>
      </div>

      <div class="form-group" role="group" aria-labelledby="branch-option-label">
        <span id="branch-option-label" class="group-label">Branch Option</span>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              name="branchMode"
              value="new"
              bind:group={branchMode}
              disabled={creating}
            />
            <span class="radio-label">Create new branch</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="branchMode"
              value="existing"
              bind:group={branchMode}
              disabled={creating}
            />
            <span class="radio-label">Use existing branch</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="branchMode"
              value="detached"
              bind:group={branchMode}
              disabled={creating}
            />
            <span class="radio-label">Detached HEAD</span>
          </label>
        </div>
      </div>

      {#if branchMode === "new"}
        <div class="form-group">
          <label for="newBranch">New Branch Name</label>
          <input
            id="newBranch"
            type="text"
            bind:value={newBranchName}
            placeholder="feature/my-branch"
            disabled={creating}
          />
        </div>
      {:else if branchMode === "existing"}
        <div class="form-group">
          <label for="existingBranch">Select Branch</label>
          <select
            id="existingBranch"
            bind:value={selectedBranch}
            disabled={creating}
          >
            <option value="">-- Select a branch --</option>
            {#each availableBranches as branch}
              <option value={branch.name}>
                {branch.name}
                {#if branch.is_remote}(remote){/if}
              </option>
            {/each}
          </select>
          {#if availableBranches.length === 0}
            <p class="hint">All branches are already checked out in worktrees.</p>
          {/if}
        </div>
      {:else if branchMode === "detached"}
        <div class="form-group">
          <label for="commitIsh">Commit/Tag/Branch (optional)</label>
          <input
            id="commitIsh"
            type="text"
            bind:value={commitIsh}
            placeholder="HEAD, commit SHA, tag, or branch"
            disabled={creating}
          />
          <p class="hint">Leave empty to use HEAD</p>
        </div>
      {/if}
    </div>

    <div class="dialog-footer">
      <button class="cancel-btn" onclick={onClose} disabled={creating}>
        Cancel
      </button>
      <button class="create-btn" onclick={handleCreate} disabled={creating}>
        {#if creating}
          <span class="spinner"></span>
          Creating...
        {:else}
          Create
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .dialog-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
  }

  .close-btn:hover:not(:disabled) {
    background: var(--color-bg);
    color: var(--color-text);
  }

  .close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dialog-body {
    padding: var(--space-lg);
    overflow-y: auto;
    flex: 1;
  }

  .error-message {
    padding: var(--space-sm) var(--space-md);
    background: rgba(248, 113, 113, 0.1);
    color: var(--color-error);
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-md);
    font-size: 0.9rem;
  }

  .form-group {
    margin-bottom: var(--space-lg);
  }

  .form-group label,
  .group-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: var(--space-sm);
    color: var(--color-text);
  }

  .path-input {
    display: flex;
    gap: var(--space-sm);
  }

  .path-input input {
    flex: 1;
  }

  input,
  select {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: inherit;
    transition: border-color 0.15s;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  input:disabled,
  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  select {
    cursor: pointer;
  }

  .browse-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .browse-btn:hover:not(:disabled) {
    background: var(--color-bg-card);
    border-color: var(--color-primary);
  }

  .browse-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    transition: background-color 0.15s;
  }

  .radio-option:hover {
    background: var(--color-bg);
  }

  .radio-option input[type="radio"] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }

  .radio-label {
    font-size: 0.9rem;
    color: var(--color-text);
  }

  .hint {
    margin-top: var(--space-xs);
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .cancel-btn,
  .create-btn {
    padding: var(--space-sm) var(--space-lg);
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: opacity 0.15s, background-color 0.15s;
  }

  .cancel-btn {
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text);
  }

  .cancel-btn:hover:not(:disabled) {
    background: var(--color-bg);
  }

  .cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .create-btn {
    border: none;
    background: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 100px;
    justify-content: center;
  }

  .create-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .create-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
