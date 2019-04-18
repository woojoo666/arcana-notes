### Run

Because the interpreter uses ES6 modules, you can't just open the HTML file. First open a webserver using

	npx http-server

and then point your browser to the server you just created, and open `interpreter.html`

If you don't want to download `http-server` every time, just install the development environment using

	npm install --dev

and use the command below to start the webserver:
	
	npm run http-server

### Tests

Tests are written using the [Jest](https://jestjs.io/) testing framework. All tests are stored in the `jest/` directory. Install Jest via the development environment:

	npm install --dev

and run tests using

	npm test
