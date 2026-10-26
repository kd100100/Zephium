<script lang="ts">
  import "$shared/ui/Menu/surface.css";
  import * as m from "$shared/i18n/messages";
  import type { SpaceIconView } from "$shared/ipc/bindings";
  import { tabs } from "$domain/tabs";
  import Button from "$shared/ui/Button";
  import { IconChoice } from "$features/tabs";
  import { untrack } from "svelte";
  import * as picking from "../lib/icon-picking.svelte";

  const id = $derived(picking.pickingId());
  const tab = $derived(id === null ? undefined : tabs.tabs().find((entry) => entry.id === id));
  // What the Essential wore when the picker opened, so Escape can put it back.
  let original = $state<SpaceIconView | null>(null);
  let icon = $state<SpaceIconView | null>(null);
  let failed = $state(false);
  let anchor = $state<HTMLElement>();
  let panel = $state<HTMLElement>();
  let place = $state<{ top: number; left: number; width: number } | null>(null);

  $effect.pre(() => {
    if (id === null) return;
    untrack(() => {
      original = tab?.custom_icon ?? null;
      icon = original;
      failed = false;
      place = null;
    });
  });

  // A tab that closed or left the Essentials has nothing left to choose for.
  $effect(() => {
    if (id !== null && tab === undefined) picking.finish();
  });

  async function choose(next: SpaceIconView | null) {
    if (id === null) return;
    icon = next;
    const result = await tabs.setTabIcon(id, next);
    failed = result.outcome === "failed" || result.outcome === "rejected";
  }

  function restore() {
    if (id !== null && JSON.stringify(icon) !== JSON.stringify(original))
      void tabs.setTabIcon(id, original);
    picking.finish();
  }

  // Above the Essential, as wide as the column: the tile itself stays in view.
  function measure() {
    if (id === null || !anchor) return;
    const tile = document.querySelector(`[data-zephium-tab-id="${CSS.escape(id)}"]`);
    const column = tile?.closest(".browser-sidebar");
    if (!tile || !column) return;
    const base = anchor.getBoundingClientRect();
    const tileBox = tile.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();
    place = {
      top: tileBox.top - base.top - 8,
      left: columnBox.left - base.left + 8,
      width: Math.max(0, columnBox.width - 16),
    };
  }

  // The column may still be opening from the rail; follow it as it settles.
  $effect(() => {
    if (id === null) return;
    const frame = requestAnimationFrame(measure);
    const column = document.querySelector(".browser-sidebar");
    const resized = new ResizeObserver(measure);
    if (column) resized.observe(column);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      window.removeEventListener("resize", measure);
    };
  });

  // Closing on the press, as every panel in the column does.
  $effect(() => {
    if (id === null) return;
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !panel?.contains(target)) picking.finish();
    };
    const away = () => picking.finish();
    // WebKit does not focus a pressed button, so Escape is heard window-wide.
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      restore();
    };
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("blur", away);
    window.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("blur", away);
      window.removeEventListener("keydown", escape, true);
    };
  });
</script>

<span bind:this={anchor} class="anchor">
  {#if tab}<div
      bind:this={panel}
      class="ui-menu ui-popover essential-icon sidebar-softens"
      role="dialog"
      aria-label={m.essential_icon_label({ name: tab.title || m.untitled_tab() })}
      data-open={place !== null}
      data-space-hue="0"
      style:top={place ? `${place.top}px` : undefined}
      style:left={place ? `${place.left}px` : undefined}
      style:width={place ? `${place.width}px` : undefined}
    >
      <IconChoice
        {icon}
        label={m.space_icon()}
        noneLabel={m.essential_icon_site()}
        onchange={(next) => void choose(next)}
      />
      {#if failed}<p class="failed" role="alert">{m.essential_icon_failed()}</p>{/if}
      <div class="actions">
        <Button size="compact" variant="primary" onclick={() => picking.finish()}
          >{m.space_done()}</Button
        >
      </div>
    </div>{/if}
</span>

<style>
  .anchor {
    position: relative;
    display: block;
    width: 0;
    height: 0;
  }

  .essential-icon {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 10px;
    translate: 0 -100%;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--motion-fast) var(--ease-out);
  }

  .essential-icon[data-open="true"] {
    opacity: 1;
    visibility: visible;
  }

  .failed {
    margin: 0;
    color: var(--color-danger);
    font-size: var(--text-caption);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  @media (prefers-reduced-motion: reduce) {
    .essential-icon {
      transition: none;
    }
  }
</style>
