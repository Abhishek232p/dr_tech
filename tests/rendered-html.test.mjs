import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(path = "/en") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("root redirects to the default locale", async () => {
  const response = await render("/");
  assert.equal(response.status, 307);
  const location = response.headers.get("location");
  assert.ok(location && location.endsWith("/en"), `Expected redirect to /en, got: ${location}`);
});

test("server-renders the anatomy app shell for /en", async () => {
  const response = await render("/en");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  // The page title from the English UI dictionary.
  assert.match(html, /dr_tech/);
  // The HTML lang attribute should be set to the locale.
  assert.match(html, /lang="en"/);
});

test("anatomy app has the expected file structure", async () => {
  // Core layout and page live under [locale], not at app root.
  const [layout, page, anatomyApp, organViewer, anatomyData, i18nConfig, i18nDicts, packageJson] =
    await Promise.all([
      readFile(new URL("../app/[locale]/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AnatomyApp.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/OrganViewer.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/lib/anatomy-data.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/i18n/config.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/i18n/dictionaries.ts", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);

  // Layout sets HTML lang and dir, loads fonts, imports globals.css.
  assert.match(layout, /lang=\{config\.code\}/);
  assert.match(layout, /dir=\{config\.dir\}/);
  assert.match(layout, /globals\.css/);
  assert.match(layout, /generateStaticParams/);

  // Page renders AnatomyApp with locale and dictionary.
  assert.match(page, /AnatomyApp/);
  assert.match(page, /getDictionary/);
  assert.match(page, /getLocale/);

  // AnatomyApp is a "use client" component with the main UI.
  assert.match(anatomyApp, /"use client"/);
  assert.match(anatomyApp, /OrganViewer/);
  assert.match(anatomyApp, /organ-library/);

  // OrganViewer manages Three.js rendering.
  assert.match(organViewer, /"use client"/);
  assert.match(organViewer, /three\/viewer/);

  // Anatomy data defines all organ structures.
  assert.match(anatomyData, /organStructures/);
  assert.match(anatomyData, /heart/);
  assert.match(anatomyData, /brain/);

  // i18n config defines all supported locales.
  assert.match(i18nConfig, /defaultLocale/);
  assert.match(i18nConfig, /"en"/);

  // Dictionaries wire up lazy imports for each locale.
  assert.match(i18nDicts, /getDictionary/);

  // All 12 locale UI files exist.
  const uiLocales = await readdir(new URL("../app/i18n/ui", import.meta.url));
  for (const code of ["en", "es", "hi", "zh", "ar", "pt", "fr", "de", "ja", "ru", "id", "ko"]) {
    assert.ok(uiLocales.includes(`${code}.ts`), `Missing UI locale file: ${code}.ts`);
  }

  // All 12 organ locale files exist.
  const organLocales = await readdir(new URL("../app/i18n/organs", import.meta.url));
  for (const code of ["en", "es", "hi", "zh", "ar", "pt", "fr", "de", "ja", "ru", "id", "ko"]) {
    assert.ok(organLocales.includes(`${code}.ts`), `Missing organ locale file: ${code}.ts`);
  }

  // Three.js viewer modules exist.
  const threeDir = await readdir(new URL("../app/lib/three", import.meta.url));
  assert.ok(threeDir.includes("viewer.ts"), "Missing viewer.ts");
  assert.ok(threeDir.includes("hotspots.ts"), "Missing hotspots.ts");
  assert.ok(threeDir.includes("loaders.ts"), "Missing loaders.ts");

  // Key dependencies are present.
  assert.match(packageJson, /"three":/);
  assert.match(packageJson, /"gsap":/);
  assert.match(packageJson, /"lucide-react":/);
  assert.match(packageJson, /"drizzle-orm":/);

  // No stale _sites-preview directory should exist.
  await assert.rejects(
    access(new URL("app/_sites-preview", templateRoot)),
  );
});
