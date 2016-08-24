app.service("ApiService", ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {

    // Return public API.
    return ({
        set: set,
        getItem: getItem,
        getList: getList,
        remove: remove,
        multipartForm: multipartForm,
        buildUrl: buildUrl,
        getItemPdf: getItemPdf
    });

    function set(data, url, parameters, showLoading) {

        if (showLoading == null) {
            showLoading = true;
        }

        if (data == null) {
            data = undefined;
        }

        var headers = {};
        headers["Content-Type"] = "application/json";

        var request = $http({
            ignoreLoadingBar: !showLoading,
            method: "post",
            data: angular.toJson(data),
            url: url + "?timezone=UTC",
            params: parameters,
            timeout: 90000,
            isApi: true,
            headers: headers
        });

        return (request.then(onSuccess, onError));

    }

    function getItem(url, parameters, showLoading, timeout) {

        if (showLoading == null) {
            showLoading = true;
        }

        var headers = {};

        if (!timeout) {
            timeout = 15000;
        }

        var request = $http({
            ignoreLoadingBar: !showLoading,
            method: "get",
            url: url,
            params: parameters,
            timeout: timeout,
            isApi: true,
            headers: headers
        });

        if (parameters) {
            if (!parameters["timezone"]) {
                request.url += "?timezone=UTC"
            }
        } else {
            request.url += "?timezone=UTC"
        }

        return (request.then(onSuccess, onError));

    }

    function getItemPdf(url, parameters, showLoading, timeout) {

        if (showLoading == null) {
            showLoading = true;
        }

        var headers = {};

        if (!timeout) {
            timeout = 25000;
        }

        headers.Accept = "application/pdf";

        var request = $http({
            ignoreLoadingBar: !showLoading,
            method: "get",
            url: url,
            params: parameters,
            timeout: timeout,
            isApi: true,
            headers: headers,
            responseType: "arraybuffer"
        });

        if (parameters) {
            if (!parameters["timezone"]) {
                request.url += "?timezone=UTC"
            }
        } else {
            request.url += "?timezone=UTC"
        }

        return (request.then(onSuccess, onError));

    }
    
    function getList(url, parameters, showLoading) {

        if (showLoading == null) {
            showLoading = true;
        }

        var headers = {};

        // Parse the query parameters in the url
        var queryParameters = utils.getQueryParameters(url);

        if (queryParameters["timezone"] == null) {
            queryParameters["timezone"] = "UTC";
        }

        if (queryParameters["limit"] == null) {
            queryParameters["limit"] = 50;
        }

        // Remove any query parameters that are explicitly provided in parameters
        _.each(parameters, function (item, index) {
            if (queryParameters[index] != null) {
                delete queryParameters[index];
            }
        });

        // Remove the current query string
        if (url.indexOf("?") > 0) {
            url = url.substring(0, url.indexOf("?"))
        }

        // Append the parameters
        url = utils.appendParams(url, queryParameters);

        var request = $http({
            ignoreLoadingBar: !showLoading,
            method: "get",
            url: url,
            params: parameters,
            timeout: 25000,
            isApi: true,
            headers: headers
        });

        return (request.then(onSuccess, onError));

    }

    function remove(url, parameters, showLoading, tokenOverride) {

        if (showLoading == null) {
            showLoading = true;
        }

        var headers = {};
        // Used on logout when you are injecting a token to be deleted that may not be the currently established token in localStorage
        if (tokenOverride) {
            token = "Bearer " + tokenOverride;
        }

        var request = $http({
            ignoreLoadingBar: !showLoading,
            method: "delete",
            url: url + "?timezone=UTC",
            params: parameters,
            timeout: 15000,
            isApi: true,
            headers: headers
        });

        return (request.then(onSuccess, onError));

    }

    function multipartForm(data, file, url, parameters, showLoading) {

        if (showLoading == null) {
            showLoading = true;
        }

        var headers = {};
        headers["Content-Type"] = undefined;

        var fd = new FormData();

        if (file) {
            fd.append("file", file);
        }

        Object.keys(data).forEach(function (key, index) {
            fd.append(key, data[key]);
        });

        var request = $http({
            ignoreLoadingBar: !showLoading,
            method: "post",
            data: fd,
            transformRequest: angular.identity,
            url: url + "?timezone=UTC",
            params: parameters,
            timeout: 600000,
            isApi: true,
            isMultipart: true,
            headers: headers
        });

        return (request.then(onSuccess, onError));

    }

    function buildUrl(endpoint) {
        return "https://" + $rootScope.apiHost + "/api/v1" + endpoint;
    }

    function onError(response) {

        var error = {};

        // Most calls will return a formatted error message unless something unexpected happens. Pass the error object through if present, or create one that has the same properties if not.
        if (response.data.error) {

            if (response.data.error.status == 403) {
                error.code = "error";
                error.message = "It appears that you don't have permissions to access page or function you have requested. If you feel this is incorrect, please contact an account administrator.";
                error.status = response.status;
                return ($q.reject(error));
            }

            return ($q.reject(response.data.error));

        } else {
            error.code = "error";
            error.message = response.statusText;
            error.status = response.status;
            return ($q.reject(error));
        }
    }

    function onSuccess(response) {
        return (response.data);
    }

}]);
