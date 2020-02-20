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
};

export default DefaultConfigurationOptions;
