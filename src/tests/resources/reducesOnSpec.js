import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';
import EmptyKey from '../../constants/EmptyKey';

describe('reducesOn:', function () {
  beforeAll(function () {
    this.initialState = {
      users: {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob',
              signedIn: true,
            },
            status: { type: SUCCESS }
          },
        },
        collections: {
          [EmptyKey]: {
            positions: [ 1 ],
            status: { type: SUCCESS }
          }
        },
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

    const { reducers: sessionReducers, actionCreators: { destroySession }, actions } = resources({
      name: 'session',
      url: 'http://test.com/session/:id',
    }, {
      destroy: true
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

    const {
      reducers: usersReducers,
    } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
      reducesOn: [
        {
          action: this.sessionActions.destroy,
          reducer: (users, { key }) => {

            const item = users.items[key];

            return {
              resources: users,
              items: {
                ...users.items,
                [key]: {
                  ...item,
                  values: {
                    ...item.values,
                    signedIn: false
                  }
                }
              }
            };
          }
        }
      ],
    }, {
      index: true,
      new: true,
    });

    this.store = buildStore({
      ...this.initialState
    }, {
      users: usersReducers,
      session: this.sessionReducers
    });
  });

  afterAll(function () {
    fetchMock.restore();
  });

  it('calls the specified reducer when the specified action occurs', function() {
    expect(this.store.getState().users.items['1'].values.signedIn).toEqual(true);

    return this.store.dispatch(this.destroySession(1)).then(() => {
      expect(this.store.getState().users.items['1'].values.signedIn).toEqual(false);
    });
  });

});
