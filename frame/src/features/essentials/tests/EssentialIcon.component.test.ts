import { afterEach, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import "$styles/global.css";
import type { SpaceIconView, TabView } from "$shared/ipc/bindings";
import { emitNativeEvent } from "$shared/testing/native-events";
import { revision, tabFixture } from "$shared/testing/fixtures";
import { tabs } from "$domain/tabs";
import { finish, pick } from "../lib/icon-picking.svelte";
import IconPanelHarness from "./IconPanelHarness.svelte";

const native = vi.hoisted(() => ({ setIcon: vi.fn() }));

vi.mock("$shared/ipc/bindings", async () => {
  const { mockBindings } = await import("$shared/testing/bindings");
  return mockBindings({
    tabsBootstrap: async () => {},
    tabsSetIcon: native.setIcon.mockImplementation(async () => ({
      accepted: true,
      operation_id: null,
    })),
  });
});

let projection = 100;
function project(tab: TabView) {
  emitNativeEvent("itemsChanged", {
    projection_revision: revision((projection += 1)),
    profile: { id: "p", name: "Personal", kind: "default" },
    spaces: [],
    active_space_id: null,
    nodes: [
      { id: tab.id, parent_id: null, section: "favorites", kind: { type: "tab", tab_id: tab.id } },
    ],
    tabs: [tab],
    active: null,
    split_group: null,
  });
}

// Every test's tab is newer than the last, so the projection takes it.
let tabRevision = 1;
const mail = (custom_icon: SpaceIconView | null = null) =>
  tabFixture({
    id: "mail",
    projection_revision: revision((tabRevision += 1)),
    title: "Inbox",
    url: "https://mail.google.com/",
    custom_icon,
  });

async function mount(tab: TabView) {
  await page.viewport(420, 760);
  await tabs.init();
  project(tab);
  return render(IconPanelHarness, { tab });
}

afterEach(() => {
  finish();
  native.setIcon.mockClear();
});

test("an Essential shows the icon it was given instead of its site's", async () => {
  const screen = await mount(mail({ kind: "emoji", text: "💼" }));
  await expect.element(screen.getByText("💼")).toBeVisible();
});

test("choosing an icon applies at once, and Escape puts the old one back", async () => {
  const screen = await mount(mail());
  pick("mail");
  const dialog = screen.getByRole("dialog", { name: "Icon for Inbox" });
  await expect.element(dialog).toBeVisible();

  await screen.getByRole("radio", { name: "Symbol 3" }).click();
  expect(native.setIcon).toHaveBeenLastCalledWith("mail", { kind: "symbol", index: 2 });

  await userEvent.keyboard("{Escape}");
  expect(native.setIcon).toHaveBeenLastCalledWith("mail", null);
  await expect.element(dialog).not.toBeInTheDocument();
});

test("the site's own icon is a choice too", async () => {
  const screen = await mount(mail({ kind: "symbol", index: 4 }));
  pick("mail");
  await screen.getByRole("radio", { name: "Site icon" }).click();
  expect(native.setIcon).toHaveBeenLastCalledWith("mail", null);
  await screen.getByRole("button", { name: "Done" }).click();
  await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
});
