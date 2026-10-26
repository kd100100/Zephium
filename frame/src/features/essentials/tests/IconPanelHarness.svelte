<script lang="ts">
  import type { TabView } from "$shared/ipc/bindings";
  import EssentialIconPanel from "../components/EssentialIconPanel.svelte";
  import EssentialTile from "../components/EssentialTile.svelte";

  let { tab }: { tab: TabView } = $props();
  const nothing = () => {};
</script>

<div class="browser-sidebar" style="position: relative; width: 300px; height: 700px">
  <ul style="position: absolute; bottom: 20px; left: 8px; width: 80px; list-style: none">
    <EssentialTile
      {tab}
      active={false}
      splitCandidate={false}
      onSelect={nothing}
      onContextMenu={nothing}
      onPointerDown={nothing}
      onPointerMove={nothing}
      onPointerUp={nothing}
      onPointerCancel={nothing}
    />
  </ul>
  <EssentialIconPanel />
</div>
