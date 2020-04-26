import DefaultKey from './DefaultKey';

/**
 * The default options to use unless overridden by calling the configure() or resources() functions
 */
const DefaultConfigurationOptions = {

  /**
   * Index objects by the DefaultKey unless otherwise specified
   */
  keyBy: DefaultKey,

  /**
   * Don't call any functions before passing response objects back to the reducers, by default
   */
  beforeReducers: [],

  /**
   * Don't call any functions after passing response objects back to the reducers, by default
   */
  afterReducers: [],

  /**
   * The attributes present at the root of responses that indicate an error and/or contain information
   * about that error
   */
  errorAttributes: ['error'],
};

export default DefaultConfigurationOptions;
