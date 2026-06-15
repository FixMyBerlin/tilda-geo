# Tailwind touch & iPad checklist

Non-obvious items for React + Tailwind reviews. Assume semantic HTML and basic responsiveness are already in place.

---

## 1. Hit area without visual bloat

| Check                                                       | Tailwind / pattern                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Minimum **44×44 CSS px** tap target (Apple HIG; WCAG 2.5.8) | `min-h-11 min-w-11` or `size-11`; icon visually smaller inside with `p-2.5` / `p-3`                                            |
| Small glyph, large tap surface                              | Wrapper: `inline-flex items-center justify-center min-h-11 min-w-11` — do **not** shrink the `<button>` to the icon’s `size-5` |
| Extend hit area without shifting layout                     | Negative margin + padding: `-m-2 p-2` on icon-only controls                                                                    |
| Spacing between adjacent tappables                          | At least **8–12px** — `gap-3`, `space-x-3`, or margin between toolbar icons                                                    |

---

## 2. FMC + iOS interaction classes

| Check                                                  | Tailwind / pattern                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Desktop hand cursor** on all links & buttons         | `cursor-pointer` on `<a>`, `<button>`, and custom tappables                           |
| **Suppress iOS text-selection / callout** on controls  | `select-none` on buttons, icon buttons, tabs, segmented controls, map UI chrome       |
| **Remove gray tap flash** (optional polish)            | `[-webkit-tap-highlight-color:transparent]` on controls, or global base style         |
| **Disable double-tap zoom delay** on controls & map UI | `touch-manipulation` (`touch-action: manipulation`) on buttons, sliders, map overlays |
| **Pressed feedback** (hover is unreliable on iPad)     | `active:scale-95`, `active:bg-*`, or `active:opacity-80` — not hover alone            |

---

## 3. Hover that breaks on iPad

iPad Safari leaves `:hover` **sticky** until the user taps elsewhere. Never gate critical UI on hover alone.

| Anti-pattern                               | Fix                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `hover:` reveals menu / actions / toolbars | Toggle on tap (`aria-expanded`, click); or always visible on coarse pointer               |
| `group-hover:` shows delete/edit icons     | Use explicit row action button or swipe pattern; or visible on `@media (pointer: coarse)` |
| Bare `hover:bg-*` as only pressed feedback | Add `active:`; gate decorative hover                                                      |

**Fine-pointer-only hover (Tailwind arbitrary variant):**

```html
<button class="active:bg-muted [@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted/80"></button>
```

Prefer a shared variant in `tailwind.css` if used often:

```css
@custom-variant hover-fine {
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      @slot;
    }
  }
}
```

Then: `hover-fine:bg-muted`.

---

## 3b. Touch-over highlight (press → drag → release)

On iPad, users **keep a finger down**, slide across items (highlight follows), and **release to activate**. CSS `:hover` does not track the finger during `touchmove`. Split reviews into **two buckets**:

| Bucket                     | Typical UI                                                      | Touch-over works if…                                                                    |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **A — Library menus**      | Headless UI `Menu` / `Listbox`, Radix `DropdownMenu` / `Select` | Rows styled with library “active item” state — **not** `hover:` alone                   |
| **B — Custom inline rows** | Sidebar `<button onClick>` lists, dataset pickers               | Needs `Listbox`, shared row + pointer hook, or explicit `pointermove` — CSS alone fails |

### Bucket A — Headless UI (Tilda-style)

Headless UI v2 tracks pointer movement while open (`onPointerMove` → active item). It **ignores `data-hover` on touch** to avoid sticky hover — touch-over preview must use the **`focus` render prop** or **`data-focus:`**, not `hover:` or `data-hover:`.

```tsx
// MenuItem / ListboxOption — render prop
<MenuItem>
  {({ focus }) => <button className={clsx('select-none cursor-pointer', focus && 'bg-yellow-50')}>…</button>}
</MenuItem>

// Or data attribute
<MenuItem className="data-focus:bg-gray-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-50">…</MenuItem>
```

**Audit:** grep `MenuItem` / `ListboxOption` / `menuItemClasses` for `hover:` without `focus` / `data-focus:` → **Low effort** styling fix.

### Bucket A — Radix / shadcn

Radix sets `data-highlighted` on the row under the finger:

```html
class="select-none cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
```

Keep `[@media(hover:hover)_and_(pointer:fine)]:hover:…` as desktop-only polish.

### Bucket B — Custom inline selectable rows

Plain rows like `selected ? 'bg-yellow-400' : 'hover:bg-yellow-50'` give **no preview while dragging** — only the tapped row fires `onClick`. Common in sidebars (dataset lists, QA categories).

Prefer Headless UI / Radix for open menus. For custom inline rows, flag hover-only rows and suggest a shared row primitive or pointer-move hook.

**Severity:** missing touch-over on **primary** picker (filters, layer switcher, dataset sidebar) → Warning; rare/admin lists → Nice to have.

### Custom menus / overlays (no library)

1. `pointerdown` on list → capture active index
2. `pointermove` → `elementFromPoint(x, y)` → update highlight
3. `pointerup` / `pointercancel` → `onSelect` highlighted row; close if needed
4. `touch-action: none` on panel during sweep (or pointer capture) so page does not scroll

### Review red flags

| Anti-pattern                                                       | Why                                            |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| `hover:bg-*` only on menu/list rows                                | No drag highlight; sticky wrong row after lift |
| Headless UI item with `data-hover:` but no `data-focus:` / `focus` | v2 ignores hover on touch                      |
| `onClick` per row, no pointer-move handling                        | Tap works; sweep-select does not               |
| `pointer-events-none` on row content                               | Breaks hit-testing under finger                |
| Menu closes on `pointerdown` before `pointerup`                    | Release never reaches intended row             |

---

## 4. iPad layout & Split View

| Check                                                          | Tailwind / pattern                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Avoid **iPad-only breakpoints** (e.g. `lg:` = 1024 for “iPad”) | Split View / Slide Over changes width continuously — use fluid `flex` / `grid`, `min-w-0`, `flex-1`                   |
| Window can shrink to **phone-width column**                    | Test at ~320–400px width; stack toolbars; don’t assume `md:` is “enough”                                              |
| Primary actions in **thumb reach** on large touch              | Bottom bars: `fixed bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)]`; side nav OK for iPad landscape              |
| Full viewport height on iOS Safari                             | Prefer `min-h-dvh` over `min-h-screen` for sheets / full-page layouts                                                 |
| Safe areas (notch, home indicator)                             | `pb-[env(safe-area-inset-bottom)]` (or `pb-safe` if the project has a safe-area plugin) on fixed footers / map chrome |

---

## 5. Scroll, zoom, keyboard (Safari / iPadOS)

| Check                                     | Tailwind / pattern                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Double-tap zoom** on buttons / map      | `touch-manipulation` on interactives                                                                                 |
| **iOS zoom on input focus** (< 16px text) | `text-base` (16px) minimum on `<input>`, `<select>`, `<textarea>` — `text-sm` alone triggers zoom                    |
| Scroll trapped in modal / drawer          | `overscroll-contain` on modal body; avoid scroll chaining to page                                                    |
| Page rubber-bands behind panel            | `overscroll-none` on `body` or overlay when appropriate                                                              |
| Keyboard covers focused field             | Scrollable form container; `scroll-mb-*` / `scroll-mt-*` on focus; avoid `fixed` footers over inputs without padding |
| Map + page scroll fighting                | `touch-manipulation` or `touch-none` on map container per library docs                                               |

---

## 6. Custom tap targets (easy to miss)

| Check                                     | Fix                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `<div onClick>` without semantics         | Prefer `<button type="button">` or `<a href>`; else `role="button"` `tabIndex={0}` `onKeyDown` (Enter/Space) |
| `pointer-events-none` on parent           | Children cannot receive taps — audit overlays, disabled-looking wrappers                                     |
| Tiny checkbox/radio hit area              | Wrap label: `flex items-center gap-3 min-h-11` with `cursor-pointer select-none` on `<label>`                |
| Drag handle vs tap                        | Separate handle with `min-h-11`; don’t rely on 2px divider for primary action                                |
| `disabled` without visual + pointer block | `disabled:pointer-events-none disabled:opacity-50`                                                           |

---

## 7. Touch + maps / canvases

For `react-map-gl` and similar — see skill `react-map-gl`. Additionally:

| Check                      | Pattern                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Controls over map          | `min-h-11 min-w-11 touch-manipulation select-none cursor-pointer`                                 |
| Popups / tooltips on hover | Open on tap; close on outside tap — not `mouseenter` only                                         |
| Gesture vs click           | Document `touch-action` on map root per library; avoid nested scroll without `overscroll-contain` |

---

## 8. Accessibility on touch (non-obvious)

| Check                                         | Pattern                                                          |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Icon-only button                              | `aria-label`; hit area still `min-h-11 min-w-11`                 |
| Focus visible for trackpad / keyboard on iPad | Don’t remove `focus-visible:ring-*` in favor of hover-only rings |
| `prefers-reduced-motion`                      | `motion-reduce:transition-none` on tap animations                |

---

## Severity quick reference

| Signal                                                     | Severity     |
| ---------------------------------------------------------- | ------------ |
| Primary CTA &lt; 44px, or hover-only menu                  | Critical     |
| Open menu (Headless/Radix): hover-only, no focus/highlight | Warning      |
| Inline sidebar list: hover-only rows, no touch-over        | Warning      |
| Sticky hover changes layout / hides actions                | Warning      |
| Missing `select-none` / `cursor-pointer` on some controls  | Warning      |
| Thumb-zone / `dvh` / safe-area polish                      | Nice to have |
