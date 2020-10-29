import { getConfiguration } from './configuration';

function mergeWithLatestGlobalConfig(options) {
  return { ...getConfiguration(), ...options };
}

export default mergeWithLatestGlobalConfig;
