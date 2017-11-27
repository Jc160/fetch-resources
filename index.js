'use strict';


const Lodash = require('lodash');
const QueryString = require('query-string');


////////////////////////////////////////////////////////////


/**
 * Default headers
 * @type {Object}
 */
const HEADERS = {
 'Accept': 'application/json'
}


const X_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';


/**
 * Axios Data field validation.
 * @type {Array}
 */
const DATA_VALID_METHODS = ['PUT', 'POST', 'PATCH'];


/**
 * Requester Creator
 * @param {Object} objConfig Init config
 */
function Requester(objConfig={}) {
  const INTERNAL_HEADERS = Object.assign({}, HEADERS, objConfig.headers);


  const fnAfterFetchFn = objConfig.afterFetch || afterFetch;
  const fnBeforeFetchFn = objConfig.beforeFetchFn || beforeFetch;
  const fnOnError = objConfig.onError || onError;
  const fnOnRequestError = objConfig.onRequestError || onRequestError;


  function mergeWithBaseUrl(strEndpointUrl) {
    return objConfig.host ? `${objConfig.host}/${strEndpointUrl}` : strEndpointUrl;
  }


  /**
   * Axios Request
   * @param  {Object} objRequestConfig      Fetch Config
   * @return {Fuction}            Promise
   */
  function request(objRequestConfig, objCustomEndpoint) {
    return fnBeforeFetchFn(objRequestConfig, objCustomEndpoint).then((listResults) => {

      let [objRequestConfig, objCustomEndpoint] = listResults;
      const strRequestUrl = mergeWithBaseUrl(objRequestConfig.url);
      const objInternalRequest = Lodash.omit(objRequestConfig, ['url']);

      return fetch(strRequestUrl, objInternalRequest)
        .then((varResponse) => {
          return fnAfterFetchFn(varResponse, objRequestConfig, objCustomEndpoint);
        })
        .catch(fnOnRequestError);

    }).catch(fnOnError);
  }


  /**
   * This function handles the request error
   * @param  {Object} objError Error object
   * @return {Promise}
   */
  function onRequestError(objError) {
    if (objError.then) {
      return objError.then((objNestedError) => {
        return Promise.reject(objNestedError);
      });
    }
    return Promise.reject(objError);
  }


  /**
   * This function handles the beforeFetch.
   */
  function beforeFetch(objRequestConfig, objCustomEndpoint) {
    return Promise.resolve([objRequestConfig, objCustomEndpoint]);
  }


  /**
   * Handle success response request
   * @return {Object}
   */
  function afterFetch(varResponse, objRequestConfig, objCustomEndpoint) {
    if (objCustomEndpoint.isRaw) {
      return varResponse;
    }

    if (varResponse.status === 413) {
      return varResponse.text();
    }

    if (varResponse.status >= 200 && varResponse.status < 300) {
      if (varResponse.status === 204) {
        return null;
      }
      return varResponse.json();
    } else {
      return Promise.reject(varResponse.json());
    }
  }


  /**
   * Handle error request
   * @param  {Object} objResponse
   * @return {Object}
   */
  function onError(objResponse) {
    return objResponse;
  }


  /**
   * Transform endpoint replacing key params
   * @param  {Object} objCustomApi Custom api data
   * @param  {Object} objData      Request data
   * @return {Array}
   */
  function getCustomEndpoint(objCustomApi, objData) {
    let strEndpoint = objCustomApi.endpoint;
    objCustomApi.params && objCustomApi.params.forEach((strParam) => {
      strEndpoint = strEndpoint.replace(`:${strParam}`, objData[strParam]);
    });


    return strEndpoint;
  }


  /**
   * This function creates the custom api object. (Axios Config Object)
   * @param  {Object} objCustomEndpoint Custom API Config
   * @param  {Object} objSourceHeaders  Initial Headers
   * @return {Function}                   Request function
   */
  function createCustomApi(objCustomEndpoint, objSourceHeaders) {
    const objInternalHeaders = Object.assign(
      {},
      objSourceHeaders,
      objCustomEndpoint.headers
    );


    return (objData, objNewConfig={}) => {

      const hasBody = Lodash.includes(DATA_VALID_METHODS, objCustomEndpoint.method.toUpperCase());

      const hasQueryParams = !Lodash.isEmpty(objData)
        && !hasBody;


      const objCleanData = Lodash.omit(objData, objCustomEndpoint.params);

      const strUrl = hasQueryParams
      ? `${getCustomEndpoint(objCustomEndpoint, objData)}?${QueryString.stringify(objCleanData)}`
      : getCustomEndpoint(objCustomEndpoint, objData);

      let initialConfig = {
        method: objCustomEndpoint.method,
        url: strUrl,
        headers: Object.assign(
          {},
          objInternalHeaders,
          objNewConfig.addHeaders
        )
      };

      if (hasBody) {
        initialConfig['body'] = objCleanData;
        initialConfig.headers['Content-Type'] = X_WWW_FORM_URLENCODED;
      }

      let objConfig = Object.assign(
        initialConfig,
        objCustomEndpoint.options,
        Lodash.omit(objNewConfig, ['addHeaders'])
      );

      return request(objConfig, objCustomEndpoint);
    }
  }


  /**
   * This function transform the customs config objects to custom functions.
   * @param  {Object} objCustomEndpoint Customs endpoints config
   * @param  {Object} objSourceHeaders  Initial Headers
   * @return {Object}                   Custom endpoints functions
   */
  function getCustomEndpoints(objCustomEndpoint, objSourceHeaders) {
    return Object.keys(objCustomEndpoint).reduce((objCustomEndpoints, strKey) => {
      objCustomEndpoints[strKey] = createCustomApi(objCustomEndpoint[strKey], objSourceHeaders);
      return objCustomEndpoints;
    }, {});
  }


  /**
   * This function generates the source object with requests functions.
   * @param  {[type]} strEndpoint        Source Endpoint
   * @param  {Object} objCustomEndpoints Custom Endpoints object
   * @param  {[type]} objSourceHeaders   Custom source headers
   * @return {[type]}                    [description]
   */
  function source(strEndpoint, objCustomEndpoints={}, objSourceHeaders) {
    const objInternalHeaders = Object.assign({}, INTERNAL_HEADERS, objSourceHeaders);

    const objEndpointWithId = {
      endpoint: `${strEndpoint}/:id`,
      params: ['id']
    };


    const fnGet = createCustomApi({ method: 'GET', endpoint: strEndpoint }, objInternalHeaders);
    const fnPut = createCustomApi(Object.assign({ method: 'PUT' }, objEndpointWithId), objInternalHeaders);
    const fnDelete = createCustomApi(Object.assign({ method: 'DELETE' }, objEndpointWithId), objInternalHeaders);


    const fnPost = createCustomApi(
      {
        method: 'POST',
        endpoint: strEndpoint,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      },
      objInternalHeaders
    );


    return Object.assign(
      {
        get: fnGet,
        post: fnPost,
        update: fnPut,
        remove: fnDelete
      },
      getCustomEndpoints(objCustomEndpoints, objInternalHeaders)
    )
  }


  return {
    source,
    request,
    fetch
  }
}


////////////////////////////////////////////////////////////


module.exports = Requester;
