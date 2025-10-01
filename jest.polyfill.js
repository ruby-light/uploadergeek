/* eslint-disable @typescript-eslint/no-var-requires */
const {TextEncoder} = require('util');

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}
