import fetchMock from 'fetch-mock';

import { resources, NEW, SUCCESS, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';
import EmptyKey from '../../constants/EmptyKey';

describe('clearOn:', function () {
  beforeAll(function () {
    this.initialState = {
      users: {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          },

          temp: {
            values: {
              username: 'Jane',
            },
            status: { type: NEW }
          }
        },
        collections: {
          [EmptyKey]: {
            positions: [ 1 ],
            status: { type: SUCCESS }
          }
        },
        selectionMap: { 1: true },
        newItemKey: 'temp'
      },
      session: {
        ...RESOURCES,
        items: {
          1: {
            values: {
              active: true
            },
            status: { type: SUCCESS }
          }
        }
      }
    };

    const { reducers: sessionReducers, actionCreators: { destroyItem: destroySession }, actions } = resources({
      name: 'session',
      url: 'http://test.com/session/:id',
    }, {
      destroyItem: true
    });

    this.sessionReducers = sessionReducers;
    this.destroySession = destroySession;
    this.sessionActions = actions;

    fetchMock.delete('http://test.com/session/1', {
      body: {
        status: 200,
        response: { }
      },
      status: 200
    });
  });

  afterAll(function () {
    fetchMock.restore();
  });

  describe('when it is not used', function () {
    beforeAll(function () {
      const {
        reducers: usersReducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
      }, {
        fetchCollection: true,
        newItem: true,
      });

      this.store = buildStore({ ...this.initialState }, { users: usersReducers, session: this.sessionReducers });
    });

    it('then does NOT clear this resource when another\'s actions occur', function() {
      return this.store.dispatch(this.destroySession(1)).then(() => {
        expect(this.store.getState().users).toEqual(this.initialState.users);
      });
    });
  });

  describe('when set to another resource\'s actions', function () {
    beforeAll(function () {
      const {
        reducers: usersReducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        clearOn: this.sessionActions.destroyItem,
      }, {
        fetchCollection: true,
        newItem: true,
      });

      this.store = buildStore({ ...this.initialState }, { users: usersReducers, session: this.sessionReducers });
    });

    it('then clears this resource when another\'s actions occur', function() {
      return this.store.dispatch(this.destroySession(1)).then(() => {
        expect(this.store.getState().users).toEqual(RESOURCES);
      });
    });
  });
});
