class UploadMock {
  constructor() {
    this.onprogress = null;
    this.onloadend = null;
  }
}

class ResponseMock {
  constructor(options) {
    this.options = options;
  }
}

class MockManager {
  constructor(request = null, response = null) {
    this.request = request;
    this.response = response;
  }

  setRequest(request) {
    this.request = request;
  }

  setResponse(response) {
    this.response = response;
  }

  setUploadProgress(progressEvent) {
    const request = this._getRequest('setProgress');

    if (request.upload.onprogress) {
      request.upload.onprogress(progressEvent);
    } else {
      throw new Error(`setProgress called on request ${request.url} that does not have an onprogress handler set`);
    }
  }

  completeUpload(target) {
    const request = this._getRequest('completeUpload');
    const requestBody = JSON.stringify(request.body);
    const requestLength = requestBody ? requestBody.length : 0;

    if (request.upload.onload) {
      request.upload.onload({ target });
    }

    if (request.upload.onloadend) {
      request.upload.onloadend({ target, lengthComputable: true, loaded: requestLength, total: requestLength });
    }
  }

  setDownloadProgress(progressEvent) {
    const request = this._getRequest('setProgress');

    if (request.onprogress) {
      request.onprogress(progressEvent);
    } else {
      throw new Error(`setProgress called on request ${request.url} that does not have an onprogress handler set`);
    }
  }

  completeDownload() {
    const request = this._getRequest('sendResponse');
    const { body, ..._responseOptions } = this.response.options;
    const responseText = JSON.stringify(body);

    const target = {
      status: 200,
      statusText: 'OK',
      responseType: 'application/json',
      responseText,
      ..._responseOptions
    };

    if (request.onload) {
      return request.onload({ target });
    }
  }

  _getRequest(caller) {
    if (this.request) {
      return this.request;
    } else {
      throw Error(`${caller} called on MockManager before request was made`);
    }
  }
}

const DEFAULT_MOCK_MANAGER_DICT = {
  POST: {},
  GET: {},
  PUT: {},
  DELETE: {}
};

let mockManagersDict = {
  ...DEFAULT_MOCK_MANAGER_DICT
};

class XHRMock {
  static setup() {
    this.realXHR = global.XMLHttpRequest;

    global.XMLHttpRequest = XHRMock;
  }

  static reset() {
    mockManagersDict = { ...DEFAULT_MOCK_MANAGER_DICT };
  }

  static tearDown() {
    global.XMLHttpRequest = this.realXHR;
  }

  static post(url, options) {
    const mockManager = new MockManager();
    mockManager.setResponse(new ResponseMock(options));

    mockManagersDict.POST[url] = mockManager;

    return mockManager;
  }

  static put(url, options) {
    const mockManager = new MockManager();
    mockManager.setResponse(new ResponseMock(options));

    mockManagersDict.PUT[url] = mockManager;

    return mockManager;
  }

  static get(url, options) {
    const mockManager = new MockManager();
    mockManager.setResponse(new ResponseMock(options));

    mockManagersDict.GET[url] = mockManager;

    return mockManager;
  }

  constructor() {
    this.withCredentials = false;

    this.headers = {};
    this.upload = new UploadMock();
    this.response = null;
    this.onload = null;
    this.onerror = null;
  }

  open(method, url) {
    this.method = method;
    this.url = url;

    const mockManager = mockManagersDict[method][url];

    if (mockManager) {
      mockManager.setRequest(this);
    } else {
      throw new Error(`Received unexpected ${method} request for ${url}.`);
    }
  }

  setRequestHeader(key, value) {
    this.headers[key] = value;
  }

  send(body) {
    this.body = body;
  }

}

export default XHRMock;
