// Two-tab smoke test for the cedot editor. Usage: node drive.mjs <screenshot-dir>
import { chromium } from 'playwright';
const out = process.argv[2] ?? '.';
const base = process.env.UI_URL ?? 'http://127.0.0.1:5173';
const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await b.newContext({ viewport: { width: 1000, height: 560 } });
const a = await ctx.newPage(), c = await ctx.newPage();
const errs = [];
for (const p of [a, c]) p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const url = `${base}/#/session/t${Date.now().toString(36)}`;
const ready = (p) => p.locator('.status.connected').waitFor();
// doc text without other people's cursor name tags
const text = (p) => p.locator('.cm-content').evaluate((el) => {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('.cm-remote-caret').forEach((n) => n.remove());
  return [...copy.querySelectorAll('.cm-line')].map((l) => l.textContent).join('\n');
});
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) process.exitCode = 1; };

await a.goto(url); await c.goto(url);
await ready(a); await ready(c);
check('peer count', (await a.locator('footer').innerText()).includes('2 people here'));

await a.click('.cm-content');
await a.keyboard.type('def hi(name):\n    return name');
await c.waitForTimeout(400);
check('text syncs a -> c', (await text(c)) === (await text(a)));

// c types at the end while a inserts at the top; c's cursor must not jump
await c.click('.cm-content'); await c.keyboard.press('Control+End'); await c.keyboard.type('\n# c');
await a.keyboard.press('Control+Home'); await a.keyboard.type('# top\n');
await c.waitForTimeout(400); await c.keyboard.type('!');
await a.waitForTimeout(400);
check('cursor stable under remote edit', (await text(c)).endsWith('# c!') && (await text(a)) === (await text(c)));

// remote cursor + selection: c selects 'def', a should see it highlighted with c's name tag
await c.keyboard.press('Control+Home'); await c.keyboard.press('ArrowDown');
await c.keyboard.press('Home'); await c.keyboard.press('Shift+End');
await a.waitForTimeout(400);
const remoteSel = await a.locator('.cm-remote-selection').allInnerTexts();
check('remote selection shows', remoteSel.join('') === 'def hi(name):');
check('remote caret label', (await a.locator('.cm-remote-label').innerText()) === 'guest 2');
check('own name in status', (await c.locator('footer').innerText()).includes("you're guest 2"));
await a.screenshot({ path: `${out}/remote-cursor.png` });

await a.selectOption('header select', 'python');
await c.waitForTimeout(400);
check('language syncs', (await c.locator('header select').inputValue()) === 'python');

await c.close();
await a.waitForTimeout(400);
check('peer count drops', (await a.locator('footer').innerText()).includes('just you'));
check('remote caret removed on leave', (await a.locator('.cm-remote-caret').count()) === 0);
check('no console errors', errs.length === 0);
if (errs.length) console.log(errs);

await a.screenshot({ path: `${out}/editor-light.png` });
await a.click('text=system'); await a.click('text=light'); // system -> light -> dark
await a.screenshot({ path: `${out}/editor-dark.png` });
await a.goto(base + '/'); await a.waitForTimeout(300);
await a.screenshot({ path: `${out}/home.png` });
await b.close();
