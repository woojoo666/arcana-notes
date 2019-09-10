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
	// Define a new theme that contains only rules that match this language
	monaco.editor.defineTheme('myCoolTheme', {
		base: 'vs',
		inherit: false,
		rules: [
			{ token: 'custom-info', foreground: '808080' },
			{ token: 'custom-error', foreground: 'ff0000', fontStyle: 'bold' },
			{ token: 'custom-notice', foreground: 'FFA500' },
			{ token: 'custom-date', foreground: '008800' },
		]
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
class MyClass {
	@attribute
	void main() {
		Console.writeln( "Hello Monarch world\n");
	}
}`;

const myLang = {
	// Set defaultToken to invalid to see what you do not tokenize yet
	// defaultToken: 'invalid',

	keywords: [
		'abstract', 'continue', 'for', 'new', 'switch', 'assert', 'goto', 'do',
		'if', 'private', 'this', 'break', 'protected', 'throw', 'else', 'public',
		'enum', 'return', 'catch', 'try', 'interface', 'static', 'class',
		'finally', 'const', 'super', 'while', 'true', 'false'
	],

	typeKeywords: [
		'boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float'
	],

	operators: [
		'=', '&gt;', '&lt;', '!', '~', '?', ':', '==', '&lt;=', '&gt;=', '!=',
		'&amp;&amp;', '||', '++', '--', '+', '-', '*', '/', '&amp;', '|', '^', '%',
		'&lt;&lt;', '&gt;&gt;', '&gt;&gt;&gt;', '+=', '-=', '*=', '/=', '&amp;=', '|=', '^=',
		'%=', '&lt;&lt;=', '&gt;&gt;=', '&gt;&gt;&gt;='
	],

	// we include these common regular expressions
	symbols:  /[=&gt;&lt;!~?:&amp;|+\-*\/\^%]+/,

	// C# style strings
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			// identifiers and keywords
			[/[a-z_$][\w$]*/, { cases: { '@typeKeywords': 'keyword',
																	 '@keywords': 'keyword',
																	 '@default': 'identifier' } }],
			[/[A-Z][\w\$]*/, 'type.identifier' ],  // to show class names nicely

			// whitespace
			{ include: '@whitespace' },

			// delimiters and operators
			[/[{}()\[\]]/, '@brackets'],
			[/[&lt;&gt;](?!@symbols)/, '@brackets'],
			[/@symbols/, { cases: { '@operators': 'operator',
															'@default'  : '' } } ],

			// @ annotations.
			// As an example, we emit a debugging log message on these tokens.
			// Note: message are supressed during the first load -- change some lines to see them.
			[/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],

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
