import 'source-map-support/register';

import { Response } from 'node-fetch';
import { clearRegisteredRequests } from '../../utils/RequestManager';

/**
 * Following hack is necessary to polyfill Response and Blob constructors
 * as node-fetch will not expose Blob, but it depends on an equality check
 * with its constructor, internally:
 *
 * https://github.com/bitinn/node-fetch/issues/392
 *
 * @type {Response|*}
 */
global.Response = Response;

beforeAll(function() {
  return new Response().blob().then((blob) => {
    global.Blob = blob.constructor;
  });
});

beforeEach(function () {
  clearRegisteredRequests();
});
