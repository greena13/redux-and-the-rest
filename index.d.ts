import { RequestInit, RequestCredentials } from 'whatwg-fetch';
import { AnyAction, Reducer, ReducersMapObject } from 'redux';
import { ThunkAction } from 'redux-thunk'

/**
 * The status used when a new resource item has not yet been saved to an external API
 */
export const NEW: string;

/**
 * The status used when a resource item is being edited
 */
export const EDITING: string;

/**
 * The status used when a resource item or collection is being synchronised with an external API
 */
export const FETCHING: string;

/**
 * The status used when a new resource item is being saved to an external API for the first time
 */
export const CREATING: string;

/**
 * The status used when an edited resource item is being saved to an external API
 */
export const UPDATING: string;

/**
 * The status used when a resource item is being deleted on an external API
 */
export const DESTROYING: string;

/**
 * The status used when a resource item failed to be deleted from an external API
 */
export const DESTROY_ERROR: string;

/**
 * The status used when a resource item or collection has been successfully synchronised with an external API
 */
export const SUCCESS: string;

/**
 * The status used when a resource item or collection has is being uploaded or downloaded from an external API
 */
export const PROGRESS: string;

/**
 * The status used when a resource item or collection failed to synchronise with an external API
 */
export const ERROR: string;

/**
 * The projection type used when all of the attributes of of a resource are included
 */
export const COMPLETE: string;

/**
 * The projection type used when only the attributes necessary for a preview are included
 */
export const PREVIEW: string;

/**
 * The error type when a client error has occurred when making a request. This can be a local JavaScript
 * exception, or it can be a network timeout or disconnect.
 */
export const CLIENT_ERROR: string;

/**
 * One of the statuses a resource item or resource collection can be in
 */
export type StatusType = string;

interface ErrorStatusRequired {
    /**
     * The type of the error as either CLIENT_ERROR or specified in the response body or error handler
     */
    type: string,

    /**
     * When the error occurred
     */
    occurredAt: number,

    /**
     * The raw Error class when a client-side error occurs
     */
    raw?: Error
}

/**
 * Information about a request error
 */
export interface ErrorStatus extends ErrorStatusRequired {
    [extraValues: string]: any
}

export interface ResourceStatusRequired {
    /**
     * The type of status of the resource item or collection
     */
    type: StatusType | null;
}

/**
 * An object containing the status information of a particular resource item or resource collection.
 */
export interface ResourceStatus extends ResourceStatusRequired {
    /**
     * The HTTP status code when an error occurs
     */
    httpCode?: number,

    /**
     * Details of the error, if status type is ERROR
     */
    error?: ErrorStatus,

    /**
     * When a request to fetch, create or update the resource item or collection was last made to an external
     * API
     */
    requestedAt: number,

    /**
     * When a response to fetch, create or update the resource item or collection was last received from an
     * external API
     */
    syncedAt: number
}

interface ProjectionRequired {
    type: string
}

/**
 * Information about the type of projection the resource item or collection represents
 */
export interface Projection extends ProjectionRequired {
    [extraValues: string]: any
}

/**
 * The state and values of a single item of a particular resource
 */
export interface ResourceItem<T> {
    values: T,
    status: ResourceStatus,
    projection: Projection
}

/**
 * The unique identifier of a resource collection
 */
export type ResourceCollectionId = string;

/**
 * A collection of a particular resource
 */
export interface ResourceCollection<T> {
    /**
     * A list of ids of resources in the order they appear in that collection.
     */
    positions: string[],

    /**
     * The status information of the resource collection
     */
    status: ResourceStatus,

    /**
     * The projection information of the resource collection
     */
    projection: Projection,

    /**
     * The list of items in the collection, in the order that they appear
     */
    items: Array<ResourceItem<T>>
}

export interface ResourcesReduxState<T> {
    /**
     * The set of items of a particular resource type
     */
    items: { [key: string]: ResourceItem<T>; },

    /**
     * The set of collections of a particular resource type
     */
    collections: { [key: string]: ResourceCollection<T>; },

    /**
     * A dictionary of the resources that are currently selected.
     */
    selectionMap: { [key: string]: boolean; },

    /**
     * The temporary key that is being used for a new resource item until it's been saved to a remote API and
     * given a permanent unique identifier.
     */
    newItemKey: string | null,
}

/**
 * Returns an item of a particular resource from a Redux store, removing any structure used implicitly.
 */
export interface GetItemFunction<T> { (currentState: ResourcesReduxState<T>, params: object | string): ResourceItem<T> }

/**
 * Returns a collection of a particular resource from a Redux store, populating it with the correct items, in
 * the right order.
 */
export interface GetCollectionFunction<T> { (currentState: ResourcesReduxState<T>, params?: object | string): ResourceCollection<T> }

/**
 * The type of Redux action that is emitted when that action occurs
 */
export type ActionType = string;

/**
 * Mapping between action names and their types
 */
export type ActionDictionary = {[key: string]: ActionType };

/**
 * Function that dispatches an AnyAction or an ThunkAction
 */
export interface ActionCreatorFunction { (...args: any[]): ThunkAction<void, any, any, AnyAction> }

/**
 * A dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
 */
export interface ActionCreatorDictionary { [key: string]: ActionCreatorFunction }

/**
 * Common interface between state builder classes
 */
export interface InitialStateBuilder {
    /**
     * Sets the status of the initial state
     * @param ResourceStatusRequired The status type to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setStatusType: (ResourceStatusRequired) => InitialStateBuilder;

    /**
     * Sets the projection of the initial state
     * @param ResourceStatusRequired The projection object to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setProjection: (ProjectionRequired) => InitialStateBuilder;
}

/**
 * Object for building and then returning an initial resource collection state that can be passed to a Redux store
 * and work with the reducers returned by the resources() function
 */
export interface InitialCollectionStateBuilder<T> extends InitialStateBuilder {
    /**
     * Adds a new item to the collection's initial state builder
     * @param valuesOrParams Either the values of a new item to add to the initial state, outside of any
     *        collection, or the params of the item to use to index it.
     * @param optionalValues The values of the item, if the first argument was used to specify params
     * @returns a new initial state builder scoped to the new item
     */
    addItem: (valuesOrParams: object | T, optionalValues?: T) => InitialItemStateBuilder<T>;

    /**
     * Generates the initial collection state the builder has been configured for, in the format suitable to
     * pass to the Redux store.
     * @param ResourceStatus The status to use for the collection and all of its items if the collection hasn't
     *        set its own.
     * @param ResourceProjection The projection to use for the collection and all of its items if the
     *        collection hasn't set its own.
     */
    build: ({status: ResourceStatus, projection: ResourceProjection}) => ResourceCollection<T>;

    /**
     * Generates a map of items indexed by their correct key
     * @param ResourceStatus The status to use for the items if the collection or item hasn't set its own.
     * @param ResourceProjection The projection for the items if the collection or item hasn't set its own.
     */
    buildItems: ({status: ResourceStatus, projection: ResourceProjection}) => { [key: string]: ResourceItem<T>; }
}

/**
 * Object for building and then returning an initial resource item state that can be passed to a Redux store
 * and work with the reducers returned by the resources() function
 */
export interface InitialItemStateBuilder<T> extends InitialStateBuilder {
    /**
     * Generates the initial item state the builder has been configured for, in the format suitable to pass to
     * the Redux store.
     * @param ResourceStatus The status to use for the item if it hasn't set its own.
     * @param ResourceProjection The projection for the item if it hasn't set its own.
     */
    build: ({status: ResourceStatus, projection: ResourceProjection}) => ResourceItem<T>
}

/**
 * Object for building and then returning an initial state that can be passed to a Redux store and work
 * with the reducers returned by the resources() function
 */
export interface InitialResourceStateBuilder<T> extends InitialStateBuilder {
    /**
     * Adds a new collection to the initial state builder
     * @param itemsOrParams Either the params to use to index the collection or the list of items that
     *        make up the collection. If no params are specified, the default unscoped collection is used.
     * @param optionalItems The list of items in the collection, if they were not specified as the first
     *        argument
     * @returns a new initial state builder scoped to the new collection
     */
    addCollection: (itemsOrParams: object | Array<T>, optionalItems?: Array<T>) => InitialCollectionStateBuilder<T>;

    /**
     * Adds a new item to the initial state builder
     * @param paramsOrValues Either the values of a new item to add to the initial state, outside of any
     *        collection, or the params of the item to use to index it.
     * @param optionalValues The values of the item, if the first argument was used to specify params
     * @returns a new initial state builder scoped to the new item
     */
    addItem: (paramsOrValues: object | T, optionalValues?: T) => InitialItemStateBuilder<T>;

    /**
     * Generates the initial state the builder has been configured for, in the format suitable to pass to
     * the Redux store.
     */
    build: () => ResourcesReduxState<T>
}

export interface ResourcesDefinition<T> {
    /**
     * Mapping between RESTful action names and constant Redux Action names
     */
    actions: ActionDictionary,

    /**
     * Dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
     */
    actionCreators: ActionCreatorDictionary,

    /**
     *  Reducer function that will accept the resource's current state and an action and return the new
     *  resource state
     */
    reducers: Reducer,

    /**
     * Function that returns a particular item of a resource type
     */
    getItem: GetItemFunction<T>,

    /**
     * Function that returns the new item of a resource type
     */
    getNewItem: GetItemFunction<T>,

    /**
     * Function that returns a particular collection of resources
     */
    getCollection: GetCollectionFunction<T>,

    /**
     * Function to build the initial resource state:
     */
    buildInitialState: (items: Array<T>) => InitialResourceStateBuilder<T>,
}

/**
 * A Mapping between the name of an associated resource, and its definition.
 */
export type AssociationOptions<T> = { [key: string]: ResourcesDefinition<T>; }

export interface GlobalConfigurationOptions {
    /**
     * The resource attribute used to key/index all items of the current resource type. This will be the value
     * you pass to each action creator to identify the target of each action. By default, 'id' is used.
     */
    keyBy?: string | Array<string>,

    /**
     * Set to true for resources that should be edited locally, only. The show and index actions are disabled
     * (the fetch* action creators are not exported) and the create, update and destroy only update the store
     * locally, without making any HTTP requests.
     */
    localOnly?: boolean,

    /**
     * The attributes passed to action creators that should be used to create the request URL, but ignored
     * when storing the request's response.
     */
    urlOnlyParams?: Array<string>,

    /**
     * Function used to adapt the responses for requests before it is handed over to the reducers. The function
     * must return the results as an object with properties values and (optionally) error.
     */
    responseAdaptor?: (responseBody: Object, response: Response) => { values: Object, error?: Object | string },

    /**
     * Function used to adapt the JavaScript object before it is handed over to become the body of the request
     * to be sent to an external API.
     */
    requestAdaptor?: (requestBody: Object) => Object,

    /**
     * Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the
     * request only if it's on the same origin.
     */
    credentials?: RequestCredentials,

    /**
     * The request configuration object to be passed to the fetch method, or the new XMLHttpRequest object,
     * when the progress option is used.
     */
    request?: RequestInit,

    /**
     * A list of functions to call before passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional pre-processing to standardise the resource before
     * it is added to the store.
     */
    beforeReducers?: Array<Reducer>,

    /**
     * A list of functions to call after passing the resource to the reducer. This is useful if you want to use
     * the default reducer, but provide some additional post-processing to standardise the resource before it
     * is added to the store.
     */
    afterReducers?: Array<Reducer>,
}

/**
 * Options used to configure the resource and apply to all actions, unless overridden by more specific
 * configuration in ActionOptions.
 */
export interface ResourceOptions<T> extends GlobalConfigurationOptions {
    /**
     * The pluralized name of the resource you are defining.
     */
    name: string,

    /**
     * A url template that is used for all of the resource's actions. The template string can include required
     * url parameters by prefixing them with a colon (e.g. :id) and optional parameters are denoted by adding
     * a question mark at the end (e.g. :id?). This will be used as the default url template, but individual
     * actions may override it with their own.
     */
    url?: string,

    /**
     * A single or list of objects with an action and a reducer, used to specify custom reducers in response to
     * actions external to the current resource.
     */
    reducesOn?: ReducersMapObject | Array<ReducersMapObject>,

    /**
     * A single or list of actions for which the current resource should be cleared.
     */
    clearOn?: ActionType | Array<ActionType>,

    /**
     * An object of associated resources, with a many-to-many relationship with the current one.
     */
    hasAndBelongsToMany?: AssociationOptions<T>,

    /**
     * An object of associated resources, with a one-to-many relationship with the current one.
     */
    belongsTo?: AssociationOptions<T>,
}

/**
 * Options used to configure individual resource actions and override any options specified in GlobalOptions
 * or ResourceOptions.
 */
export interface ActionOptions<T> {
    /**
     * The resource attribute used to key/index all items of the current resource type. This will be the value
     * you pass to each action creator to identify the target of each action. By default, 'id' is used.
     */
    keyBy?: string | Array<string>,

    /**
     * Set to true for resources that should be edited locally, only. The show and index actions are disabled
     * (the fetch* action creators are not exported) and the create, update and destroy only update the store
     * locally, without making any HTTP requests.
     */
    localOnly?: boolean,

    /**
     * A url template that is used for the action. The template string can include required url parameters by
     * prefixing them with a colon (e.g. :id) and optional parameters are denoted by adding a question mark at
     * the end (e.g. :id?).
     */
    url?: string,

    /**
     * The attributes passed to the action's creator used to create the request URL, but ignored when storing
     * the request's response.
     */
    urlOnlyParams?: Array<string>,

    /**
     * Whether the store should emit progress events as the resource is uploaded or downloaded. This is
     * applicable to the RESTful actions index, show, create, update and any custom actions.
     */
    progress?: boolean,

    /**
     * Function used to adapt the responses for requests before it is handed over to the reducers. The function
     * must return the results as an object with properties values and (optionally) error.
     */
    responseAdaptor?: (responseBody: Object, response: Response) => { values: T, error?: Object | string },

    /**
     * Function used to adapt the JavaScript object before it is handed over to become the body of the request
     * to be sent to an external API.
     */
    requestAdaptor?: (requestBody: T) => Object,

    /**
     * Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the
     * request only if it's on the same origin.
     */
    credentials?: RequestCredentials,

    /**
     * The request configuration object to be passed to the fetch method, or the new XMLHttpRequest object,
     * when the progress option is used.
     */
    request?: Object,

    /**
     * A custom reducer function to adapt the resource as it exists in the Redux store. By default, the
     * standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful
     * actions.
     */
    reducer?: Reducer,

    /**
     * A list of functions to call before passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional pre-processing to standardise the resource before
     * it is added to the store.A list of functions to call before passing the resource to the reducer. This
     * is useful if you want to use the default reducer, but provide some additional pre-processing to
     * standardise the resource before it is added to the store.
     */
    beforeReducers?: Array<Reducer>,

    /**
     * A list of functions to call after passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional post-processing to standardise the resource
     * before it is added to the store.
     */
    afterReducers?: Array<Reducer>,
}

export type ActionOptionsMap<T> = { [key: string]: ActionOptions<T> | Boolean };

/**
 * Defines a new resource, returning the actions, action creators, reducers and helpers to manage it
 */
export function resources<T>(resourceOptions: ResourceOptions<T>, actionOptions: ActionOptionsMap<T> | string[]): ResourcesDefinition<T>;

/**
 * Serializes an object to create a consistent key, no matter the ordering of the attributes, suitable to use
 * as a key for resource items and collections.
 */
export function serializeKey(target: any): string | ResourceCollectionId;

/**
 * Updates or sets the global configuration options
 */
export function configure(config: GlobalConfigurationOptions): void;

/**
 * Returns the current global configuration options
 */
export function getConfiguration(): GlobalConfigurationOptions;
