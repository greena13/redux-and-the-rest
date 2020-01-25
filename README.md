<p align="center">
  <img src="https://cdn.rawgit.com/greena13/redux-and-the-rest/f364d1e6/images/logo.png"><br/>
  <h2 align="center">Redux and the REST</h2>
</p>

Declarative, flexible Redux integration with RESTful APIs.

## Stability and Maturity

`redux-and-the-rest` is still under active development and is likely to change its functionality and API in the next few releases.

This Readme is still being actively written.

## Feature overview

* **DRY:** All of the boilerplate code usually required to use Redux is abstracted away into a succinct DSL inspired by the Ruby on Rails framework.
* **Convention over configuration:** A sensible set of configurations are used by default, but you can override them with custom behaviour whenever you need.
* **Flexible:** All RESTful conventions can be overridden and extended when you need to deviate or add to the standard CRUD functionality.
* **Minimal:** You can choose which features to enable, when you want to use them, so there is no unnecessary overhead or bloat.
* **Quick to get started:** It's quick to get up-and-running and easy to define new resources and actions in a few  lines.
* **Plays well with others:** `redux-and-the-rest` does not care what version of Redux you use or how you have architected your app, and it allows you to gradually introduce it to your project alongside other Redux solutions.
* **Documented:** The API is minimal and expressive, and all options and common use cases are documented in full.
* **Tested:** `redux-and-the-rest` comes with an extensive test suite.

## Basic usage

```javascript
import { resources } from 'redux-and-the-rest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

/**
 * Define a users resource
 */
const { reducers: usersReducers, fetchUsers, getCollection } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);

/**
 * Pass the reducers to your store (the reducers for only one resource is used -
 * normally you would have many)
 */
const store = createStore(combineReducers({ users: usersReducers }), {}, applyMiddleware(Thunk));

/**
 * Action to fetch the users from http://test.com/users/newest and make them
 * available in your store
 */
fetchUsers();

/**
 * Retrieve the users from the store
 */
users = getCollection(store.getState().users);
```

## Install & Setup

`redux-and-the-rest` can be installed as a CommonJS module:


```
npm install redux-and-the-rest --save
# OR
yarn add redux-and-the-rest
```

### Peer Dependencies

If you have already installed `redux`; `redux-thunk`; some form of fetch polyfill (suggested: `isomorphic-fetch`); and (optionally) `react-redux`, then you can skip to the next section and dive right in.

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

You must then pass the middleware in as a parameter when you create your Redux store ([full instructions](https://github.com/reduxjs/redux-thunk#installation)):

```javascript
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

function buildStore(initialState, reducers) {
  return createStore(combineReducers(reducers), initialState, applyMiddleware(Thunk));
}

export default buildStore;
```

If you are using React, then you will also need the `react-redux` bindings ([full instructions](https://github.com/reduxjs/react-redux)):

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

Resources are defined with the `resources` function, which accepts two options hashes as arguments:

* `resourceOptions` - options that apply to all of a resource's actions
* `actionOptions` - options that configure individual actions (RESTful or not)

It returns an object containing Redux components necessary to use the resource you have just defined:

* `reducers` - an object of reducers that you can pass to Redux's `combineReducers` function.
* `actions` - an object of action constants where the keys are the generic action names and the values are the specific action constants (e.g. `{ index: 'FETCH_USERS' }`)
* `getCollection` - a helper function for retrieving a collection based on its key parameters
* `getItem` - a helper function for retrieving an item based on its key parameters
* `getNewItem` - a helper function for retrieving the item currently being created
* Action creators - these are the functions you call to trigger your store's actions and are defined if you enabled them in `actionOptions` (e.g. `fetchUsers`).

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);
```

### Configuring individual actions

`actionOptions` lists the actions that are defined for a particular resource and allow you to expand upon, or override, the configuration made in `resourceOptions`.

`actionOptions` should be an either:

* An object with action names as keys and configuration objects as values or
* An array of RESTful action names as strings

#### Using the default RESTful action configuration

If you want to use the default configuration for a particular action, you just need to pass a value of `true`, for example:

```javascript
const { fetchUsers } = resources(
    {
        // ...
    },
    { index: true }
);
```

You can also pass an array of RESTful actions for which you want to use the default configuration:

```javascript
const { fetchUsers } = resources(
    {
        // ...
    },
    [ 'index' ]
);
```

#### Providing custom action configuration

You can override or extend the default configuration for an action using an options hash instead of `true` when defining your actions:

```javascript
const { fetchUsers } = resources(
    {
        // ...
    },
    {
        index:  {
            // action options
        }
    }
);
```

Please see [Action Options API](#action-options-api) for a full list of supported options.

## Store data


### Getting resources from the store

Where resources are located in your Redux store depend on how you pass the `reducers` returned by the `resources()` function to Redux.

For example, assuming you have defined a users resource like this:

```javascript
const { reducers: usersReducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);
```

Passing the reducers to Redux like the following:

```javascript
const store = createStore(combineReducers({ users: usersReducers }), {}, applyMiddleware(Thunk));
```

Will mean that the users resource will be located at:

```javascript
store.getState().users;
```

Or if you are using Redux's React bindings:

```javascript
import { connect } from 'react-redux';

function mapStateToProps({ users }) {
  return { users };
}

function mapDispatchToProps(dispatch) {
  return {
    //...
  };
}

const MyComponentContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(MyComponent);
```

Similarly, if you passed it like so:

```javascript
const store = createStore(combineReducers({ guests: usersReducers }), {}, applyMiddleware(Thunk));
```

Then you could get the resource with:

```javascript
store.getState().guests;
```

#### Getting items from the store

To get an item from a resource, you use the `getItem()` function returned by `resources()`.

It will return an [empty item](#item-schema) (instead of `undefined`) if one with the corresponding key does not exist in the store.

```javascript
import { serializeKey, ITEM } from `redux-and-the-rest`;
import { connect } from 'react-redux';

const { reducers: usersReducers, fetchUsers, getItem } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        show: true
    }
);

function mapStateToProps({ users }, { params: { id } }) {
  return getItem(users, { id });
}
```

#### Getting collections from the store

To get a collection from a resource, you use the `getCollection()` function returned by `resources()`.

It will return an [empty collection](#collection-schema) (instead of `undefined`) if one with the corresponding key does not exist in the store.

```javascript
import { serializeKey, COLLECTION } from `redux-and-the-rest`;
import { connect } from 'react-redux';

const { reducers: usersReducers, fetchUsers, getCollection } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);

function mapStateToProps({ users: usersResource }, { params: { order } }) {
  return getCollection(usersResource, { order });
}
```

### Data lifecycle

`redux-and-the-rest` uses the `status.type` attribute of collections and items to indicate what state they are currently in.

To check an item or collection's state, you only have to inspect it's `status.type` attribute and compare it to one of the constants that are exported by the package:

```javascript
import React from 'react';
import { ERROR, SUCCESS } from 'redux-and-the-rest';

class MyComponent extends Component {
    render() {
        const { status: { type } } = this.props;

        if (status === SUCCESS) {
            // item is loaded and ready to display
        } else if (status === ERROR) {
           // display error message
        } else {
           // display preloader
        }
    }
}
```

#### Client statuses

These statuses are useful for creating behaviour specific to new or changed items, such as displaying warning messages if the user attempts to navigate away without saving:

* `NEW`: When a new item is being created on the client, but has not yet been sent to the server.
* `EDITING`: When an existing item is being updated but has not yet been saved to the server.

#### Pending statuses

Checking for these statuses is generally useful for displaying loaders or progress indicators:

* `FETCHING`: When an item or collection is being fetched from the server but it has not yet arrived.
* `CREATING`: When the request to create a new item has been sent to the server, but the response has not yet arrived.
* `UPDATING`: When the request to save the changes to an existing item have been sent to the server, but the response has not yet arrived.
* `DESTROYING`: When the request to destroy an existing item has been sent to the server, but the response has not yet arrived.
* `PROGRESS`: When progress updates are enabled, this status occurs while an upload or download request is taking place. You can check `status.progressUp` (for the upload request progress) and `status.progressDown` (for the download response progress).

#### Response statuses

Checking for these statuses is useful for displaying success or error messages:

* `SUCCESS`: When the response to the a request to fetch collection or an item has arrived and it was a success. You can now use the contents of the collection or item.
* `ERROR`: When the response to the a request to fetch collection or an item has arrived and it was an error. You should now check the `status.error` attribute for details.
* `DESTROY_ERROR`: When the response to the request to destroy an existing item has arrived, and it's an error. You should now check the `status.error` attribute for details.

#### Knowing when to call your action creators

You can tell when no attempt to fetch a resource has been made yet, because `status.type` is `null`. You can use this to decide when to call your action creators:

```javascript
import React from 'react';

class UserIndexPage extends Component {
    componentWillMount() {
        const { status: { type }, fetchUsers } = this.props;

        if (!type) {
          fetchUsers();
        }
    }
}
```

The same applies for initialising new resources:

```javascript
import React from 'react';
import { NEW } from 'redux-and-the-rest';

class NewUserPage extends Component {
    componentWillMount() {
        const { status: { type }, newUser } = this.props;

        if (!type) {
          newUser(Date.now(), {});
        }
    }

    render() {
        const { status: { type } } = this.props;

        if (status === NEW) {
            // Display new user form
        } else {
           // display preloader
        }
    }
}
```

## RESTful (asynchronous) actions

### RESTful behaviour overview

Given the following resource definition:

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    [
        'index', 'show', 'create', 'update', 'destroy'
    ]
);
```

`redux-and-the-rest` will define the following action creators, that when called, will perform the standard HTTP RESTful requests:

| Action creator | RESTful action | HTTP Request |
| ---- | :--- | :--- |
| `fetchUsers()` | #index | `GET http://test.com/users` |
| `fetchUser(1)` | #show | `GET http://test.com/users/1` |
| `createUser('tempId', {name: 'foo'})` | #create | `POST http://test.com/users` |
| `updateUser(1, {name: 'foo'})` | #update | `PUT http://test.com/users/1` |
| `destroyUser(1)` | #destroy | `DELETE http://test.com/users/1` |

### Fetch a resource collection from the server

The index action fetches a list or collection of resources from a particular URL. It does not require a primary identifier and instead accepts parameters that may scope, filter or order the collection.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `index` |
| Action creator name | `fetch<PluralizedResourceName>()` |
| First action creator argument | (Optional) `keys` - See [Getting collections from the store](#getting-collections-from-the-store) and [Configuring the URLs used for a request](configuring-the-urls-used-for-a-request) for more information.|
| Second action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `FETCHING` -> (`SUCCESS` \| `ERROR`) |


#### Index action creator options

The index action creator supports the following options as its second argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the collection. |

When the collection is successfully fetched, the default index reducer expects the server to respond with a JSON object containing an array of resource items' attributes. If the request rails, it expects the server to respond with a JSON object containing an error.

### Fetch an individual resource item from the server

The show action creator fetches an individual resource item from the server and adds it in the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `show` |
| Action creator name | `fetch<SingularizedResourceName>()` |
| First action creator argument | `keys` - See [Getting collections from the store](#getting-collections-from-the-store) and [Configuring the URLs used for a request](configuring-the-urls-used-for-a-request) for more information. |
| Second action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `FETCHING` -> (`SUCCESS` \| `ERROR`) |

#### Show action creator options

The show action creator supports the following options as its second argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `request` | Object | { } | An object that [configures the HTTP request](#configuring-other-request-properties) made to fetch the item. |

When the resource item is successfully fetched, the default show reducer expects the server to respond with a JSON object containing resource's attributes. If the request rails, it expects the server to respond with a JSON object containing an error.

### Create a new resource item on the server

The create action creator saves a new resource item to the server, with a set of specified attributes and adds it to the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `create` |
| Action creator name | `create<SingularizedResourceName>()` |
| First action creator argument | `keys` - The temporary id to use to store the new resource in the store until a permanent id has been assigned by the server. This temporary id is available as `newItemKey` on the resource, until a new one is returned by the server, and then `newItemKey` is updated to the value assigned by the server.|
| Second action creator argument | Resource item's attributes - An object of attributes to save to the server |
| Third action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `CREATING` -> (`SUCCESS` \| `ERROR`) |

#### Create action creator options

The create action creator supports the following options as its third argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `push` | Array | [ ] | An array of collection keys to push the new resource item to the end of. |
| `unshift` | Array | [ ] | An array of collection keys to add the new resource item to the beginning of. |
| `invalidate` | Array | [ ] | An array of collection keys for which to clear (invalidate). This is useful for when you know the resource item that was just created is likely to appear in a collection, but you don't know where so you need to re-retrieve the whole collection from the server. |

When the resource item is successfully created, the default create reducer expects the server to respond with a JSON object containing resource's attributes. If the request rails, it expects the server to respond with a JSON object containing an error.

### Update a resource item on the server

The update action creator updates an existing resource item's attributes with a set of new values by saving them to the server, and updating the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `update` |
| Action creator name | `update<SingularizedResourceName>()` |
| First action creator argument | `keys` - The keys that point to the resource item to update. |
| Second action creator argument | The resource item's new attributes - An object of attributes to save to the server. |
| Third action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `UPDATING` -> (`SUCCESS` \| `ERROR`) |

#### Update action creator options

The update action creator supports the following options as its third argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `previous` | Object | undefined | The previous values, before the update. This is used to more efficiently update associations defined with `belongsTo` or `hasAndBelongsToMany`, but otherwise is generally not used. |

When the resource item is successfully updated, the default update reducer expects the server to respond with a JSON object containing resource's attributes. If the request rails, it expects the server to respond with a JSON object containing an error.

### Destroy a resource item on the server

The destroy action creator deletes an existing resource item from the server and then removes it from the store.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `destroy` |
| Action creator name | `destroy<SingularizedResourceName>()` |
| First action creator argument | `keys` - The keys that point to the resource item to destroy. |
| Second action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `DESTROYING` -> (`SUCCESS` \| `DESTROY_ERROR`) |

#### Destroy action creator options

The destroy action creator supports the following options as its second argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `previous` | Object | undefined | The previous values, before it was destroyed. This is used to more efficiently update associations defined with `belongsTo` or `hasAndBelongsToMany`, but otherwise is generally not used. |

When the resource item is successfully destroyed, the default destroy reducer expects the server to respond a with a success response. If the request rails, it expects the server to respond with a JSON object containing an error.

## Local (synchronous) actions

On top of the RESTful action creators that come with `redux-and-the-rest`, there are a number of extras that do not make any requests, but instead perform synchronous local changes to the store.

### Add a new resource item to the store

The new action creator creates a new resource item and adds it to the store, without sending any requests to the server. This is useful when you want to create a particular resource item over several pages or steps, before sending it to the server to be saved.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `new` |
| Action creator name | `new<SingularizedResourceName>()` |
| First action creator argument | `keys` - The temporary id to use to store the new resource in the store until a permanent id has been assigned by the server. This temporary id is available as `newItemKey` on the resource. |
| Second action creator argument | Resource item's attributes - An object of attributes to save as a new resource item in the store. |
| Third action creator argument | (Optional) `actionCreatorOptions` - Options that configure how the request behaves - see below. |
| `status.type` lifecycle |  `NEW` |

#### New action creator options

The new action creator supports the following options as its third argument:

| actionCreatorOptions | Type | Default value or required | Description |
| :--- | :---: | :---: | :--- |
| `push` | Array | [ ] | An array of collection keys to push the new resource item to the end of. |
| `unshift` | Array | [ ] | An array of collection keys to add the new resource item to the beginning of. |
| `invalidate` | Array | [ ] | An array of collection keys for which to clear (invalidate). This is useful for when you know the resource item that was just created is likely to appear in a collection, but you don't know where, so you need to re-retrieve the whole collection from the server. |

### Clear the new resource item from the store

The clearNew action creator deletes the resource item pointed to by `newItemKey` if it has a status of `NEW`, and sets the `newItemKey` to `null`.

This is useful when the user wishes to cancel or navigate away from creating a new resource.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `new` |
| Action creator name | `new<SingularizedResourceName>()` |

### Edit a resource item in the store

The edit action creator updates a resource item in the store with new values, without sending any requests to the server.

This is useful when you want to edit a particular resource item over several pages or steps, before saving it to the server.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `edit` |
| Action creator name | `edit<SingularizedResourceName>()` |
| First action creator argument | `keys` - See [Getting collections from the store](#getting-collections-from-the-store) for more information. |
| Second action creator argument | Resource item's attributes - An object of attributes to save as the resource item's new values in the store. |
| `status.type` lifecycle |  `EDITING` |


### Select a resource item in the store

The select action creator adds an item's key to the `selectionMap` dictionary. It ensures that it is the only resource item (and overrides any previous values).

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `select` |
| Action creator name | `select<SingularizedResourceName>()` |
| First action creator argument | `keys` - See [Getting collections from the store](#getting-collections-from-the-store) for more information. |

### Select another resource item in the store

The selectAnother action creator adds an item's key to the `selectionMap` dictionary, while persisting any items' keys that have already been selected.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `selectAnother` |
| Action creator name | `selectAnother<SingularizedResourceName>()` |
| First action creator argument | `keys` - See [Getting collections from the store](#getting-collections-from-the-store) for more information. |

### Deselect a resource item in the store

The deselect action creator removes an item's key from the `selectionMap` dictionary, if appears in there.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `deselect` |
| Action creator name | `deselect<SingularizedResourceName>()` |
| First action creator argument | `keys` - See [Getting collections from the store](#getting-collections-from-the-store) for more information. |

### Clear all the selected resource items in the store

The clearSelected action creator clears the `selectionMap` dictionary, resetting it to an empty object.

| Property | Value |
| :--- | :--- |
| Action name for defining with `actionOptions` | `clearSelected` |
| Action creator name | `clearSelected<SingularizedResourceName>()` |
| First action creator argument | `keys` - See [Getting collections from the store](#getting-collections-from-the-store) for more information. |

## Configuring requests

### Configuring the URLs used for a request

The default template URL for a resource is set in [resourceOptions](#resource-options-api). RESTful actions use this template by selecting the convention request type for the operation (`GET`, `POST`, `PUT`, `DESTROY`) and populating the parameter templates where appropriate.

However, you can override this default for individual actions using the `url` option for [actionOptions](#action-options-api):

```javascript
const { fetchUser } = resources(
{
    name: 'users',
    url: 'http://test.com/users/:id?',
    keyBy: 'id'
}, {
    index: true,
    show: {
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

const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    [ 'index' ]
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

#### Pagination

For situations where you want to include query parameters that do not change the destination collection in the store (i.e. the collection returned by the server should be merged into values that are already in the store, rather than replacing them), you can use the `urlOnlyParams` option. This is especially useful for pagination.

For example, if you define a resource using the following actions:

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        urlOnlyParams: [ 'page']
    },
    [ 'index' ]
);
```

Then calling `fetchUsers({ order: 'newest', page: 1 })` will load the first page of results in `store.getState().users.collections['newest']` and calling `fetchUsers({ order: 'newest', page: 2 })` will add the second page of users to the end of the same collection.

### Configuring other request properties

All actions that perform an asynchronous request to a HTTP endpoint accept a `request` option in their final argument (in the [actionCreatorOptions](#levels-of-configuration)).

Most of the options are passed directly to `global.fetch()` when creating a new `Request` object (See [the Request API](https://developer.mozilla.org/en-US/docs/Web/API/Request) for a full list of these options).

There are also a few additional options used directly by `redux-and-the-rest` itself:

| Option | Type | Default | Description |
| :--- | :---: | :---: | :---- |
| `cookie` | String | '' | The value to set as the request's `Cookie` header. This is useful for performing requests to authenticated endpoints as part of initial render for server-side rendering. |
| `credentials` | Boolean | `false` | Similar to the `cookie` option, when set to `true`,  `credentials` sends the cookies set in the browser in the request's `Cookie` header(s). This option should won't work for SSR (as there is no browser cookie jar to pull the cookies from) - you will need to use `cookie` instead. |
| `errorHandler` | Function | `undefined` | A function to call if the request returns an error response (HTTP status > 400). This function must accept two arguments: the `Response` object and a callback that the `errorHandler` will call once it has finished executing, with a value representing the error that will be placed in the store. This option is useful to "unwrap" error objects from error responses, or to standardise how errors are represented in Redux that come from different endpoints or servers. |

## API Reference

### Levels of configuration

It's important to have a basic understanding of `redux-and-the-rest` achieves its flexibility using its four levels of configuration; each have different scopes and are specified at different times.

You need to select where you place your configuration depending on how wide you want particular options to apply.

The options are set out in a hierarchy, so as their scope becomes increasingly specific, their priority increases and they override any corresponding action that may have been provided to a lower priority set of options.

For example, `actionCreatorOptions` take precedence over `actionOptions` (which take precedence over `resourceOptions`).


| Options | Priority | Defined | Scope | Required |
| ---- | :---- | :---- | :-- | :--: |
| `globalOptions` | Lowest | Before defining any resources, using `configure()` | All resources and their actions | No |
| `resourceOptions` |  | When defining resources, using `resources()` | All of a single resource's actions | Yes |
| `actionOptions` |  | When defining resources, using `resources()` | A single resource action | No |
| `actionCreatorOptions` | Highest | When calling an action creator, as the last argument | A single store operation | No |

Here is an example of them used all in once place:

```javascript
import { configure, resources } from 'redux-and-the-rest';

configure({
    // globalOptions
    // ...
});

const { fetchUsers } = resources(
    {
        // resourceOptions
        name: 'users',
        url: 'http://www.example.com/users/:id',
        keyBy: 'id'
    },
    {
        index: {
            // actionOptions
            // ...
        },
        show: {
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

| key |  Type |Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |

### Resource Options API

Values passed to `resourceOptions` are used to configure the resource and apply to all actions, unless overridden by more specific configuration in `actionOptions`.

#### Usage

```javascript
import { resources } from 'redux-and-the-rest';

const { fetchUsers } = resources(
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

| key |  Type |Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `name` | String | Required | The pluralized name of the resource you are defining.
| `keyBy` | String |  'id' | The resource attribute used to key/index all items of the current resource type. This will be the value you pass to each action creator to identify the target of each action. |

##### Synchronising with a remote API

| key |  Type |Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `localOnly` | Boolean | false | Set to true for resources that should be edited locally, only. The `show` and `index` actions are disabled (the `fetch*` action creators are not exported) and the `create`, `update` and `destroy` only update the store locally, without making any HTTP requests. |
| `url` | String |  Required | A url template that is used for all of the resource's actions. The template string can include required url parameters by prefixing them with a colon (e.g. `:id`) and optional parameters are denoted by adding a question mark at the end (e.g. `:id?`). This will be used as the default url template, but individual actions may override it with their own. |
| `urlOnlyParams` | String[] | [ ] | The attributes passed to action creators that should be used to create the request URL, but ignored when storing the request's response. |
| `responseAdaptor` | Function | Identity function | Function used to adapt the response for a particular request before it is handed over to the reducers ||

##### Reducers

| key |  Type |Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `beforeReducers` | Function[] | [ ] | A list of functions to call before passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional pre-processing to standardise the resource before it is added to the store. |
| `afterReducers` | Function[] | [ ] |A list of functions to call after passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional post-processing to standardise the resource before it is added to the store. |
| `reducesOn` | {action: Action, reducer: function} | [ ] | A single or list of objects with an `action` and a `reducer`, used to specify custom reducers in response to actions external to the current resource. |
| `clearOn` | Action or Action[] | [ ] | A single or list of actions for which the current resource should be cleared. |
| `hasAndBelongsToMany` | {\[associationName\]: Resource } | { } | An object of associated resources, with a many-to-many relationship with the current one. |
| `belongsTo` | {\[associationName\]: Resource } | { } | An object of associated resources, with a one-to-many relationship with the current one. |

### Action Options API

`actionOptions` are used to configure individual resource actions and override any options specified in `globalOptions` or `resourceOptions`. They are the most specific level of options available at the time that resources are defined and can only be superseded by options provided to action creators when they are called.

#### Usage

```javascript
import { resources } from 'redux-and-the-rest';

const { fetchUsers } = resources(
    {
        // ...
    },
    {
        index: {
            // actionOptions
        },
        show: {
            // actionOptions
        }
    }
);
```

#### Options

##### Naming and indexing

| key | Type | Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `keyBy` | String | `resourceOptions.keyBy` | The key to index all items on for this particular action. |

##### Synchronising with a remote API

| key | Type | Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `url` |  String |`resourceOptions.url` | The URL template to use for this particular action. |
| `urlOnlyParams` | String[] | `resourceOptions.urlOnlyParams` | The attributes passed to the action creator that should be used to create the request URL, and ignored when storing the result in the store. |
| `responseAdaptor` | Function | Identity function | Function used to adapt the response for a particular request before it is handed over to the reducers ||
| `progress` | Boolean |   false | Whether the store should emit progress events as the resource is uploaded or downloaded. This is applicable to the RESTful actions `index`, `show`, `create`, `update` and any custom actions. |

##### Reducers

| key | Type | Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `reducer` | Function | RESTFUL actions: a sensible default; non-RESTFUL: Required | A custom reducer function to adapt the resource as it exists in the Redux store. By default, the standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful actions. |
| `beforeReducers` | Function[] | [ ] | A list of functions to call before passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional pre-processing to standardise the resource before it is added to the store. |
| `afterReducers` | Function[] | [ ] |A list of functions to call after passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional post-processing to standardise the resource before it is added to the store. |


## Store data schemas

### Nomenclature

It is helpful to first clarify some of the terms used in the next few sections:

* **Resource:** A *type of thing* that is available in your application and you can view or perform actions on. Examples of resources are "users", "posts" or "comments".
* **Collection:** An ordered list of items of a particular resource. This is generally what is returned from an RESTful index server endpoint. They can be ordered, scoped or filtered. Examples include "the newest users", "the most popular posts", or simply "comments" (collections don't have to have an explicit order - but one will be implied by how they are listed in a server's response).
* **Item:** Individual resource objects, that can belong to collections or can exist as individual entities. They always have a unique primary id, or key that identifies them. For example "user with ID 123" or "post with ID 7".

### Resource schema

All resources defined with the `resources()` function, return a `reducers` object that initialises and maintains the same data schema. This means you can easily reason about each of your resources and there is very little overhead to defining a new resource.

#### Top level schema

The top-level schema looks like the following, before it any data is added to your store:

```javascript
{
    items: {},
    collections: {},
    selectionMap: {},
    newItemKey: null
}
```

We will now explore each one:
* `items` - A map of item keys to item objects, from all of the collections currently in the store. This means that collections with a large amount of overlap (i.e. they share many of the same items) only store one copy of each item.
* `collections` - A map of collections, keyed by their parameters. This allows you to have many collections of the same resource all in the one place (e.g. "newest", "most popular"), without having to re-fetch them if the user moves back and forth between them.
* `selectionMap` - A dictionary of item keys, representing which of the resources are currently selected in your application (if any). Because it is a map, it is easy to query if any one particular item is currently selected or not, in constant time.
* `newItemKey` - A value that keeps track of the key assigned to the latest item that was created of this particular resource. This is useful when you are creating a new item with a temporary id (say the current time) and you need to know the new ID the server has assigned it once it has been successfully created there, so you can move from the temporary id to the new server-assigned Id.

#### Item schema

A blank item has the following schema:

```javascript
{
  values: {},
  status: { type: null },
};
```

* `values`: This is where all of the item's attributes are stored.
* `status`: This is where status information is stored, separate from the item's attributes. This allows the `values` to remain pure - so if you are editing an item, all you need to do is send the new `values` back to the server, without having to worry about any irrelevant attributes being mixed in.

#### Collection schema

A blank collection has the following schema:

```javascript
{
  positions: [],
  status: { type: null },
};
```

* `positions`: This is an array of keys of the items that exist in the collection. It stores the order of the items separate from the items themselves, so the items may be efficiently stored (without any duplicates) when we have multiple collections that may share them. It also means that we may update individual item's values, without having to alter all of the collections they are a part of.
* `status`: This is where status information is stored for the entire collection.
