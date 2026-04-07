# ImgToPDF

**A free, open-source, client-side Image to PDF converter.**  
Convert JPEG, PNG, and WebP images to a polished PDF — entirely inside your browser. No uploads, no accounts, no data ever leaves your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjmmaguigad%2Fimgtopdf)
[![Contributions welcome](https://img.shields.io/badge/Contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

> **Live Demo:** [https://jmmaguigad-imgtopdf.vercel.app/](https://jmmaguigad-imgtopdf.vercel.app/)

---

## Screenshots

> 

---

## Features

| Feature | Details |
|---|---|
| **Drag & Drop Upload** | Drop multiple images at once onto the upload zone |
| **File Browser** | Click to open the native OS file picker |
| **Sortable Gallery** | Drag and drop thumbnails to set page order |
| **Delete Individual Images** | Hover a card for the × remove button |
| **Clear All** | Remove all images in one click |
| **Page Size** | A4, A3, Letter, Legal |
| **Orientation** | Portrait or Landscape |
| **Quality Control** | Slider from 10% (small file) to 100% (full quality) |
| **PDF Preview** | Fullscreen in-browser preview before downloading |
| **Download PDF** | One-click download, or from the preview modal |
| **Dark Mode** | System-aware default + persistent toggle |
| **100% Client-Side** | No server, no uploads, no tracking, no cookies |
| **Keyboard Accessible** | Full keyboard navigation + ARIA roles |
| **Mobile Friendly** | Touch drag-to-reorder, responsive layout |

---

## Quick Start

### Option 1 — Open directly in a browser

```
git clone https://github.com/jmmaguigad/imgtopdf.git
cd imgtopdf
# Just open index.html in any modern browser
open index.html         # macOS
start index.html        # Windows
xdg-open index.html     # Linux
```

No build step. No dependencies to install.

### Option 2 — Deploy to Vercel

1. Fork this repository on GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your fork.
3. Leave all settings as defaults — Vercel auto-detects a static site.
4. Click **Deploy**.

Or use the one-click button at the top of this README.

### Option 3 — Serve locally with any static server

```bash
# Python 3
python -m http.server 3000

# Node.js (npx)
npx serve .

# Then open http://localhost:3000
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Semantic markup, ARIA accessibility |
| [Tailwind CSS](https://tailwindcss.com) | v4 Play CDN | Utility-first styling, dark mode |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | Client-side PDF generation |
| [SortableJS](https://github.com/SortableJS/Sortable) | 1.15.7 | Touch-friendly drag-to-reorder |
| [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) | 2.0.2 | In-browser JPEG/PNG/WebP compression |

All libraries are loaded via [jsDelivr CDN](https://www.jsdelivr.com/) — no `npm install` or build tools required.

---

## Project Structure

```
imgtopdf/
├── index.html          # All UI markup — Tailwind classes, ARIA roles, CDN scripts
├── js/
│   └── app.js          # Application logic — fully JSDoc-documented
├── css/
│   └── style.css       # Custom CSS: animations, SortableJS states, scrollbar, spinner
├── README.md           # This file
├── CONTRIBUTING.md     # Contribution guidelines
├── LICENSE             # MIT License
└── vercel.json         # Minimal Vercel deployment config
```

---

## How It Works

1. **Upload** — Files are read with the [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API). Blob URLs are created for thumbnails.
2. **Reorder** — [SortableJS](https://sortablejs.com/) makes the gallery drag-sortable. On `onEnd`, the `state.images` array is reordered to match the DOM.
3. **Compress** — [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) reduces each image before embedding. The quality slider maps to a `maxSizeMB` target via an exponential curve.
4. **Generate PDF** — Each image is read via `FileReader`, drawn onto an `<img>` to get its natural pixel dimensions, letterbox-scaled into the chosen page size (with an 8 mm margin), and embedded into the PDF via `jsPDF.addImage()`.
5. **Preview / Download** — For "Preview", the PDF is output to a Blob URL and loaded into an `<iframe>`. For "Download", `jsPDF.save()` triggers a standard browser download. Blob URLs are revoked after use.

---

## Customisation

### Change the default page size

In `js/app.js`, update the initial state:

```js
const state = {
  pageSize:    'letter',   // 'a4' | 'a3' | 'letter' | 'legal'
  orientation: 'portrait', // 'portrait' | 'landscape'
  quality:     80,
  // ...
};
```

### Add a new page size

1. Add an `<option>` to `#pageSizeSelect` in `index.html`.
2. Add the dimensions (in mm, portrait `[width, height]`) to `getPageDimensions()` in `js/app.js`:

```js
const sizes = {
  a4:     [210, 297],
  a3:     [297, 420],
  letter: [215.9, 279.4],
  legal:  [215.9, 355.6],
  a5:     [148, 210],  // ← new entry
};
```

### Change the default quality

In `js/app.js`:

```js
const state = {
  quality: 90,  // 10–100
  // ...
};
```

Also update the slider's `value` attribute in `index.html` and the initial `qualityLabel` text.

### Change the page margin

In `js/app.js`, find the `MARGIN` constant inside `generatePDF()`:

```js
const MARGIN = 8; // mm on each side — set to 0 for full-bleed
```

### Modify the colour theme

The brand colour is defined in the `@theme` block inside `index.html`:

```css
@theme {
  --color-brand-500: #2f95f5;  /* Change this hex to your brand colour */
  /* ... other shades are derived from this */
}
```

---

## Browser Support

| Browser | Supported |
|---|---|
| Chrome / Edge 90+ | ✅ |
| Firefox 90+ | ✅ |
| Safari 15+ | ✅ |
| Mobile Chrome / Safari | ✅ |
| Internet Explorer | ❌ |

Requires: File API, Blob API, `<canvas>`, ES2020 (`async/await`, optional chaining).

---

## FAQ

**Q: Is my data safe?**  
A: Yes. All processing happens in your browser. No image or PDF data is ever sent to any server. The app works offline once the CDN scripts are cached.

**Q: What image formats are supported?**  
A: JPEG, PNG, and WebP. GIF and SVG are not supported because `browser-image-compression` does not handle them. SVG can be supported by adding a canvas rasterisation step — see [CONTRIBUTING.md](CONTRIBUTING.md).

**Q: How large can the images be?**  
A: There is no hard limit. Very large images (>20 MP) may take a few seconds to compress and embed. The quality slider helps control the output file size.

**Q: Can I add a password to the PDF?**  
A: Not in the current version. jsPDF supports encryption — see the [jsPDF docs](https://raw.githack.com/MrRio/jsPDF/master/docs/) if you want to add it. PRs welcome!

**Q: Why is the Tailwind Play CDN used instead of a production build?**  
A: To keep the project zero-dependency and zero-build-step — the main goal is a file you can open directly in a browser. If you need a leaner production bundle, swap it for a Vite + Tailwind PostCSS setup.

---

## Contributing

Contributions, issues, and feature requests are welcome!  
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

[MIT](LICENSE) © 2026 ImgToPDF Contributors
