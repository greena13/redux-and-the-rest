let configuration = {};

export function setConfiguration(customConfiguration) {
  configuration = {
    ...configuration,
    customConfiguration
  };
}

export function getConfiguration() {
  return { ...configuration };
}
