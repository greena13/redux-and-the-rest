import fetchMock from 'fetch-mock';
import { CREATING, ERROR, NEW, RESOURCES, resources, SUCCESS } from '../../index';
import nop from '../../utils/function/nop';
import {
  resourcesItem,
  setupInitialState,
} from '../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('afterReducers option:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { createItem: createUser } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id'
    }, {
      createItem: {
        afterReducers: [
          (_resources, { status }) => {
            const _items = _resources.items;
            const currentItem = _items.temp;

            if (status === CREATING) {
              return {
                ..._resources,
                items: {
                  ..._items,
                  temp: {
                    ...currentItem,
                    beforeRequest: true
                  }
                }
              };
            } else if (status === SUCCESS) {
              return {
                ..._resources,
                items: {
                  ..._items,
                  1: {
                    ...currentItem,
                    afterRequest: true
                  }
                }
              };
            } else if (status === ERROR) {
              return {
                ..._resources,
                items: {
                  ..._items,
                  temp: {
                    ...currentItem,
                    afterRequestError: true
                  }
                }
              };
            }

            return _resources;
          }
        ]
      }
    });

    this.createUser = createUser;
    this.reducers = reducers;

    this.initialState = {
      items: {
        temp: {
          values: { username: 'Robert' },
          status: { type: NEW }
        }
      },
      lists: {},
      newItemKey: 'temp'
    };

    this.newValues = { username: 'Bob' };
    this.responseValues = { ...this.newValues, id: 1 };
  });

  fdescribe('Given a afterReducers option is provided when defining a resource', () => {
    describe('and the API request succeeds', function () {
      describe('before the request has completed', function () {
        beforeAll(function () {
          setUpBeforeRequest(this, { ...RESOURCES, ...this.initialState }, 'temp', this.newValues);
        });

        it('then calls the afterReducers', function () {
          expect(resourcesItem(this, RESOURCE_NAME, 'temp').beforeRequest).toEqual(true);
        });

        afterAll(function () {
          tearDown(this);
        });
      });

      describe('when the request has completed', () => {
        beforeAll(function () {
          setUpAfterRequestSuccess(this, { ...RESOURCES, ...this.initialState }, 'temp', this.newValues, this.responseValues);
        });

        it('then calls the afterReducers', function () {
          expect(resourcesItem(this, RESOURCE_NAME, '1').afterRequest).toEqual(true);
        });

        afterAll(function () {
          tearDown(this);
        });
      });
    });

    describe('and the API request errors', function () {
      describe('before the request has completed', function () {
        beforeAll(function () {
          setUpBeforeRequest(this, { ...RESOURCES, ...this.initialState }, 'temp', this.newValues);
        });

        it('then calls the afterReducers', function () {
          expect(resourcesItem(this, RESOURCE_NAME, 'temp').beforeRequest).toEqual(true);
        });

        afterAll(function () {
          tearDown(this);
        });
      });

      describe('when the request has completed', () => {
        beforeAll(function () {
          setUpAfterRequestFailure(this, { ...RESOURCES, ...this.initialState }, 'temp', this.newValues);
        });

        it('then calls the afterReducers', function () {
          expect(resourcesItem(this, RESOURCE_NAME, 'temp').afterRequestError).toEqual(true);
        });

        afterAll(function () {
          tearDown(this);
        });
      });
    });

  });

  function setUpBeforeRequest(context, initialState, id, newValues, actionCreatorOptions = {}) {
    fetchMock.post('http://test.com/users', new Promise(nop));

    setupState(context, initialState, id, newValues, actionCreatorOptions);
  }

  function setUpAfterRequestSuccess(context, initialState, id, initialValues,
                                    responseValues = initialValues, actionCreatorOptions = {}) {
    fetchMock.post('http://test.com/users', {
      body: responseValues,
    });

    setupState(context, initialState, id, initialValues, actionCreatorOptions);
  }

  function setUpAfterRequestFailure(context, initialState, id, newValues, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.post('http://test.com/users', options);

    setupState(context, initialState, id, newValues);
  }

  function setupState(context, initialState, id, newValues, actionCreatorOptions = {}) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.createUser(id, newValues, actionCreatorOptions));
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
