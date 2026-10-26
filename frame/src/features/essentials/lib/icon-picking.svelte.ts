import { expandBriefly } from "$session/sidebar-mode.svelte";

/** The Essential whose icon is being chosen, and the release of a column
 *  expanded from the rail only to show the picker. */
let picking = $state.raw<{ id: string; release: () => void } | null>(null);

export const pickingId = () => picking?.id ?? null;

/** Opens the picker on one Essential; the rail opens to the full column. */
export function pick(id: string) {
  picking?.release();
  picking = { id, release: expandBriefly() };
}

export function finish() {
  picking?.release();
  picking = null;
}
