---
name: filing-cabinet-sections
description: Add or restore section headers and content blocks on Maya's filing cabinet homepage (index.html). Use when adding headers like currently reading, photos, or reads, or when extending the filing cabinet layout.
---

# Filing Cabinet Sections

Apply patterns from `index.html` (the filing cabinet homepage). Match existing hierarchy, spacing, and hover styling.

## Page hierarchy

1. `h1.phrase` — page title (`filing cabinet`)
2. `section[aria-labelledby]` — content blocks
3. `h4.phrase` — section header (lowercase label)
4. Section body — content or expandable entries

## Design tokens

```css
--paper: #faf9f6;
--ink: #24211f;
--hover: #8b2f32;
```

- Font: `"Libre Baskerville", serif`
- Section spacing: `section { margin: 0 0 40px; }`
- Header: `h4 { margin: 0 0 8px; font-size: 1rem; font-weight: 700; }`
- Interactive text: `.phrase` with hover color `var(--hover)`

## Empty section (currently reading, reads, etc.)

Insert inside `<main>`, above or below other sections:

```html
<section aria-labelledby="SECTION-ID">
    <h4 id="SECTION-ID" class="phrase">section label</h4>
    <!-- optional body: lists, links, paragraphs -->
</section>
```

**Examples:**

```html
<section aria-labelledby="currently-reading">
    <h4 id="currently-reading" class="phrase">currently reading</h4>
</section>

<section aria-labelledby="reads">
    <h4 id="reads" class="phrase">reads</h4>
</section>
```

## Photos section with expandable albums

```html
<section aria-labelledby="photos">
    <h4 id="photos" class="phrase">photos</h4>
    <details class="photo-entry">
        <summary>city, month year</summary>
        <div class="photo-grid" aria-label="City photo gallery">
            <!-- photo-item blocks -->
        </div>
    </details>
</section>
```

## Single gallery photo

```html
<div class="photo-item">
    <button type="button" class="photo-slot photo-thumb" data-src="photos/example.jpeg" aria-label="Open photo">
        <img src="photos/example.jpeg" alt="Description">
    </button>
    <div class="photo-meta">
        <button type="button" class="caption-toggle" aria-expanded="false" aria-label="Show caption">+</button>
        <p class="photo-caption">location, month year</p>
    </div>
</div>
```

## Footer link pattern

```html
<a class="sketchbook-link phrase" href="sketchbook.html">
    visit my sketchbook <span class="arrow" aria-hidden="true">&#x2197;&#xFE0E;</span>
</a>
```

## Checklist when adding a section

- [ ] Use lowercase header text
- [ ] Set matching `id` on `h4` and `aria-labelledby` on `section`
- [ ] Add `class="phrase"` to the header
- [ ] Place section in logical order inside `<main>`
- [ ] Keep `sketchbook-link` footer last in `<main>`
