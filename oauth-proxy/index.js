// Get the token from the url hash
var hashParameters = getHashParameters(window.location.href);
var queryParameters = getQueryParameters(window.location.href);

if (hashParameters["access_token"] != undefined) {

    // Clear any previous user info
    localStorage.clear();

    var token = hashParameters["access_token"];
    var account_id = hashParameters["account_id"];

    // Save in localstorage. The server keeps track of how long the token is valid, if it expires the application will receive a 401 and prompt the user to log in.
    localStorage.setItem("token", token);

    // Get the account_id from the user object and save in storage.
    var tokenResponse = executeURL("/api/v1/users/me", null, "GET", token);

    // Define what happens if the call succeeds
    tokenResponse.success(function (data) {

        // Set the various user data elements in local storage. These are used for client-side logic & presentation only and not for actual security.
        localStorage.setItem("account_id", account_id);
        localStorage.setItem("user_id", data.user_id);

        // The status of test comes from the type of token supplied
        if (token.indexOf(".test.") > 0) {
            localStorage.setItem("test", true);
        } else {
            localStorage.setItem("test", false);
        }

        localStorage.setItem("name", data.name);
        if (data.language) {
            localStorage.setItem("language", data.language);
        }
        localStorage.setItem("locale", data.locale);
        localStorage.setItem("permissions", JSON.stringify(data.effective_permissions));

        // If in an iframe, post a message to the parent indicating login success.
        if (queryParameters["iframe"] == "true") {
            parent.postMessage("loginSuccess", "*");
        } else {
            // Otherwise, redirect  
            if (hashParameters["state"] == undefined) {
                window.location = "/";
            } else {
                // state should be the path without the hostname. We'll only redirect within the realm of the app (self).
                if (left(hashParameters["state"], 7) == "http://" || left(hashParameters["state"], 8) == "https://") {
                    window.location = "/";
                } else {
                    window.location = "/" + hashParameters["state"];
                }
            }
        }
    });

    // Define what happens if the call fails
    tokenResponse.fail(function (data) {

        // If in an iframe, post a message to the parent indicating login failure.
        if (queryParameters["iframe"] == "true") {
            parent.postMessage("loginFailure", "*");
        } else {
            // Otherwise, redirect to error 
            window.location = "/errors/400.html";
        }
    });

} else {
    // If in an iframe, post a message to the parent indicating login failure.
    if (queryParameters["iframe"] == "true") {
        parent.postMessage("loginFailure", "*");
    } else {
        // Otherwise, redirect to error 
        window.location = "/errors/400.html";
    }
}

function executeURL(url, data, method, bearer) {
    return $.ajax({
        type: method,
        url: url,
        data: data,
        dataType: "json",
        beforeSend: function (xhr) {
            if (bearer != "") {
                xhr.setRequestHeader("Authorization", "Bearer " + bearer);
            }
        }
    });
}

function getHashParameters(url) {

    var hashParameters = {};

    if (url.indexOf("#") == -1) {
        return hashParameters;
    }

    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = url.substring(url.indexOf("#") + 1);

    while (e = r.exec(q))
        hashParameters[d(e[1])] = d(e[2]);

    return hashParameters;
}

function getQueryParameters(url) {

    if (url.indexOf("?") == -1) {
        return {};
    }

    q = url.substring(url.indexOf("?") + 1);

    // Strip off any hash parameters
    if (q.indexOf("#") > 0) {
        q = q.substring(0, q.indexOf("#"));
    }

    return parseQueryParameters(q);
}

function parseQueryParameters(query) {

    var queryParameters = {};

    if (isNullOrEmpty(query)) {
        return queryParameters;
    }

    var e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&;=]+)=?([^&;]*)/g,
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); }
    var queryParameters = {};

    while (e = r.exec(query))
        queryParameters[d(e[1])] = d(e[2]);

    return queryParameters;

}

function left(str, n) {
    if (n <= 0)
        return "";
    else if (n > String(str).length)
        return str;
    else
        return String(str).substring(0, n);
}

function isNullOrEmpty(string) {

    if (string == null || string == undefined) {
        return true;
    }

    // The string could in fact be numeric, convert to string before you do the tests below.

    if (string.toString() == "") {
        return true;
    }

    if (string.toString().replace(/ /g, '') == null) {
        return true;
    }

    return false;

}
