# Contributing to ImgToPDF

Thank you for taking the time to contribute! This document explains the workflow for reporting issues, suggesting features, and submitting pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Development Workflow](#development-workflow)
- [Pull Request Checklist](#pull-request-checklist)
- [Code Style](#code-style)

---

## Code of Conduct

Be respectful and constructive. Harassment or exclusionary behaviour is not welcome. See the [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines).

---

## Reporting Bugs

Before opening an issue, please:

1. Search [existing issues](https://github.com/jmmaguigad/imgtopdf/issues) to avoid duplicates.
2. Confirm you are using a supported browser (Chrome/Edge 90+, Firefox 90+, Safari 15+).

**When opening a bug report, include:**

- A clear, descriptive title.
- Steps to reproduce the issue.
- What you expected to happen.
- What actually happened (error messages, screenshots).
- Browser name and version.
- Operating system.

---

## Suggesting Features

Open a [Feature Request issue](https://github.com/jmmaguigad/imgtopdf/issues/new). Include:

- The problem you're trying to solve.
- Your proposed solution.
- Any alternatives you've considered.

---

## Development Workflow

This project has **no build step**. All you need is a modern browser and a text editor.

### 1. Fork and clone

```bash
git clone https://github.com/jmmaguigad/imgtopdf.git
cd imgtopdf
```

### 2. Open in browser

```bash
# Python 3 (from the project root)
python -m http.server 3000

# Or with Node.js
npx serve .
```

Then open [http://localhost:3000](http://localhost:3000).

> **Note:** Opening `index.html` directly via `file://` also works for most features, but some browsers restrict Blob URL handling in file-protocol contexts. A local server is recommended for testing the PDF preview.

### 3. Make your changes

The three files you'll edit most:

| File | Purpose |
|---|---|
| `index.html` | Markup, Tailwind classes, CDN script tags |
| `js/app.js` | All application logic |
| `css/style.css` | Custom CSS (animations, SortableJS states, etc.) |

### 4. Test manually

- Upload JPEG, PNG, and WebP images.
- Test with 1 image and with 10+ images.
- Verify all 4 page sizes × 2 orientations.
- Test quality slider at 10%, 50%, 100%.
- Test dark mode toggle and reload to confirm localStorage persistence.
- Open PDF preview, close via the × button, and close via Escape.
- Download from both the main button and the preview modal.
- Test on a mobile device or using browser DevTools responsive mode (touch drag reorder).

### 5. Validate markup

Paste `index.html` into the [W3C HTML Validator](https://validator.w3.org/#validate_by_input) and fix any errors.

---

## Pull Request Checklist

Before submitting a PR, confirm the following:

- [ ] The feature/fix works in Chrome, Firefox, and Safari.
- [ ] No regressions introduced (test all features listed above).
- [ ] All new JavaScript functions have JSDoc comments.
- [ ] No unused variables, `console.log` statements, or commented-out code left in.
- [ ] `index.html` section comments are present for any new HTML sections.
- [ ] `README.md` updated if a new feature or customisation option was added.
- [ ] PR description explains **what** changed and **why**.

---

## Code Style

### JavaScript (`js/app.js`)

- `'use strict'` mode is enabled.
- Use `const` / `let`, never `var`.
- Use `async/await` for asynchronous code; avoid raw `.then()` chains.
- Function names describe what they do: `renderGallery`, `compressImage`, `generatePDF`.
- All exported/top-level functions must have a JSDoc comment (`/** ... */`) with `@param` and `@returns` tags.
- Error handling: use `try/catch` in async paths; do not silently swallow errors.

### HTML (`index.html`)

- Semantic elements (`<header>`, `<main>`, `<section>`, `<footer>`).
- All interactive elements have an `aria-label` or visible label.
- Section separators use `<!-- ═══ SECTION NAME ════ -->` style comments.

### CSS (`css/style.css`)

- Custom CSS only for things Tailwind cannot do natively (keyframe animations, `::-webkit-scrollbar`, SortableJS class overrides).
- Section headers use `/* ── Section Name ────── */` style comments.
- No `!important` except where overriding third-party library styles (SortableJS).

---

Thank you for contributing! 🎉
