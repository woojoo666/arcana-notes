import { importCommonJS } from './utils.js';

import { lexerWrapper } from './lexerWrapper.js';

const grammar = importCommonJS('grammar', './');
console.assert(grammar !== undefined, "failed to load grammar synchronously");

export { grammar };
