const editor = CodeMirror.fromTextArea(
    document.getElementById('editor'), 
    {
        mode: 'python',
        lineNumbers: true,
        lineWrapping: true,
        lint: true,
        indentUnit: 4,
        theme: 'ayu-dark',
        autofocus: true,
        autoCloseBrackets: true,
        extraKeys: {
        	"Ctrl-/": "toggleComment",
        	"Ctrl-Q": "autocomplete",
        	"Ctrl-F": function(cm) {
                CodeMirror.commands.find(cm);
            },
            "Ctrl-G": function(cm) {
                CodeMirror.commands.findNext(cm);
            },
            "Shift-Ctrl-G": function(cm) {
                CodeMirror.commands.findPrev(cm);
            }
        }
    }
);

editor.on('inputRead', function(instance) {
    if (instance.state.completionActive) return;
    CodeMirror.commands.autocomplete(instance);
});

function changeTheme() {
	const theme = document.getElementById("theme-selector").value;
	editor.setOption("theme", theme);
}

const editorElement = document.querySelector('.editor-container');
const resizeHandle = document.getElementById('resize-handle');

let isResizing = false;

resizeHandle.addEventListener('mousedown', function(e) {
    isResizing = true;
    e.preventDefault();
});

window.addEventListener('mouseup', function() {
    isResizing = false;
});

window.addEventListener('mousemove', function(e) {
    if (!isResizing) return;

    const newHeight = e.clientY - editorElement.getBoundingClientRect().top - 5;

    if (newHeight < 25) newHeight = 25;
    if (newHeight > 800) newHeight = 800;

    editorElement.style.height = newHeight + 'px';
    editor.setSize(window.innerWidth/2, newHeight);
});

window.addEventListener('resize', function() {
	editor.setSize(window.innerWidth/2, editorElement.getBoundingClientRect().bottom - editorElement.getBoundingClientRect().top);
});

CodeMirror.registerHelper("lint", "python", function(text) {
    const errors = [];
    const lines = text.split('\n');

    // Простая проверка на незакрытые скобки и кавычки
    lines.forEach((line, lineNumber) => {
        const openBrackets = (line.match(/\(/g) || []).length;
        const closeBrackets = (line.match(/\)/g) || []).length;
        const openQuotes = (line.match(/"/g) || []).length;

        if (openBrackets !== closeBrackets) {
            errors.push({
                message: "Незакрытая скобка",
                severity: "error",
                from: CodeMirror.Pos(lineNumber, 0),
                to: CodeMirror.Pos(lineNumber, line.length)
            });
        }

        if (openQuotes % 2 !== 0) {
            errors.push({
                message: "Незакрытая кавычка",
                severity: "error",
                from: CodeMirror.Pos(lineNumber, 0),
                to: CodeMirror.Pos(lineNumber, line.length)
            });
        }
    });

    return errors;
});

function runCode() {
    const code = editor.getValue();
    const output = document.getElementById('output');
    
    output.textContent = 'Running...';
    
    fetch('/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
    })
    .then(response => response.json())
    .then(data => {
        output.textContent = data.output || data.error;
        output.style.color = data.error ? 'red' : 'white';
    })
    .catch(error => {
        output.textContent = 'Error: ' + error;
        output.style.color = 'red';
    });
};