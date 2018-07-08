<p align="center">
  <img src="https://cdn.rawgit.com/greena13/redux-and-the-rest/f364d1e6/images/logo.png"><br/>
  <h2 align="center">Redux and the REST</h2>
</p>

Declarative, flexible Redux integration with RESTful APIs. https://github.com/greena13/redux-and-the-rest

## Stability and Maturity

`redux-and-the-rest` is still under active development and is likely to change its functionality and API in the next few releases.

This Readme is still being actively written.

## Feature overview

* **DRY:** All of the boilerplate code usually required to interface with Redux is abstracted away into a succinct DSL inspired by the Ruby on Rails framework.
* **Convention over configuration:** Sensible defaults are used, that can be overridden with custom behaviour.
* **Flexible:** All conventions can be overridden and extended beyond the set of RESTful actions.
* **Minimal:** You can choose which features to enable when you want to use them so there is little to no overhead or bloat beyond what you chose to use.
* **Fast:** It's quick to get up-and-running and easy to define new resources and actions in a couple of lines.
* **Plays well with others:** `redux-and-the-rest` does not care what version of Redux you use or how you have architected your app, and it allows you to gradually introduce it to your project alongside other Redux solutions.
* **Documented:** The API is minimal and expressive, and all options and common use cases are documented in full.
* **Tested:** `redux-and-the-rest` comes with a ever-growing test suite of over 650 tests.

## Basic usage

```javascript
import { resources } from 'redux-and-the-rest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

/**
 * Define a users resource
 */
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

/**
 * Pass the reducers to your store (the reducers for only one resource is used -
 * but normally you would have many)
 */
const store = createStore(combineReducers({ users: reducers }), {}, applyMiddleware(Thunk));

/**
 * Action to fetch the users from http://test.com/users/newest and make them
 * available in your store
 */
fetchUsers('newest');

/**
 * Retrieve the users from the store
 */
users = store.getState().users.collections.newest;
```

## Install & Setup

`redux-and-the-rest` can be installed as a CommonJS module:


```
npm install redux-and-the-rest --save
# OR
yarn add redux-and-the-rest
```

### Peer Dependencies

If you have already correctly installed `redux`, `redux-thunk`, some form of fetch polyfill (suggested: `isomorphic-fetch`), and (optionally) `react-redux`, then you can skip to the next section and dive right in.

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

You must then pass the middleware in as a parameter when you create your Redux store ([full instructions](https://github.com/reduxjs/redux-thunk#installation)):

```javascript
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

function buildStore(initialState, reducers) {
  return createStore(combineReducers(reducers), initialState, applyMiddleware(Thunk));
}

export default buildStore;
```

# Defining resources

Resources are defined with the `resources` function, which accepts two options hashes as arguments:

* `resourceOptions` - options that apply to all the resource's actions
* `actionOptions` - options that enable and configure individual actions (RESTful or not)

It returns an object containing Redux components necessary to use the resource you have just defined:

* `reducers` - an object of reducers that you can pass to Redux's `combineReducers` function.
* `actions` - an object of action constants where the keys are the generic action names (e.g. `index`) and the values are the specific action constants (e.g. `FETCH_USERS`)
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

### Defining resources

Values passed to `resourceOptions` are used to configure the resource and apply to all actions, unless overridden by more specific configuration in `actionOptions`:

| key |  Type |Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `name` | String | Required | The pluralized name of the resource you are defining.
| `url` | String |  Required | A url template that is used for all of the resource's actions. The template string can include required url parameters by prefixing them with a colon (e.g. `:id`) and optional parameters are denoted by adding a question mark at the end (e.g. `:id?`). This will be used as the default url template, but individual actions may override it with their own. |
| `keyBy` | String |  'id' | The resource attribute used to key/index all items of the current resource type. This will be the value you pass to each action creator to identify the target of each action. |
| `urlOnlyParams` | [ ] | String[] |The attributes passed to action creators that should be used to create the request URL, but ignored when storing the request's response.

### Configuring individual actions

The `actionOptions` is used to list the actions that should be defined for a particular resource and allow you to expand upon, or override, the configuration made in `resourceOptions`.

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

`actionOptions` accepts values of configuration objects with the following attributes:

| key | Type | Required or Default Value | Description |
| --------------------------------------- | :----: | :----: | :-- |
| `url` |  String |`resourceOptions.url` | The URL template to use for this particular action. |
| `keyBy` | String | `resourceOptions.keyBy` | The key to index all items on for this particular action. |
| `urlOnlyParams` | String[] | `resourceOptions.urlOnlyParams` | The attributes passed to the action creator that should be used to create the request URL, and ignored when storing the result in the store. |
| `reducer` | Function | RESTFUL actions: a sensible default; non-RESTFUL: Required | A custom reducer function to adapt the resource as it exists in the Redux store. By default, the standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful actions. |
| `progress` | Boolean |   false | Whether the store should emit progress events as the resource is uploaded or downloaded. This is applicable to the RESTful actions `index`, `show`, `create`, `update` and any custom actions. |
| `responseAdaptor` | Function | Identity function | Function used to adapt the response for a particular request before it is handed over to the reducers ||
| `beforeReducers` | Function[] | [ ] | A list of functions to call before passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional pre-processing to standardise the resource before it is added to the store. |
| `afterReducers` | Function[] | [ ] |A list of functions to call after passing the resource to the `reducer`. This is useful if you want to use the default reducer, but provide some additional post-processing to standardise the resource before it is added to the store. |
| `clearOn` | Action or Action[] | [ ] | A single or list of actions for which the current resource should be cleared. |
| `reducesOn` | {action: Action, reducer: function} | [ ] | A single or list of objects with an `action` and a `reducer`, used to specify custom reducers in response to actions external to the current resource. |
| `hasAndBelongsToMany` | {\[associationName\]: Resource } | { } | An object of associated resources, with a many-to-many relationship with the current one. |
| `belongsTo` | {\[associationName\]: Resource } | { } | An object of associated resources, with a one-to-many relationship with the current one. |

## RESTful (asynchronous) actions

The URL used to fetch a particular resource, and the data structure used to contain it in the Redux store, depend on two factors:

* The URL template set when you initialise your app, and
* The parameters passed to the resource's action creator when you call it.

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
| `fetchUsers` | #index | `GET http://test.com/users` |
| `fetchUser(1)` | #show | `GET http://test.com/users/1` |
| `createUser({name: 'foo'})` | #create | `POST http://test.com/users` |
| `updateUser(1, {name: 'foo'})` | #update | `PUT http://test.com/users/1` |
| `destroyUser(1)` | #destroy | `DELETE http://test.com/users/1` |

### Index

The index action fetches a list or collection of resources from a particular URL. It does not require a primary identifier and instead accepts parameters that may scope, filter or order the collection.

| Property | Description |
| :--- | :--- |
| Action name for defining with `actionOptions` | `index` |
| Action creator returned by `resources` | `fetch<PluralizedResourceName>()` |
| (Optional) First action creator argument | An object whose attributes are used to construct the URL from the url template and store the resulting collection under `collections`. |
| (Optional) Second action creator argument | An object of server-side rendering options. These are used when a page's data must be completely fetched in order to render the initinal HTML for the first page load and rehydrate the app on the client. |
| HTTP Request | `GET <urlTemplateWithSubstitutedValues>` |
| `status.type` lifecycle |  `FETCHING` -> `SUCCESS` or `ERROR` |

* Expects the server to respond with an array of resources
* Places the results in `collections` with a key serialized from the the filter parameters

### Show

* Sends a GET request to the server
* `show` action option
* Defines a `fetch<ResourceName>` action creator that accepts filter parameters
* Goes through a lifecycle of `FETCHING` -> `SUCCESS` or `ERROR`
* Expects the server to respond with an object of the resource's attributes

### Create

* Sends a POST request to the server to create the resource
* `create` action option
* returns a `create<ResourceName>` action creator that accepts the new resource's attributes
* Goes through lifecycle of `CREATING` -> `SUCCESS` or `ERROR`
* Expects the server to return the new resource after it's created
* Gives the resource a temporary id (which is available as `.newItemKey` attribute in the store) until one is returned by the server, then `.newItemKey` is updated to the value assigned by the server
* Accepts a third argument that lets you specify which collection to add it to - otherwise it's added to the default blank collection

### Update

* creates a `update<ResourceName>` action creator that sends a PUT request to the server to update the resource
* Lifecycle: `UPDATING` -> `SUCCESS` or `ERROR`

### Destroy

* returns a `destroy<ResourceName>` action creator
* Sends a DESTROY request to the server to destroy the resource
* Lifecycle of `DESTROYING` -> (removal from the store) or `DESTROY_ERROR`

## Local (synchronous) actions

On top of the RESTful actions that come with `redux-and-the-rest`, there are a number of extras that do not make any requests, but instead perform synchronous local changes to the store:

### new

* `new` action option
* returns a `new<ResourceName>` action creator that accepts an object of parameters
* adds a new resource to the store without sending a request to the server to create it - useful if you want to create the resource over serveral steps or screens before sending it to the server to be created with `create<ResourceName>`
* Also useful if you want to create a resource with default values for the user to add to before creating
* Accepts an optional argument to specify which collection to add the new resource to, otherwise it is added to the default collection


### clearNew

* creates a `clearNew<ResourceName>` action creator that clears a new resource that has not yet been saved to the server, from the store - useful when the user changes their mind and cancels creating a resource
* enabled using the `clearNew` action option
* does not make any requests to the server

### edit

* creates a `edit<ResourceName>` action creator that allows editing a resource locally and saving the changes in the store without sending them to the server
* Useful for moving between form pages to temporarily save progress without sending it to the server yet or displaying a confirmation page
* Lifecycle: `EDITING`


### select

* Useful when you only want to have one resource selected at once
* `select` action option
* Defines a `select<ResourceName>` action creator that accepts the id of the resource to add (as the only member) of the selection map

### selectAnother

* Useful for when you want to select multiple resources at once
* `selectAnother` action option
* Defines a `selectAnother<ResourceName>` action creator that accepts the id of the resource to add to the selection map

### deselect

* Allows marking a single selected resource as no longer selected

### clearSelected

* Clears all of the selected resources from the store

### URL Params

* Accepts an object or a string
* If you have more than one url parameter - you need to use an object
* Serialized in a consistent manner - helper method provided
* Can be passed to any of the action creator functions and will ethier form part of the url used, or query parameters

#### Using string values

If a string value is passed to an action, it will assumed to be value of the first url parameter.

For example, calling `fetchUsers('newest')` will make a request to:

```
http://test.com/users/newest
```

and make the resulting collection of items received from that url available as:

```javascript
store.getState().users.collections['newest'];
```

#### Using object values

If an object is passed to an action, the value corresponding to the key matching the name of the URL parameter will be substituted into the URL.

Identical to the above, calling `fetchUsers({ id: 'newest' })` will make a request to:

```
http://test.com/users/newest
```

and make the resulting collection of items received from that url available as:

```javascript
store.getState().users.collections['newest'];
```

If there are other values present in the object, these are serialized and used as query parameters:

For example, calling `fetchUsers({ id: 'newest', page: 1 })` will make a request to:

```
http://test.com/users/newest?page=1
```

and make the resulting collection of items received from that url available as:

```javascript
store.getState().users.collections['id=newest.page=1'];
```

* If object used that doesn't specify matching param name, all values are used as query parameters
* Can use the `urlOnlyParams` to specify attributes in the object that should only be used in the url - useful for page numbers - subsequent calls to later pages will be placed in the same collection

### Overriding default URLs

* Can provide a `url` option when you are defining an action ad that will be used instead

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

# Server Side Rendering

## What is Server Side Rendering?

Many modern single-page apps respond to the first page request from a browser by:

* Fetching all of the data necessary to render that page, from various different sources
* (Waiting for all of that data to arrive)
* Using that data to generate the HTML to satisfy that initial request
* Saving the retrieved data in a serialised format and attaching it to that HTML (e.g., in a <script /> tag)
* And sending the response containing the correct HTML, the serialised data, and instructions on how to "rehydrate" the application once it arrives on the client (by parsing the data and using it to initialise the SPA to the same state that matches the HTML in the response).

This is known as server-side rendering. If this doesn't sound familiar, than this article probably does not apply to your situation.

## redux-and-the-rest's support for SSR

`redux-and-the-rest` relies on a peer dependency of `isomorphic-fetch` to make its requests, so it will work both in the browser and in node.js environments.

All action creators that perform asynchronous GET requests accept a hash of options as their last argument that help with making the requests to generate the correct HTML on the server.

The RESTful action creators are:

* fetch<PluralizedResourceName>()
* fetch<SingularResourceName>()

These are the recognised options:

*
