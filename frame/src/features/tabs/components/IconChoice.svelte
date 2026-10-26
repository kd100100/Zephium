<script lang="ts">
  import * as m from "$shared/i18n/messages";
  import { UnavailableIcon } from "@hugeicons/core-free-icons";
  import type { SpaceIconView } from "$shared/ipc/bindings";
  import Icon from "$shared/ui/Icon";
  import "./space-hue.css";
  import { SPACE_SYMBOLS, emojiOf } from "../lib/space-look";

  let {
    icon,
    label,
    noneLabel,
    onchange,
  }: {
    icon: SpaceIconView | null;
    label: string;
    /** What choosing no icon means where this picker is used. */
    noneLabel: string;
    onchange: (icon: SpaceIconView | null) => void;
  } = $props();

  const labelId = $props.id();
  let emoji = $state("");
  $effect.pre(() => {
    if (icon?.kind === "emoji") emoji = icon.text;
  });

  function typeEmoji(text: string) {
    emoji = text;
    const found = emojiOf(text);
    if (found) onchange({ kind: "emoji", text: found });
  }
</script>

<!-- One emoji typed or pasted, one of the curated symbols, or none: the same
     choice wherever a person marks something of theirs. -->
<div class="group" role="radiogroup" aria-labelledby={labelId}>
  <div class="group-head">
    <span id={labelId}>{label}</span>
    <input
      class="emoji-field"
      value={emoji}
      oninput={(event) => typeEmoji(event.currentTarget.value)}
      onfocus={() => icon?.kind !== "emoji" && emojiOf(emoji) && typeEmoji(emoji)}
      placeholder={m.space_emoji_short()}
      aria-label={m.space_emoji_placeholder()}
      data-on={icon?.kind === "emoji" || undefined}
      maxlength={16}
    />
  </div>
  <div class="symbols">
    <button
      type="button"
      role="radio"
      class="symbol symbol-none"
      aria-checked={icon === null}
      aria-label={noneLabel}
      title={noneLabel}
      onclick={() => onchange(null)}
      ><Icon icon={UnavailableIcon} size={15} strokeWidth={1.6} /></button
    >
    {#each SPACE_SYMBOLS as symbol, index (index)}
      <button
        type="button"
        role="radio"
        class="symbol"
        aria-checked={icon?.kind === "symbol" && icon.index === index}
        aria-label={m.space_symbol({ index: String(index + 1) })}
        onclick={() => onchange({ kind: "symbol", index })}
        ><Icon icon={symbol} size={15} strokeWidth={1.8} /></button
      >
    {/each}
  </div>
</div>

<style>
  .group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 20px;
    padding-inline: 2px;
    color: var(--color-faint);
    font-size: var(--text-caption);
    font-weight: 550;
    letter-spacing: 0.01em;
  }

  .emoji-field {
    width: 64px;
    height: 20px;
    padding-inline: 8px;
    border: 0;
    border-radius: var(--radius-capsule);
    background: var(--row-hover);
    color: var(--color-text);
    font: inherit;
    font-size: var(--text-label);
    text-align: center;
    outline: none;
  }

  .emoji-field::placeholder {
    color: var(--color-faint);
  }

  .emoji-field:focus {
    background: var(--row-active);
  }

  .emoji-field[data-on] {
    background: var(--row-active);
    box-shadow: inset 0 0 0 1px var(--space-hue);
  }

  .symbols {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(24px, 1fr));
    gap: 1px;
  }

  .symbol {
    display: grid;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-inset);
    background: transparent;
    color: var(--color-muted);
    place-items: center;
    transition:
      background-color var(--motion-instant) var(--ease-out),
      color var(--motion-instant) var(--ease-out);
  }

  .symbol-none {
    color: var(--color-faint);
  }

  .symbol:hover,
  .symbol:focus-visible {
    outline: none;
    background: var(--row-hover);
    color: var(--color-text);
  }

  .symbol[aria-checked="true"] {
    background: var(--row-active);
    color: var(--space-ink);
  }

  .symbol-none[aria-checked="true"] {
    color: var(--color-text);
  }
</style>
