<script lang="ts">
  import { Globe02Icon } from "@hugeicons/core-free-icons";
  import type { TabView } from "$shared/ipc/bindings";
  import FavIcon from "$shared/ui/FavIcon";
  import { favicons } from "$domain/favicons";
  import { SpaceGlyph } from "$features/tabs";

  let { tab, size }: { tab: TabView; size: number } = $props();
</script>

<!-- The icon the person gave this Essential, so two of the same site can be
     told apart; otherwise the site's own. -->
{#if tab.custom_icon}<span class="mark" data-space-hue="0"
    ><SpaceGlyph icon={tab.custom_icon} color={0} size={size + 2} /></span
  >{:else}<FavIcon
    image={favicons.image(tab.icon)}
    tone={favicons.tone(tab.icon)}
    loading={tab.loading}
    {size}
    lit
    fallback={Globe02Icon}
  />{/if}

<style>
  .mark {
    display: grid;
    place-items: center;
  }
</style>
