angular.module("launch", [])
    .controller("Launch", ['$scope', '$http', '$q', function ($scope, $http, $q) {

        // Set up your configuration object for API calls
        var config = {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token"),
                "Accept": "application/json;"
            }
        };

        var host = "api.comecero.com";
        if (window.location.hostname.indexOf("admin-staging.") > -1) {
            host = "api-staging.comecero.com";
        }

        var getToken = function (test, config, app_installation) {

            var deferred = $q.defer();

            // If a server side app, no need to supply a token
            if (app_installation.client_side == false) {
                deferred.resolve();
                return deferred.promise;
            }

            // If an admin app, we will use the user's current token.
            if (app_installation.type == "admin") {

                var token = localStorage.getItem("token");
                var tokenTest = false;
                if (token.substring(0, 13) == "trusted.test.") {
                    tokenTest = true;
                }

                // Make sure that "test" between the supplied token and app_installation match.
                if (app_installation.test != tokenTest) {
                    console.log("The app installation test flag and the supplied token's test flag do not match.");
                    window.location.href = "error.html";
                }

                deferred.resolve(token);

            } else {

                // If we already have a limited token saved, don't bother getting a new one.

                if (test == false) {
                    // We don't need to generate a token if not test.
                    deferred.resolve();
                    return deferred.promise;
                }

                // If the token is not null and expires in more than 30 minutes, use it.
                if (localStorage.getItem("token_limited_test") != null && localStorage.getItem("token_limited_test_expires") != null) {
                    if ((localStorage.getItem("token_limited_test_expires") - 300) > new Date() / 1000) {
                        deferred.resolve(localStorage.getItem("token_limited_test"));
                        return deferred.promise;
                    }
                }

                // Generate a token
                var request = $http.post("https://" + host + "/api/v1/auths/limited?test=true&show=token,expires_in_seconds", {}, config);

                request.success(function (auth) {
                    // Save the response data in a cookie for future use
                    var now = new Date();
                    var expires = Date.parse(new Date(now.setSeconds(now.getSeconds() + auth.expires_in_seconds))) / 1000
                    localStorage.setItem("token_limited_test", auth.token);
                    localStorage.setItem("token_limited_test_expires", expires);
                    deferred.resolve(auth.token);
                });

                request.error(function (error) {
                    deferred.reject();
                });
            }

            return deferred.promise;

        }

        var getLaunchUrl = function (app_installation, token) {

            var params = [];
            var launch_url = app_installation.launch_url;

            if (window.location.hostname.indexOf("admin-staging.") > -1) {
                launch_url = launch_url.replace("apps.comecero.com", "apps-staging.comecero.com");
            }

            if (app_installation.client_side) {

                // Set the token parameter. Live storefront apps are client side but don't have a token, so the token could be null even though client side. Don't set in that case.
                if (token != null) {
                    params.push("access_token=" + token);
                }

                // If a storefront app and test, append a flush parameter to start a new session, a convenience in testing.
                if (app_installation.type == "storefront" && app_installation.test) {
                    params.push("flush=true");
                }

                // Send the target version so the app host environment knows which version to serve.
                if (app_installation.platform_hosted) {

                    params.push("target_version=" + app_installation.version);
                }
            }

            params.push("redirect_uri=/" + app_installation.alias);

            // Build the parameter string
            var query = "";
            if (params.length > 0) {
                params.forEach(function (param) {
                    query += param + "&";
                });
            }

            // Take the last ampersand off the query
            if (query != null) {
                query = query.substring(0, query.length - 1);
            }

            if (query) {
                launch_url += "#" + query;
            }

            return launch_url;

        }

        var getAppInstallation = function (app_installation_id, config) {

            var deferred = $q.defer();

            // Get the app_installation details
            var request = $http.get("https://" + host + "/api/v1/app_installations/" + app_installation_id + "?show=alias,launch_url,version,is_default_version,platform_hosted,client_side,type,test", config);

            request.success(function (app_installation) {
                deferred.resolve(app_installation);
            });

            request.error(function (error) {
                deferred.reject();
            });

            return deferred.promise;

        }

        // Set parameters
        var hashParameters = utils.getPageHashParameters();
        var app_installation_id = hashParameters["app_installation_id"];

        // Set test flag
        var test = utils.stringToBool(hashParameters["test"]);
        if (test != true) {
            test = false;
        }

        // Get the app installation
        getAppInstallation(app_installation_id, config).then(function (app_installation) {

            // Get the token, as necessary
            getToken(test, config, app_installation).then(function (token) {

                var launch_url = getLaunchUrl(app_installation, token);
                window.location.href = launch_url;
            },
            function (error) {
                console.log(error);
                window.location.href = "error.html";
            });

        }, function (error) {
            console.log(error);
            window.location.href = "error.html";
        });

    }]);