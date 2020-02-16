import isObject from '../../utils/object/isObject';
import requestProgress from '../requestProgress';
import { DOWN, UP } from '../../constants/ProgressDirections';
import without from '../../utils/collection/without';

/**
 * Performs a HTTP request to an external API endpoint, based on the configuration options provided
 *
 * @param {Object} options The options configuring the request to make
 *
 * @param {string} options.url The complete URI to use to make the request to
 * @param {Object} options.request The request configuration object to be passed to the fetch method, or the
 *        new XMLHttpRequest object, when the progress option is used.
 * @param {boolean} options.credentials=false Whether to include any cookies that may be stored in the cookie jar,
 *        when making the request.
 * @param {boolean} options.progress=false Whether to enable progress update events for uploading request and downloading
 *        the response. When no progress events are enabled, the global fetch API is used. When they are enabled
 *        then an XMLHttpRequest is created.
 * @param {function} options.responseAdaptor A function to adaptor the response of the JSON body before handing
 *        it to the Redux reducer.
 *
 * @param {function} options.dispatch A Redux store's dispatch function, to be called when the request succeeds
 *        or fails.
 * @param {function} options.onSuccess The handler function to call when the request succeeds
 * @param {function} options.onError The handler function to call when the request fails
 *
 *  PUT/PATCH request options
 *
 * @param {Object} options.previousValues={} The previous values of the resource item that an PUT or PATCH
 *        request is being made for. These values are passed to the success handler after the request succeeds
 *        to aid in more efficiently updating associated resource items that may contain references to resource
 *        item.
 *
 *  CREATE/DELETE request options
 *
 * @param {string||Array<string>} options.collectionKeys=[] The keys of the collections that should have the
 *        resource item added or removed when the item is successfully created or destroyed.
 *
 * @param {Object} actionCreatorOptions={} The options passed to the action creator that is making the request,
 *        primarily to be passed to the success and error handlers to further configure their behaviour.
 *
 * @returns {Promise<Response>} A promise that is resolved once the request has finished and the success or
 *          error handler have been called.
 */
function makeRequest(options, actionCreatorOptions = {}) {
  const {
    /**
     * Request options
     */

    url,
    request,
    credentials,
    progress,
    responseAdaptor,

    /**
     * Redux options
     */

    dispatch,
    onSuccess,
    onError,

    collectionKeys,
    previousValues,

    ..._options
  } = options;

  /********************************************************************************************************
   * Compile the request options
   *********************************************************************************************************/

  /**
   * We allow an action creator to customise the request options when it is called
   */
  const actionCreatorRequestOptions = actionCreatorOptions.request || {};

  /**
   * Merge all sources of request options together with the correct order so that the more specific or
   * the more recently specified options take precedence.
   */
  const _request = {
    credentials,
    ...request || {},
    ...actionCreatorRequestOptions
  };

  const requestOptions = function(){
    const common = {
      /**
       * Extract options that will be handled separately below
       */
      ...without(_request, [ 'errorHandler', 'cookie', 'credentials' ]),
      headers: {
        /**
         * Set default Accept and Content-Type headers, but allow overriding them with options (along with
         * any other headers)
         */
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ..._request.headers,
        ...(actionCreatorRequestOptions.headers || {})
      }
    };

    if (_request.cookie) {
      /**
       * Support specifying cookies directly, without having to nest them in a headers parent object
       */
      common.headers.Cookie = _request.cookie;
    } else if (_request.credentials) {
      /**
       * Support opting into sending authentication cookies using a boolean value rather than the magic
       * 'include' string
       */
      common.credentials = 'include';
    }

    return common;
  }();

  /********************************************************************************************************
   * Define the request success and failure handlers
   *********************************************************************************************************/

  const processResponse = (response) => {
    const { status } = response;

    if (status < 400) {
      /**
       * We assume a HTTP request status below 400 is a HTTP success, but not necessarily and application-level
       * success - the presence of a top-level error object indicates an application-level error.
       *
       * In any case, we go ahead an attempt to parse it as a JSON object.
       */
      return response.json().then((json) => {
        const _json = function () {
          if (responseAdaptor) {
            /**
             * We run the response through the responseAdaptor function, if one has been specified
             */
            return responseAdaptor(json, response);
          } else {
            /**
             * If a responseAdaptor hasn't been specified, we fallback to the default behaviour of looking for
             * an error on the top level of the response and separating it out for the rest of the response.
             */
            if (isObject(json)) {
              const { error, ...values } = json;

              return { values, error };
            } else {
              return { values: json };
            }
          }
        }();

        if (_json.error) {
          /**
           * If there was an error object on the top level of the response, we call the error handler
           */
          return dispatch(
            onError(
              _options,
              actionCreatorOptions,
              status,
              _json.error
            )
          );
        } else {
          /**
           * If the response had a HTTP status code below 400 and no error at its root, we call the success
           * handler.
           */
          return dispatch(
            onSuccess(
              _options,
              actionCreatorOptions,
              _json.values,
              collectionKeys || previousValues
            )
          );
        }
      });
    } else {
      if (_request.errorHandler) {
        /**
         * If a separate error handler function has been specified on the request options, we hand it over
         * to that function to resolve HTTP error codes of 400 and above.
         *
         * We pass that error handler a callback that it is expected to call with an error object that is
         * safe to place in the Redux store.
         */
        _request.errorHandler(response, (error) => {
          dispatch(
            onError(
              _options,
              actionCreatorOptions,
              status,
              error
            )
          );
        });
      } else {
        /**
         * If no explicit error handler function has been provided, we fallback to the default error handler.
         */
        if (response.headers.get('Content-Type').startsWith('application/json')) {
          /**
           * We first attempt to parse the response as valid JSON, again looking for a error attribute at the
           * top level. If one if found, it's used to create an error object that can be stored in the Redux
           * store.
           */
          return response.json().then((json) => {
            const errorNormalized = isObject(json.error) ? json.error : { message: json.error };

            return dispatch(
              onError(
                _options,
                actionCreatorOptions,
                status,
                {
                  ...errorNormalized,
                  occurredAt: Date.now()
                }
              )
            );
          });
        } else {
          /**
           * If the response's headers do not indicate the response is valid json, we parse it instead as text
           * and insert the entire response body's content as an error message into the Redux store
           */
          return response.text().then((message) => {
            return dispatch(
              onError(
                _options,
                actionCreatorOptions,
                status,
                { message, occurredAt: Date.now() }
              )
            )
          });
        }
      }
    }
  };

  /********************************************************************************************************
   * Make the request
   *********************************************************************************************************/

  if (progress) {
    /**
     * If the progress option has been used, we cannot use the simpler fetch API and must instead manually
     * create a XMLHttpRequest to get access to the progress events.
     */
    return new Promise((resolve, reject)=>{
      /**
       * We instantiate the XMLHttpRequest and set its header values
       */
      const xhRequest = new XMLHttpRequest();

      if (requestOptions.credentials === 'include') {
        xhRequest.withCredentials = true;
      }

      xhRequest.open(requestOptions.method || 'GET', url);

      Object.keys(requestOptions.headers || {}).forEach((headerKey) => {
        xhRequest.setRequestHeader(headerKey, requestOptions.headers[headerKey]);
      });

      /**
       * We set up the correct listeners to report changes in sending the request and downloading the
       * response
       */

      xhRequest.upload.onprogress = (event) => {
        dispatch(requestProgress(_options, { ...event, direction: UP }));
      };

      xhRequest.upload.onloadend = (event) => {
        dispatch(requestProgress(_options, { ...event, direction: UP }));
      };

      xhRequest.onprogress = (event) => {
        dispatch(requestProgress(_options, { ...event, direction: DOWN }));
      };

      xhRequest.onload = ({ target })=> {
        const responseBlob =
          new Blob(
            [ target.responseText ],
            { type: target.responseType || 'application/json' }
          );

        const response =
          new Response(responseBlob, {
            status: target.status,
            statusText: target.statusText
          });

        return processResponse(response).then(resolve);
      };

      xhRequest.onerror = (error) => {
        /**
         * We handle network level errors such as timeouts or broken network connections here
         */

        dispatch(
          onError(
            _options,
            actionCreatorOptions,
            0,
            {
              type: 'NETWORK_ERROR',
              occurredAt: Date.now(),
              ...(error || {})
            }
          )
        ).then(reject);
      };

      xhRequest.send(requestOptions.body);
    }).catch((error) => {
      throw error;
    });

  } else {
    /**
     * If we don't need progress events, we use the simpler fetch API
     */
    return fetch(url, requestOptions)
            .then(processResponse)
            .catch((error) => {
              /**
               * We handle network level errors such as timeouts or broken network connections here
               */
              return dispatch(
                onError(
                  _options,
                  actionCreatorOptions,
                  0,
                  {
                    type: 'NETWORK_ERROR',
                    occurredAt: Date.now(),
                    ...(error || {})
                  }
                )
              )
            });
  }
}

export default makeRequest;
