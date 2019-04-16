### Run

Because the interpreter uses ES6 modules, you can't just open the HTML file. First open a webserver using

	npx http-server

and then point your browser to the server you just created, and open `interpreter.html`

### Tests

Tests are written using the [Jest](https://jestjs.io/) testing framework. All tests are stored in the `jest/` directory. Install Jest using

	npm install --dev

and run tests using

	npm test
