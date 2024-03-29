<p align="center">
  <img src="https://cdn.rawgit.com/greena13/redux-and-the-rest/f364d1e6/images/logo.png"><br/>
  <h2 align="center">Redux and the REST</h2>
</p>

Declarative, flexible Redux integration with RESTful APIs.

## Feature overview

* **DRY:** All of the boilerplate code usually required to use Redux is abstracted away into a succinct DSL inspired by the Ruby on Rails framework.
* **Convention over configuration:** A sensible set of configurations are used by default, but you can override them with custom behaviour whenever you need.
* **Flexible:** All RESTful conventions can be overridden and extended when you need to deviate or add to the standard CRUD functionality.
* **Minimal:** You can choose which features to enable, when you want to use them, so there is no unnecessary overhead or bloat.
* **Quick to get started:** It's quick to get up-and-running and easy to define new resources and actions in a few  lines.
* **Plays well with others:** `redux-and-the-rest` does not care what version of Redux you use or how you have architected your app, and it allows you to gradually introduce it to your project alongside other Redux solutions.
* **Documented:** The API is minimal and expressive, and all options and common use cases are documented in full.
* **Tested:** `redux-and-the-rest` comes with an extensive test suite.


## Design philosophy

`redux-and-the-rest` loosely takes its lead from Reduced Instruction Set Computing (RISC) and the standard Create, Read, Update, Delete (CRUD) paradigm and offers as few low-level reducers and actions as possible. In doing so, it allows more re-use and sharing of code, and reduces the overhead of scaling out a store for large applications.

You are encouraged to write your own helper functions on top of the action creators `redux-and-the-rest` provides for more nuanced updates, where needed (details and examples follow). 

## Basic usage

```javascript
import { resources } from 'redux-and-the-rest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

/**
 * Define a users resource
 */
const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getList } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        fetchList: true
    }
);

/**
 * Pass the reducers to your store (the reducers for only one resource is used -
 * normally you would have many)
 */
const store = createStore(combineReducers({ users: usersReducers }), {}, applyMiddleware(Thunk));

/**
 * Action to fetch the users from http://test.com/users and make them available in your store
 */
fetchUsers();

/**
 * Retrieve the users from the store
 */
users = getList(store.getState().users);
```

## Quick Reference

You can find more examples and a walk-through style introduction of how to make the most of `redux-and-the-rest` in the [Quick Reference](QuickReference.md).

## Contents

* [Install &amp; Setup](#install--setup)
   * [Peer Dependencies](#peer-dependencies)
* [Defining resources](#defining-resources)
   * [Configuring individual actions](#configuring-individual-actions)
      * [Using the default RESTful action configuration](#using-the-default-restful-action-configuration)
      * [Providing custom action configuration](#providing-custom-action-configuration)
   * [Actions and their action creators](#actions-and-their-action-creators)
      * [CRUD actions](#crud-actions)
         * [Local CRUD actions](#local-crud-actions)
         * [Remote API CRUD actions](#remote-api-crud-actions)
      * [Clearing actions](#clearing-actions)
      * [Selection actions](#selection-actions)
   * [Dispatchers](#dispatchers)
* [Defining associations](#defining-associations)
   * [One-to-One and One-to-Many relationships](#one-to-one-and-one-to-many-relationships)
   * [Many-to-Many relationships](#many-to-many-relationships)
* [Connecting to React](#connecting-to-react)
   * [Usage with react-redux](#usage-with-react-redux)
* [API Reference](#api-reference)
   * [Levels of configuration](#levels-of-configuration)
   * [Global Options API](#global-options-api)
      * [Usage](#usage)
      * [Options](#options)
   * [Resource Options API](#resource-options-api)
      * [Usage](#usage-1)
      * [Options](#options-1)
         * [Naming and indexing](#naming-and-indexing)
         * [Synchronising with a remote API](#synchronising-with-a-remote-api)
         * [Reducers](#reducers)
   * [Action Options API](#action-options-api)
      * [Usage](#usage-2)
      * [Options](#options-2)
         * [Naming and indexing](#naming-and-indexing-1)
         * [Synchronising with a remote API](#synchronising-with-a-remote-api-1)
         * [Reducers](#reducers-1)
* [Store data](#store-data)
   * [Getting items from the store](#getting-items-from-the-store)
   * [Automatically fetching items not in the store](#automatically-fetching-items-not-in-the-store)
   * [Automatically instantiating new items not in the store](#automatically-instantiating-new-items-not-in-the-store)
   * [Getting lists from the store](#getting-lists-from-the-store)
      * [Automatically fetching lists that are not in the store](#automatically-fetching-lists-that-are-not-in-the-store)
   * [Store data schemas](#store-data-schemas)
      * [Nomenclature](#nomenclature)
      * [Use helper methods where possible](#use-helper-methods-where-possible)
      * [Resource schema](#resource-schema)
         * [Top level schema](#top-level-schema)
         * [Item schema](#item-schema)
         * [List schema](#list-schema)
   * [Data lifecycle](#data-lifecycle)
      * [Client statuses](#client-statuses)
      * [Pending statuses](#pending-statuses)
      * [Response statuses](#response-statuses)
* [Setting initial state](#setting-initial-state)
* [RESTful (asynchronous) actions](#restful-asynchronous-actions)
   * [RESTful behaviour overview](#restful-behaviour-overview)
      * [Preventing duplicate requests](#preventing-duplicate-requests)
      * [Dealing with failed requests](#dealing-with-failed-requests)
      * [Dealing with slow requests](#dealing-with-slow-requests)
      * [Detecting old data](#detecting-old-data)
   * [Fetch a list from the server](#fetch-a-list-from-the-server)
      * [fetchList action creator options](#fetchlist-action-creator-options)
   * [Fetch an individual item from the server](#fetch-an-individual-item-from-the-server)
      * [Fetch action creator options](#fetch-action-creator-options)
   * [Create a new item on the server](#create-a-new-item-on-the-server)
      * [Adding a created item to a list](#adding-a-created-item-to-a-list)
   * [Update a item on the server](#update-a-item-on-the-server)
      * [Update action creator options](#update-action-creator-options)
   * [Destroy a item on the server](#destroy-a-item-on-the-server)
      * [DestroyItem action creator options](#destroyitem-action-creator-options)
* [Local (synchronous) actions](#local-synchronous-actions)
   * [Add a new item to the store](#add-a-new-item-to-the-store)
      * [NewItem action creator options](#newitem-action-creator-options)
   * [Clear the new item from the store](#clear-the-new-item-from-the-store)
   * [Edit the new item in the store](#edit-the-new-item-in-the-store)
   * [Edit an existing item in the store](#edit-an-existing-item-in-the-store)
   * [Edit an item without worrying whether it's new or not](#edit-an-item-without-worrying-whether-its-new-or-not)
   * [Detecting if a item has been edited](#detecting-if-a-item-has-been-edited)
   * [Accessing values before they were edited](#accessing-values-before-they-were-edited)
   * [Clear local edits](#clear-local-edits)
   * [Select a item in the store](#select-a-item-in-the-store)
   * [Select another item in the store](#select-another-item-in-the-store)
   * [Deselect a item in the store](#deselect-a-item-in-the-store)
   * [Clear all the selected items in the store](#clear-all-the-selected-items-in-the-store)
   * [Clearing a resource when a user signs out or other event](#clearing-a-resource-when-a-user-signs-out-or-other-event)
* [Configuring requests](#configuring-requests)
   * [Configuring the URLs used for a request](#configuring-the-urls-used-for-a-request)
      * [URL Parameters](#url-parameters)
         * [Using string values](#using-string-values)
         * [Using object values](#using-object-values)
         * [Specifying query parameters](#specifying-query-parameters)
      * [Adapting request bodies](#adapting-request-bodies)
      * [Pagination](#pagination)
   * [Working with Authenticated APIs](#working-with-authenticated-apis)
      * [Auth tokens as headers](#auth-tokens-as-headers)
      * [Auth tokens as query parameters](#auth-tokens-as-query-parameters)
      * [Session cookies](#session-cookies)
   * [Configuring other request properties](#configuring-other-request-properties)
* [Adapting responses](#adapting-responses)
   * [Adapting success responses](#adapting-success-responses)
   * [Handling error responses](#handling-error-responses)
   
## Install & Setup

`redux-and-the-rest` can be installed as a CommonJS module:

```
npm install redux-and-the-rest --save
# OR
yarn add redux-and-the-rest
```

### Peer Dependencies

If you have already installed `redux`; `redux-thunk`; some form of fetch polyfill (suggested: `isomorphic-fetch`); and (optionally) `react-redux`, then you can skip to the next section.

If you have not already done so, you must also install `redux` ([full installation](https://github.com/reduxjs/redux)):


```
npm install redux --save
# OR
yarn add redux
```

`redux-and-the-rest` also requires the `redux-thunk` middleware to function:

```
npm install redux-thunk --save
# OR
yarn add redux-thunk
```

You must then pass the `redux-thunk` middleware in as a parameter when you create your Redux store ([full instructions](https://github.com/reduxjs/redux-thunk#installation)):

```javascript
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

function buildStore(initialState, reducers) {
  return createStore(combineReducers(reducers), initialState, applyMiddleware(Thunk));
}

export default buildStore;
```

If you are using React, it's also recommended to use the `react-redux` bindings ([full instructions](https://github.com/reduxjs/react-redux)):

```
npm install react-redux --save
# OR
yarn add react-redux
```

Finally, you will also need to ensure global calls to the `fetch` method work in all your environments (node.js and browser). The simplest way to do this is to install `isomorphic-fetch` ([full instructions](https://github.com/matthew-andrews/isomorphic-fetch)):

```
npm install --save isomorphic-fetch es6-promise
# OR
yarn add isomorphic-fetch es6-promise
```

## Defining resources

Resources are defined with one of two functions: 

* `resources` - For when there are many resources, each referenced with one or more ids or keys, or 
* `resource` - For singular resources; cases where there is only one like the current user's profile

They both accept two options hashes as arguments:

* `resourceOptions` - options that apply to all of a resource's actions
* `actionOptions` - options that configure individual actions (RESTful or not)

The functions return an object containing Redux components necessary to use the resource you have just defined:

* `reducers` - an object of reducers that you can pass to Redux's `combineReducers` function.
* `actions` - an object of action constants where the keys are the generic action names and the values are the specific action constants (e.g. `{ fetchList: 'FETCH_USERS' }`)
* `actionCreators` - an object of functions (action creators) you call to interact with the resource which match the actions you specify in `actionOptions` and are passed to Redux's `dispatch` function.

Also returned are 3 helper functions that are always available:

* `getList` - for retrieving a list based on its key parameters
* `getItem` - for retrieving an item based on its key parameters
* `getNewItem` - for retrieving the item currently being created
* `getNewOrExistingItem` - for first attempting to retrieve and existing item and then falling back to returning the new item currently being created

In addition to these, if you enable the underlying actions, the following helper functions are also exported:

* `getOrFetchItem` - Retrieves an item from the Redux store, or makes a fetch request for it, if it's not available 
* `getOrFetchList` - Retrieves a list from the Redux store, or makes a fetch request for it, if it's not available 
* `getOrInitializeItem` - Retrieves the new item from the Redux store, or instantiates it with the provided values, if it's not available
* `saveItem` - Creates an item (by sending a `POST` request) if it's not already in the store, or has a status of `NEW`, otherwise sends and `UPDATE` request with the values provided.

Each of these can be thought of as helpers that contain common logic to determine which underlying action creator to invoke. They require the `store` option to be used with `configure()`, so they can manually call `dispatch` as appropriate (consequently, these are not action creators and should not have their return values passed to `dispatch`). 

Their first argument must be the current resource's state in the Redux store, and all others are passed to the action creators they wrap.

These methods are asynchronous (they return a value immediately but do not dispatch any actions synchronously to avoid React warnings about updating other component's state during a render cycle when used with `react-redux`) and throttled (so if multiple components on the same React tree call them in the same render cycle, only one action is dispatched), so they are safe to use in component's `render` functions.

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, actionCreators: { fetchList: fetchUsers } } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id'
    },
    {
        fetchList: true
    }
);
```     
### Configuring individual actions

`actionOptions` specifies the actions defined for a particular resource and allow you to expand upon, or override, the configuration made in `resourceOptions`.

`actionOptions` should be an either one of two formats:

An array of action names as strings:

```javascript
const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // ...
    },
    [ 'fetchList' ]
);
```                                

This format is shorter, and recommended unless you need the second format.

The other format is an object with action names as keys and configuration objects as values.

#### Using the default RESTful action configuration

If you want to use the default configuration for a particular action, you just need to pass a value of `true`, for example:

```javascript
const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // ...
    },
    { fetchList: true }
);
```

#### Providing custom action configuration

You can override or extend the default configuration for an action using an options hash instead of `true` when defining your actions:

```javascript
const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // ...
    },
    {
        fetchList:  {
            // action options
        }
    }
);
```

See [Action Options API](#action-options-api) for a full list of supported options.

### Actions and their action creators

#### CRUD actions

It's common to think about interacting with resources in terms of 4 primary operations: create, read, update, delete (CRUD). `redux-and-the-rest` provides local (client-side) actions to refine the input state of each of these operations, and the remote API actions to persist or submit them.

##### Local CRUD actions

Generally your application will need to perform actions on resources locally, until a point is reached where those changes should be synchronised with a remote API. None of them make any requests to a remote API and are client-side operations that happen only in your Redux store. 

| Action | Action Creator | Description |
| ------ | -------------- | ----------- |
| newItem | newItem() | Creates a new item in the Redux store |
| editNewItem | editNewItem() | Continue to add or modify a new item's attributes until it's ready to be saved. |
| clearNewItem | clearNewItem() | Discards (removes) the new item fom the Redux store |
| editItem | editItem() | Replaces an existing (saved) item's attributes in the store with new ones |
| editNewOrExistingItem | editNewOrExistingItem() | Delegates to editNewItem or editItem depending on the state of the item |
| clearItemEdit | clearItemEdit() | Reverts an edit, to restore the item's attributes before the edit |

These actions are generally accumulative and reversible, so you can call them successively over multiple screens or stages of a workflow and provide a cancel feature if the user wishes to abort.

##### Remote API CRUD actions

When the your application is done with local manipulation of a resource, you can use the following to persist those changes to a remote API.

| Action | Action Creator | Description |
| ------ | -------------- | ----------- |
| fetchList | fetchList() | Fetches a list of items from a remote API |
| fetchItem | fetchItem() | Fetches an item from a remote API |
| createItem | createItem() | Sends a create request with an item's attributes to a remote API |
| updateItem | updateItem() | Sends new attributes (an "update") for an item to a remote API |
| destroyItem | destroyItem() | Sends a delete request for an item to a remote API |

`resources()` accepts a `localOnly` option, that allows you to maintain resources without a remote API and will turn the asynchronous remote API actions into synchronous updates that label your resources as being in a "saved" state.

#### Clearing actions

It's generally _not_ recommended to use any of the following directly, as there is usually a better way of achieving what you need, but they are available:

| Action | Action Creator | Description |
| ------ | -------------- | ----------- |
| clearItem | clearItem() | Removes an item from the store. |
| clearList | clearList() | Removes a list from the store (but still leaves behind its items). |
| clearResource | clearResource() | Completely resets a resource to its empty state, clearing all selections, items and lists. |

Some common situations where you may be tempted to use the above, are:

* Refreshing an item or list from a remote API: `fetchItem()` or `fetchList()` should handle transitioning between the stale and new records more cleanly.
* Cancelling an edit to an item: Use `clearItemEdit()` to roll back the changes without the need to re-fetch from the remote API.
* Clearing a resource when an event occurs, such as when user logs out: use the `clearOn` option to achieve this more efficiently (discussed below).   

#### Selection actions

In addition to the CRUD functionality, `redux-and-the-rest` provides a number of actions for selecting one or more items to perform actions on. This is useful if your application needs to selectItem resources on one screen or area and persist that selection to another area, or allow it to be retrieved at a later time.

| Action | Action Creator | Description |
| ------ | -------------- | ----------- |
| selectItem | selectItem() | Selects an item in the store, replacing any previous items that may have been selected. |
| selectAnotherItem | selectAnotherItem() | Selects an item in the store, adding it to any previous items that are selected. |
| deselectItem | deselectItem() | Unselects an item that is currently selected |
| clearSelectedItems | clearSelectedItems() | Unselects all selected items |

### Dispatchers

`redux-and-the-rest` exports action creators in the `actionCreators` object of every resource definition, which return objects (actions) that are ready to be passed to redux's `dispatch` function (as users of redux are accustom to doing). 

However, for convenience, `redux-and-the-rest` also exports _dispatchers_, which are functions that call `dispatch` for you, and are useful in circumstances where the `dispatch` function is not readily available. They have the same name as their action creator counterparts, accept the same arguments, and are enabled with the same configuration when defining your `resource` or `resources`.

They are available directly off the exported object:

```javascript
const { actionCreators: { fetchList: fetchUsersActionCreator }, fetchList: fetchUsersDispatcher } = resources(
    {
        // ...
    },
    {
        fetchList:  {
            // action options
        }
    }
);
```

## Defining associations

You can define associations between resources so that their foreign keys are properly maintained as you add, update and remove related resources.

Once associated, if the associated resource is deleted, it will be removed from the foreign keys of any related items of the current resource.

If a new item  of the associated resource is created with a foreign key pointing at an item of the current resource, it's key will be added to the list of foreign keys.

If an existing associated item is updated and the current resource items are swapped, this will also be handled. 

You define associations on the resources you want to be updated when the associated resource changes. If you need the updates to work both ways, you'll need to define both sides of the association.

Association configuration come in two forms: `belongsTo` and `hasAndBelongsTo`. Each expects an array of resource names (values that you provide to the `name` attribute when defining those resources), or an object, where the keys are the names of the associated resources, and the values are a configuration object containing the following options:

* `foreignKey` -  (string) Name of the attribute that stores the id or ids of the current resource on the associated one. If unspecified, the `as` attribute (or the resource's `name` value) are appended with the suffix of `id`.
* `as` - (string) If a foreign key is not specified, this association name is used with a suffix of `id` to derive the foreign key.

* `key` - (string) 

* `dependent` - (boolean) Whether to remove the associated resource if the current one is removed from the store. 

### One-to-One and One-to-Many relationships

The `belongsTo` resource option is used to define a one-to-one and one-to-many relationships.

```javascript
import { resources } from 'redux-and-the-rest';

const addresses = resources({
  name: 'addresses',
  url: 'http://test.com/addresses/:id?',
  keyBy: 'id'
}, ['createItem', 'updateItem', 'destroyItem']);
                                     

const users = resources({
    name: 'users',
    url: 'http://test.com/users/:id?',
    keyBy: 'id',
    belongsTo: ['addresses']
  }, {
    fetchList: true,
    newItem: true,
  });     
                                                                                   
/**
 * The following will add 'temp' to 'addressIds' of the user with id '1' (if it exists in the store).
 */
addresses.actionCreators.createItem({ id: 'temp' }, { userId: 1, city: 'Boston' });
``` 

### Many-to-Many relationships

The `hasAndBelongsToMany` resource option is used to define many-to-many relationships. It behaves and accepts the same arguments as `belongsTo`, but correctly maintains an *array* of foreign keys on items of the resource being defined, rather than a single id. For example, if each user item has an `addressId` with a singular value, use `belongsTo`, however if a user item has an `addressesId` with an array if address ids, use `hasAndBelongsToMany`.

## Connecting to React

### Usage with react-redux

Although not required, when using `redux-and-the-rest` with React, it's recommended you use `react-redux`. It provides the `connect` function, which accepts two arguments:

| function | Has access to | Passes to your component as props | Can be thought of as |
| -------- | ------------- | --------------------------------- | -------------------- |
| `mapStateToProps` | Current Redux state and the props passed to your container | Some subset of the total redux state | READ |
| `mapDispatchToProps` | `dispatch` (the function for dispatching actions or updates on the Redux store) | Handler functions that accept values from your component and call `dispatch` | WRITE (CREATE, UPDATE, DELETE) |

The full API can be seen in the [docs](https://react-redux.js.org/api/connect).

Because `redux-and-the-rest` is built around the principle of providing a reduced set of reducers for the standard CRUD operations (with a few extras for selection and clearing), you're expected to define utility functions for performing "sub-operations". Take the example of a widget that sets the user's age: you only want to modify one of the the user items's values, but you need to provide the entire new set of values back to `redux-and-the-rest` (this is to allow for removal of attributes and complex or deep merging that `redux-and-the-rest` cannot be expected to guess).

Because the `connect` function separates access to `dispatch` (`mapDispatchToProps`) and access to the current Redux state (`mapStateToProps`), you have a few options.

When your component needs access to all the resource's attributes anyway, you can pass the whole item into your component and then back out again in the handler:

```javascript
import { connect } from 'react-redux'

import { getUser, updateUser } from './resources/users';    
import AgeWidget from './components/AgeWidget';

const mapStateToProps = ({ user } ) => {
  return {
    user: getUser(user)
  }
};

const mapDispatchToProps = ((dispatch) => {
  return {
    updateAge: (user, newAge) => dispatch(updateUser({ ...user, age: newAge }))
  };
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AgeWidget)
```

And you would then call it in your component:

```javascript
<Button onPress={updateAge(user.values, user.values.age + 1)} >
  Increment
</Button>
``` 

You may also choose to use `connect`'s third argument to curry your handler props:

```javascript
import { connect } from 'react-redux'

import { getUser, updateUser } from './resources/users';    
import AgeWidget from './components/AgeWidget';

const mapStateToProps = ({ user } ) => {
  return {
    user: getUser(user)
  }
};

const mapDispatchToProps = ((dispatch) => {
  return {
    updateAge: (values, newAge) => dispatch(updateUser({ ...values, age: newAge }))
  };
});         

const mergeProps = ((stateProps, dispatchProps, ownProps) => {
  return {
    ...stateProps,
    ...dispatchProps,
    updateAge: (newAge) => dispatchProps.updateAge(stateProps.user.values, newAge),
    ...ownProps
  }   
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(AgeWidget)
```        

And call it in your component with the reduced argument list:

```javascript
<Button onPress={updateAge(user.values.age + 1)} >
  Increment
</Button>
``` 

However, if your component doesn't need access to the rest of the user's attributes it's recommended that you keep the component's interface minimal and your handler arguments as few as possible and just retrieve the state directly from the store when it's needed in your handlers:


```javascript
import { connect } from 'react-redux'

import { getUser, updateUser } from './resources/users';
import store from './store';    
import AgeWidget from './components/AgeWidget';

const mapStateToProps = ({ user } ) => {
  return {
    user: getUser(user)
  }
};

const mapDispatchToProps = ((dispatch) => {
  return {
    updateAge: (newAge) => {
      const { values } = getUser(store.getState().users); 
      
      dispatch(updateUser({ ...values, age: newAge }));
    }   
  };
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AgeWidget)
```              

Or alternatively, you can chose not to pass down the attributes you only needed to make available to your handlers:

```javascript
import { connect } from 'react-redux'

import { getUser, updateUser } from './resources/users';    
import AgeWidget from './components/AgeWidget';

const mapStateToProps = ({ user } ) => {
  return {
    user: getUser(user)
  }
};

const mapDispatchToProps = ((dispatch) => {
  return {
    updateAge: (user, newAge) => dispatch(updateUser({ ...user, age: newAge }))
  };
});         

const mergeProps = ((stateProps, dispatchProps, ownProps) => {
  // The final list of props passed to your component
  return {
    age: stateProps.user.values.age,
    updateAge: (newAge) => dispatchProps.updateAge(stateProps.user.values, newAge),
    ...ownProps
  }   
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(AgeWidget)
```        

Either option will allow you to call the handler in your component with only the new values:

```javascript
<Button onPress={updateAge(age + 1)} >
  Increment
</Button>
``` 

## API Reference

### Levels of configuration

`redux-and-the-rest` achieves its flexibility using four levels of configuration; each one has a different scope and is specified at different times.

You need to selectItem where you place your configuration depending on how wide you want particular options to apply, and when the desired values are available.

The options are set out in a hierarchy, so as their scope becomes increasingly specific, their priority increases and they override any corresponding action that may have been provided to a lower priority set of options.

For example, `actionCreatorOptions` take precedence over `actionOptions` (which take precedence over `resourceOptions`).


| Options | Priority | Defined | Scope | Required |
| ------- | -------- | ------- | ----- | -------- |
| `globalOptions` | Lowest | At any time, using `configure()`. | All resources and their actions | No |
| `resourceOptions` |  | When defining resources, using `resources()` | All of a resource's actions | Yes |
| `actionOptions` |  | When defining resources, using `resources()` | An action creator function | No |
| `actionCreatorOptions` | Highest | When calling an action creator, as the last argument | An invocation of an action creator | No |

Here is an example of them used all in once place:

```javascript
import { configure, resources } from 'redux-and-the-rest';

configure({
    // globalOptions
    // ...
});

const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // resourceOptions
        name: 'users',
        url: 'http://www.example.com/users/:id',
        keyBy: 'id'
    },
    {
        fetchList: {
            // actionOptions
            // ...
        },
        fetch: {
            // actionOptions
            // ...
        }
    }
);

fetchUsers({order: 'newest'}, {
  // actionCreatorOptions
  // ...
})
```

### Global Options API

#### Usage

```javascript
import { configure } from 'redux-and-the-rest';

configure({
  // globalOptions
});
```

#### Options

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------- | ----------- |
| keyBy | string or array of strings | No | The resource attribute used to key/index all items of the current resource type. This will be the value you pass to each action creator to identify the target of each action. By default, 'id' is used. |
| localOnly | boolean | False | Set to true for resources that should be edited locally, only. The fetchItem and fetchList actions are disabled (use `getOrFetchItem` and `getOrFetchList` instead) and the createItem, updateItem and destroyItem only update the store locally, without making any HTTP requests. |
| urlOnlyParams | Array of string | [] | The attributes passed to action creators that should be used to create the request URL, but ignored when storing the request's response. |
| method | String | No | The HTTP method to use for the request. Defaults to the standard method used for the particular RESTful action |
| actionName | String | No | The type value to give the action(s) dispatched. If this value is not specified, RESTful actions will use a standard default that includes the resource name and the action name, while custom actions will use the key of the action configuration object, attempting to substitute 'Item' for the resource name, or fallback to a name with the action and resource name concatenated together. |
| actionCreator | Function | Required only for custom actions | A custom action creator function that returns an action or thunk action that can then be passed to Redux's dispatch function |
| responseAdaptor | (responseBody: Object, response: Response) => { values: Object, error?: Object or string, errors?: Array<Object or string> } | No | Function used to adapt the responses for requests before it is handed over to the reducers. The function must return the results as an object with properties values and (optionally) error. |
| requestAdaptor | (requestBody: Object) => Object | No | Function used to adapt the JavaScript object before it is handed over to become the body of the request to be sent to an external API. |
| credentials | RequestCredentials | No | Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the request only if it's on the same origin. |
| acceptType | String | No | The `Accept` header to use with each request. Defaults to the contentType if not defined. |
| contentType | String | No | The `Content-Type` header to use with each request |
| errorContentType | String | No | The `Content-Type` of error responses that should be parsed as JSON. Defaults to the `contentType` if not defined. |
| queryStringOptions | Object | {} | Set of options passed to query-string when serializing query strings. (See https://www.npmjs.com/package/query-string) |  
| request | RequestInit | No | The request configuration object to be passed to the fetch method, or the new XMLHttpRequest object, when the progress option is used. |
| listWildcard | String | '*' | The list key used to reference all lists for action creator's option's list operations |
| generateId | Function | `() => Date.now().toString()` | A function to use to generate ids for new items | 
| reducer | Function | Required for custom actions | A custom reducer function to adapt the resource as it exists in the Redux store. By default, the standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful actions. |
| beforeReducers | Array of reducers | No | A list of functions to call before passing the resource to the reducer. This is useful if you want to use the default reducer, but provide some additional pre-processing to standardise the resource before it is added to the store. |
| afterReducers | Array of reducers  | No | A list of functions to call after passing the resource to the reducer. This is useful if you want to use the default reducer, but provide some additional post-processing to standardise the resource before it is added to the store. |
| store | Store | Yes, if you use the mentioned helpers | The Redux store, used to directly invoke dispatch and get state for the getOrFetchItem() and getOrFetchList() functions |

### Resource Options API

Values passed to `resourceOptions` are used to configure the resource and apply to all of that resource's actions, unless overridden by more specific configuration in `actionOptions`.

#### Usage

```javascript
import { resources } from 'redux-and-the-rest';

const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // resourceOptions
    },
    {
        // ...
    }
);
```

#### Options

##### Naming and indexing

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------  | ----------- |
| `name` | string | Required | The pluralized name of the resource you are defining, used to create the names of the action types
| `keyBy` | string |  'id' | The resource attribute used to key/index all items of the current resource type. This will be the value you pass to each action creator to identify the target of each action. |

##### Synchronising with a remote API

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------- | ----------- |
| `localOnly` | boolean | false | Set to true for resources that should be edited locally, only. The `fetchItem` and `fetchList` actions are disabled (you must use `getOrFetchItem` or `getOrFetchList` instead) and the `createItem`, `updateItem` and `destroyItem` only update the store locally, without making any HTTP requests. |
| `url` | string |  Required | A url template that is used for all of the resource's actions. The template string can include required url parameters by prefixing them with a colon (e.g. `:id`) and optional parameters are denoted by adding a question mark at the end (e.g. `:id?`). This will be used as the default url template, but individual actions may override it with their own. |
| `urlOnlyParams` | string[] | [ ] | The attributes passed to action creators that should be used to create the request URL, but ignored when storing the request's response. Useful for pagination. |
| `responseAdaptor` | Function | Identity function | Function used to adapt the response for a particular request before it is handed over to the reducers. The function must return the results as an object with properties `values` and (optionally) `error` or `errors`. |
| `credentials` | string | undefined | Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the request only if it's on the same origin. |
| `requestAdaptor` | Function | Identity function | Function used to adapt the JavaScript object before it is handed over to become the body of the request to be sent to an external API. |

##### Reducers

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------- | ----------- |
| `beforeReducers` | Function[] | [ ] | A list of functions to call before passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional pre-processing to standardise the resource before it is added to the store. |
| `afterReducers` | Function[] | [ ] |A list of functions to call after passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional post-processing to standardise the resource before it is added to the store. |
| `reducesOn` | Object | {} | An object that specifies custom reducers in response to actions external to the current resource. The keys of the objects are action types from other resources, your own custom actions outside of redux-and-the-rest, or the name of the action you're enabling on this resource (e.g. fetchItem). The values are the reducer functions. |
| `clearOn` | Action or Action[] | [ ] | A single or list of actions for which the current resource should be cleared. |
| `hasAndBelongsToMany` | {\[associationName\]: Resource } | { } | An object of associated resources, with a many-to-many relationship with the current one. |
| `belongsTo` | {\[associationName\]: Resource } | { } | An object of associated resources, with a one-to-many relationship with the current one. |

The reducer functions used in the `beforeReducers`, `afterReducers` and `reducesOn` options accept 3 arguments:

* The current resource(s) Redux state (not the entire Redux state)
* The current action being dispatch (not restricted to only those defined on the current resource being defined)
* An object of getter and reducer helper functions (to avoid having to manipulate the internal structure directly)

The helper object contains the following methods:

* `getItemStatus(state, params)`: Returns the status of an item by providing its params
* `mergeItemStatus(state, params, newStatus)`: Returns a copy of current resource's redux state with an item's status merged with new values 

* `getItemValues(state, params)`: Returns the values of an item by providing its params
* `mergeItemValues(state, params, newValues)`: Returns a copy of current resource's redux state with an item's values merged with new values
* `replaceItemValues(state, params, values)`: Returns a copy of current resource's redux state with an item's values replaced by new values
* `clearItemValues(state, params)`: Returns a copy of current resource's redux state with an item's values cleared
* `clearItem(state, params)`: Returns a copy of current resource's redux state with an item omitted

* `getItemMetadata(state, params)`: Returns the metadata of an item by providing its params
* `mergeItemMetadata(state, params, metadata)`: Returns a copy of current resource's redux state with an item's metadata merged with new metadata
* `replaceItemMetadata(state, params, metadata)`: Returns a copy of current resource's redux state with an item's metadata replaced by new metadata
* `clearItemMetadata(state, params)`: Returns a copy of current resource's redux state with an item's metadata cleared

* `getListStatus(state, params)`: Returns the status of an list by providing its params
* `mergeListStatus(state, params, newStatus)`: Returns a copy of current resource's redux state with an list's status merged with new values

* `getListPositions(state, params)`: Returns the positions of an list by providing its params
* `removeItemFromListPositions(state, listParams, itemParams)`: Returns a copy of current resource's redux state with item's key removed from the list specified
* `replaceListPositions(state, params, positions)`: Returns a copy of current resource's redux state with an list's positions replaced by new positions

* `getListMetadata(state, params)`: Returns the metadata of an list by providing its params
* `mergeListMetadata(state, params, metadata)`: Returns a copy of current resource's redux state with a list's metadata merged with new metadata
* `replaceListMetadata(state, params, metadata)`: Returns a copy of current resource's redux state with a list's metadata replaced by new metadata
* `clearListMetadata(state, params)`: Returns a copy of current resource's redux state with a list's metadata cleared

* `clearList(state, params)`: Returns a copy of current resource's redux state with a list omitted
                        
* `deselectItem(state, params)`: Returns a copy of current resource's redux state with the item no longer selected
* `deselectItems(state, params[])`: Returns a copy of current resource's redux state with the items specified no longer selected
* `selectAnotherItem(state, params)`: Returns a copy of current resource's redux state with an item selected (without clearing those already selected)
* `selectMoreItems(state, params[])`: Returns a copy of current resource's redux state with the items selected (without clearing those already selected)
* `selectItem(state, params)`: Returns a copy of current resource's redux state with only a single item selected
* `selectItems(state, params[])`: Returns a copy of current resource's redux state with only the listed items selected
* `clearSelectedItems(state, params)`: Returns a copy of current resource's redux state with no items selected

* `clearResource()`: Returns an empty singular resource state, for clearing the entire resources
* `clearResources()`: Returns an empty resource state, for clearing the entire resource

### Action Options API

`actionOptions` are used to configure individual resource actions and override any options specified in `globalOptions` or `resourceOptions`. They are the most specific level of options available at the time that resources are defined and can only be superseded by options provided to action creators when they are called.

#### Usage

```javascript
import { resources } from 'redux-and-the-rest';

const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // ...
    },
    {
        fetchList: {
            // actionOptions
        },
        fetch: {
            // actionOptions
        }
    }
);
```

#### Options

##### Naming and indexing

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------- | ----------- |
| `keyBy` | string | `resourceOptions.keyBy` | The key to index all items on for this particular action. |

##### Synchronising with a remote API

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------- | ----------- |
| `url` |  string |`resourceOptions.url` | The URL template to use for this particular action. |
| `urlOnlyParams` | string[] | `resourceOptions.urlOnlyParams` | The attributes passed to the action creator that should be used to create the request URL, and ignored when storing the result in the store. |
| `responseAdaptor` | Function | Identity function | Function used to adapt the response for a particular request before it is handed over to the reducers. The function must return the results as an object with properties `values` and (optionally) `error` or `errors`. |
| `requestAdaptor` | Function | Identity function | Function used to adapt the JavaScript object before it is handed over to become the body of the request to be sent to an external API. |
| `credentials` | string | undefined | Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the request only if it's on the same origin. |
| `progress` | boolean |   false | Whether the store should emit progress events as the resource is uploaded or downloaded. This is applicable to the RESTful actions `fetchList`, `fetchItem`, `createItem`, `updateItem` and any custom actions. |
| `metadata` | object | `{ type: 'COMPLETE' }` | An object of attributes and values that describe the list's metadata. It can be used for containing information like page numbers, limits, offsets and includes for lists and types for items (previews, or the complete set of attributes of an item). |  
| `itemsMetadata` | object | `{ type: 'COMPLETE' }` | Accepted only by `fetchList` and `getOrFetchList`, used to define the metadata of each item in the list (the `metadata` is applied to the list). |  

##### Reducers

| key | Type | Required or Default Value | Description |
| --- | ---- | ------------------------- | ----------- |
| `reducer` | Function or String name of action | RESTFUL actions: a sensible default; non-RESTFUL: Required | A custom reducer function to use for the action. Either a Reducer function (accepting the current resource state and the next action as arguments), or the name of one of an action (e.g. 'fetchItem', 'createItem') if you want to re-use one of the standard reducers. By default, the standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful actions. |
| `beforeReducers` | Function[] | [ ] | A list of functions to call before passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional pre-processing to standardise the resource before it is added to the store. |
| `afterReducers` | Function[] | [ ] | A list of functions to call after passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional post-processing to standardise the resource before it is added to the store. |


## Store data

### Getting items from the store

To get an item from a resource, you use the `getItem()` function returned by `resources()`.

It will return an [empty item](#item-schema) (instead of `undefined`) if one with the corresponding key does not exist in the store.

```javascript
import { serializeKey, ITEM } from `redux-and-the-rest`;
import { connect } from 'react-redux';

const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getItem } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        fetch: true
    }
);

function mapStateToProps({ users }, { params: { id } }) {
  return getItem(users, { id });
}
```

### Automatically fetching items not in the store

To get a item or list from the store and fallback to making a request to the remote API if it's not there, use the `getOrFetchItem()` function returned by `resources()`.

If the item is in the store, it will return it. However, if it is not there, it will return an [empty item](#item-schema) (instead of `undefined`) and trigger the action(s) to fetch the resource in the background.

You can use this function multiple times, across renders and components mounted at the same time, because duplicate actions and requests are ignored, so no unnecessary updates to the store or remote requests will be made.

In order for you to use this, a few pre-requisites must be met:

You must use the `configure()` function to pass `redux-and-the-rest` the instance of the store after you define it:

```javascript
import { configure } from 'redux-and-the-rest';
import { createStore } from 'redux';

const store = createStore(reducers, {});

configure({ store });
```

And you must define a `fetchItem` action when defining your resource:

```javascript
import { serializeKey, ITEM } from `redux-and-the-rest`;
import { connect } from 'react-redux';

const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getOrFetchItem } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id',
    },
    {
        fetch: true,
    }
);
```

`getOrFetchItem()` expects the current resources state (the part of the Redux store that contains your resources data) as its first argument. The second argument is the params object that will be serialized to generate the item or list's key. The third (optional) argument are options to pass to the action creator, if it's called.

```javascript
function mapStateToProps({ users }, { params: { id } }) {
  // Looks for the user item in store.getState().users.items[<id>]
  return getOrFetchItem(users, { id }); 
}
```

The actionCreatorOptions accepts the option `forceFetch`, which accepts a boolean or a function that is passed the current item or list and is expected to return a boolean value. This provides a way to conditionally ignore the version of the item or list in the store and to make a fetchItem request anyway:

```javascript
function mapStateToProps({ users }, { params: { id } }) {
  // Looks for the user item in store.getState().users.items[<id>]
  return getOrFetchItem(users, { id }, {
    forceFetch: ({ status: { type } }) => type === 'BOOTSTRAPPED',
  }); 
}
```      

### Automatically instantiating new items not in the store

To retrieve a new item form the store, or initialize one if it does not already exist, you can use the `getOrInitializeNewItem()` function.

Similar to `getOrFetchItem()`, it expects the current resources state (the part of the Redux store that contains your resources data) as its first argument. The second argument should be the values to initialize a new resource item with, if it does not exist in the store already. 

This method returns the new item immediately, but it does not update it in the Redux store until after the current render cycle. So it's safet to use in your component's `redner` function.

It does not accept any parameters argument, as it relies on (and sets) the internal pointer to a new item (so this method cannot be used to initialise an existing item).

This method is particularly helpful for ensuring forms have default resource items to edit when a user first accesses them.

It's also memoized, so multiple components can use it in the same render cycle and only one update to the store is made.

```javascript
function mapStateToProps({ users }, { params: { id } }) {
  return getOrInitializeNewItem(users, { username: 'DEFAULT', age: 18 }); 
}
```  

### Getting lists from the store

To get a list from a resource, you use the `getList()` function returned by `resources()`.

It will return an [empty list](#list-schema) (instead of `undefined`) if one with the corresponding key does not exist in the store.

```javascript
import { serializeKey, LIST } from `redux-and-the-rest`;
import { connect } from 'react-redux';

const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getList } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        fetchList: true
    }
);

function mapStateToProps({ users: usersResource }, { params: { order } }) {
  return getList(usersResource, { order });
}
```

#### Automatically fetching lists that are not in the store

Similar to `getOrFetchItem()`, the `resources()` function returns a `getOrFetchList()` that accepts the same arguments and performs in the same manner.

To use it, you will also need to have configured `redux-and-the-rest` to use your store instance and you'll need to have defined an `fetchList` action when defining your `resources()`.

### Store data schemas

#### Nomenclature

It is helpful to first clarify some of the terms used in the next few sections:

* **Resource:** A *type of thing* that is available in your application and you can view or perform actions on. Examples of resources are "users", "posts" or "comments".
* **List:** An ordered list of items of a particular resource. This is generally what is returned from an RESTful index server endpoint. They can be ordered, scoped or filtered. Examples include "the newest users", "the most popular posts", or simply "comments" (lists don't have to have an explicit order - but one will be implied by how they are listed in a server's response).
* **Item:** Individual resource objects, that can belong to lists or can exist as individual entities. They have a unique primary id when using `resources()` or an implicit id when using `resource()`. For example "user with ID 123" or "post with ID 7".

#### Use helper methods where possible

Although the structure of each resource is standard, it's strongly recommended you use the helper methods `redux-and-the-rest` makes available to retrieve the data, whenever possible. Doing so will help isolate you from any changes in the underlying structure that may occur with future versions of the package.  


#### Resource schema

All resources defined with the `resources()` function, return a `reducers` object that initialises and maintains the same data schema. This means you can easily reason about each of your resources and there is very little overhead to defining a new resource.

##### Top level schema

The top-level schema looks like the following, before it any data is added to your store:

```javascript
{
    items: {},
    lists: {},
    selectionMap: {},
    newItemKey: null
}
```

We will now explore each one:
* `items` - A map of item keys to item objects, from all of the lists currently in the store. This means that lists with a large amount of overlap (i.e. they share many of the same items) only store one copy of each item.
* `lists` - A map of lists, keyed by their parameters. This allows you to have many lists of the same resource all in the one place (e.g. "newest", "most popular"), without having to re-fetch them if the user moves back and forth between them.
* `selectionMap` - A dictionary of item keys, representing which of the resources are currently selected in your application (if any). Because it is a map, it is easy to query if any one particular item is currently selected or not, in constant time.
* `newItemKey` - A value that keeps track of the key assigned to the latest item that was created of this particular resource. This is useful when you are creating a new item with a temporary id (say the current time) and you need to know the new ID the server has assigned it once it has been successfully created there, so you can move from the temporary id to the new server-assigned Id.

##### Item schema

A blank item has the following schema:

```javascript
{
  values: {},
  status: { type: null },
  metadata: { type: null }
};
```

* `values`: This is where all of the item's attributes are stored.
* `status`: This is where status information is stored, separate from the item's attributes. This allows the `values` to remain pure - so if you are editing an item, all you need to do is send the new `values` back to the server, without having to worry about any irrelevant attributes being mixed in.
* `metadata`: This is where information about the nature of the item's set of attributes is stored. A `type` attribute indicates whether all of the item's attributes have been retrieved (`COMPLETE` by default), or whether only some of them have (e.g. `PREVIEW`). Other information can also be stored here, and is configurable when the resource action is defined or when the action creator is called.


Setting the `metadata` when defining the resource:

```
const { reducers, actionCreators: { fetchList: fetchUsers } } = resources({
  name: 'users',
  url: 'http://test.com/users',
  keyBy: 'id',
}, {
  fetch: {
    metadata: { type: 'PREVIEW' }
  }
});
```

Setting the `metadata` when calling the action creator:

```javascript
dispatch(fetchUser(1, { metadata: { type: 'PREVIEW' }}));
```

##### List schema

A blank list has the following schema:

```javascript
{
  positions: [],
  status: { type: null },
  metadata: { type: null }
};
```

* `positions`: This is an array of keys of the items that exist in the list. It stores the order of the items separate from the items themselves, so the items may be efficiently stored (without any duplicates) when we have multiple lists that may share them. It also means that we may update individual item's values, without having to alter all of the lists they are a part of.
* `status`: This is where status information is stored for the entire list.
* `metadata`: This is where information about the nature of the list is stored. A `type` attribute indicates whether all of the items in the list have been retrieved (`COMPLETE` by default), or whether only some of them have. Other information can also be stored here, and is configurable when the resource action is defined or when the action creator is called.

Setting the `metadata` when defining the resource:

```
const { reducers, actionCreators: { fetchList: fetchUsers } } = resources({
  name: 'users',
  url: 'http://test.com/users',
  keyBy: 'id',
}, {
  fetchList: {
    metadata: { type: 'PAGINATED' }
  }
});
```

Setting the `metadata` when calling the action creator:

```javascript
dispatch(fetchUsers({}, { metadata: { type: 'PAGINATED', page: 1 }}));
```

### Data lifecycle

`redux-and-the-rest` uses the `status.type` attribute of lists and items to indicate what state they are currently in. However, it's recommended to use one of the helper methods to query the status rather than accessing the attribute directly.

* `isNew(item)` - Whether the item is new and has yet to be created on the remote
* `isEditing(item)` - Whether the item has been modified since it was last synced with the server

Checking if a value is the same as the new item's temporary key:

* `isNewItemKey(resourceReduxState, key)` - Whether the (internally managed) `newItemKey` for the resource matches the `key` supplied

Checking if an item or list is syncing with a remote API:

There are 3 levels or groups to be aware of:

* Syncing - When any sort of request is in flight to upload or download data in the store to keep the redux store and the remote in sync. This includes fetching, creating, updating or destroying.
* Saving - When the data in the redux store is being uploaded to the remote. This includes creating or updating. Saving is a subset of syncing.
* Individual RESTful actions - fetching, creating, updating and destroying (separately)

* `isFetching(itemOrList)` - Whether the item or list is fetching (specifically) from the remote 
* `isCreating(item)` - Whether the item being created (specifically) on the remote 
* `isUpdating(item)` - Whether the item being updated (specifically) on the remote 
* `isDestroying(item)` - Whether the item being destroyed (specifically) on the remote 
* `isSaving(item)` - Whether the item being saved (created or updated) on the remote 
* `isSyncing(itemOrList)` - Whether the item or list being synced (fetched, updated, created, destroyed) on the remote 
 
To check against custom statuses, you can use the more generic:

* `isStatus(itemOrList, statusList)` - Whether the resource item currently has a particular status - statusList is either a single value or an array of values (a match on any of which will return true).  
 
Checking when a sync is finished:

* `isFinishedFetching(itemOrList)` - Whether the request to fetch the item or list is finished 
* `isFinishedCreating(item)` - Whether the request to create the item is finished 
* `isFinishedUpdating(item)` - Whether the request to update the item is finished 
* `isFinishedSaving(item)` - Whether the request to save the item is finished 
* `isFinishedSyncing(itemOrList)` - Whether the request to sync the item or list is finished 
* `isNotAvailableLocally(itemOrList)` - Whether a list or item is `undefined`, `null` or an empty schema, indicating it was not in the store when it was retrieved.

To check against custom statuses, you can use the more generic:

* `isFinished(itemOrList, statusList)` - Whether a resource item or list has exited the provided status (or any value in the status list) and is now in a success or error state  

Checking the result of the latest sync with the remote API:

* `isSucces(itemOrList)` - Whether the item or list was successful in its last sync
* `isError(itemOrList)` - Whether the item or list was failed in its last sync
* `getHttpStatusCode(itemOrList)` - The HTTP status code of the last request related to the resource item or list as a number

```javascript
import React from 'react';
import { isFinishedSyncing, isSuccess } from 'redux-and-the-rest';

class MyComponent extends Component {
    render() {
        const { item } = this.props;

        if (isFinishedSyncing(item)) { 
            if (isSuccess(item)) {
              // item is loaded and ready to display
            } else {
              // display error message
            }
        } else {
           // display preloader
        }
    }
}
```

If for whatever reason the above helper methods are not suitable for your needs, the raw status type are as follows:

#### Client statuses

These statuses are useful for creating behaviour specific to new or changed items, such as displaying warning messages if the user attempts to navigate away without saving:

* `NEW`: When a new item is being created on the client, but has not yet been sent to the server.
* `EDITING`: When an existing item is being updated but has not yet been saved to the server.

#### Pending statuses

Checking for these statuses is generally useful for displaying loaders or progress indicators:

* `FETCHING`: When an item or list is being fetched from the server but it has not yet arrived.
* `CREATING`: When the request to create a new item has been sent to the server, but the response has not yet arrived.
* `UPDATING`: When the request to save the changes to an existing item have been sent to the server, but the response has not yet arrived.
* `DESTROYING`: When the request to destroy an existing item has been sent to the server, but the response has not yet arrived.
* `PROGRESS`: When progress updates are enabled, this status occurs while an upload or download request is taking place. You can check `status.progressUp` (for the upload request progress) and `status.progressDown` (for the download response progress).

#### Response statuses

Checking for these statuses is useful for displaying success or error messages:

* `SUCCESS`: When the response to the a request to fetch list or an item has arrived and it was a success. You can now use the contents of the list or item.
* `ERROR`: When the response to the a request to fetch list or an item has arrived and it was an error. You should now check the `status.errors` attribute for details.
* `DESTROY_ERROR`: When the response to the request to destroy an existing item has arrived, and it's an error. You should now check the `status.errors` attribute for details.

## Setting initial state

`redux-and-the-rest` provides a Builder for each resource that can be used to define the initial resource state in a minimal fashion. This builder provides a chainable interface for specifying values and a `build()` function for returning the initial state, correctly nested and formatted to work with the resource's reducers.

`resources()` returns a `buildInitialState()` helper function that returns an `InitialResourceStateBuilder` instance. This instance lets you set values that will propagate to all of the resource's lists and items.

```javascript
const { buildInitialState } = resources({
    name: 'users',
    url: 'http://test.com/users/:id',
}, ['fetch']);

const stateBuilder = buildInitialState([ { id: 1, username: 'John' }]);

createStore(reducers, { users: stateBuilder.build() });
```

It provides a `addList()` function for specifying a list, which returns a builder scoped to that list, so you can further specify state and metadata values on that list and its items. The `addList()` function accepts an optional params object, used to create the list's key and an array of items in the list, as its arguments.

```javascript
// The default, unkeyed list
const listBuilder = stateBuilder.addList([ { id: 1, username: 'John' }]);

// List with a key
const listBuilder = stateBuilder.addList('newest', [ { id: 1, username: 'John' }]);
```

The list builder also provides an `addItem()` function for adding items to the list after its been instantiated. The `addItem()` function accepts an optional params object to define the object's key, and an object of the item's attributes.

```javascript
// Taking the key from the item (using the default of 'id')
listBuilder.addItem({id: 2, username: 'Bob' });

// Specifying params to use to generate the key
listBuilder.addItem(3, {username: 'George' }); // OR
listBuilder.addItem({id: 3}, {username: 'George' });
```

`InitialResourceStateBuilder` also provides an `addItem()` function, to add items that are not in any specific list.

```javascript
const stateBuilder = buildInitialState();
stateBuilder.addItem({ id: 1, username: 'John'});
```

All builders allow you to set the state type of its contents using the `setStateType()`, `setSyncedAt()` and the metadata values using `setMetadata()`. These methods return the state builder you call them on, so you can chain them together

```javascript
const itemStateBuilder = stateBuilder.addItem({ id: 1, username: 'John'});

itemStateBuilder.setStatusType(customStatusType).setMetadata({ type: 'CUSTOM' });
```

Items inherit the state and metadata of their list, unless explicitly set. Similarly, lists inherit these values from their resource unless explicitly set.

**Note** It is strongly recommended that you set the syncedAt value for your initial state, to allow the `canFallbackToOldValues()` helper to function correctly.


## RESTful (asynchronous) actions

### RESTful behaviour overview

Given the following resource definition:

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, actionCreators: { fetchList: fetchUsers } } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    [
        'fetchList', 'fetch', 'createItem', 'updateItem', 'destroyItem'
    ]
);
```

`redux-and-the-rest` will define the following action creators, that when called, will perform the standard HTTP RESTful requests:

| Action creator | RESTful action | HTTP Request |
| ---- | :--- | :--- |
| `fetchList()` | #fetchList | `GET http://test.com/users` |
| `fetchItem(1)` | #fetchItem | `GET http://test.com/users/1` |
| `createUser('tempId', {name: 'foo'})` | #createItem | `POST http://test.com/users` |
| `updateUser(1, {name: 'foo'})` | #updateItem | `PUT http://test.com/users/1` |
| `destroyUser(1)` | #destroyItem | `DELETE http://test.com/users/1` |

#### Preventing duplicate requests

Asynchronous action creators are throttled so if you call one multiple times before the first call has had a chance to receive the response, the subsequent calls have no effect on the store (no actions are dispatched) and do not make any requests.

This is to allow mounting multiple React components on the same page that both require the same data - they can each call (for example) `fetchUser(1)` and only the first call will update the store and perform the request (but both will have access to the data once it arrives from the eternal API). Once the request has resolved, the action creator can be called again and will have the expected effect.

This behaviour can be overridden by passing a `force` value of `true` to the `actionCreatorOptions` of any action creator function.

#### Dealing with failed requests

When an error occurs with fetching a list or resource, you can use the `canFallbackToOldValues()` helper method to determine if there are old versions of the request resource already in the store that can be displayed until a connection is re-established.

It accepts an item or a list.

```javascript
import { canFallbackToOldValues } from 'redux-and-the-rest';

if (canFallbackToOldValues(item)) {
  
}
```

#### Dealing with slow requests

You can identify slow requests with the `getTimeSinceFetchStarted()` helper method.

It accepts an item or a list and returns the time duration in milliseconds.

```javascript
import { getTimeSinceFetchStarted } from 'redux-and-the-rest';

if (getTimeSinceFetchStarted(item) > 3000) {
  
}
```

You will likely need to wrap this in a `setInterval` or similar, to ensure the check is performed regularly until the fetch is resolved.

#### Detecting old data

You can use the `getTimeSinceLastSync()` helper method to identify an item or list's age (when its state was last confirmed with a remote API using `fetchItem`, `fetchList`, `updateItem` or `createItem`) and establish whether it should be re-requested.

It accepts an item or a list and returns the time duration in milliseconds.

```javascript
import { getTimeSinceLastSync } from 'redux-and-the-rest';

if (getTimeSinceLastSync(item) > 3600000) {
  
}
```

### Fetch a list from the server

The fetchList action fetches a list or list of resources from a particular URL. It does not require a primary identifier and instead accepts parameters that may scope, filter or order the list.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `fetchList` |
| Action creator name | `fetchList()` |
| First action creator argument | (Optional) `keys` - See [Getting lists from the store](#getting-lists-from-the-store) and [Configuring the URLs used for a request](configuring-the-urls-used-for-a-request) for more information.|
| Second action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `FETCHING` -> (`SUCCESS` or `ERROR`) |


#### fetchList action creator options

The fetchList action creator supports the following options as its second argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the list. |
| `metadata` | Object | {}} | An object of attributes and values that describe the list's metadata. It can be used for containing information like page numbers, limits, offsets and includes for lists and types for items (previews, or the complete set of attributes of an item). |
| `itemsMetadata` | Object | {}} | An object of attributes to apply to the metadata of each item in the list. |
| `force` | boolean | false | Whether to ignore any outstanding requests with the same URL and make the request again, anyway |

When the list is successfully fetched, the default fetchList reducer expects the server to respond with a JSON object containing an array of items' attributes. If the request fails, it expects the server to respond with a JSON object containing an error.

### Fetch an individual item from the server

The fetchItem action creator fetches an individual item from the server and adds it in the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `fetchItem` |
| Action creator name | `fetchItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) and [Configuring the URLs used for a request](configuring-the-urls-used-for-a-request) for more information. |
| Second action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `FETCHING` -> (`SUCCESS` or `ERROR`) |

#### Fetch action creator options

The fetchItem action creator supports the following options as its second argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the item. |
| `metadata` | Object | {}} | An object of attributes and values that describe the list's metadata. It can be used for containing information like page numbers, limits, offsets and includes for lists and types for items (previews, or the complete set of attributes of an item). |
| `force` | boolean | false | Whether to ignore any outstanding requests with the same URL and make the request again, anyway |

When the item is successfully fetched, the default fetchItem reducer expects the server to respond with a JSON object containing resource's attributes. If the request fails, it expects the server to respond with a JSON object containing an error.

### Create a new item on the server

The create action creator saves a new item to the server, with a set of specified attributes and adds it to the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `createItem` |
| Action creator name | `createItem()` |
| First action creator argument | (Optional) `keys` - The temporary id to use to fetchList the new resource in the store until a permanent id has been assigned by the server. This temporary id is available as `newItemKey` on the resource, until a new one is returned by the server, and then `newItemKey` is updated to the value assigned by the server. This argument is optional unless used with the `localOnly` option (`localOnly` requires you to specify an id, as there is no external API to assign one). If it is not specified, a temporary key is automatically generated and you can access the item using the `getNewItem()` helper. If you do not want to specify this argument, you can pass the item's `values` as the first parameter.|
| Second action creator argument | Resource item's attributes - An object of attributes to save to the server |
| Third action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `CREATING` -> (`SUCCESS` or `ERROR`) |

#### Adding a created item to a list

Often when you create a new item, you want it to appear in a list immediately (without having to re-fetch the list from the remote API). You can achieve this with one of the following options:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `push` | Array | [ ] | An array of list keys to push the new item to the end of. |
| `unshift` | Array | [ ] | An array of list keys to add the new item to the beginning of. |
| `invalidate` | Array | [ ] | An array of list keys for which to clear (invalidate). This is useful for when you know the item that was just created is likely to appear in a list, but you don't know where so you need to re-retrieve the whole list from the server. |
| `merge` | Array | [ ] | An array of tuples, where the first element is an array of list keys to run the custom merger on (the second element). See below for details |

If you want to add the new item to the default (unspecified) list, you can use the `UNSPECIFIED_KEY` exported by the package:

```javascript
import { UNSPECIFIED_KEY } from 'redux-and-the-rest';

// ...

createUser(userAttributes, { push: [UNSPECIFIED_KEY] })
```          

If you want to perform a list operation on all other lists whose key has not been explicitly referenced, you can use the `getConfiguration().listWildcard` value (`'*'` by default).

For example the following will unshift an item to the `newest` list and invalidate all others:

```javascript 
createTodoItem({ title: 'Pick up milk'}, { unshift: ['newest'], invalidate: ['*'] });
```                                                                           

If the `push`, `unshift` or `invalidate` list operations do not do what you need, you can use the `merge` option to provide a custom function of your own.

The merger function accepts two arguments:

* An array of items in their current order
* The new item to merge into its correct position

The merger function and the collection of list keys that is should operate on are specified as tuples (to allow specifying multiple custom mergers in the same action).

The merger function must return an array of item keys in the correct order for the corresponding items (rather than an array of the the full item objects passed as arguments).

For example, the following will sort the list of items with the key `'important'` by priority:

```javascript
const sortListItemsByImportance = (items, newItem) => {
  return itemsSortedByPriority([...items, newItem]).map(({ values: { id }}) => id);
}      

createTodoItem(
    { title: 'Pick up milk'}, 
    { merge: [['important'], sortListItemsByImportance ]}
);
```

When the item is successfully created, the default createItem reducer expects the server to respond with a JSON object containing the item's attributes. If the request fails, it expects the server to respond with a JSON object containing an error.

### Update a item on the server

The updateItem action creator updates an existing item's attributes with a set of new values by saving them to the server, and updating the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `updateItem` |
| Action creator name | `updateItem()` |
| First action creator argument | `keys` - The keys that point to the item to update. |
| Second action creator argument | The item's new attributes - An object of attributes to save to the server. |
| Third action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `UPDATING` -> (`SUCCESS` or `ERROR`) |

#### Update action creator options

The updateItem action creator supports the following options as its third argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the item. |
| `metadata` | Object | {}} | An object of attributes and values that describe the list's metadata. It can be used for containing information like page numbers, limits, offsets and includes for lists and types for items (previews, or the complete set of attributes of an item). |
| `force` | boolean | false | Whether to ignore any outstanding requests with the same URL and make the request again, anyway |
| `previousValues` | Object | undefined | The previous values, before the update. This is used to more efficiently update associations defined with `belongsTo` or `hasAndBelongsToMany`, but otherwise is generally not used. |

When the item is successfully updated, the default updateItem reducer expects the server to respond with a JSON object containing resource's attributes. If the request fails, it expects the server to respond with a JSON object containing an error.

### Destroy a item on the server

The destroyItem action creator deletes an existing item from the server and then removes it from the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `destroyItem` |
| Action creator name | `destroyItem()` |
| First action creator argument | `keys` - The keys that point to the item to destroy. |
| Second action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `DESTROYING` -> (`SUCCESS` \| `DESTROY_ERROR`) |

#### DestroyItem action creator options

The destroyItem action creator supports the following options as its second argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the item. |
| `force` | boolean | false | Whether to ignore any outstanding requests with the same URL and make the request again, anyway |
| `previousValues` | Object | undefined | The previous values, before it was destroyed. This is used to more efficiently update associations defined with `belongsTo` or `hasAndBelongsToMany`, but otherwise is generally not used. |

When the item is successfully destroyed, the default destroyItem reducer expects the server to respond a with a success response. If the request fails, it expects the server to respond with a JSON object containing an error.

## Local (synchronous) actions

On top of the RESTful action creators that come with `redux-and-the-rest`, there are a number of extras that do not make any requests, but instead perform synchronous local changes to the store.

### Add a new item to the store

The new action creator creates a new item and adds it to the store, without sending any requests to the server. This is useful when you want to create a particular item over several pages or steps, before sending it to the server to be saved.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `newItem` |
| Action creator name | `newItem()` |
| First action creator argument | `keys` - The temporary id to use to store the new resource in the store until a permanent id has been assigned by the server. This temporary id is available as `newItemKey` on the resource. |
| Second action creator argument | Resource item's attributes - An object of attributes to save as a new item in the store. |
| Third action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `NEW` |

#### NewItem action creator options

The new action creator supports the following options as its third argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the item. |
| `force` | boolean | false | Whether to ignore any outstanding requests with the same URL and make the request again, anyway |
| `metadata` | Object | {}} | An object of attributes and values that describe the list's metadata. It can be used for containing information like page numbers, limits, offsets and includes for lists and types for items (previews, or the complete set of attributes of an item). |
| `push` | Array | [ ] | An array of list keys to push the new item to the end of. |
| `unshift` | Array | [ ] | An array of list keys to add the new item to the beginning of. |
| `invalidate` | Array | [ ] | An array of list keys for which to clear (invalidate). This is useful for when you know the item that was just created is likely to appear in a list, but you don't know where, so you need to re-retrieve the whole list from the server. |

### Clear the new item from the store

The clearNewItem action creator deletes the item pointed to by `newItemKey` if it has a status of `NEW`, and sets the `newItemKey` to `null`.

This is useful when the user wishes to cancel or navigate away from creating a new resource.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `newItem` |
| Action creator name | `newItem()` |

### Edit the new item in the store

The editNewItem action creator updates the new item in the store before it's been saved to an external API, with new values.

This is useful when you want to create the new item over several pages or steps, before saving it to the server.

This is different from the editItem action creator in that it only allows editing the current new item, and maintains the `NEW` state, so you can differentiate between editing a resource that has been saved to an external API and one that is still being refined before being saved.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `editNewItem` |
| Action creator name | `editNewItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |
| Second action creator argument | Resource item's attributes - An object of attributes to save as the item's new values in the store. |
| `status.type` lifecycle |  `NEW` |

### Edit an existing item in the store

The editItem action creator updates a item in the store with new values, without sending any requests to the server.

This is useful when you want to edit a particular item over several pages or steps, before saving it to the server.

It should not be used for editing a new item - user the editNewItem action creator instead.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `editItem` |
| Action creator name | `editItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |
| Second action creator argument | Resource item's attributes - An object of attributes to save as the item's new values in the store. |
| `status.type` lifecycle |  `EDITING` |

### Edit an item without worrying whether it's new or not

Often you want to re-use the same forms and components to create an item as you do to edit it, and you would like to re-use as much code as possible.

In these circumstances, you can use the `editNewOrExistingItem` action creator, which delegates to either `editItem` or `editNewItem` based on the current state of the item.

It accepts the same arguments as `editItem` - so you must have manually specified an id for your new item (rather than letting `redux-and-the-rest` manage it internally for you)

### Detecting if a item has been edited

You can use the `isEdited()` helper function to determine if a item has been edited (but not saved to the server) since it was last synchronised.

```javascript
import { isEdited } from 'redux-and-the-rest';

if (isEdited(item)) {
  // ...
}
```

### Accessing values before they were edited

You can use the `getValuesBeforeEditing()` function to get an item's values before any local edits were performed.

```javascript
import { getValuesBeforeEditing } from 'redux-and-the-rest';

const originalValues = getValuesBeforeEditing(item);
```

### Clear local edits

The clearItemEdit action creator reverts any local edits (those that haven't been sent to an external API) and resets a item back to its original values (as they existed when the resource was last synced).

This is useful when a user wants to cancel or clear their editing of a particular item.

It can also be used to clear an edit after an UPDATE request has failed to be submitted to the server to reset the item back to its last known valid state, without having to make a separate request to the external API.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `clearItemEdit` |
| Action creator name | `clearItemEdit()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |
| `status.type` lifecycle |  `EDITING` -> `SUCCESS` |

### Select a item in the store

The selectItem action creator adds an item's key to the `selectionMap` dictionary. It ensures that it is the only item (and overrides any previous values).

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `selectItem` |
| Action creator name | `selectItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |

### Select another item in the store

The selectAnotherItem action creator adds an item's key to the `selectionMap` dictionary, while persisting any items' keys that have already been selected.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `selectAnotherItem` |
| Action creator name | `selectAnotherItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |

### Deselect a item in the store

The deselectItem action creator removes an item's key from the `selectionMap` dictionary, if appears in there.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `deselectItem` |
| Action creator name | `deselectItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |

### Clear all the selected items in the store

The clearSelectedItems action creator clears the `selectionMap` dictionary, resetting it to an empty object.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `clearSelectedItems` |
| Action creator name | `clearSelectedItem()` |
| First action creator argument | `keys` - See [Getting lists from the store](#getting-lists-from-the-store) for more information. |


### Clearing a resource when a user signs out or other event

Often you will have events that should trigger some sort of cache busting, or clearing or resources. A common situation is clearing all resources related to the current user when that user logs out. This can be achieved with the resource `clearOn` option.

This option accepts a list of, or a single action, that should trigger clearing the resource.

Example:

```javascript
const { reducers: sessionReducers, actionCreators: { destroyItem: destroySession }, actions } = resources({
      name: 'session',
      url: 'http://test.com/session/:id',
    }, {
      destroyItem: true
    });

// ...

const { reducers: usersReducers, } = resources({
    name: 'users',
    url: 'http://test.com/users/:id?',
    keyBy: 'id',
    clearOn: destroySession,
  }, {
    fetchList: true,
    newItem: true,
  });
```

## Configuring requests

### Configuring the URLs used for a request

The default template URL for a resource is set in [resourceOptions](#resource-options-api). RESTful actions use this template by selecting the convention request type for the operation (`GET`, `POST`, `PUT`, `DESTROY`) and populating the parameter templates where appropriate.

However, you can override this default for individual actions using the `url` option for [actionOptions](#action-options-api):

```javascript
const { actionCreators: { fetchItem: fetchUser } } = resources(
{
    name: 'users',
    url: 'http://test.com/users/:id?',
    keyBy: 'id'
}, {
    fetchList: true,
    fetch: {
      url: 'http://test.com/guests/:id?'
    },
});

// Makes request to http://test.com/guests/1
fetchUser(1);
```

#### URL Parameters

The URL used to fetch a particular resource depends on two factors:

* The URL template set in [`resourceOptions`](#resource-options-api), and
* The parameters passed to the resource's action creator when you call it.

##### Using string values

If a string value is passed to an action creator as its first argument, it will assumed to be the value of the parameter mentioned in the `keyBy` option.

For example, given the following resource definition:

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, actionCreators: { fetchList: fetchUsers } } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    [ 'fetchList' ]
);
```

Calling `fetchUsers('newest')` will make a request to:

```
http://test.com/users/newest
```

If you are using a url template with more than one parameter, or wish to specify query parameters, you need to use an object rather than a string.

##### Using object values

If an object is passed to an action creator as the first argument, the keys are matched to the url parameter names, and the corresponding values are substituted into the URL.

For example, given the same resource definition above, calling `fetchUsers({ id: 'newest' })` will make a request to:

```
http://test.com/users/newest
```

##### Specifying query parameters

If there are keys present in the object that do not have a corresponding URL parameter, they are serialized and used as query parameters:

For example, calling `fetchUsers({ order: 'newest' })` will make a request to:

```
http://test.com/users?order=newest
```

#### Adapting request bodies

If you need to adapt data from the format in which it's stored in the Redux store to one that matches the needs of your remote API, you can do so using the `requestAdaptor` option.

This function is available as global, resource or action level configuration and is only applied to actions that are expected to make requests with bodies: `createItem` and `updateItem`.

It accepts an item's `values` and is expected to return a JSON-serializeable object to form the body of the request.

Example:

```javascript
import { resources } from 'redux-and-the-rest';

/**
 * Define a users resource
 */
const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getList } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
    },
    {
        fetchList: {
          requestAdaptor: (values) => {
            return { user: values };   
          }   
        }     
    }
);
```
 
 
#### Pagination

For situations where you want to include query parameters that do not change the destination list in the store (i.e. the list returned by the server should be merged into values that are already in the store, rather than replacing them), you can use the `urlOnlyParams` option. This is especially useful for pagination.

For example, if you define a resource using the following actions:

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, actionCreators: { fetchList: fetchUsers } } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        urlOnlyParams: [ 'page']
    },
    [ 'fetchList' ]
);
```

Then calling `fetchUsers({ order: 'newest', page: 1 }, { metadata: { page: 1 } })` will load the first page of results in `store.getState().users.lists['newest']` and calling `fetchUsers({ order: 'newest', { metadata: { page: 1 } })` will add the second page of users to the end of the same list.

We provide the metadata argument to store what page we are currently on, so it does not have to be retained outside of the Redux store. It can be accessed like so:

```javascript
import { getUsers } from './resources/users';    

const mapStateToProps = ({ users } ) => {
  const usersList = getUsers(users);
 
  return {
    user: usersList,
    currentPage: usersList.metadata.page // Current page is available on the list's metadata
  }
};

// ...
```  

The `status.itemsInLastResponse` attribute on each list can be used to indicate when there are no more pages of results available (when it is less than the total page size, you have reached the last page).

### Working with Authenticated APIs

#### Auth tokens as headers

If you're working with an API that uses authentication tokens transmitted as headers, you need to authenticate the user to get access to the token (possibly even through redux-and-the-rest itself) and then use the `request` options for global configuration when the token is available. 

```javascript
import { configure } from 'redux-and-the-rest';

// Once you have your token

configure({
  request: {
    headers: {
      'Authorization': `Token token="${token}"`
    }
  }
});
```      

You may need to merge with any existing request options you have already configured.

#### Auth tokens as query parameters

APIs that use query parameters to communicate authentication tokens are not explicitly supported (there is no global configuration option you can specify that will apply to all subsequent requests).

However, you can define a global constant in your own code and pass it to each action creator that needs to be authenticated (all non-key values passed to the first argument of an action creator are converted to query parameters).

```javascript 
const AUTHENTICATION_PARAMS = {
  auth: 'MY-TOKEN'
}

fetchUser({ id: 1, ...AUTHENTICATION_PARAMS }) 
```

#### Session cookies

If you're working with an API that uses session cookies, you simply need to have the user sign in so their cookie is correctly populated before calling any of the action creators that make requests of authenticated endpoints, and use the `credentials` option to global configuration, resource options or action options depending on the scope of requests you need to send the cookie with. 

Accepted values are 'include', 'omit' or 'same-origin' - [see for more details](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Sending_a_request_with_credentials_included). 

### Configuring other request properties

All actions that perform an asynchronous request to a HTTP endpoint accept a `request` option in their final argument (in the [actionCreatorOptions](#levels-of-configuration)).

Most of the options are passed directly to `global.fetch()` when creating a new `Request` object (See [the Request API](https://developer.mozilla.org/en-US/docs/Web/API/Request) for a full list of these options).

There are also a few additional options used directly by `redux-and-the-rest` itself:

| Option | Type | Default | Description |
| :--- | :---: | :---: | :---- |
| `cookie` | string | '' | The value to set as the request's `Cookie` header. This is useful for performing requests to authenticated endpoints as part of initial render for server-side rendering. |
| `credentials` | string | undefined | Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the request only if it's on the same origin. |
| `errorHandler` | Function | `undefined` | A function to call if the request returns an error response (HTTP status > 400). This function must accept two arguments: the `Response` object and a callback that the `errorHandler` will call once it has finished executing, with a value representing the error(s) that will be placed in the store. This option is useful to "unwrap" error objects from error responses, or to standardise how errors are represented in Redux that come from different endpoints or servers. |

## Adapting responses

### Adapting success responses

All action controllers that make remote requests accept a `responseAdaptor` option (either as a global, resource or action option). This function is used to adapt responses from the server before they are passed to Redux (their output is routed through an internal action creator and used to generate an action object). This is useful if the remote API you're working with doesn't conform to the shape that `redux-and-the-rest` expects.

It accepts two input arguments:

* `responseBody` - The body of the request parsed as a JSON object.
* `response` - The HTTP Response object, if for whatever reason you need more information than the JSON response parameter provides.

It is expected to return a single object with a number of properties:

* `values` - (Required) For item action creators, this is an object of attributes that will form the list or item's `values` in the store. For list action creators, it is an array of values for each item.
* `error` - (Optional and Deprecated) error details extracted from the response body (if a singular error) as a string or object
* `errors` -  (Optional) The errors' details extracted from the response body, as an array of objects or strings
* `metadata` - (Optional) Additional metadata that should be stored with the list or item, but does not form part of its attributes. These values are (non-recursively) merged with the `metadata` that's already there, to allow compiling metadata of both values known at call time (when you call your action creator) and values know only when the response returns.

This adaptor is called for all requests with a HTTP status below 400. If you need to adapt requests with HTTP status above that, use the `request.errorHandler` option.

Example:

```javascript
import { resources } from 'redux-and-the-rest';

/**
 * Define a users resource
 */
const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getList } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
    },
    {
        fetchList: {
          responseAdaptor: ({ items, page, errors }) => {
            if (errors) {
              return { errors };
            }     
            
            return { values: items, metadata: { page } }
          }
        }     
    }
);
```

### Handling error responses

To handle error responses from the remote API, you can use the `request.errorHandler` option (as global, resource, action or actionCreator configuration).

This function is called whenever a response is received with an HTTP status of 400 or above.

It receives two arguments: the first is the HTTP `Response` object, and the second is a function to call when you are done handling or adapting the error, that expects two arguments:

* `errorOrErrors` - Either a single string or object describing the error, or an array of error strings or objects describing multiple errors. (The latter is the preferred option).
* `metadata` - Additional metadata that should be stored with the list or item, but does not form part of its attributes. These values are (non-recursively) merged with the `metadata` that's already there, to allow compiling metadata of both values known at call time (when you call your action creator) and values know only when the response returns.

A callback is provided because the methods on the `Response` object used for parsing the response are asynchronous.

You *must* call the callback function, otherwise the request will appear to `redux-and-the-rest` as if it never resolved.

Example:

```javascript
import { resources } from 'redux-and-the-rest';

/**
 * Define a users resource
 */
const { reducers: usersReducers, actionCreators: { fetchList: fetchUsers }, getList } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
    },
    {
        fetchList: {
          request: {
            errorHandler: (response, callback) => {
              if (response.status === 500) {
                callback([{ message: 'Unknown server error' }]);
              } else {
                response.text().then((message) => {
                   callback([{ message }]);
                });
              }
            }             
          } 
        }     
    }
);
```
