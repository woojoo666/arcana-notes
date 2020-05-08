### Initial Setup

Install dependencies:

	npm install --production

### Run

Because the interpreter uses ES6 modules, you can't just open the HTML file. First open a webserver using

	npx serve

and then point your browser to the server you just created, and open `react-ide.html`.

If you don't want to download `serve` every time, just install the development environment using

	npm install

and use the command below to start the webserver:
	
	npm run serve

### Tests

Tests are written using the [Jest](https://jestjs.io/) testing framework. All tests are stored in the `jest/` directory. Install Jest via the development environment:

	npm install

and run tests using

	npm test

or to run an individual test file

	npm test -- <filename>

note that you only need the prefix, so to run `lexer.test.js` use `npm test -- lexer`.

to debug tests, use

	npm test-debug -- <filename>

### Compile Grammar

If you make any changes to `grammar.ne`, you'll need to re-compile it. First, make sure environment is installed using:

	npm install

and then simply run

	npm run compile-grammar
