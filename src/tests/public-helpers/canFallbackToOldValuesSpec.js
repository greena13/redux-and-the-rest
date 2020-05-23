import fetchMock from 'fetch-mock';
import { canFallbackToOldValues, resource } from '../../../index';
import nop from '../../utils/function/nop';
import { resourceItem, setupInitialState, } from '../helpers/resourceAssertions';
import { COMPLETE, RESOURCES, SUCCESS } from '../..';
import EmptyKey from '../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('canFallbackToOldValues:', function () {
  beforeAll(function() {
    this.url = 'http://test.com/users';

    const { reducers, actionCreators: { fetchItem: fetchUser } } = resource({
      name: 'users',
      url: this.url,
      keyBy: 'id',
    }, {
      show: true
    });

    this.fetchUser = fetchUser;
    this.reducers = reducers;
  });

  describe('Given a resource item does not already exist in the store', () => {
    describe('when the resource is requested and before it has returned from the remote', function () {
      expectToReturnWhileRequestIsInFlight(false);
    });

    describe('and the API request succeeds', function () {
      beforeAll(function () {
        this.newValues = { username: 'Bob' };

        setUpAfterRequestSuccess(this, this.url, { ...RESOURCES }, {
          body: this.newValues,
        });
      });

      it(`then returns ${false}`, function () {
        expect(canFallbackToOldValues(resourceItem(this, RESOURCE_NAME))).toEqual(false);
      });

      afterAll(function () {
        tearDown(this);
      });
    });

    describe('when the API request errors', function () {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(this, this.url, { ...RESOURCES }, this.options);
      });

      it(`then returns ${false}`, function () {
        expect(canFallbackToOldValues(resourceItem(this, RESOURCE_NAME))).toEqual(false);
      });

      afterAll(function () {
        tearDown(this);
      });
    });
  });

  describe('Given a resource item has already been successfully fetched', () => {
    beforeAll(function () {
      this.newValues = { username: 'Bob' };

      this.initialState = { ...RESOURCES,
        items: {
          [EmptyKey]: {
            values: this.newValues,
            status: {
              type: SUCCESS,
              requestedAt: 1590216487970,
              syncedAt: 1590216487975
            },
            projection: {
              type: COMPLETE
            }
          }
        }
      };
    });

    describe('when the resource is requested and before it has returned from the remote', function () {
      expectToReturnWhileRequestIsInFlight(false);
    });

    describe('and the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, this.url, this.initialState, {
          body: this.newValues,
        });
      });

      it(`then returns ${false}`, function () {
        expect(canFallbackToOldValues(resourceItem(this, RESOURCE_NAME))).toEqual(false);
      });

      afterAll(function () {
        tearDown(this);
      });
    });

    describe('when the API request errors', function () {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(this, this.url, this.initialState, this.options);
      });

      it(`then returns ${true}`, function () {
        expect(canFallbackToOldValues(resourceItem(this, RESOURCE_NAME))).toEqual(true);
      });

      afterAll(function () {
        tearDown(this);
      });
    });
  });

  function expectToReturnWhileRequestIsInFlight(expectation) {
    beforeAll(function () {
      setUpBeforeRequest(this, this.url, { ...RESOURCES });
    });

    it(`then returns ${expectation}`, function () {
      expect(canFallbackToOldValues(resourceItem(this, RESOURCE_NAME))).toEqual(expectation);
    });

    afterAll(function () {
      tearDown(this);
    });
  }

  function setUpBeforeRequest(context, url, initialState) {
    fetchMock.get(url, new Promise(nop));

    setupState(context, initialState);
  }

  function setUpAfterRequestSuccess(context, url, initialState, options = { body: {} }) {
    fetchMock.get(url, options);

    setupState(context, initialState);
  }

  function setUpAfterRequestFailure(context, url, initialState, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.get(url, options);

    setupState(context, initialState);
  }

  function setupState(context, initialState) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.fetchUser());
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
