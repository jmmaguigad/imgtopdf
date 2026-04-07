/**
 * @fileoverview ImgToPDF - Client-Side Image to PDF Converter
 * All processing runs in the browser; no data is sent to any server.
 * @author jmmaguigad
 * @version 1.0.0
 * @license MIT
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Central application state.
 *
 * @typedef {Object} ImageEntry
 * @property {string} id        - Unique identifier (Date.now + random)
 * @property {File}   file      - Original File object
 * @property {string} objectURL - Blob URL created for the thumbnail preview
 * @property {string} name      - File display name (truncated internally)
 * @property {string} sizeLabel - Human-readable file size (e.g. "1.2 MB")
 *
 * @type {{
 *   images:      ImageEntry[],
 *   pageSize:    string,
 *   orientation: 'portrait'|'landscape',
 *   quality:     number,
 *   previewBlob: string|null
 * }}
 */
const state = {
  images:      [],
  pageSize:    'a4',
  orientation: 'portrait',
  quality:     80,
  previewBlob: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────────────────────────────────────

const dropZone        = document.getElementById('dropZone');
const fileInput       = document.getElementById('fileInput');
const uploadError     = document.getElementById('uploadError');
const uploadErrorText = document.getElementById('uploadErrorText');

const gallerySection  = document.getElementById('gallerySection');
const settingsSection = document.getElementById('settingsSection');
const actionSection   = document.getElementById('actionSection');

const imageGallery    = document.getElementById('imageGallery');
const imageCount      = document.getElementById('imageCount');
const clearAllBtn     = document.getElementById('clearAllBtn');

const pageSizeSelect  = document.getElementById('pageSizeSelect');
const orientPortrait  = document.getElementById('orientPortrait');
const orientLandscape = document.getElementById('orientLandscape');
const qualitySlider   = document.getElementById('qualitySlider');
const qualityLabel    = document.getElementById('qualityLabel');

const previewBtn      = document.getElementById('previewBtn');
const convertBtn      = document.getElementById('convertBtn');
const convertIcon     = document.getElementById('convertIcon');
const convertSpinner  = document.getElementById('convertSpinner');
const convertBtnText  = document.getElementById('convertBtnText');

const pdfModal        = document.getElementById('pdfModal');
const pdfFrame        = document.getElementById('pdfFrame');
const previewSpinner  = document.getElementById('previewSpinner');
const modalDownloadBtn= document.getElementById('modalDownloadBtn');
const modalCloseBtn   = document.getElementById('modalCloseBtn');
const modalPageCount  = document.getElementById('modalPageCount');

const darkToggle      = document.getElementById('darkToggle');
const iconSun         = document.getElementById('iconSun');
const iconMoon        = document.getElementById('iconMoon');

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a byte count into a human-readable string.
 *
 * @param {number} bytes - File size in bytes.
 * @returns {string} e.g. "1.2 MB", "340 KB"
 */
function formatFileSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Truncates a filename for display while preserving the extension.
 *
 * @param {string} name    - Full filename.
 * @param {number} [maxLen=22] - Maximum character count.
 * @returns {string}
 */
function truncateName(name, maxLen = 22) {
  if (name.length <= maxLen) return name;
  const ext   = name.includes('.') ? '.' + name.split('.').pop() : '';
  const base  = name.slice(0, name.length - ext.length);
  return base.slice(0, maxLen - ext.length - 1) + '…' + ext;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD ERROR DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shows an inline error message below the drop zone.
 *
 * @param {string} message - Error text to display.
 */
function showUploadError(message) {
  uploadErrorText.textContent = message;
  uploadError.classList.remove('hidden');
  uploadError.classList.add('flex');
  setTimeout(() => hideUploadError(), 5000);
}

function hideUploadError() {
  uploadError.classList.add('hidden');
  uploadError.classList.remove('flex');
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE HANDLING
// ─────────────────────────────────────────────────────────────────────────────

/** Allowed MIME types (matches browser-image-compression's supported formats). */
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Validates, deduplicates, and adds image files to state.
 * Triggers gallery re-render after each batch.
 *
 * @param {FileList|File[]} files - Files to process.
 */
function handleFiles(files) {
  hideUploadError();
  const fileArray = Array.from(files);
  const rejected  = [];
  let added       = 0;

  for (const file of fileArray) {
    if (!ALLOWED_TYPES.has(file.type)) {
      rejected.push(file.name);
      continue;
    }
    // Prevent exact duplicates (same name + size)
    const isDuplicate = state.images.some(
      (img) => img.file.name === file.name && img.file.size === file.size
    );
    if (isDuplicate) continue;

    state.images.push({
      id:        uid(),
      file,
      objectURL: URL.createObjectURL(file),
      name:      file.name,
      sizeLabel: formatFileSize(file.size),
    });
    added++;
  }

  if (rejected.length > 0) {
    showUploadError(
      `Skipped ${rejected.length} unsupported file${rejected.length > 1 ? 's' : ''}: ${rejected.slice(0, 3).join(', ')}${rejected.length > 3 ? '…' : ''}. Only JPEG, PNG, and WebP are supported.`
    );
  }

  if (added > 0) renderGallery();
}

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY RENDERING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (Re-)renders the sortable image gallery from `state.images`.
 * Shows/hides the gallery, settings, and action sections accordingly.
 */
function renderGallery() {
  const hasImages = state.images.length > 0;

  gallerySection.classList.toggle('hidden', !hasImages);
  settingsSection.classList.toggle('hidden', !hasImages);
  actionSection.classList.toggle('hidden', !hasImages);
  imageCount.textContent = state.images.length;
  imageGallery.innerHTML = '';

  state.images.forEach((entry) => {
    const card = document.createElement('div');
    card.dataset.id = entry.id;
    card.className = [
      'group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200',
      'dark:border-slate-800 overflow-hidden shadow-sm card-hover cursor-grab active:cursor-grabbing',
      'select-none transition-shadow',
    ].join(' ');

    card.innerHTML = `
      <div class="aspect-[3/4] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src="${entry.objectURL}"
          alt="${escapeHtml(entry.name)}"
          class="w-full h-full object-contain"
          loading="lazy"
          draggable="false"
        />
      </div>

      <div class="px-2.5 py-2 space-y-0.5">
        <p class="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight truncate" title="${escapeHtml(entry.name)}">
          ${escapeHtml(truncateName(entry.name))}
        </p>
        <p class="text-xs text-slate-400 dark:text-slate-500">${entry.sizeLabel}</p>
      </div>

      <button
        class="delete-btn absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white
               flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100
               transition-opacity hover:bg-red-600 shadow-md"
        data-id="${entry.id}"
        aria-label="Remove ${escapeHtml(entry.name)}"
        title="Remove image"
      >
        <svg class="w-3 h-3 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="absolute bottom-10 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none" aria-hidden="true">
        <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
    `;

    imageGallery.appendChild(card);
  });

  imageGallery.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeImage(btn.dataset.id);
    });
  });
}

/**
 * Removes a single image from state by its ID.
 * Revokes the associated Blob URL to free memory.
 *
 * @param {string} id - Image entry ID to remove.
 */
function removeImage(id) {
  const idx = state.images.findIndex((img) => img.id === id);
  if (idx === -1) return;
  URL.revokeObjectURL(state.images[idx].objectURL);
  state.images.splice(idx, 1);
  renderGallery();
}

/** Removes all images from state and clears all thumbnail Blob URLs. */
function clearAll() {
  state.images.forEach((img) => URL.revokeObjectURL(img.objectURL));
  state.images = [];
  renderGallery();
}

// ─────────────────────────────────────────────────────────────────────────────
// SORTABLE (DRAG-TO-REORDER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialises SortableJS on the image gallery.
 * When the user finishes dragging, `state.images` is reordered to match the
 * new DOM order so the PDF page sequence stays in sync.
 */
new Sortable(imageGallery, {
  animation:     200,
  ghostClass:    'sortable-ghost',
  chosenClass:   'sortable-chosen',
  dragClass:     'sortable-drag',
  delay:         0,
  delayOnTouchOnly: true,
  touchStartThreshold: 4,

  onEnd() {
    const newOrder = Array.from(imageGallery.children).map((card) => card.dataset.id);
    state.images.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DROP ZONE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer?.files?.length) {
    handleFiles(e.dataTransfer.files);
  }
});

dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files?.length) {
    handleFiles(fileInput.files);
    fileInput.value = '';
  }
});

clearAllBtn.addEventListener('click', clearAll);

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

pageSizeSelect.addEventListener('change', () => {
  state.pageSize = pageSizeSelect.value;
});

/**
 * Updates the orientation state and toggles the active visual state on the
 * portrait/landscape buttons.
 *
 * @param {'portrait'|'landscape'} value - New orientation.
 */
function setOrientation(value) {
  state.orientation = value;
  const activeClasses   = ['bg-brand-500', 'text-white'];
  const inactiveClasses = ['bg-transparent', 'text-slate-500', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800'];

  if (value === 'portrait') {
    orientPortrait.classList.add(...activeClasses);
    orientPortrait.classList.remove(...inactiveClasses);
    orientPortrait.setAttribute('aria-pressed', 'true');
    orientLandscape.classList.remove(...activeClasses);
    orientLandscape.classList.add(...inactiveClasses);
    orientLandscape.setAttribute('aria-pressed', 'false');
  } else {
    orientLandscape.classList.add(...activeClasses);
    orientLandscape.classList.remove(...inactiveClasses);
    orientLandscape.setAttribute('aria-pressed', 'true');
    orientPortrait.classList.remove(...activeClasses);
    orientPortrait.classList.add(...inactiveClasses);
    orientPortrait.setAttribute('aria-pressed', 'false');
  }
}

orientPortrait.addEventListener('click',  () => setOrientation('portrait'));
orientLandscape.addEventListener('click', () => setOrientation('landscape'));

qualitySlider.addEventListener('input', () => {
  state.quality        = parseInt(qualitySlider.value, 10);
  qualityLabel.textContent = `${state.quality}%`;
});

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE COMPRESSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compresses a single image file using browser-image-compression.
 * The quality percentage (10-100) maps to a maxSizeMB target:
 *   100% → no meaningful compression (10 MB cap)
 *   10%  → aggressive compression (0.05 MB cap)
 *
 * @param {File}   file    - The image file to compress.
 * @param {number} quality - Quality value from 1 to 100.
 * @returns {Promise<File>} The compressed (or original, if smaller) file.
 */
async function compressImage(file, quality) {
  // Exponential curve: 10% → 0.05 MB cap, 100% → 10 MB cap
  const maxSizeMB = 0.05 + ((quality / 100) ** 1.8) * 9.95;

  const options = {
    maxSizeMB,
    maxWidthOrHeight: 4096,
    useWebWorker:     true,
    fileType:         file.type,
    alwaysKeepResolution: false,
  };

  try {
    const compressed = await imageCompression(file, options);
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF DIMENSIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the print dimensions (in mm) for a given page size and orientation.
 *
 * @param {string} sizeKey    - One of: 'a4', 'a3', 'letter', 'legal'
 * @param {'portrait'|'landscape'} orientation
 * @returns {{ width: number, height: number }} Dimensions in millimetres.
 */
function getPageDimensions(sizeKey, orientation) {
  const sizes = {
    a4:     [210, 297],
    a3:     [297, 420],
    letter: [215.9, 279.4],
    legal:  [215.9, 355.6],
  };
  const [w, h] = sizes[sizeKey] ?? sizes.a4;
  return orientation === 'landscape'
    ? { width: h, height: w }
    : { width: w, height: h };
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a PDF from the current image list and settings.
 *
 * Each image is:
 *  1. Compressed according to the quality setting.
 *  2. Drawn onto a temporary canvas to read pixel dimensions.
 *  3. Letterbox-scaled to fit the page without cropping.
 *  4. Centred on the page.
 *
 * @param {boolean} [forPreview=false] - If true, returns a Blob URL instead
 *   of triggering a download. The caller is responsible for revoking the URL.
 * @returns {Promise<string|void>} Blob URL when `forPreview` is true, else void.
 * @throws {Error} If no images are loaded or PDF generation fails.
 */
async function generatePDF(forPreview = false) {
  if (state.images.length === 0) throw new Error('No images to convert.');

  // jsPDF v4 UMD: global is window.jspdf (lowercase), not window.jsPDF
  const { jsPDF } = window.jspdf;

  const { pageSize, orientation, quality } = state;
  const { width: pageW, height: pageH }    = getPageDimensions(pageSize, orientation);

  const MARGIN = 0; // mm on each side
  const printW = pageW - MARGIN * 2;
  const printH = pageH - MARGIN * 2;
  const downloadFileSuffix = crypto.randomUUID().slice(0, 8);

  const doc = new jsPDF({
    orientation,
    unit:   'mm',
    format: pageSize,
  });

  for (let i = 0; i < state.images.length; i++) {
    const entry = state.images[i];

    if (i > 0) doc.addPage(pageSize, orientation);

    const compressedFile           = await compressImage(entry.file, quality);
    const { imgW, imgH, dataURL }  = await loadImageMeta(compressedFile);

    // Letterbox: scale to fit print area, never upscale
    const scale = Math.min(printW / imgW, printH / imgH, 1);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    const x = MARGIN + (printW - drawW) / 2;
    const y = MARGIN + (printH - drawH) / 2;

    const format = compressedFile.type === 'image/png' ? 'PNG' : 'JPEG';
    doc.addImage(dataURL, format, x, y, drawW, drawH);
  }

  if (forPreview) {
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  } else {
    doc.save(`converted-${downloadFileSuffix}.pdf`);
  }
}

/**
 * Loads a File as an `<img>` element to read its natural pixel dimensions,
 * and converts it to a data URL for jsPDF.
 *
 * @param {File|Blob} file - Image file to load.
 * @returns {Promise<{ imgW: number, imgH: number, dataURL: string }>}
 */
function loadImageMeta(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;
      const img     = new Image();
      img.onload  = () => resolve({ imgW: img.naturalWidth, imgH: img.naturalHeight, dataURL });
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = dataURL;
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sets the convert button into a loading state (spinner + disabled).
 *
 * @param {boolean} loading
 * @param {string}  [label='Converting…'] - Text to show while loading.
 */
function setConvertLoading(loading, label = 'Converting…') {
  convertBtn.disabled    = loading;
  previewBtn.disabled    = loading;
  convertIcon.classList.toggle('hidden', loading);
  // style.display avoids Tailwind v4 layer specificity bug (.spinner beats .hidden)
  convertSpinner.style.display = loading ? 'inline-block' : 'none';
  convertBtnText.textContent   = loading ? label : 'Convert & Download';
}

function setPreviewLoading(loading) {
  previewBtn.disabled          = loading;
  convertBtn.disabled          = loading;
  previewSpinner.style.display = loading ? 'flex' : 'none'; // same Tailwind v4 fix
  pdfFrame.classList.toggle('hidden', loading);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF PREVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

async function openPreview() {
  pdfModal.classList.remove('hidden');
  pdfModal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  setPreviewLoading(true);
  modalPageCount.textContent = '';

  if (state.previewBlob) {
    URL.revokeObjectURL(state.previewBlob);
    state.previewBlob = null;
  }

  try {
    const blobURL       = await generatePDF(true);
    state.previewBlob   = blobURL;
    pdfFrame.src        = blobURL;
    modalPageCount.textContent = `${state.images.length} page${state.images.length !== 1 ? 's' : ''}`;
  } catch (err) {
    closeModal();
    alert(`Preview failed: ${err.message}`);
  } finally {
    setPreviewLoading(false);
  }
}

function closeModal() {
  pdfModal.classList.add('hidden');
  pdfModal.classList.remove('flex');
  document.body.style.overflow = '';
  pdfFrame.src = '';

  if (state.previewBlob) {
    URL.revokeObjectURL(state.previewBlob);
    state.previewBlob = null;
  }

  setPreviewLoading(false);
}

function downloadFromPreview() {
  if (!state.previewBlob) return;
  const a    = document.createElement('a');
  a.href     = state.previewBlob;
  a.download = 'converted.pdf';
  a.click();
}

previewBtn.addEventListener('click', openPreview);
modalCloseBtn.addEventListener('click', closeModal);
modalDownloadBtn.addEventListener('click', downloadFromPreview);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !pdfModal.classList.contains('hidden')) closeModal();
});
pdfModal.addEventListener('click', (e) => { if (e.target === pdfModal) closeModal(); });

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT & DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────

convertBtn.addEventListener('click', async () => {
  if (state.images.length === 0) return;
  setConvertLoading(true, 'Converting…');
  try {
    await generatePDF(false);
  } catch (err) {
    alert(`Conversion failed: ${err.message}`);
  } finally {
    setConvertLoading(false);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DARK MODE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies the given theme to the document root and persists the preference
 * to `localStorage`.
 *
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  iconSun.classList.toggle('hidden',  !isDark);
  iconMoon.classList.toggle('hidden', isDark);
  try { localStorage.setItem('imgtopdf-theme', theme); } catch { /* private mode */ }
}

darkToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
});

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────────────────────────────────────

(function init() {
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('imgtopdf-theme') ?? 'light'; } catch { /* ignore */ }
  applyTheme(savedTheme);
})();
