// Get the token from the url hash
var hashParameters = utils.getPageHashParameters();
var queryParameters = utils.getPageQueryParameters();

if (hashParameters["access_token"] != undefined) {

    // Clear any previous user info
    localStorage.clear();

    var token = hashParameters["access_token"];

    // Save in localstorage. The server keeps track of how long the token is valid, if it expires the application will receive a 401 and prompt the user to log in.
    localStorage.setItem("token", token);

    var host = "api.comecero.com";
    if (window.location.hostname.indexOf("admin-staging.") > -1) {
        host = "api-staging.comecero.com";
    }

    // Get the account_id from the user object and save in storage.
    var tokenResponse = executeURL("https://" + host + "/api/v1/users/me", null, "GET", token);

    // Define what happens if the call succeeds
    tokenResponse.success(function (data) {

        // Set the various user data elements in local storage. These are used for client-side logic & presentation only and not for actual security.
        localStorage.setItem("account_id", data.account_id);
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
                // state should be the path without the hostname. We'll only redirect within the realm of admin.comecero.com.
                if (utils.left(hashParameters["state"], 7) == "http://" || utils.left(hashParameters["state"], 8) == "https://") {
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
