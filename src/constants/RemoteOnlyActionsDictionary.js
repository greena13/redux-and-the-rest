/**
 * A dictionary of actions that only make sense for resources managed on a remote data source or API
 */
const RemoteOnlyActionsDictionary = {
  fetchList: true,
  fetchItem: true,
};

export default RemoteOnlyActionsDictionary;
