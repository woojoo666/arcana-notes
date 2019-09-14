// import React from 'react';
// import './app.css';

class FireflyIDE extends React.Component {
	constructor(props) {
		super(props);
		this.monacoContainer = React.createRef();
	}
	componentDidMount() {
		require.config({ paths: { 'vs': '../node_modules/monaco-editor/min/vs' }});
		require(['vs/editor/editor.main'], () => loadEditor(this.monacoContainer.current));
	}
	render () {
		return <div ref={this.monacoContainer} className="monaco-container"></div>
	}
}

ReactDOM.render(<FireflyIDE />, document.getElementById('app'));

function loadEditor(container) {
	/*----------------------------------------SAMPLE JS START*/
	// Register a new language
	monaco.languages.register({ id: 'mySpecialLanguage' });
	// Register a tokens provider for the language
	monaco.languages.setMonarchTokensProvider('mySpecialLanguage', myLang);

	// colors from VS Code Monokai Extended
	monaco.editor.defineTheme('myCoolTheme', {
		base: 'vs-dark',
		inherit: true,
		rules: [
			{ token: 'key', foreground: 'A6E22E' },
			{ token: 'keyword', foreground: 'F92672'},
			{ token: 'operator', foreground: 'F92672' },
			{ token: 'delimiter.parenthesis', foreground: '66D9EF' },
			{ token: 'string', foreground: 'E6DB74' },
			{ token: 'number', foreground: 'AE81FF' },
			{ token: 'comment', foreground: '75715E' },
			{ token: 'tag', foreground: 'FD971F'},
			{ token: 'parameter', foreground: 'FD971F'},
		],
	});
	// Register a completion item provider for the new language
	monaco.languages.registerCompletionItemProvider('mySpecialLanguage', {
		provideCompletionItems: () => {
			var suggestions = [{
				label: 'simpleText',
				kind: monaco.languages.CompletionItemKind.Text,
				insertText: 'simpleText'
			}, {
				label: 'testing',
				kind: monaco.languages.CompletionItemKind.Keyword,
				insertText: 'testing(${1:condition})',
				insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
			}, {
				label: 'ifelse',
				kind: monaco.languages.CompletionItemKind.Snippet,
				insertText: [
					'if (${1:condition}) {',
					'\t$0',
					'} else {',
					'\t',
					'}'
				].join('\n'),
				insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
				documentation: 'If-Else Statement'
			}];
			return { suggestions: suggestions };
		}
	});
	monaco.editor.create(container, {
		theme: 'myCoolTheme',
		value: sampleCode,
		language: 'mySpecialLanguage'
	});
	/*----------------------------------------SAMPLE CSS END*/
}

const sampleCode = `\
// Type source code in your language here...
(a,b >> c+d) (e,f >> g+h)
foo: (bar: -1+x*2/y, x: 10, y: 3)
clone: foo(x: 15)
barAlias: clone.bar
sum: a,b >>
    result: a+b
   str: "hello world"
   c,d >>
item, item2

binaryTreeHeight: tree >>
   tag #height.           // declare a tag, which can be used to attach attributes to objects

   // calculate height of all nodes
   for node in tree.nodes:
      node.#height: Math.max(node.left.#height | 0, node.right.#height | 0) + 1

   => tree.#height   // return height of root node`;

const myLang = {
	// Set defaultToken to invalid to see what you do not tokenize yet
	// defaultToken: 'invalid',

	keywords: [
		'abstract', 'continue', 'for', 'new', 'switch', 'assert', 'goto', 'do',
		'if', 'private', 'this', 'break', 'protected', 'throw', 'else', 'public',
		'enum', 'return', 'catch', 'try', 'interface', 'static', 'class',
		'finally', 'const', 'super', 'while', 'true', 'false'
	],

	operators: [
		'=', '>', '<', '!', '~', '?', '==', '<=', '>=', '!=',
		'&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
		'<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
		'%=', '<<=', '>>=', '>>>=','=>'
	],

	identifier: /[a-zA-Z_][\w]*/,

	// we include these common regular expressions
	symbols:  /[=><!~?:&|+\-*\/\^%]+/,

	// C# style strings
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			[/@identifier(?=\s*:)/, { cases: { '@keywords': 'keyword',
																	 '@default': 'key' } }],

			// identifiers and keywords
			[/@identifier/, { cases: { '@keywords': 'keyword',
																	 '@default': 'identifier' } }],

			// whitespace
			{ include: '@whitespace' },

			// arguments/parameters
			[/^(?=[\w\s,\(\)\[\]]*?>>)/, 'operator', '@parameters'], // to match start of line, ^ has to be at start of regex, so we can't do fancy stuff like (^|:)
			[/:(?=[\w\s,\(\)\[\]]*?>>)/, 'operator', '@parameters'],

			// delimiters and operators
			[/[{}()\[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],
			[/@symbols/, { cases: { '@operators': 'operator',
															'@default'  : '' } } ],

			// # tags.
			[/#@identifier/, { token: 'tag' }],

			// numbers
			[/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
			[/0[xX][0-9a-fA-F]+/, 'number.hex'],
			[/\d+/, 'number'],

			// delimiter: after number because of .\d floats
			[/[;,.]/, 'delimiter'],

			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid' ],  // non-teminated string
			[/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

			// characters
			[/'[^\\']'/, 'string'],
			[/(')(@escapes)(')/, ['string','string.escape','string']],
			[/'/, 'string.invalid']
		],

		parameters: [
			[/@identifier/, 'parameter' ],
			[/[{}()\[\]]/,  '@brackets'],
			[/,/,           'operator'],

			{include: '@whitespace' },

			[/>>/, 'keyword', '@pop' ],
		],

		comment: [
			[/[^\/*]+/, 'comment' ],
			[/\/\*/,    'comment', '@push' ],    // nested comment
			["\\*/",    'comment', '@pop'  ],
			[/[\/*]/,   'comment' ]
		],

		string: [
			[/[^\\"]+/,  'string'],
			[/@escapes/, 'string.escape'],
			[/\\./,      'string.escape.invalid'],
			[/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
		],

		whitespace: [
			[/[ \t\r\n]+/, 'white'],
			[/\/\*/,       'comment', '@comment' ],
			[/\/\/.*$/,    'comment'],
		],
	},
};
