const vscode = require('vscode');
const javascriptStringify = require("javascript-stringify")

const { window, Position, Range, Selection } = vscode;

function processSelection(editor, doc, sel, formatCB, argsCB) {
    const replaceRanges = [];
    editor.edit(function (edit) {
        // itterate through the selections
        for (let x = 0; x < sel.length; x++) {
            try {
                let txt = JSON.parse(doc.getText(new Range(sel[x].start, sel[x].end)));
                if (argsCB.length > 0) {
                    // in the case of figlet the params are test to change and font so this is hard coded
                    // the idea of the array of parameters is to allow for a more general approach in the future
                    txt = formatCB.apply(this, [txt, ...argsCB]);
                }
                else {
                    txt = formatCB(txt, ...argsCB);
                }

                //replace the txt in the current select and work out any range adjustments
                edit.replace(sel[x], txt);
                const startPos = new Position(sel[x].start.line, sel[x].start.character);
                const endPos = new Position(sel[x].start.line + txt.split(/\r\n|\r|\n/).length - 1, sel[x].start.character + txt.length);
                replaceRanges.push(new Selection(startPos, endPos));
            } catch(e) {
                console.error('json-to-js:', e);
            }
        }
    });
    editor.selections = replaceRanges;
}

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.jsonToJs', () => {
        const editor = window.activeTextEditor;
        const document = editor.document;
        const selection = editor.selections;

        if (!window.activeTextEditor || selection.every(sel => sel.isEmpty)) return;

        processSelection(editor, document, selection, javascriptStringify, [null, 2]);
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

exports.activate = activate;
exports.deactivate = deactivate;
