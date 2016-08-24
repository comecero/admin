
//#region Auths

app.controller("AuthsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.auths = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadAuths = function () {

        ApiService.getList(ApiService.buildUrl("/auths?show=auth_id,token,comments,expires,date_created&sort_by=" + $scope.params.date_type + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.auths.authList = result;

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.setParam = function (param, value) {
        $scope.params[param] = value;
        $scope.params.before_item = null;
        $scope.params.after_item = null;
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }

    $scope.search = function () {
        if ($scope.params.q != null) {

            // Reset the view to the first page
            $scope.params.offset = null;
            $scope.nav.scrollTop = true;

            // If empty, reset to null
            if ($scope.params.q == "") {
                $scope.params.q = null;
            }

            $location.search($scope.params);
        }
    }

    $scope.movePage = function (direction) {
        if (direction == "+") {
            $scope.params.offset = $scope.auths.authList.next_page_offset;
        } else {
            $scope.params.offset = $scope.auths.authList.previous_page_offset;
        }
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }

    $scope.sort = function (sort_by, desc) {
        $scope.params.sort_by = sort_by;
        $scope.params.desc = desc;
        $location.search($scope.params);
    }

    $scope.$on('$routeUpdate', function (e) {
        $scope.parseParams();
        $scope.loadAuths();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadAuths();

}]);

app.controller("AuthsSetCtrl", ['$scope', '$rootScope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', '$http', function ($scope, $rootScope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, $http) {

    $scope.exception = {};
    $scope.data = {};

    // Set default values
    $scope.data.type = "secret";
    $scope.data.test = true;

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/auths/" + $routeParams.id)

        // Load the auth
        ApiService.getItem($scope.url).then(function (auth) {
            $scope.auth = auth;

            // Make a copy of the original for comparision
            $scope.auth_orig = angular.copy($scope.auth);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.auth = {};

    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.auth, $scope.auth_orig)) {
            utils.redirect($location, "/auths");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/auths");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.addAuth = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.auth, ApiService.buildUrl("/auths/secret"), { show: "auth_id,token", test: $rootScope.settings.test })
        .then(
        function (auth) {
            $scope.showToken = true;
            $scope.auth.token = auth.token;
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateAuth = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        // Remove effective_permissions to save bandwidth on the way up
        delete $scope.auth.effective_permissions;

        ApiService.set($scope.auth, $scope.url, { show: "auth_id,token" })
        .then(
        function (auth) {
            GrowlsService.addGrowl({ id: "edit_success", name: auth.name, type: "success", name: auth.token, url: "#/auths/" + auth.auth_id + "/edit" });
            utils.redirect($location, "/auths");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.url).then(
        function (auth) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.auth.token, type: "success" });
            utils.redirect($location, "/auths");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.addLimitedAuth = function (test) {

        prepareSubmit();

        var config = {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token"),
                "Accept": "application/json;"
            }
        };

        if (test == false) {
            delete config.headers["Authorization"];
        }

        var request = $http.post("https://" + $rootScope.apiHost + "/api/v1/auths/limited?account_id=" + localStorage.getItem("account_id") + "&test=" + test, null, config);

        request.success(function (auth) {
            $scope.showToken = true;
            $scope.auth.token = auth.token;
        });

        request.error(function (error) {
            $scope.exception.error = error.error;
            window.scrollTo(0, 0);
        });

    }

}]);

//#endregion Auths



