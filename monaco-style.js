// Czekamy na załadowanie Monaco - używamy window.onload aby upewnić się, że Monaco jest dostępne
window.addEventListener('load', function () {
    // Sprawdzamy czy Monaco jest załadowane
    if (typeof monaco === 'undefined') {
        console.error('Monaco Editor nie został załadowany');
        return;
    }

    // Definicja ciemnego motywu z pełnym mapowaniem palety CORE
    monaco.editor.defineTheme('terminal-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Podstawowe tokeny
            { token: '', foreground: 'e2e2e2ec', background: '17181a' },
            { token: 'comment', foreground: '4d595f', fontStyle: 'bold' },
            { token: 'comment.line', foreground: '4d595f', fontStyle: 'bold' },
            { token: 'comment.block', foreground: '4d595f', fontStyle: 'bold' },
            { token: 'comment.doc', foreground: '4d595f', fontStyle: 'bold' },

            // Słowa kluczowe
            { token: 'keyword', foreground: 'b267e6', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: 'b267e6', fontStyle: 'bold' },
            { token: 'keyword.operator', foreground: 'b267e6' },
            { token: 'keyword.other', foreground: 'b267e6', fontStyle: 'bold' },

            // Stringi
            { token: 'string', foreground: '21fd6b' },
            { token: 'string.quoted', foreground: '21fd6b' },
            { token: 'string.template', foreground: '21fd6b' },
            { token: 'string.regexp', foreground: '21fd6b' },

            // Liczby
            { token: 'number', foreground: 'F39C12' },
            { token: 'number.hex', foreground: 'F39C12' },
            { token: 'number.binary', foreground: 'F39C12' },
            { token: 'number.octal', foreground: 'F39C12' },
            { token: 'number.float', foreground: 'F39C12' },

            // Typy i klasy
            { token: 'type', foreground: 'f859b1' },
            { token: 'type.identifier', foreground: 'f859b1' },
            { token: 'class', foreground: 'f859b1', fontStyle: 'bold' },
            { token: 'class.name', foreground: 'f859b1', fontStyle: 'bold' },

            // Identyfikatory
            { token: 'identifier', foreground: '00ffd9' },
            { token: 'identifier.function', foreground: 'FED604' },
            { token: 'identifier.variable', foreground: '00ffd9' },
            { token: 'identifier.constant', foreground: 'f15a4c' },

            // Funkcje
            { token: 'function', foreground: 'FED604', fontStyle: 'bold' },
            { token: 'function.name', foreground: 'FED604', fontStyle: 'bold' },

            // Operatory i delimitery
            { token: 'delimiter', foreground: 'e2e2e2ec' },
            { token: 'delimiter.bracket', foreground: 'e2e2e2ec' },
            { token: 'delimiter.parenthesis', foreground: 'e2e2e2ec' },
            { token: 'delimiter.square', foreground: 'e2e2e2ec' },
            { token: 'operator', foreground: '2493fa' },

            // Tagi (HTML/XML)
            { token: 'tag', foreground: '00B2FF' },
            { token: 'tag.name', foreground: '00B2FF' },
            { token: 'tag.attribute', foreground: 'fed404ea' },
            { token: 'tag.delimiter', foreground: '0587c4' },

            // Atrybuty
            { token: 'attribute.name', foreground: 'fed404ea' },
            { token: 'attribute.value', foreground: '37E7AC' },

            // CSS
            { token: 'property', foreground: '37E7AC' },
            { token: 'property.name', foreground: '37E7AC' },
            { token: 'property.value', foreground: 'FED604' },
            { token: 'selector', foreground: '00B2FF' },
            { token: 'unit', foreground: 'FED604' },

            // JSON
            { token: 'key', foreground: 'FED604' },
            { token: 'value', foreground: '21fd6b' },

            // Zmienne specjalne
            { token: 'variable', foreground: '00ffd9' },
            { token: 'variable.predefined', foreground: 'f15a4c' },
            { token: 'variable.parameter', foreground: '00ffd9' },

            // Inne
            { token: 'constant', foreground: 'f15a4c' },
            { token: 'constant.language', foreground: 'f15a4c', fontStyle: 'bold' },
            { token: 'constant.numeric', foreground: 'F39C12' },
            { token: 'entity.name', foreground: 'f859b1' },
            { token: 'support', foreground: 'FED604' },
            { token: 'support.function', foreground: 'FED604' },
            { token: 'support.class', foreground: 'f859b1' },
            { token: 'meta', foreground: 'e2e2e2ec' },
            { token: 'invalid', foreground: 'ff0000', fontStyle: 'bold' },
            { token: 'invalid.deprecated', foreground: 'ff0000', fontStyle: 'italic' }
        ],
        colors: {
            // Edytor główny
            'editor.background': '#0e0e0e',
            'editor.foreground': '#d6d6d6',
            'editorCursor.foreground': '#fd0d0d',
            'editor.lineHighlightBackground': '#0c0c0e',
            'editorLineNumber.foreground': '#b6b6b673',
            'editorLineNumber.activeForeground': '#fd810d',

            // Zaznaczenie i dopasowania
            'editor.selectionBackground': '#ffffff18',
            'editor.inactiveSelectionBackground': '#18181a',
            'editor.selectionHighlightBackground': '#fd810d22',
            'editor.wordHighlightBackground': '#00000000',
            'editor.findMatchBackground': '#fd810d22',

            // Widgety (Find, Suggest, Hover)
            'editorWidget.background': '#0c0c0e',
            'editorWidget.border': '#18181a',
            'editorSuggestWidget.background': '#0c0c0e',
            'editorSuggestWidget.border': '#18181a',
            'editorSuggestWidget.selectedBackground': '#18181a',
            'editorSuggestWidget.foreground': '#d6d6d6',
            'editorSuggestWidget.highlightForeground': '#fd810d',
            'editorHoverWidget.background': '#0c0c0e',
            'editorHoverWidget.border': '#18181a',
            'editorHoverWidget.foreground': '#d6d6d6',

            // Menu kontekstowe
            'menu.background': '#0c0c0e',
            'menu.foreground': '#d6d6d6',
            'menu.selectionBackground': '#18181a',
            'menu.selectionForeground': '#fd810d',
            'menu.separatorBackground': '#18181a',
            'menu.border': '#18181a',

            // Input
            'input.background': '#000000',
            'input.border': '#18181a',
            'input.foreground': '#d6d6d6',
            'inputOption.activeForeground': '#fd810d',

            // Lista i selekcja
            'list.activeSelectionBackground': '#18181a',
            'list.activeSelectionForeground': '#fd810d',
            'list.dropBackground': '#18181a',
            'list.hoverBackground': '#18181a',
            'list.hoverForeground': '#fd810d',
            'list.focusBackground': '#18181a',
            'list.focusForeground': '#fd810d',
            'list.inactiveSelectionBackground': '#18181a',
            'list.inactiveSelectionForeground': '#d6d6d6',
            'quickInputList.focusBackground': '#18181a',
            'quickInputList.focusForeground': '#fd810d',

            // Inne
            'editorBracketMatch.background': '#ffffff44',
            'editorBracketMatch.border': '#ffffff00',
            'button.background': '#18181a',
            'button.foreground': '#d6d6d6',
            'button.hoverBackground': '#fd810d',
            'badge.background': '#18181a',
            'badge.foreground': '#d6d6d6',
            'focusBorder': '#fd810d',
            'editorGutter.background': '#000000',
            'editorGutter.foldingControlForeground': '#8b8b8b',
            'scrollbar.shadow': '#000000',
            'scrollbarSlider.background': '#252526',
            'scrollbarSlider.hoverBackground': '#2b2b2b',
            'scrollbarSlider.activeBackground': '#fd810d50',
            'diffEditor.insertedTextBackground': '#c7c7c713',
            'progressBar.background': '#fd810d',
            'checkbox.foreground': '#fd810d',
            'checkbox.border': '#fd810d',
            'textLink.foreground': '#fd810d',
            'notificationLink.foreground': '#d6d6d6',
            'pickerGroup.foreground': '#fd810d',
            'dropdown.background': '#0c0c0e',
            'dropdown.foreground': '#d6d6d6',
            'dropdown.border': '#fd810d',
            'settings.dropdownBorder': '#fd810d',
            'settings.headerForeground': '#fd810d',
            'settings.modifiedItemIndicator': '#fd810d',
            'breadcrumb.foreground': '#d6d6d6',
            'breadcrumb.background': '#000000',
            'breadcrumb.focusForeground': '#fd810d',
            'breadcrumbPicker.background': '#0c0c0e',
            'foreground': '#d6d6d6',
            'gitDecoration.ignoredResourceForeground': '#4d595f',
            'gitDecoration.modifiedResourceForeground': '#F39C12',
            'gitDecoration.untrackedResourceForeground': '#21fd6b',
            'titleBar.activeBackground': '#000000',
            'activityBar.background': '#000000',
            'activityBarBadge.background': '#fd810d',
            'activityBarBadge.foreground': '#000000',
            'activityBar.foreground': '#d6d6d6',
            'activityBar.activeBorder': '#fd810d',
            'activityBar.activeFocusBorder': '#fd810d',
            'editorGroupHeader.tabsBackground': '#000000',
            'editorGroupHeader.tabsBorder': '#18181a',
            'panel.background': '#000000',
            'panel.border': '#18181a',
            'panel.dropBorder': '#fd810d',
            'panelTitle.activeBorder': '#fd810d',
            'panelInput.border': '#fd810d',
            'panelTitle.activeForeground': '#d6d6d6',

            // Minimap
            'minimap.background': '#000000',
            'minimapSlider.background': '#25252644',
            'minimapSlider.hoverBackground': '#2b2b2b88',
            'sideBar.background': '#000000',
            'sideBarSectionHeader.background': '#000000',
            'sideBarSectionHeader.foreground': '#fd810d',
            'sideBarSectionHeader.border': '#18181a',
            'sideBarTitle.foreground': '#fd810d',
            'statusBar.background': '#000000',
            'statusBar.border': '#18181a',
            'statusBar.foreground': '#d6d6d6',
            'statusBar.noFolderBackground': '#000000',
            'statusBar.noFolderBorder': '#18181a',
            'statusBarItem.activeBackground': '#fd810d',
            'statusBarItem.hoverBackground': '#18181a',
            'tab.activeBackground': '#0c0c0e',
            'tab.hoverBackground': '#0c0c0e',
            'tab.inactiveBackground': '#000000',
            'tab.inactiveForeground': '#8b8b8b',
            'tab.unfocusedInactiveForeground': '#8b8b8b',
            'terminal.background': '#000000',
            'terminal.border': '#18181a',
            'terminalCursor.background': '#f53131',
            'terminal.ansiBlack': '#090300',
            'terminal.ansiBlue': '#01A0E4',
            'terminal.ansiBrightBlack': '#f38028',
            'terminal.ansiBrightBlue': '#01A0E4',
            'terminal.ansiBrightCyan': '#ff0ff3',
            'terminal.ansiBrightGreen': '#01A252',
            'terminal.ansiBrightMagenta': '#eb64cb',
            'terminal.ansiBrightRed': '#0a37ff',
            'terminal.ansiBrightWhite': '#240ee2',
            'terminal.ansiBrightYellow': '#FDED02',
            'terminal.ansiCyan': '#0ba9dd',
            'terminal.ansiGreen': '#01A252',
            'terminal.ansiMagenta': '#A16A94',
            'terminal.ansiRed': '#DB2D20',
            'terminal.ansiWhite': '#f37676',
            'terminal.ansiYellow': '#FDED02',
            'menubar.selectionForeground': '#fd810d',
            'menu.selectionForeground': '#fd810d'
        }
    });

    // Definicja jasnego motywu z pełnym mapowaniem palety CORE
    monaco.editor.defineTheme('terminal-light', {
        base: 'vs',
        inherit: true,
        rules: [
            // Podstawowe tokeny
            { token: '', foreground: '1a1a1a', background: 'ffffff' },
            { token: 'comment', foreground: '8b8b8b', fontStyle: 'italic' },
            { token: 'comment.line', foreground: '8b8b8b', fontStyle: 'italic' },
            { token: 'comment.block', foreground: '8b8b8b', fontStyle: 'italic' },
            { token: 'comment.doc', foreground: '8b8b8b', fontStyle: 'italic' },

            // Słowa kluczowe
            { token: 'keyword', foreground: 'fd810d', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: 'fd810d', fontStyle: 'bold' },
            { token: 'keyword.operator', foreground: 'fd810d' },
            { token: 'keyword.other', foreground: 'fd810d', fontStyle: 'bold' },

            // Stringi
            { token: 'string', foreground: '28a745' },
            { token: 'string.quoted', foreground: '28a745' },
            { token: 'string.template', foreground: '28a745' },
            { token: 'string.regexp', foreground: '28a745' },

            // Liczby
            { token: 'number', foreground: 'fd810d' },
            { token: 'number.hex', foreground: 'fd810d' },
            { token: 'number.binary', foreground: 'fd810d' },
            { token: 'number.octal', foreground: 'fd810d' },
            { token: 'number.float', foreground: 'fd810d' },

            // Typy i klasy
            { token: 'type', foreground: '1a1a1a' },
            { token: 'type.identifier', foreground: '1a1a1a' },
            { token: 'class', foreground: '1a1a1a', fontStyle: 'bold' },
            { token: 'class.name', foreground: '1a1a1a', fontStyle: 'bold' },

            // Identyfikatory
            { token: 'identifier', foreground: '1a1a1a' },
            { token: 'identifier.function', foreground: '1a1a1a' },
            { token: 'identifier.variable', foreground: '1a1a1a' },
            { token: 'identifier.constant', foreground: 'fd810d' },

            // Funkcje
            { token: 'function', foreground: '1a1a1a' },
            { token: 'function.name', foreground: '1a1a1a' },

            // Operatory i delimitery
            { token: 'delimiter', foreground: '1a1a1a' },
            { token: 'delimiter.bracket', foreground: '1a1a1a' },
            { token: 'delimiter.parenthesis', foreground: '1a1a1a' },
            { token: 'delimiter.square', foreground: '1a1a1a' },
            { token: 'operator', foreground: 'fd810d' },

            // Tagi (HTML/XML)
            { token: 'tag', foreground: 'fd810d' },
            { token: 'tag.name', foreground: 'fd810d' },
            { token: 'tag.attribute', foreground: '1a1a1a' },
            { token: 'tag.delimiter', foreground: '1a1a1a' },

            // Atrybuty
            { token: 'attribute.name', foreground: '1a1a1a' },
            { token: 'attribute.value', foreground: '28a745' },

            // CSS
            { token: 'property', foreground: '1a1a1a' },
            { token: 'property.name', foreground: '1a1a1a' },
            { token: 'property.value', foreground: '28a745' },
            { token: 'selector', foreground: 'fd810d' },
            { token: 'unit', foreground: 'fd810d' },

            // JSON
            { token: 'key', foreground: '1a1a1a' },
            { token: 'value', foreground: '28a745' },

            // Zmienne specjalne
            { token: 'variable', foreground: '1a1a1a' },
            { token: 'variable.predefined', foreground: 'fd810d' },
            { token: 'variable.parameter', foreground: '1a1a1a' },

            // Inne
            { token: 'constant', foreground: 'fd810d' },
            { token: 'constant.language', foreground: 'fd810d', fontStyle: 'bold' },
            { token: 'constant.numeric', foreground: 'fd810d' },
            { token: 'entity.name', foreground: '1a1a1a' },
            { token: 'support', foreground: '1a1a1a' },
            { token: 'support.function', foreground: '1a1a1a' },
            { token: 'support.class', foreground: '1a1a1a' },
            { token: 'meta', foreground: '1a1a1a' },
            { token: 'invalid', foreground: 'ff0000', fontStyle: 'bold' },
            { token: 'invalid.deprecated', foreground: 'ff0000', fontStyle: 'italic' }
        ],
        colors: {
            // Edytor główny
            'editor.background': '#ffffff',
            'editor.foreground': '#1a1a1a',
            'editorCursor.foreground': '#fd810d',
            'editor.lineHighlightBackground': '#f5f5f5',
            'editorLineNumber.foreground': '#8b8b8b61',
            'editorLineNumber.activeForeground': '#8b8b8b',

            // Zaznaczenie i dopasowania
            'editor.selectionBackground': '#c5c5c544',
            'editor.inactiveSelectionBackground': '#e8e8e8',
            'editor.selectionHighlightBackground': '#fd810d22',
            'editor.wordHighlightBackground': '#00000000',
            'editor.findMatchBackground': '#fd810d22',

            // Widgety (Find, Suggest, Hover)
            'editorWidget.background': '#f5f5f5',
            'editorWidget.border': '#e0e0e0',
            'editorSuggestWidget.background': '#f5f5f5',
            'editorSuggestWidget.border': '#e0e0e0',
            'editorSuggestWidget.selectedBackground': '#e8e8e8',
            'editorSuggestWidget.foreground': '#1a1a1a',
            'editorSuggestWidget.highlightForeground': '#fd810d',
            'editorHoverWidget.background': '#f5f5f5',
            'editorHoverWidget.border': '#e0e0e0',
            'editorHoverWidget.foreground': '#1a1a1a',

            // Menu kontekstowe
            'menu.background': '#f5f5f5',
            'menu.foreground': '#1a1a1a',
            'menu.selectionBackground': '#e8e8e8',
            'menu.selectionForeground': '#fd810d',
            'menu.separatorBackground': '#e0e0e0',
            'menu.border': '#e0e0e0',

            // Input
            'input.background': '#ffffff',
            'input.border': '#e0e0e0',
            'input.foreground': '#1a1a1a',
            'inputOption.activeForeground': '#fd810d',

            // Lista i selekcja
            'list.activeSelectionBackground': '#e8e8e8',
            'list.activeSelectionForeground': '#fd810d',
            'list.dropBackground': '#e8e8e8',
            'list.hoverBackground': '#e8e8e8',
            'list.hoverForeground': '#fd810d',
            'list.focusBackground': '#e8e8e8',
            'list.focusForeground': '#fd810d',
            'list.inactiveSelectionBackground': '#e8e8e8',
            'list.inactiveSelectionForeground': '#1a1a1a',
            'quickInputList.focusBackground': '#e8e8e8',
            'quickInputList.focusForeground': '#fd810d',

            // Inne
            'editorBracketMatch.background': '#fd810d44',
            'editorBracketMatch.border': '#fd810d',
            'button.background': '#e8e8e8',
            'button.foreground': '#1a1a1a',
            'button.hoverBackground': '#fd810d',
            'badge.background': '#e8e8e8',
            'badge.foreground': '#1a1a1a',
            'focusBorder': '#fd810d',
            'editorGutter.background': '#ffffff',
            'editorGutter.foldingControlForeground': '#8b8b8b',
            'scrollbar.shadow': '#00000011',
            'scrollbarSlider.background': '#e0e0e0',
            'scrollbarSlider.hoverBackground': '#fd810d',
            'scrollbarSlider.activeBackground': '#fd810d'
        }
    });

    // Wymuszamy zastosowanie odpowiedniego motywu na podstawie aktualnego stanu
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const savedTheme = localStorage.getItem("theme");
    
    // Ustaw motyw Monaco na podstawie zapisanego motywu lub aktualnego
    const themeToUse = savedTheme || currentTheme || "dark";
    const monacoTheme = themeToUse === "light" ? "terminal-light" : "terminal-dark";
    monaco.editor.setTheme(monacoTheme);
});