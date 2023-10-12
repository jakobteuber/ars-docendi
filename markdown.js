function renderMarkdown(string) {

    /*
     * Setup KaTeX
     */

    function katexExt(name, startPattern, parsePattern, contentGroup, isDisplay, options) {
        return {
            name: name,
            level: 'inline',
            start(src) {
                return src.match(startPattern)?.index
            },
            tokenizer(src) {
                const match = parsePattern.exec(src);
                if (match) {
                    return {
                        type: name,
                        raw: match[0],
                        text: match[contentGroup],
                        displayMode: isDisplay
                    };
                }
            },
            renderer(token) {
                return katex.renderToString(
                    token.text,
                    { ...options, displayMode: token.displayMode }) + "\n";
            }
        };
    }

    const escapedDollar = {
        name: 'katex-escape-dollar',
        level: 'inline',
        start(src) {
            return src.match(/\\\$/)?.index;
        },
        tokenizer(src) {
            const match = /^\\\$/.exec(src);
            if (match) {
                return {
                    type: 'katex-escape-dollar',
                    raw: match[0]
                };
            }
        },
        renderer() {
            return `&#36;`;
        }
    }

    const inlineStart = /\$(?:\\\$|[^$])+\$/;
    const inlineMath = /^\$((?:\\\$|[^$])+)\$/;
    const fullInlineStart = /\\begin{inline}(?:(?!\\end{inline})[\s\S])*\\end{inline}/;
    const fullInline = /^\\begin{inline}((?:(?!\\end{inline})[\s\S])*)\\end{inline}/;
    const blockStart = /\$\$(?:(?!\$\$)[\s\S])+\$\$/;
    const blockMath = /^\$\$((?:(?!\$\$)[\s\S])+)\$\$/;
    const fullBlockStart = /\\begin{display}(?:(?!\\end{inline})[\s\S])*\\end{display}/
    const fullBlock = /^\\begin{display}((?:(?!\\end{inline})[\s\S])*)\\end{display}/;
    const envStart = /\\begin{((?:equation|align|gather|alignat|CD)\*?)}(?:(?!\\end{\1})[\s\S])*\\end{\1}/
    const directEnv = /^(\\begin{((?:equation|align|gather|alignat|CD)\*?)}(?:(?!\\end{\2})[\s\S])*\\end{\2})/;

    function markedKatex(options = {}) {
        return {
            extensions: [
                katexExt('katex-$', inlineStart, inlineMath, 1, false, options),
                katexExt('katex-inline', fullInlineStart, fullInline, 1, false, options),
                katexExt('katex-$$', blockStart, blockMath, 1, true, options),
                katexExt('katex-display', fullBlockStart, fullBlock, 1, true, options),
                katexExt('katex-env', envStart, directEnv, 1, true, options),
                escapedDollar
            ]
        };
    }

    /*
     * HighlightJS
     */

    const highlightExt = {
        name: 'highlightJs',
        level: 'block',
        start(src) {
            return src.match(/```\S+\S*\n(?:(?!```)[\s\S])+```/)?.index;
        },
        tokenizer(src) {
            const rule = /^```(\S+)\S*\n((?:(?!```)[\s\S])+)```/;
            const match = rule.exec(src);
            if (match) {
                const token = {
                    type: 'highlightJs',
                    raw: match[0],
                    text: match[0].trim(),
                    tokens: [],
                    lang: match[1],
                    code: match[2]
                };
                this.lexer.inline(token.text, token.tokens);
                return token;
            }
        },
        renderer({code, lang}) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            const markup = hljs.highlight(code, {language}).value;
            return `<pre><code class="hljs language-${lang}">${markup}</code></pre>`;
        }
    };

    /*
     * Answer Boxes
     */

    const radioGroupExt = {
        name: 'radioGroup',
        level: 'block',
        start(src) {
            return src.match(/@\(\)/)?.index;
        },
        tokenizer(src) {
            const rule = /^(?:@\(\)(?:(?!@\(\)|\n\n)[\s\S])*)+/;
            const match = rule.exec(src);
            if (match) {
                const token = {
                    type: 'radioGroup',
                    raw: match[0],
                    text: match[0].trim(),
                    tokens: []
                };
                this.lexer.inline(token.text, token.tokens);
                return token;
            }
        },
        renderer(token) {
            return `<div class="radio-group">${this.parser.parseInline(token.tokens)}\n</div>`;
        }
    }

    const radioButtonExt = {
        name: 'radioButton',
        level: 'inline',
        start(src) {
            return src.match(/@\(\)/)?.index;
        },
        tokenizer(src) {
            const rule = /^@\(\)((?:(?!@\(\)|\n\n)[\s\S])*)/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'radioButton',
                    raw: match[0],
                    text: this.lexer.inlineTokens(match[1].trim())
                };
            }
        },
        renderer(token) {
            const id = next();
            return `
            <div class="grid-cell solution-cell"></div>
            <div class="grid-cell input-cell" id="c${id}">
               <input type="radio" id="i${id}" name="radioGroup" class="answer answer-radio">
            </div>
            <div class="grid-cell label-cell">
               <label for="i${id}">${this.parser.parseInline(token.text)}</label>
            </div>
            <div class="grid-cell stats-label"></div>
            <div class="grid-cell statistics" id="s${id}"></div>
            `;
        },
    }

    const checkGroupExt = {
        name: 'checkGroup',
        level: 'block',
        start(src) {
            return src.match(/@\[]/)?.index;
        },
        tokenizer(src) {
            const rule = /^(?:@\[](?:(?!@\[]|\n\n)[\s\S])*)+/;
            const match = rule.exec(src);
            if (match) {
                const token = {
                    type: 'checkGroup',
                    raw: match[0],
                    text: match[0].trim(),
                    tokens: []
                };
                this.lexer.inline(token.text, token.tokens);
                return token;
            }
        },
        renderer(token) {

            return `<div class="check-group">${this.parser.parseInline(token.tokens)}\n</div>`;
        }
    }

    const checkBoxExt = {
        name: 'checkBox',
        level: 'inline',
        start(src) {
            return src.match(/@\[]/)?.index;
        },
        tokenizer(src) {
            const rule = /^@\[]((?:(?!@\[]|\n\n)[\s\S])*)/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'checkBox',
                    raw: match[0],
                    text: this.lexer.inlineTokens(match[1].trim())
                };
            }
        },
        renderer(token) {
            const id = next();
            return `
        <div class="grid-cell solution-cell"></div>
        <div class="grid-cell input-cell" id="c${id}">
           <input type="checkbox" id="i${id}" name="radioGroup" class="answer answer-checkbox">
        </div>
        <div class="grid-cell label-cell">
            <label for="i${id}">${this.parser.parseInline(token.text)}</label>
        </div>
        <div class="grid-cell stats-label"></div>
        <div class="grid-cell statistics" id="s${id}"></div>`;
        },
    }

    const intFieldExt = {
        name: 'intField',
        level: 'inline',
        start(src) {
            return src.match(/@\{int}/)?.index;
        },
        tokenizer(src) {
            const rule = /^@\{int}/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'intField',
                    raw: match[0],
                };
            }
        },
        renderer() {
            const id = next();
            return `
                <span class="int-group">
                    <span class="grid-cell">
                        <input type="number" step="1" id="i${id}" class="answer answer-int">
                    </span>
                    <span class="grid-cell solution" id="s${id}"></span>
                    <span class="grid-cell stats-label"></span>
                    <span class="grid-cell statistics"></span>
                </span>
        `;
        },
    }

    const floatFieldExt = {
        name: 'floatField',
        level: 'inline',
        start(src) {
            return src.match(/@\{float}/)?.index;
        },
        tokenizer(src) {
            const rule = /^@\{float}/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'floatField',
                    raw: match[0],
                };
            }
        },
        renderer() {
            const id = next();
            return `
        <span class="float-field">
            <span class="grid-cell">
                <input type="number" step="any" id="i${id}" class="answer answer-float">
            </span>
            <span class="grid-cell solution" id="s${id}"></span>
            <span class="grid-cell stats-label"></span>
            <span class="statistics"></span>
        </span>
        `;
        },
    }

    const textFieldExt = {
        name: 'textField',
        level: 'inline',
        start(src) {
            return src.match(/@\{text}/)?.index;
        },
        tokenizer(src) {
            const rule = /^@\{text}/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'textField',
                    raw: match[0],
                };
            }
        },
        renderer() {
            const id = next();
            return `
        <sapn class="text-group">
            <span class="grid-cell">
                <input type="text" id="i${id}" class="answer answer-text">
            </span>
            <span class="grid-cell solution" id="s${id}"></span>
            <span class="grid-cell stats-label"></span>
            <span class="grid-cell statistics"></span>
        </sapn>
        `;
        },
    }

    const imageExt = {
        name: 'imgExt',
        level: 'block',
        start(src) {
            return src.match(/@img:[^\n@:]+(?::[^\n@:]+)?@/)?.index;
        },
        tokenizer(src) {
            const rule = /^@img:([^\n@:]+)(?::([^\n@:]+))?@/;
            const match = rule.exec(src);
            if (match) {
                return {
                    type: 'imgExt',
                    raw: match[0],
                    name: match[1],
                    width: match[2]
                };
            }
        },
        renderer({name, width}) {
            return `<img src="img/${name}" alt="no alt" style="width: ${width};"/>`;
        },
    }

    marked.use(markedKatex({throwOnError: false}));

    marked.use({
        extensions: [highlightExt, imageExt]
    });

    marked.use({
        extensions: [
            radioGroupExt,
            radioButtonExt,
            checkGroupExt,
            checkBoxExt,
            intFieldExt,
            floatFieldExt,
            textFieldExt]
    });

    document.getElementById('question').innerHTML =
        marked.parse(string, {mangle: false, headerIds: false});

    document.querySelectorAll('#question .radio-group')
        .forEach(
            group => {
                const id = 'group-' + next();
                group.querySelectorAll('input[type=radio]')
                    .forEach(
                        radioButton => {
                            radioButton.name = id;
                        }
                    );
            }
        );
}