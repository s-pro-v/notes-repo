/**
       * --- SYSTEM CORE ---
       */
let editor;
let monacoLoaded = false;
let isAutoDetectEnabled = true;
const GITHUB_USER = "skokivPr";
const GITHUB_REPO = "json-lista";
const GITHUB_FILE = "notes.json";
/** URL do notes.json dla Pull/Push (s-pro-v/json-lista, main) */
const NOTES_SYNC_URL = "https://raw.githubusercontent.com/s-pro-v/json-lista/main/notes.json";
const GITHUB_SYNC_OWNER = "s-pro-v";
const GITHUB_NOTES_API_URL = `https://api.github.com/repos/${GITHUB_SYNC_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
/** Plik na GitHubie, do którego Push wrzuca dane (repo s-pro-v/json-lista, main) */
const PUSH_TARGET_FILE = "new-note.json";
const GITHUB_PUSH_API_URL = `https://api.github.com/repos/${GITHUB_SYNC_OWNER}/${GITHUB_REPO}/contents/${PUSH_TARGET_FILE}`;
const STORAGE_KEY_SYNCED_NAMES = "notes_synced_to_github";
const STORAGE_KEY_GITHUB_TOKEN = "github_token";
const STORAGE_KEY_AUTO_TRANSFER = "auto_transfer_to_github";
const STORAGE_KEY_RESTORE_NOTE = "monaco_restore_note";
const AUTO_TRANSFER_DEBOUNCE_MS = 2500;
/** Obrazy ładowane dopiero na żądanie (np. przy wejściu w viewport) */
const LAZY_IMAGE_REQUEST = true;
/** Automatyczne przeładowanie obrazów (np. przy zmianie URL lub odświeżeniu) */
const LAZY_IMAGE_AUTO_RELOAD = true;
var ENCODING_DISPLAY_NAMES = { javascript: 'JavaScript', json: 'JSON', html: 'HTML', css: 'CSS', xml: 'XML', plaintext: 'Plain Text', auto: 'Auto Detect' };
window.projectsData = null;
let autoTransferToGitHubTimer = null;
let hasUnsavedChanges = false;
let lastSavedContent = "";
let currentLoadedFile = null;

// --- Editor Settings ---
let editorSettings = {
    fontSize: 13,
    fontFamily: '"JetBrains Mono", monospace',
    lineHeight: 0,
    wordWrap: 'off',
    minimap: true,
    lineNumbers: 'on',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    tabSize: 4,
    insertSpaces: true,
    renderWhitespace: 'none',
    renderLineHighlight: 'all',
    renderIndentGuides: true,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    scrollBeyondLastLine: true,
    smoothScrolling: false,
    mouseWheelZoom: false,
    roundedSelection: false,
    formatOnPaste: false,
    formatOnType: false,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    quickSuggestions: {
        other: true,
        comments: false,
        strings: true
    },
    quickSuggestionsDelay: 100,
    autoIndent: 'full',
    bracketPairColorization: true,
    colorDecorators: true,
    folding: true,
    showFoldingControls: 'mouseover',
    matchBrackets: 'always',
    occurrencesHighlight: true,
    selectionHighlight: true,
    codeLens: false,
    links: true,
    multiCursorModifier: 'alt',
    dragAndDrop: true,
    emptySelectionClipboard: true,
    copyWithSyntaxHighlighting: true,
    cursorSmoothCaretAnimation: false,
    cursorSurroundingLines: 0,
    cursorSurroundingLinesStyle: 'default'
};

// Wczytaj zapisane ustawienia
function loadSettings() {
    const saved = localStorage.getItem('monacoEditorSettings');
    if (saved) {
        try {
            editorSettings = { ...editorSettings, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

loadSettings();

const CustomUI = {
    toastContainer: null,

    _getToastContainer: function () {
        if (!this.toastContainer || !this.toastContainer.parentNode) {
            this.toastContainer = document.querySelector(".custom-toast-container");
            if (!this.toastContainer) {
                this.toastContainer = document.createElement("div");
                this.toastContainer.className = "custom-toast-container";
                document.body.appendChild(this.toastContainer);
            }
        }
        return this.toastContainer;
    },

    _esc: function (s) {
        if (s == null) return '';
        const t = String(s);
        return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    close: function (force = false) {
        const overlay = document.querySelector(".custom-modal-overlay");
        if (overlay) {
            if (force) {
                overlay.remove();
            } else {
                overlay.classList.remove("visible");
                setTimeout(() => overlay.remove(), 250);
            }
        }
    },

    createOverlay: function (isWide = false) {
        this.close(false);
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        const modal = document.createElement('div');
        modal.className = `custom-modal ${isWide ? 'wide' : 'h2'}`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.offsetHeight;
        overlay.classList.add('visible');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });
        return modal;
    },

    alert: function (title, message, type = 'info') {
        const modal = this.createOverlay();
        const T = this._esc(title);
        const M = this._esc(message);
        modal.innerHTML = `
            <h2 class="custom-modal-title">${T}</h2>
            <p class="custom-modal-message">${M}</p>
            <div class="custom-modal-actions">
                <button class="custom-btn custom-btn-confirm">OK</button>
            </div>
        `;
        modal.querySelector('button').onclick = () => this.close();
    },

    confirm: function (title, message, confirmText = 'Tak', cancelText = 'Anuluj', isDanger = false) {
        return new Promise((resolve) => {
            const modal = this.createOverlay();
            const T = this._esc(title);
            const M = this._esc(message);
            const CT = this._esc(confirmText);
            const XT = this._esc(cancelText);
            modal.innerHTML = `
                <h2 class="custom-modal-title">${T}</h2>
                <p class="custom-modal-message">${M}</p>
                <div class="custom-modal-actions">
                    <button class="custom-btn custom-btn-cancel">${XT}</button>
                    <button class="custom-btn ${isDanger ? 'custom-btn-danger' : 'custom-btn-confirm'}">${CT}</button>
                </div>
            `;
            const confirmBtn = modal.querySelector('.custom-btn-confirm, .custom-btn-danger');
            const cancelBtn = modal.querySelector('.custom-btn-cancel');
            confirmBtn.onclick = () => { this.close(); resolve(true); };
            cancelBtn.onclick = () => { this.close(); resolve(false); };
        });
    },

    prompt: function (title, label, defaultValue = '') {
        return new Promise((resolve) => {
            const modal = this.createOverlay();
            const T = this._esc(title);
            const L = this._esc(label);
            const def = this._esc(defaultValue);
            modal.innerHTML = `
                <h2 class="custom-modal-title">${T}</h2>
                <p class="custom-modal-message">${L}</p>
                <input type="text" class="custom-input custom-prompt-input" value="${def}" autocomplete="off">
                <div class="custom-modal-actions">
                    <button class="custom-btn custom-btn-cancel">Anuluj</button>
                    <button class="custom-btn custom-btn-confirm">Zatwierdź</button>
                </div>
            `;
            const input = modal.querySelector('input');
            input.focus();
            input.select();
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') modal.querySelector('.custom-btn-confirm').click();
            });
            modal.querySelector('.custom-btn-confirm').onclick = () => {
                this.close();
                resolve(input.value);
            };
            modal.querySelector('.custom-btn-cancel').onclick = () => {
                this.close();
                resolve(null);
            };
        });
    },

    html: function (title, htmlContent, width = 850) {
        const modal = this.createOverlay(true);
        if (width) modal.style.width = width + 'px';
        const T = this._esc(title);
        modal.innerHTML = `
            <h2 class="custom-modal-title">${T}</h2>
            <div class="custom-modal-content">${htmlContent}</div>
            <div class="custom-modal-actions">
                <button class="custom-btn custom-btn-cancel">Zamknij</button>
            </div>
        `;
        modal.querySelector('.custom-btn-cancel').onclick = () => this.close();
    },

    toast: function (message, type = 'info') {
        const container = this._getToastContainer();
        const toast = document.createElement('div');
        toast.className = `custom-toast custom-toast-${type}`;
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        if (type === 'error') iconClass = 'fas fa-exclamation-circle';
        toast.innerHTML = `<i class="${iconClass}"></i> <span>${this._esc(message)}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'custom-toast-fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLoading: function (message = 'Ładowanie...') {
        this.close(true);
        const modal = this.createOverlay();
        const M = this._esc(message);
        modal.innerHTML = `<div class="custom-loading"><i class="fas fa-spinner fa-spin custom-loading-icon"></i><h3 class="custom-loading-text">${M}</h3></div>`;
        const overlay = document.querySelector('.custom-modal-overlay');
        if (overlay) overlay.onclick = null;
    },

    hideLoading: function () {
        this.close(true);
    },

    /** Modal w Twoim stylu: odświeżenie strony z niezapisanymi zmianami. Zwraca 'save' | 'reload' | 'cancel'. */
    confirmReload: function () {
        return new Promise((resolve) => {
            const modal = this.createOverlay();
            modal.innerHTML = `
                <h2 class="custom-modal-title">Niezapisane zmiany</h2>
                <p class="custom-modal-message">Masz niezapisane zmiany. Zapisać przed odświeżeniem?</p>
                <div class="custom-modal-actions custom-modal-actions-three">
                    <button class="custom-btn custom-btn-cancel" data-choice="cancel">Anuluj</button>
                    <button class="custom-btn custom-btn-reload" data-choice="reload">Odśwież bez zapisu</button>
                    <button class="custom-btn custom-btn-confirm" data-choice="save">Zapisz i odśwież</button>
                </div>
            `;
            modal.querySelectorAll('[data-choice]').forEach((btn) => {
                btn.onclick = () => {
                    this.close();
                    resolve(btn.getAttribute('data-choice'));
                };
            });
        });
    }
};
function runHeuristicDetection(content) {
    if (!content || !isAutoDetectEnabled) return null;

    // Analizuj cały content dla dokładniejszej detekcji
    const trimmed = content.trim();
    const sample = trimmed.substring(0, 1000); // Zwiększona próbka

    // JSON - sprawdź strukturę i spróbuj sparsować
    if (/^\s*[\{\[]/.test(trimmed)) {
        try {
            JSON.parse(content);
            return 'json';
        } catch (e) {
            // Może to być JavaScript z obiektem - sprawdź dalej
        }
    }

    // HTML - dokładniejsze sprawdzenie struktury dokumentu
    if (/^\s*<!DOCTYPE\s+html/i.test(trimmed) ||
        /<html[\s>]/i.test(sample) ||
        /<head[\s>]/i.test(sample) ||
        (/<body[\s>]/i.test(sample) && /<\/body>/i.test(content)) ||
        /^<(!DOCTYPE|html|head|body|div|p|span|section|article|header|footer|nav|main)/i.test(trimmed)) {
        return 'html';
    }

    // XML - sprawdź deklarację XML lub strukturę
    if (/^\s*<\?xml/i.test(trimmed) ||
        (/^<[\w-]+[^>]*>/.test(trimmed) && /<\/[\w-]+>\s*$/.test(trimmed) && !/<(script|style|div|p|span|body|html)/i.test(sample))) {
        return 'xml';
    }

    // JavaScript przed CSS – żeby obiekty JS nie były brane za CSS
    if (/(^|\n)\s*(const|let|var|function|class|import|export|async|await)\s+/m.test(sample) ||
        /=>\s*[\{\(]/.test(sample) ||
        /(console|document|window|process|require|module)\.\w+/m.test(sample) ||
        /^\s*['"`]use strict['"`];?/m.test(trimmed)) {
        return 'javascript';
    }

    // CSS - sprawdź selektory, reguły i at-rules
    if (/^\s*(@(charset|import|media|font-face|keyframes|supports|page)|[.#@*]?[\w-]+\s*\{|:root\s*\{)/i.test(trimmed) ||
        (/\{[^}]*([a-z-]+\s*:\s*[^;]+;)+[^}]*\}/i.test(sample) && !/^\s*[\{\[]/.test(trimmed))) {
        return 'css';
    }

    return 'plaintext';
}

function markAsSaved() {
    hasUnsavedChanges = false;
    lastSavedContent = editor.getValue();
    updateStatusBar();
    updateUpdateButton();
}

function checkUnsavedChanges() {
    return hasUnsavedChanges && editor.getValue() !== lastSavedContent;
}

function updateUpdateButton() {
    const updateBtn = document.getElementById('updateNoteBtn');
    if (!updateBtn) return;

    if (currentLoadedFile && hasUnsavedChanges) {
        updateBtn.style.display = 'inline-block';
    } else {
        updateBtn.style.display = 'none';
    }
}

function initMonaco() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        // Na starcie vs/vs-dark – monaco-style.js po 'load' ustawi terminal-dark/terminal-light
        const theme = document.documentElement.getAttribute("data-theme") === "light" ? "vs" : "vs-dark";

        editor = monaco.editor.create(document.getElementById('editor'), {
            value: "// TERMINAL_READY\n// START_CODING...",
            language: 'javascript',
            theme: theme,
            fontSize: editorSettings.fontSize,
            fontFamily: editorSettings.fontFamily,
            lineHeight: editorSettings.lineHeight || 0,
            automaticLayout: true,
            minimap: { enabled: editorSettings.minimap },
            scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
            cursorBlinking: editorSettings.cursorBlinking,
            cursorStyle: editorSettings.cursorStyle,
            cursorSmoothCaretAnimation: editorSettings.cursorSmoothCaretAnimation,
            bracketPairColorization: {
                enabled: editorSettings.bracketPairColorization,
                independentColorPoolPerBracketType: true
            },
            guides: {
                bracketPairs: true,
                bracketPairsHorizontal: true,
                highlightActiveBracketPair: true
            },
            matchBrackets: editorSettings.matchBrackets,
            scrollBeyondLastLine: editorSettings.scrollBeyondLastLine,
            renderLineHighlight: editorSettings.renderLineHighlight,
            renderWhitespace: editorSettings.renderWhitespace,
            smoothScrolling: editorSettings.smoothScrolling,
            mouseWheelZoom: editorSettings.mouseWheelZoom,
            contextmenu: true,
            quickSuggestions: editorSettings.quickSuggestions,
            suggestOnTriggerCharacters: editorSettings.suggestOnTriggerCharacters,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: editorSettings.acceptSuggestionOnEnter,
            tabCompletion: 'on',
            wordBasedSuggestions: 'matchingDocuments',
            parameterHints: {
                enabled: true
            },
            colorDecorators: editorSettings.colorDecorators,
            links: editorSettings.links,
            folding: editorSettings.folding,
            foldingStrategy: 'auto',
            showFoldingControls: editorSettings.showFoldingControls,
            unfoldOnClickAfterEndOfLine: false,
            highlightActiveIndentGuide: true,
            renderControlCharacters: false,
            renderIndentGuides: editorSettings.renderIndentGuides,
            renderFinalNewline: true,
            wordWrap: editorSettings.wordWrap,
            tabSize: editorSettings.tabSize,
            insertSpaces: editorSettings.insertSpaces,
            autoClosingBrackets: editorSettings.autoClosingBrackets,
            autoClosingQuotes: editorSettings.autoClosingQuotes,
            formatOnPaste: editorSettings.formatOnPaste,
            formatOnType: editorSettings.formatOnType,
            roundedSelection: editorSettings.roundedSelection,
            occurrencesHighlight: editorSettings.occurrencesHighlight,
            selectionHighlight: editorSettings.selectionHighlight,
            codeLens: editorSettings.codeLens,
            multiCursorModifier: editorSettings.multiCursorModifier,
            dragAndDrop: editorSettings.dragAndDrop,
            emptySelectionClipboard: editorSettings.emptySelectionClipboard,
            copyWithSyntaxHighlighting: editorSettings.copyWithSyntaxHighlighting
        });



        monacoLoaded = true;
        lastSavedContent = editor.getValue();
        editor.onDidChangeCursorPosition(updateStatusBar);

        let detectionTimeout;
        editor.onDidChangeModelContent(() => {
            hasUnsavedChanges = true;
            updateStatusBar();
            updateUpdateButton();
            if (isAutoDetectEnabled) {
                clearTimeout(detectionTimeout);
                // Zmniejszony timeout z 1000ms na 300ms dla szybszej detekcji
                detectionTimeout = setTimeout(() => {
                    const detected = runHeuristicDetection(editor.getValue());
                    if (detected && detected !== editor.getModel().getLanguageId()) {
                        monaco.editor.setModelLanguage(editor.getModel(), detected);
                        updateSelectUI(detected);
                    }
                }, 300);
            }
        });

        initializeCustomSelects();
        fetchGitHubData();
        updateStatusBar();
        updateUpdateButton();

        var restoreName = localStorage.getItem(STORAGE_KEY_RESTORE_NOTE);
        if (restoreName) {
            var saved = JSON.parse(localStorage.getItem('terminal_db') || '{}');
            if (saved[restoreName]) {
                var data = saved[restoreName];
                editor.setValue(data.content || '');
                monaco.editor.setModelLanguage(editor.getModel(), data.language || 'plaintext');
                currentLoadedFile = { name: restoreName, source: 'local' };
                lastSavedContent = editor.getValue();
                hasUnsavedChanges = false;
                updateStatusBar();
                updateUpdateButton();
                syncSyntaxSelectFromModel();
                updateDocumentTitle();
            }
        } else {
            syncSyntaxSelectFromModel();
            updateDocumentTitle();
        }
    });
}

function updateStatusBar() {
    if (!monacoLoaded) return;
    const pos = editor.getPosition();
    const model = editor.getModel();
    const unsavedIndicator = hasUnsavedChanges ? ' <img src="https://api.iconify.design/ph:warning-circle-duotone.svg" width="18" height="18" class="status-icon-red"><span style="color: rgba(var(--danger-rgb), 1);"> NIEZAPISANE</span>' : '';
    const fileIndicator = currentLoadedFile ? ` <span style="color: var(--highlight-color);">• ${currentLoadedFile.name}</span>` : '';
    const statusIcon = hasUnsavedChanges ? '<img src="https://api.iconify.design/ph:warning-duotone.svg" width="18" height="18" class="file-icon">' : '<img src="https://api.iconify.design/ph:check-square-duotone.svg" width="18" height="18" class="status-icon">';
    const fileIcon = currentLoadedFile ? '<img src="https://api.iconify.design/ph:clipboard-text-duotone.svg" width="18" height="18" class="file-icon">' : '<img src="https://api.iconify.design/ph:clipboard-duotone.svg" width="18" height="18" class="file-icon">';
    // Language icon mapping
    const langIcons = {
        'javascript': 'https://api.iconify.design/material-icon-theme:javascript.svg',
        'json': 'https://api.iconify.design/vscode-icons:file-type-light-json.svg',
        'html': 'https://api.iconify.design/vscode-icons:file-type-html.svg',
        'css': 'https://api.iconify.design/vscode-icons:file-type-css2.svg',
        'xml': 'https://api.iconify.design/vscode-icons:file-type-xml.svg',
        'plaintext': 'https://api.iconify.design/material-icon-theme:latexmk.svg'
    };
    const currentLang = model.getLanguageId();
    const langIcon = langIcons[currentLang] || 'https://api.iconify.design/vscode-icons:file-type-json2.svg';
    const langIconHtml = `<img src="${langIcon}" width="18" height="18" class="lang-icon">`;
    document.getElementById('statusText').innerHTML = `${statusIcon} SYSTEM_READY | ${fileIcon} [LN ${pos.lineNumber}, COL ${pos.column}] | LANG: ${langIconHtml}${fileIndicator}${unsavedIndicator}`;
}

/**
 * --- ACTIONS ---
 */
window.applyTransform = function (type) {
    if (!monacoLoaded) return;
    const selection = editor.getSelection();
    const model = editor.getModel();
    let text = selection.isEmpty() ? editor.getValue() : model.getValueInRange(selection);
    if (!text) return;

    let result = text;
    switch (type) {
        case 'uppercase': result = text.toUpperCase(); break;
        case 'lowercase': result = text.toLowerCase(); break;
        case 'capitalize': result = text.replace(/\b\w/g, l => l.toUpperCase()); break;
        case 'sort': result = text.split('\n').sort().join('\n'); break;
        case 'removeDuplicates': result = [...new Set(text.split('\n'))].join('\n'); break;
        case 'removeEmpty': result = text.split('\n').filter(l => l.trim() !== "").join('\n'); break;
        case 'trim': result = text.split('\n').map(l => l.trim()).join('\n'); break;
        case 'addNumbers': result = text.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'); break;
        case 'wrap':
            const len = parseInt(document.getElementById('wrapLength').value) || 80;
            const reg = new RegExp(`.{1,${len}}`, 'g');
            result = text.replace(/\n/g, ' ').match(reg)?.join('\n') || text;
            break;
    }

    if (selection.isEmpty()) editor.setValue(result);
    else editor.executeEdits("transform", [{ range: selection, text: result, forceMoveMarkers: true }]);
    CustomUI.toast("TRANSFORM_SUCCESS");
};

window.formatCode = async function () {
    if (!monacoLoaded) return;
    const model = editor.getModel();
    const code = editor.getValue();
    const lang = model.getLanguageId();
    let parser = lang === 'javascript' ? 'babel' : (lang === 'html' ? 'html' : (lang === 'css' ? 'css' : null));

    if (lang === 'json') {
        try { editor.setValue(JSON.stringify(JSON.parse(code), null, 4)); return; } catch (e) { }
    }
    if (!parser) { CustomUI.toast("FORMAT_UNAVAILABLE"); return; }
    try {
        const formatted = prettier.format(code, { parser, plugins: prettierPlugins, tabWidth: 4 });
        editor.setValue(formatted);
    } catch (e) { CustomUI.toast("SYNTAX_ERROR", "error"); }
};

window.newFile = async function () {
    if (checkUnsavedChanges()) {
        const confirmed = await CustomUI.confirm(
            'NIEZAPISANE ZMIANY',
            'Masz niezapisane zmiany. Czy na pewno chcesz utworzyć nowy plik?',
            'Tak, utwórz nowy',
            'Anuluj',
            true
        );
        if (!confirmed) return;
    }
    editor.setValue("");
    currentLoadedFile = null;
    localStorage.removeItem(STORAGE_KEY_RESTORE_NOTE);
    markAsSaved();
    updateDocumentTitle();
};

window.clearEditor = async function () {
    if (checkUnsavedChanges()) {
        const confirmed = await CustomUI.confirm(
            'NIEZAPISANE ZMIANY',
            'Masz niezapisane zmiany. Czy na pewno chcesz wyczyścić edytor?',
            'Tak, wyczyść',
            'Anuluj',
            true
        );
        if (!confirmed) return;
    } else {
        const confirmed = await CustomUI.confirm(
            'CZYŚĆ BUFOR',
            'Czy na pewno chcesz wyczyścić edytor?',
            'Tak, wyczyść',
            'Anuluj',
            false
        );
        if (!confirmed) return;
    }
    editor.setValue("");
    currentLoadedFile = null;
    localStorage.removeItem(STORAGE_KEY_RESTORE_NOTE);
    markAsSaved();
    updateDocumentTitle();
};

window.saveFile = function () {
    const blob = new Blob([editor.getValue()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `terminal_dump_${Date.now()}.txt`;
    a.click();
    markAsSaved();
};

window.openFile = async function () {
    if (checkUnsavedChanges()) {
        const confirmed = await CustomUI.confirm(
            'NIEZAPISANE ZMIANY',
            'Masz niezapisane zmiany. Czy na pewno chcesz otworzyć inny plik?',
            'Tak, otwórz',
            'Anuluj',
            true
        );
        if (!confirmed) return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.js,.html,.css,.json,.md';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            editor.setValue(ev.target.result);
            currentLoadedFile = null;
            localStorage.removeItem(STORAGE_KEY_RESTORE_NOTE);
            markAsSaved();
            updateDocumentTitle();
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
};

window.saveLocally = async function () {
    const name = await CustomUI.prompt('NAZWA_REKORDU', 'Podaj nazwę...');
    if (name) {
        const data = { content: editor.getValue(), language: editor.getModel().getLanguageId(), date: new Date().toLocaleString() };
        let saved = JSON.parse(localStorage.getItem('terminal_db') || '{}');
        saved[name] = data;
        localStorage.setItem('terminal_db', JSON.stringify(saved));
        scheduleAutoTransferToGitHub();
        CustomUI.toast("STORE_SUCCESS");
        markAsSaved();
        /** Szybki zapis do LOCAL_DB: jeśli notatka załadowana – zapis w miejscu; jeśli nie – prośba o nazwę (żeby nic nie utracić). */
        window.quickSaveLocally = async function () {
            if (currentLoadedFile && currentLoadedFile.source === 'local') {
                const data = {
                    content: editor.getValue(),
                    language: editor.getModel().getLanguageId(),
                    date: new Date().toLocaleString()
                };
                let saved = JSON.parse(localStorage.getItem('terminal_db') || '{}');
                saved[currentLoadedFile.name] = data;
                localStorage.setItem('terminal_db', JSON.stringify(saved));
                scheduleAutoTransferToGitHub();
                markAsSaved();
                CustomUI.toast('Zapisano: ' + currentLoadedFile.name, 'success');
                return;
            }
            await saveLocally();
        };

    }
};

window.updateLoadedNote = async function () {
    if (!currentLoadedFile) return;

    const confirmed = await CustomUI.confirm(
        'AKTUALIZACJA NOTATKI',
        `Czy na pewno chcesz zaktualizować notatkę "${currentLoadedFile.name}"?`,
        'Tak, aktualizuj',
        'Anuluj',
        false
    );

    if (!confirmed) return;

    const data = {
        content: editor.getValue(),
        language: editor.getModel().getLanguageId(),
        date: new Date().toLocaleString()
    };

    let saved = JSON.parse(localStorage.getItem('terminal_db') || '{}');
    saved[currentLoadedFile.name] = data;
    localStorage.setItem('terminal_db', JSON.stringify(saved));
    scheduleAutoTransferToGitHub();
    CustomUI.toast("NOTATKA ZAKTUALIZOWANA", "success");
    markAsSaved();
};

window.exportLocalDB = function () {
    const saved = localStorage.getItem('terminal_db') || '{}';
    const blob = new Blob([saved], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `local_db_backup_${Date.now()}.json`;
    a.click();
    CustomUI.toast("EXPORT_SUCCESS");
};

window.importLocalDB = async function () {
    const confirmed = await CustomUI.confirm(
        'IMPORT LOCAL_DB',
        'Import zastąpi całą zawartość LOCAL_DB. Czy kontynuować?',
        'Tak, importuj',
        'Anuluj',
        true
    );
    if (!confirmed) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                // Normalizacja danych - jeśli to obiekt z kluczami, zachowaj strukturę
                // Jeśli to tablica, przekształć na obiekt z nazwami jako kluczami
                let normalizedData = {};
                if (Array.isArray(data)) {
                    data.forEach((item, index) => {
                        const name = item.name || `imported_${index + 1}`;
                        normalizedData[name] = {
                            content: item.content || item.code || JSON.stringify(item, null, 2),
                            language: item.language || 'plaintext',
                            date: item.date || new Date().toLocaleString()
                        };
                    });
                } else if (typeof data === 'object') {
                    // Jeśli to już obiekt z kluczami, zachowaj go
                    normalizedData = data;
                }
                localStorage.setItem('terminal_db', JSON.stringify(normalizedData));
                scheduleAutoTransferToGitHub();
                CustomUI.toast("IMPORT_SUCCESS", "success");
                CustomUI.close();
                showLocalFiles();
            } catch (err) {
                CustomUI.toast("IMPORT_ERROR: Nieprawidłowy format JSON", "error");
            }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
};

function getSyncedNoteNames() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_SYNCED_NAMES);
        return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
}

function setSyncedNoteNames(names) {
    localStorage.setItem(STORAGE_KEY_SYNCED_NAMES, JSON.stringify(names));
}

function getGitHubToken() {
    try {
        const t = localStorage.getItem(STORAGE_KEY_GITHUB_TOKEN);
        return t && t.trim() ? t.trim() : null;
    } catch (_) { return null; }
}

function setGitHubToken(token) {
    if (token == null || String(token).trim() === "") {
        localStorage.removeItem(STORAGE_KEY_GITHUB_TOKEN);
    } else {
        localStorage.setItem(STORAGE_KEY_GITHUB_TOKEN, String(token).trim());
    }
}

/** Nagłówek Authorization dla GitHub API: Classic PAT (ghp_) = "token ...", Fine-grained = "Bearer ..." */
function getGitHubAuthHeader() {
    const t = getGitHubToken();
    if (!t) return null;
    const v = t.toLowerCase();
    if (v.startsWith("ghp_") || v.startsWith("gho_")) return "token " + t;
    return "Bearer " + t;
}

/** Wspólne nagłówki dla requestów do GitHub API (zmniejsza ryzyko 403) */
function getGitHubApiHeaders(extra) {
    const auth = getGitHubAuthHeader();
    const h = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "NotesSync-App"
    };
    if (auth) h.Authorization = auth;
    return extra ? { ...h, ...extra } : h;
}

window.saveGitHubToken = function () {
    const input = document.getElementById("githubTokenInput");
    if (!input) return;
    const val = (input.value || "").trim();
    setGitHubToken(val || null);
    if (val) {
        CustomUI.toast("Token GitHub zapisany", "success");
        input.value = "";
        input.placeholder = "•••••••• (zapisany)";
        const hint = document.querySelector("#settings-github .settings-github-control .settings-github-hint");
        if (hint) { hint.textContent = "Token zapisany. Wpisz nowy i Zapisz, aby zmienić."; hint.classList.remove("settings-github-hint-token-empty"); hint.classList.add("settings-github-hint-token-saved"); }
    } else {
        CustomUI.toast("Token usunięty", "success");
        input.placeholder = "ghp_... lub Fine-grained token";
        const hint = document.querySelector("#settings-github .settings-github-control .settings-github-hint");
        if (hint) { hint.textContent = "Pull/Push z repo s-pro-v/json-lista. Push: token z zapisem (Contents lub repo); w org. włącz SSO."; hint.classList.remove("settings-github-hint-token-saved"); hint.classList.add("settings-github-hint-token-empty"); }
    }
};

window.clearGitHubToken = function () {
    setGitHubToken(null);
    const input = document.getElementById("githubTokenInput");
    if (input) {
        input.value = "";
        input.placeholder = "ghp_... lub Fine-grained token";
    }
    const hint = document.querySelector("#settings-github .settings-github-control .settings-github-hint");
    if (hint) { hint.textContent = "Pull/Push z repo s-pro-v/json-lista. Push: token z zapisem (Contents lub repo); w org. włącz SSO."; hint.classList.remove("settings-github-hint-token-saved"); hint.classList.add("settings-github-hint-token-empty"); }
    CustomUI.toast("Token GitHub usunięty", "success");
};

function getAutoTransferToGitHub() {
    try {
        return localStorage.getItem(STORAGE_KEY_AUTO_TRANSFER) === "true";
    } catch (_) { return false; }
}

function setAutoTransferToGitHub(enabled) {
    localStorage.setItem(STORAGE_KEY_AUTO_TRANSFER, enabled ? "true" : "false");
}

/** Buduje plik do wysyłki na GitHub: tylko notatki z LOCAL_DB, format [ { name, content, date, mode } ]. */
function buildPushPayloadFromLocal() {
    const saved = JSON.parse(localStorage.getItem("terminal_db") || "{}");
    const arr = Object.entries(saved).map(([name, v]) => {
        if (!v || typeof v !== "object") return null;
        return {
            name: String(name),
            content: v.content != null ? String(v.content) : "",
            date: v.date != null ? String(v.date) : new Date().toLocaleString(),
            mode: v.language != null ? String(v.language) : "plaintext"
        };
    }).filter(Boolean);
    const json = JSON.stringify(arr, null, 2);
    return { json, arr };
}

/** Buduje zmergowany JSON (remote notes.json + local) – do schowka/pobrania przy ręcznym Push. */
async function buildMergedNotesJson() {
    const saved = JSON.parse(localStorage.getItem("terminal_db") || "{}");
    let remoteArr = [];
    try {
        remoteArr = await fetchNotesJsonFromGitHub();
    } catch (_) { }
    const remoteByName = new Map();
    remoteArr.forEach((item, idx) => {
        const n = item.name || "item_" + idx;
        remoteByName.set(n, { name: n, content: item.content != null ? item.content : "", date: item.date || "-", mode: item.mode || "plaintext" });
    });
    Object.entries(saved).forEach(([name, v]) => {
        if (!v || typeof v !== "object") return;
        remoteByName.set(name, {
            name: String(name),
            content: v.content != null ? String(v.content) : "",
            date: v.date != null ? String(v.date) : new Date().toLocaleString(),
            mode: v.language != null ? String(v.language) : "plaintext"
        });
    });
    const arr = Array.from(remoteByName.values());
    const json = JSON.stringify(arr, null, 2);
    return { json, arr };
}

/** Wysyła JSON na GitHub (PUT). Zwraca true jeśli OK. Rzuca lub zwraca false przy błędzie. */
async function pushJsonToGitHubApi(json) {
    const token = getGitHubToken();
    if (!token) return false;
    let sha = null;
    const getRes = await fetch(GITHUB_PUSH_API_URL, { headers: getGitHubApiHeaders() });
    if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha || null;
    }
    const putRes = await fetch(GITHUB_PUSH_API_URL, {
        method: "PUT",
        headers: getGitHubApiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
            message: "Update new-note.json",
            content: btoa(unescape(encodeURIComponent(json))),
            sha: sha || undefined
        })
    });
    if (!putRes.ok) {
        let errText = await putRes.text();
        let msg = putRes.status + ": " + (errText || "").slice(0, 200);
        try { const errJson = JSON.parse(errText); if (errJson.message) msg = putRes.status + ": " + errJson.message; } catch (_) { }
        if (putRes.status === 403) msg += " Token: zapis do repo lub SSO.";
        throw new Error(msg);
    }
    return true;
}

function scheduleAutoTransferToGitHub() {
    if (!getAutoTransferToGitHub() || !getGitHubToken()) return;
    if (autoTransferToGitHubTimer) clearTimeout(autoTransferToGitHubTimer);
    autoTransferToGitHubTimer = setTimeout(async () => {
        autoTransferToGitHubTimer = null;
        try {
            const { json, arr } = buildPushPayloadFromLocal();
            await pushJsonToGitHubApi(json);
            setSyncedNoteNames(arr.map((item) => item.name));
            CustomUI.toast("Auto: wgrano do GitHub", "success");
        } catch (e) {
            CustomUI.toast("Auto transfer: " + (e.message || String(e)), "error");
        }
    }, AUTO_TRANSFER_DEBOUNCE_MS);
}

/** Pobiera notes.json z GitHub (z tokenem przez API lub bez tokenu przez raw URL). Zwraca tablicę notatek lub rzuca. */
async function fetchNotesJsonFromGitHub() {
    const token = getGitHubToken();
    if (token) {
        const res = await fetch(GITHUB_NOTES_API_URL, {
            headers: getGitHubApiHeaders({ Accept: "application/vnd.github.raw" })
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error("HTTP " + res.status + (errBody ? ": " + errBody.slice(0, 80) : ""));
        }
        const text = await res.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("Oczekiwano tablicy w notes.json");
        return data;
    }
    const res = await fetch(NOTES_SYNC_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const arr = await res.json();
    if (!Array.isArray(arr)) throw new Error("Oczekiwano tablicy");
    return arr;
}

window.showLocalFiles = function () {
    const saved = JSON.parse(localStorage.getItem('terminal_db') || '{}');
    const syncedSet = new Set(getSyncedNoteNames());
    const entries = Object.entries(saved);
    entries.sort((a, b) => {
        const dateA = a[1] && a[1].date ? new Date(a[1].date).getTime() : 0;
        const dateB = b[1] && b[1].date ? new Date(b[1].date).getTime() : 0;
        return dateB - dateA;
    });
    if (entries.length === 0) { CustomUI.toast("DB_EMPTY"); return; }
    let html = '<div class="local-files-grid">';
    entries.forEach(([name, data]) => {
        // Zabezpieczenie przed null/undefined data
        if (!data) return;
        const iconClass = 'fas fa-file-code';
        const displayDate = data.date || '-';
        const pendingPush = !syncedSet.has(name);
        const nameEscJs = String(name).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const nameEscHtml = String(name).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const pendingBadge = pendingPush
            ? '<span class="local-file-pending-push" title="Oczekuje na przesłanie do repozytorium">Oczekuje na przesłanie</span>'
            : '';
        html += `<div class="local-file-card ${pendingPush ? 'local-file-pending' : ''}">
                    <div class="card-header">
                        <div class="card-file-name" title="${nameEscHtml}">${name}</div>
                        <button class="card-delete-btn" onclick="event.stopPropagation(); deleteLocalFile('${nameEscJs}')" title="Usuń notatkę">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="card-file-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="card-file-details">
                            Zapisano:<br>
                            <span>${displayDate}</span>
                            ${pendingBadge}
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-action-btn" onclick="loadLocal('${nameEscJs}')">
                            WCZYTAJ
                        </button>
                    </div>
                </div>`;
    });
    html += '</div>';
    const modal = CustomUI.createOverlay(true);
    modal.innerHTML = `
        <h2>LOCAL_DB</h2>
        <div class="custom-modal-content">${html}</div>
        <div class="custom-modal-actions">
            <button class="custom-btn custom-btn-confirm" onclick="exportLocalDB()">
                <i class="fas fa-download"></i> Export JSON
            </button>
            <button class="custom-btn custom-btn-confirm" onclick="importLocalDB()">
                <i class="fas fa-upload"></i> Import JSON
            </button>
            <button class="custom-btn custom-btn-danger" onclick="deleteAllLocalNotes()" title="Usuń wszystkie notatki">
                <i class="fas fa-trash-alt"></i> Usuń wszystkie
            </button>
            <button class="custom-btn custom-btn-cancel" onclick="CustomUI.close()">Zamknij</button>
        </div>
    `;
};

window.deleteLocalFile = async function (name) {
    const confirmed = await CustomUI.confirm(
        'USUŃ NOTATKĘ',
        'Czy na pewno chcesz usunąć notatkę "' + name + '"?',
        'Tak, usuń',
        'Anuluj',
        true
    );
    if (!confirmed) return;
    const saved = JSON.parse(localStorage.getItem('terminal_db') || '{}');
    delete saved[name];
    localStorage.setItem('terminal_db', JSON.stringify(saved));
    if (currentLoadedFile && currentLoadedFile.name === name) {
        currentLoadedFile = null;
        editor.setValue('');
        monaco.editor.setModelLanguage(editor.getModel(), 'plaintext');
        markAsSaved();
    }
    CustomUI.toast('Notatka usunięta', 'success');
    if (Object.keys(saved).length === 0) CustomUI.close();
    else showLocalFiles();
};

window.deleteAllLocalNotes = async function () {
    const confirmed = await CustomUI.confirm(
        'USUŃ WSZYSTKIE NOTATKI',
        'Czy na pewno chcesz usunąć wszystkie notatki z LOCAL_DB? Tej operacji nie można cofnąć.',
        'Tak, usuń wszystkie',
        'Anuluj',
        true
    );
    if (!confirmed) return;
    localStorage.setItem('terminal_db', '{}');
    currentLoadedFile = null;
    editor.setValue('');
    monaco.editor.setModelLanguage(editor.getModel(), 'plaintext');
    markAsSaved();
    CustomUI.toast('Wszystkie notatki usunięte', 'success');
    CustomUI.close();
};

window.loadLocal = async function (name) {
    if (checkUnsavedChanges()) {
        const confirmed = await CustomUI.confirm(
            'NIEZAPISANE ZMIANY',
            'Masz niezapisane zmiany. Czy na pewno chcesz wczytać inny plik?',
            'Tak, wczytaj',
            'Anuluj',
            true
        );
        if (!confirmed) return;
    }
    const data = JSON.parse(localStorage.getItem('terminal_db'))[name];
    editor.setValue(data.content);
    monaco.editor.setModelLanguage(editor.getModel(), data.language);
    currentLoadedFile = { name: name, source: 'local' };
    localStorage.setItem(STORAGE_KEY_RESTORE_NOTE, name);
    markAsSaved();
    syncSyntaxSelectFromModel();
    updateDocumentTitle();
    CustomUI.close();
};

async function fetchGitHubData() {
    const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${GITHUB_FILE}`;
    try {
        const res = await fetch(url);
        if (res.ok) window.projectsData = await res.json();
    } catch (e) { }
}

window.showGitHubFiles = function () {
    if (!window.projectsData) return;
    let files = Array.isArray(window.projectsData) ? window.projectsData : (window.projectsData.files || []);
    let html = '<div class="local-files-grid">';
    files.forEach((file, idx) => {
        const iconClass = 'fas fa-file-code';
        html += `<div class="local-file-card">
                    <div class="card-header">
                        <div class="card-file-name" title="${file.name || 'GIT_NODE_' + idx}">${file.name || 'GIT_NODE_' + idx}</div>
                        <button class="card-delete-btn" onclick="event.stopPropagation(); deleteGitFile(${idx})" title="Usuń" style="display:none;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="card-file-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="card-file-details">
                            Zapisano:<br>
                            <span>${file.date || '-'}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="card-action-btn" onclick="loadGit(${idx})">
                            WCZYTAJ
                        </button>
                    </div>
                </div>`;
    });
    html += '</div>';
    window._gitFiles = files;
    const modal = CustomUI.createOverlay(true);
    modal.innerHTML = `
        <h2>GITHUB_EXPLORER</h2>
        <div class="custom-modal-content">${html}</div>
        <div class="custom-modal-actions">
            <button class="custom-btn custom-btn-confirm" onclick="pullNotesFromGitHub()" title="Pobierz notes.json do LOCAL_DB">
                <i class="fas fa-download"></i> Pull
            </button>
            <button class="custom-btn custom-btn-confirm" onclick="pushNotesToGitHub()" title="Wgraj do new-note.json na GitHub (copy / pobierz)">
                <i class="fas fa-upload"></i> Push
            </button>
            <button class="custom-btn custom-btn-cancel" onclick="CustomUI.close()">Zamknij</button>
        </div>
    `;
};

window.pullNotesFromGitHub = async function () {
    try {
        const arr = await fetchNotesJsonFromGitHub();
        const saved = JSON.parse(localStorage.getItem("terminal_db") || "{}");
        const syncedNames = [];
        let count = 0;
        arr.forEach((item) => {
            const name = item.name || "item_" + count;
            syncedNames.push(name);
            saved[name] = {
                content: item.content != null ? item.content : "",
                language: item.mode || "plaintext",
                date: item.date || new Date().toLocaleString()
            };
            count++;
        });
        localStorage.setItem("terminal_db", JSON.stringify(saved));
        setSyncedNoteNames(syncedNames);
        showLocalFiles();
        CustomUI.toast("Pull OK: " + count + " notatek", "success");
        CustomUI.close();
    } catch (e) {
        CustomUI.toast("Pull error: " + (e.message || String(e)), "error");
    }
};

window.pushNotesToGitHub = async function () {
    const { json, arr } = buildPushPayloadFromLocal();
    const token = getGitHubToken();
    if (token) {
        try {
            await pushJsonToGitHubApi(json);
            CustomUI.toast("Wgrano new-note.json na GitHub", "success");
        } catch (e) {
            CustomUI.toast("Push do GitHub: " + (e.message || String(e)), "error");
        }
    }
    navigator.clipboard.writeText(json).then(
        () => CustomUI.toast("Skopiowano new-note.json do schowka", "success"),
        () => CustomUI.toast("Schowek niedostępny", "error")
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = PUSH_TARGET_FILE;
    a.click();
    URL.revokeObjectURL(a.href);
    setSyncedNoteNames(arr.map((item) => item.name));
    if (!token) {
        CustomUI.toast("Pobrano " + PUSH_TARGET_FILE, "success");
    }
}

window.loadGit = async function (idx) {
    if (checkUnsavedChanges()) {
        const confirmed = await CustomUI.confirm(
            'NIEZAPISANE ZMIANY',
            'Masz niezapisane zmiany. Czy na pewno chcesz wczytać plik z GitHub?',
            'Tak, wczytaj',
            'Anuluj',
            true
        );
        if (!confirmed) return;
    }
    const file = window._gitFiles[idx];
    editor.setValue(file.content || file.code || JSON.stringify(file, null, 2));
    if (file.mode) monaco.editor.setModelLanguage(editor.getModel(), file.mode);
    currentLoadedFile = { name: file.name || 'GIT_NODE_' + idx, source: 'github' };
    markAsSaved();
    syncSyntaxSelectFromModel();
    updateDocumentTitle();
    CustomUI.close();
};

function initializeCustomSelects() {
    const container = document.getElementById('syntaxSelectContainer');
    const trigger = container.querySelector('.ja-select-btn');
    const list = container.querySelector('.ja-select-list');

    trigger.onclick = (e) => {
        e.stopPropagation();
        trigger.classList.toggle('ja-open');
        list.classList.toggle('ja-visible');
    };

    document.querySelectorAll('.ja-select-item').forEach(item => {
        item.onclick = () => {
            const val = item.getAttribute('data-value');
            isAutoDetectEnabled = (val === 'auto');
            if (!isAutoDetectEnabled) monaco.editor.setModelLanguage(editor.getModel(), val);

            // Aktualizuj wyświetlaną wartość (bez prefixu)
            const textContent = Array.from(item.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('');
            trigger.querySelector('span:not(.ja-select-arrow)').textContent = textContent;
            trigger.querySelector('img').src = item.querySelector('img')?.src || '';

            // Zamknij listę
            trigger.classList.remove('ja-open');
            list.classList.remove('ja-visible');

            // Usuń zaznaczenie z wszystkich i dodaj do wybranego
            document.querySelectorAll('.ja-select-item').forEach(i => i.classList.remove('ja-selected'));
            item.classList.add('ja-selected');

            trigger.setAttribute('data-value', val);
            updateDocumentTitle();
            updateStatusBar();
        };
    });

    document.addEventListener('click', () => {
        trigger.classList.remove('ja-open');
        list.classList.remove('ja-visible');
    });
}

function getEncodingDisplayName(langId) {
    if (!langId) return 'Plain Text';
    return ENCODING_DISPLAY_NAMES[langId] || (langId.charAt(0).toUpperCase() + langId.slice(1));
}

function updateDocumentTitle() {
    if (!editor || !monacoLoaded) return;
    var lang = editor.getModel().getLanguageId();
    var encodingName = getEncodingDisplayName(lang);
    if (currentLoadedFile) {
        document.title = 'TERMINAL: NOTATNIK | ' + currentLoadedFile.name + ' · ' + encodingName;
    } else {
        document.title = 'TERMINAL: NOTATNIK | ' + encodingName;
    }
}

/** Ustawia trigger w #syntaxSelectContainer na aktualny język modelu (np. css → "CSS"). Wywołać po każdej zmianie języka. */
function syncSyntaxSelectFromModel() {
    if (!editor || !monacoLoaded) return;
    var lang = editor.getModel().getLanguageId();
    if (!lang) return;
    var trigger = document.querySelector('#syntaxSelectContainer .ja-select-btn');
    if (!trigger) return;
    var item = document.querySelector('#syntaxSelectContainer .ja-select-item[data-value="' + lang + '"]');
    if (item) {
        var textContent = Array.from(item.childNodes)
            .filter(function (node) { return node.nodeType === Node.TEXT_NODE; })
            .map(function (node) { return node.textContent.trim(); })
            .join('');
        var span = trigger.querySelector('span:not(.ja-select-arrow)');
        var img = trigger.querySelector('img');
        if (span) span.textContent = textContent;
        if (img && item.querySelector('img')) img.src = item.querySelector('img').src;
        trigger.setAttribute('data-value', lang);
        document.querySelectorAll('#syntaxSelectContainer .ja-select-item').forEach(function (i) { i.classList.remove('ja-selected'); });
        item.classList.add('ja-selected');
    } else {
        var span = trigger.querySelector('span:not(.ja-select-arrow)');
        if (span) span.textContent = getEncodingDisplayName(lang);
        trigger.setAttribute('data-value', lang);
    }
    updateDocumentTitle();
}

function updateSelectUI(lang) {
    if (!lang || !isAutoDetectEnabled) return;
    syncSyntaxSelectFromModel();
}

window.exportJSON = () => {
    const data = { content: editor.getValue(), language: editor.getModel().getLanguageId(), timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'terminal_backup.json'; a.click();
    markAsSaved();
};

window.importJSON = async function () {
    if (checkUnsavedChanges()) {
        const confirmed = await CustomUI.confirm(
            'NIEZAPISANE ZMIANY',
            'Masz niezapisane zmiany. Czy na pewno chcesz zaimportować plik?',
            'Tak, importuj',
            'Anuluj',
            true
        );
        if (!confirmed) return;
    }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            const data = JSON.parse(ev.target.result);
            editor.setValue(data.content || "");
            if (data.language) monaco.editor.setModelLanguage(editor.getModel(), data.language);
            currentLoadedFile = null;
            markAsSaved();
            syncSyntaxSelectFromModel();
            updateDocumentTitle();
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
};

// Odświeżenie (F5 / Ctrl+R): Twój modal zamiast alertu przeglądarki; przed reload zapisujemy, którą notatkę przywrócić
window.addEventListener('keydown', function (e) {
    const isRefresh = (e.key === 'F5') || (e.ctrlKey && (e.key === 'r' || e.key === 'R'));
    if (!isRefresh || !checkUnsavedChanges()) return;
    e.preventDefault();
    CustomUI.confirmReload().then(function (choice) {
        if (currentLoadedFile && currentLoadedFile.source === 'local') {
            localStorage.setItem(STORAGE_KEY_RESTORE_NOTE, currentLoadedFile.name);
        }
        if (choice === 'save') {
            quickSaveLocally().then(function () { location.reload(); });
        } else if (choice === 'reload') {
            location.reload();
        }
    });
});

// Obsługa zmiany motywu (używa Twoich motywów terminal-light / terminal-dark z monaco-style.js)
window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    if (editor && monacoLoaded && typeof monaco !== 'undefined') {
        const monacoTheme = newTheme === "light" ? "terminal-light" : "terminal-dark";
        monaco.editor.setTheme(monacoTheme);
    }
};

// --- SETTINGS PANEL FUNCTIONS ---

/** Buduje HTML custom select (ja-select-wrap) dla ustawień */
function buildJaSelect(settingKey, options, currentValue) {
    const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const currentOption = options.find((o) => String(o.value) === String(currentValue));
    const currentLabel = currentOption ? currentOption.label : options[0].label;
    const items = options
        .map((o) => {
            const selected = String(o.value) === String(currentValue) ? 'ja-selected' : '';
            return `<div class="ja-select-item ${selected}" data-value="${esc(o.value)}"><span class="ja-select-prefix">›</span>${esc(o.label)}</div>`;
        })
        .join('');
    return `<div class="ja-select-wrap" data-setting="${esc(settingKey)}">
        <button type="button" class="ja-select-btn">
            <span class="ja-select-label">${esc(currentLabel)}</span>
            <span class="ja-select-arrow">▼</span>
        </button>
        <div class="ja-select-list">${items}</div>
    </div>`;
}

function bindJaSelects(container) {
    if (!container) return;
    const closeAll = () => {
        document.querySelectorAll('.ja-select-list.ja-visible').forEach((list) => list.classList.remove('ja-visible'));
        document.querySelectorAll('.ja-select-btn.ja-open').forEach((btn) => btn.classList.remove('ja-open'));
    };
    container.querySelectorAll('.ja-select-wrap').forEach((wrap) => {
        const btn = wrap.querySelector('.ja-select-btn');
        const list = wrap.querySelector('.ja-select-list');
        const labelEl = wrap.querySelector('.ja-select-label');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = list.classList.contains('ja-visible');
            closeAll();
            if (!isOpen) {
                list.classList.add('ja-visible');
                btn.classList.add('ja-open');
            }
        });

        wrap.querySelectorAll('.ja-select-item').forEach((item) => {
            item.addEventListener('click', () => {
                const key = wrap.dataset.setting;
                let v = item.getAttribute('data-value');
                if (v === 'true') v = true;
                else if (v === 'false') v = false;

                updateSetting(key, v);

                const textContent = Array.from(item.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .join('');
                labelEl.textContent = textContent;

                wrap.querySelectorAll('.ja-select-item').forEach((i) => i.classList.remove('ja-selected'));
                item.classList.add('ja-selected');
                list.classList.remove('ja-visible');
                btn.classList.remove('ja-open');
            });
        });
    });

    if (!window._jaSelectDocBound) {
        window._jaSelectDocBound = true;
        document.addEventListener('click', (e) => {
            if (e.target.closest('.ja-select-wrap')) return;
            closeAll();
        });
    }
}

function updateSetting(key, value) {
    editorSettings[key] = value;
    localStorage.setItem('monacoEditorSettings', JSON.stringify(editorSettings));
    applyEditorOptions();
    CustomUI.toast(`${key}: ${value}`, "success");
}

function applyEditorOptions() {
    if (!editor || !monacoLoaded) return;

    const options = {
        fontSize: editorSettings.fontSize,
        fontFamily: editorSettings.fontFamily,
        lineHeight: editorSettings.lineHeight || 0,
        wordWrap: editorSettings.wordWrap || 'off',
        minimap: { enabled: editorSettings.minimap },
        lineNumbers: editorSettings.lineNumbers || 'on',
        autoClosingBrackets: editorSettings.autoClosingBrackets || 'always',
        autoClosingQuotes: editorSettings.autoClosingQuotes || 'always',
        tabSize: editorSettings.tabSize || 4,
        insertSpaces: editorSettings.insertSpaces !== false,
        renderWhitespace: editorSettings.renderWhitespace || 'none',
        renderLineHighlight: editorSettings.renderLineHighlight || 'all',
        renderIndentGuides: editorSettings.renderIndentGuides !== false,
        cursorStyle: editorSettings.cursorStyle || 'line',
        cursorBlinking: editorSettings.cursorBlinking || 'blink',
        scrollBeyondLastLine: editorSettings.scrollBeyondLastLine !== false,
        smoothScrolling: editorSettings.smoothScrolling || false,
        mouseWheelZoom: editorSettings.mouseWheelZoom || false,
        roundedSelection: editorSettings.roundedSelection || false,
        formatOnPaste: editorSettings.formatOnPaste || false,
        formatOnType: editorSettings.formatOnType || false,
        bracketPairColorization: { enabled: editorSettings.bracketPairColorization !== false },
        matchBrackets: editorSettings.matchBrackets || 'always',
        guides: { bracketPairs: true },
        occurrencesHighlight: editorSettings.occurrencesHighlight !== false,
        selectionHighlight: editorSettings.selectionHighlight !== false,
        colorDecorators: editorSettings.colorDecorators !== false,
        folding: editorSettings.folding !== false,
        showFoldingControls: editorSettings.showFoldingControls || 'mouseover',
        codeLens: editorSettings.codeLens || false,
        links: editorSettings.links !== false,
        multiCursorModifier: editorSettings.multiCursorModifier || 'alt',
        dragAndDrop: editorSettings.dragAndDrop !== false,
        suggestOnTriggerCharacters: editorSettings.suggestOnTriggerCharacters !== false,
        acceptSuggestionOnEnter: editorSettings.acceptSuggestionOnEnter || 'on'
    };

    editor.updateOptions(options);
}

window.toggleSettings = function () {
    const sidebar = document.getElementById('settingsSidebar');
    const overlay = document.getElementById('settingsOverlay');
    if (!sidebar || !overlay) return;

    if (!sidebar.classList.contains('active')) {
        showSettings();
    }

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};

window.closeSettings = function () {
    const sidebar = document.getElementById('settingsSidebar');
    const overlay = document.getElementById('settingsOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
};

window.switchSettingsTab = function (tabId) {
    document.querySelectorAll('.settings-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.settings-tab-content').forEach(el => el.classList.remove('active'));

    const tab = document.querySelector(`.settings-tab[data-tab="${tabId}"]`);
    if (tab) tab.classList.add('active');

    const content = document.getElementById('settings-' + tabId);
    if (content) content.classList.add('active');
};

function showSettings() {
    const body = document.getElementById('settingsSidebarBody');
    if (!body) return;

    const html = `
        <div class="settings-tabs">
            <div class="settings-tab active" data-tab="general" onclick="switchSettingsTab('general')">
                <i class="fas fa-cog"></i> GENERAL
            </div>
            <div class="settings-tab" data-tab="cursor" onclick="switchSettingsTab('cursor')">
                <i class="fas fa-mouse-pointer"></i> CURSOR
            </div>
            <div class="settings-tab" data-tab="formatting" onclick="switchSettingsTab('formatting')">
                <i class="fas fa-code"></i> FORMATTING
            </div>
            <div class="settings-tab" data-tab="display" onclick="switchSettingsTab('display')">
                <i class="fas fa-eye"></i> DISPLAY
            </div>
            <div class="settings-tab" data-tab="advanced" onclick="switchSettingsTab('advanced')">
                <i class="fas fa-sliders-h"></i> ADVANCED
            </div>
            <div class="settings-tab" data-tab="github" onclick="switchSettingsTab('github')">
               <i class="fa-brands fa-github"></i> GITHUB
            </div>
        </div>
        
        <div id="settings-general" class="settings-tab-content active">
            <div class="setting-item setting-range">
                <label class="setting-label">
                    <i class="fas fa-font setting-icon"></i>
                    <span>Font Size</span>
                </label>
                <div class="setting-control">
                    <input type="range" min="10" max="24" value="${editorSettings.fontSize}" 
                        onchange="updateSetting('fontSize', parseInt(this.value))" 
                        oninput="this.nextElementSibling.textContent = this.value + 'px'">
                    <span class="setting-value">${editorSettings.fontSize}px</span>
                </div>
            </div>
            
            <div class="setting-item setting-range">
                <label class="setting-label">
                    <i class="fas fa-text-height setting-icon"></i>
                    <span>Line Height</span>
                </label>
                <div class="setting-control">
                    <input type="range" min="0" max="50" value="${editorSettings.lineHeight || 0}" 
                        onchange="updateSetting('lineHeight', parseInt(this.value))" 
                        oninput="this.nextElementSibling.textContent = (this.value == 0 ? 'Auto' : this.value + 'px')">
                    <span class="setting-value">${editorSettings.lineHeight === 0 ? 'Auto' : editorSettings.lineHeight + 'px'}</span>
                </div>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-font setting-icon"></i>
                    <span>Font Family</span>
                </label>
                ${buildJaSelect('fontFamily', [
        { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
        { value: '"Share Tech Mono", monospace', label: 'Share Tech Mono' },
        { value: '"Courier New", monospace', label: 'Courier New' },
        { value: 'monospace', label: 'System Monospace' }
    ], editorSettings.fontFamily)}
            </div>
            
            <div class="setting-item setting-range">
                <label class="setting-label">
                    <i class="fas fa-indent setting-icon"></i>
                    <span>Tab Size</span>
                </label>
                <div class="setting-control">
                    <input type="range" min="2" max="8" value="${editorSettings.tabSize}" 
                        onchange="updateSetting('tabSize', parseInt(this.value))"
                        oninput="this.nextElementSibling.textContent = this.value">
                    <span class="setting-value">${editorSettings.tabSize}</span>
                </div>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-text-width setting-icon"></i>
                    <span>Word Wrap</span>
                </label>
                ${buildJaSelect('wordWrap', [
        { value: 'on', label: 'ON' },
        { value: 'off', label: 'OFF' }
    ], editorSettings.wordWrap)}
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-map setting-icon"></i>
                    <span>Minimap</span>
                    <input type="checkbox" ${editorSettings.minimap ? 'checked' : ''} 
                        onchange="updateSetting('minimap', this.checked)">
                </label>
            </div>
        </div>
        
        <div id="settings-cursor" class="settings-tab-content">
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-mouse-pointer setting-icon"></i>
                    <span>Cursor Style</span>
                </label>
                ${buildJaSelect('cursorStyle', [
        { value: 'line', label: 'LINE' },
        { value: 'block', label: 'BLOCK' },
        { value: 'underline', label: 'UNDERLINE' },
        { value: 'line-thin', label: 'LINE THIN' },
        { value: 'block-outline', label: 'BLOCK OUTLINE' }
    ], editorSettings.cursorStyle)}
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-circle setting-icon"></i>
                    <span>Cursor Blinking</span>
                </label>
                ${buildJaSelect('cursorBlinking', [
        { value: 'blink', label: 'BLINK' },
        { value: 'smooth', label: 'SMOOTH' },
        { value: 'phase', label: 'PHASE' },
        { value: 'expand', label: 'EXPAND' },
        { value: 'solid', label: 'SOLID' }
    ], editorSettings.cursorBlinking)}
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-magic setting-icon"></i>
                    <span>Smooth Caret Animation</span>
                    <input type="checkbox" ${editorSettings.cursorSmoothCaretAnimation ? 'checked' : ''} 
                        onchange="updateSetting('cursorSmoothCaretAnimation', this.checked)">
                </label>
            </div>
        </div>
        
        <div id="settings-formatting" class="settings-tab-content">
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-brackets-curly setting-icon"></i>
                    <span>Auto Close Brackets</span>
                </label>
                ${buildJaSelect('autoClosingBrackets', [
        { value: 'always', label: 'ALWAYS' },
        { value: 'languageDefined', label: 'LANGUAGE DEFINED' },
        { value: 'beforeWhitespace', label: 'BEFORE WHITESPACE' },
        { value: 'never', label: 'NEVER' }
    ], editorSettings.autoClosingBrackets)}
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-quote-right setting-icon"></i>
                    <span>Auto Close Quotes</span>
                </label>
                ${buildJaSelect('autoClosingQuotes', [
        { value: 'always', label: 'ALWAYS' },
        { value: 'languageDefined', label: 'LANGUAGE DEFINED' },
        { value: 'beforeWhitespace', label: 'BEFORE WHITESPACE' },
        { value: 'never', label: 'NEVER' }
    ], editorSettings.autoClosingQuotes)}
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-palette setting-icon"></i>
                    <span>Bracket Pair Colorization</span>
                    <input type="checkbox" ${editorSettings.bracketPairColorization ? 'checked' : ''} 
                        onchange="updateSetting('bracketPairColorization', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-code-branch setting-icon"></i>
                    <span>Folding</span>
                    <input type="checkbox" ${editorSettings.folding ? 'checked' : ''} 
                        onchange="updateSetting('folding', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-indent setting-icon"></i>
                    <span>Insert Spaces</span>
                    <input type="checkbox" ${editorSettings.insertSpaces !== false ? 'checked' : ''} 
                        onchange="updateSetting('insertSpaces', this.checked)">
                </label>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-align-left setting-icon"></i>
                    <span>Auto Indent</span>
                </label>
                ${buildJaSelect('autoIndent', [
        { value: 'none', label: 'NONE' },
        { value: 'keep', label: 'KEEP' },
        { value: 'brackets', label: 'BRACKETS' },
        { value: 'advanced', label: 'ADVANCED' },
        { value: 'full', label: 'FULL' }
    ], editorSettings.autoIndent)}
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-paste setting-icon"></i>
                    <span>Format on Paste</span>
                    <input type="checkbox" ${editorSettings.formatOnPaste ? 'checked' : ''} 
                        onchange="updateSetting('formatOnPaste', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-keyboard setting-icon"></i>
                    <span>Format on Type</span>
                    <input type="checkbox" ${editorSettings.formatOnType ? 'checked' : ''} 
                        onchange="updateSetting('formatOnType', this.checked)">
                </label>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-brackets-curly setting-icon"></i>
                    <span>Match Brackets</span>
                </label>
                ${buildJaSelect('matchBrackets', [
        { value: 'always', label: 'ALWAYS' },
        { value: 'near', label: 'NEAR' },
        { value: 'never', label: 'NEVER' }
    ], editorSettings.matchBrackets)}
            </div>
        </div>
        
        <div id="settings-display" class="settings-tab-content">
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-eye-slash setting-icon"></i>
                    <span>Render Whitespace</span>
                </label>
                ${buildJaSelect('renderWhitespace', [
        { value: 'none', label: 'NONE' },
        { value: 'boundary', label: 'BOUNDARY' },
        { value: 'selection', label: 'SELECTION' },
        { value: 'trailing', label: 'TRAILING' },
        { value: 'all', label: 'ALL' }
    ], editorSettings.renderWhitespace)}
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-align-left setting-icon"></i>
                    <span>Render Indent Guides</span>
                    <input type="checkbox" ${editorSettings.renderIndentGuides ? 'checked' : ''} 
                        onchange="updateSetting('renderIndentGuides', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-arrows-alt-v setting-icon"></i>
                    <span>Scroll Beyond Last Line</span>
                    <input type="checkbox" ${editorSettings.scrollBeyondLastLine ? 'checked' : ''} 
                        onchange="updateSetting('scrollBeyondLastLine', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-search-plus setting-icon"></i>
                    <span>Mouse Wheel Zoom</span>
                    <input type="checkbox" ${editorSettings.mouseWheelZoom ? 'checked' : ''} 
                        onchange="updateSetting('mouseWheelZoom', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-highlighter setting-icon"></i>
                    <span>Occurrences Highlight</span>
                    <input type="checkbox" ${editorSettings.occurrencesHighlight ? 'checked' : ''} 
                        onchange="updateSetting('occurrencesHighlight', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-marker setting-icon"></i>
                    <span>Selection Highlight</span>
                    <input type="checkbox" ${editorSettings.selectionHighlight ? 'checked' : ''} 
                        onchange="updateSetting('selectionHighlight', this.checked)">
                </label>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-highlighter setting-icon"></i>
                    <span>Render Line Highlight</span>
                </label>
                ${buildJaSelect('renderLineHighlight', [
        { value: 'none', label: 'NONE' },
        { value: 'gutter', label: 'GUTTER' },
        { value: 'line', label: 'LINE' },
        { value: 'all', label: 'ALL' }
    ], editorSettings.renderLineHighlight)}
            </div>
        </div>
        
        <div id="settings-advanced" class="settings-tab-content">
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-palette setting-icon"></i>
                    <span>Color Decorators</span>
                    <input type="checkbox" ${editorSettings.colorDecorators ? 'checked' : ''} 
                        onchange="updateSetting('colorDecorators', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-link setting-icon"></i>
                    <span>Links</span>
                    <input type="checkbox" ${editorSettings.links !== false ? 'checked' : ''} 
                        onchange="updateSetting('links', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-code setting-icon"></i>
                    <span>Code Lens</span>
                    <input type="checkbox" ${editorSettings.codeLens ? 'checked' : ''} 
                        onchange="updateSetting('codeLens', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-mouse setting-icon"></i>
                    <span>Drag and Drop</span>
                    <input type="checkbox" ${editorSettings.dragAndDrop !== false ? 'checked' : ''} 
                        onchange="updateSetting('dragAndDrop', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-copy setting-icon"></i>
                    <span>Empty Selection Clipboard</span>
                    <input type="checkbox" ${editorSettings.emptySelectionClipboard !== false ? 'checked' : ''} 
                        onchange="updateSetting('emptySelectionClipboard', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-highlighter setting-icon"></i>
                    <span>Copy with Syntax Highlighting</span>
                    <input type="checkbox" ${editorSettings.copyWithSyntaxHighlighting !== false ? 'checked' : ''} 
                        onchange="updateSetting('copyWithSyntaxHighlighting', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-sliders-h setting-icon"></i>
                    <span>Smooth Scrolling</span>
                    <input type="checkbox" ${editorSettings.smoothScrolling ? 'checked' : ''} 
                        onchange="updateSetting('smoothScrolling', this.checked)">
                </label>
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-circle setting-icon"></i>
                    <span>Rounded Selection</span>
                    <input type="checkbox" ${editorSettings.roundedSelection ? 'checked' : ''} 
                        onchange="updateSetting('roundedSelection', this.checked)">
                </label>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-mouse-pointer setting-icon"></i>
                    <span>Multi Cursor Modifier</span>
                </label>
                ${buildJaSelect('multiCursorModifier', [
        { value: 'ctrlCmd', label: 'CTRL/CMD' },
        { value: 'alt', label: 'ALT' }
    ], editorSettings.multiCursorModifier)}
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-code-branch setting-icon"></i>
                    <span>Show Folding Controls</span>
                </label>
                ${buildJaSelect('showFoldingControls', [
        { value: 'always', label: 'ALWAYS' },
        { value: 'mouseover', label: 'MOUSEOVER' },
        { value: 'never', label: 'NEVER' }
    ], editorSettings.showFoldingControls)}
            </div>
            
            <div class="setting-item">
                <label class="setting-label">
                    <i class="fas fa-lightbulb setting-icon"></i>
                    <span>Suggest on Trigger Characters</span>
                    <input type="checkbox" ${editorSettings.suggestOnTriggerCharacters !== false ? 'checked' : ''} 
                        onchange="updateSetting('suggestOnTriggerCharacters', this.checked)">
                </label>
            </div>
            
            <div class="setting-item setting-select">
                <label class="setting-label">
                    <i class="fas fa-keyboard setting-icon"></i>
                    <span>Accept Suggestion on Enter</span>
                </label>
                ${buildJaSelect('acceptSuggestionOnEnter', [
        { value: 'on', label: 'ON' },
        { value: 'smart', label: 'SMART' },
        { value: 'off', label: 'OFF' }
    ], editorSettings.acceptSuggestionOnEnter)}
            </div>
            
            <div class="setting-item setting-range">
                <label class="setting-label">
                    <i class="fas fa-clock setting-icon"></i>
                    <span>Quick Suggestions Delay</span>
                </label>
                <div class="setting-control">
                    <input type="range" min="0" max="1000" step="50" value="${editorSettings.quickSuggestionsDelay || 100}" 
                        onchange="updateSetting('quickSuggestionsDelay', parseInt(this.value))"
                        oninput="this.nextElementSibling.textContent = this.value + 'ms'">
                    <span class="setting-value">${editorSettings.quickSuggestionsDelay || 100}ms</span>
                </div>
            </div>
        </div>
        
        <div id="settings-github" class="settings-tab-content">
            <div class="settings-github-section">
                <div class="settings-github-block">
                    <label class="settings-github-label">
                        <i class="fas fa-key setting-icon"></i>
                        <span>Token (opcjonalnie)</span>
                    </label>
                    <div class="settings-github-control">
                        <input type="password" id="githubTokenInput" class="settings-github-input" placeholder="${getGitHubToken() ? '•••••••• (zapisany)' : 'ghp_... lub Fine-grained token'}" autocomplete="off">
                        <p class="settings-github-hint settings-github-hint-token-${getGitHubToken() ? 'saved' : 'empty'}">${getGitHubToken() ? 'Token zapisany. Wpisz nowy i Zapisz, aby zmienić.' : 'Pull/Push z repo s-pro-v/json-lista. Push: token z zapisem (Contents lub repo); w org. włącz SSO.'}</p>
                        <div class="settings-github-actions">
                            <button type="button" class="settings-github-btn settings-github-btn-save" onclick="saveGitHubToken()">
                                <i class="fas fa-save"></i> Zapisz
                            </button>
                            <button type="button" class="settings-github-btn settings-github-btn-clear" onclick="clearGitHubToken()">
                                Wyczyść
                            </button>
                        </div>
                    </div>
                </div>
                <div class="settings-github-block settings-github-block-toggle">
                    <label class="settings-github-label settings-github-label-row">
                        <i class="fas fa-sync-alt setting-icon"></i>
                        <span>Auto transfer local → GitHub</span>
                        <input type="checkbox" id="autoTransferToGitHubCheckbox" class="settings-github-checkbox" ${getAutoTransferToGitHub() ? 'checked' : ''} onchange="setAutoTransferToGitHub(this.checked); CustomUI.toast(this.checked ? 'Auto transfer włączony' : 'Auto transfer wyłączony', 'success');">
                    </label>
                    <p class="settings-github-hint">Po zapisie (Zapisz / Aktualizuj / Import) dane są po ok. 2,5 s wgrywane do new-note.json. Wymaga tokenu.</p>
                </div>
            </div>
        </div>
    `;

    body.innerHTML = html;
    bindJaSelects(body);
}

// Główny listener DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    // Inicjalizacja Monaco
    initMonaco();

    // Ustawienie handlera dla ikony motywu
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.addEventListener('click', toggleTheme);
    }

    // Usunięcie atrybutu draggable ze wszystkich elementów
    document.querySelectorAll('[draggable="true"]').forEach((el) => {
        el.removeAttribute("draggable");
    });

    // Blokowanie zdarzeń drag & drop
    document.addEventListener("dragstart", function (e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener("drop", function (e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener("dragover", function (e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            quickSaveLocally();
        }
    });
});

