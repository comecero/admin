app.controller("UsersListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.users = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "name";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadUsers = function () {

        ApiService.getList(ApiService.buildUrl("/users?show=user_id,name,date_last_login,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.users.userList = result;
            $scope.usersChecked = false;

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
            $scope.params.offset = $scope.users.userList.next_page_offset;
        } else {
            $scope.params.offset = $scope.users.userList.previous_page_offset;
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
        $scope.loadUsers();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadUsers();

}]);

app.controller("UsersSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.data = {}

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/users/" + $routeParams.id)

        // Load the user
        ApiService.getItem($scope.url).then(function (user) {
            $scope.usr = user;

            // Make a copy of the original for comparision
            $scope.usr_orig = angular.copy($scope.usr);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.usr, $scope.usr_orig)) {
            utils.redirect($location, "/users");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/users");
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

    $scope.addUser = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        $scope.usr.password = $scope.data.password;

        ApiService.set($scope.usr, ApiService.buildUrl("/users"), { show: "user_id,name" })
        .then(
        function (usr) {
            GrowlsService.addGrowl({ id: "add_success", name: usr.name, type: "success", user_id: usr.usr_id, url: "#/users/" + usr.user_id + "/edit" });
            utils.redirect($location, "/users");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateUser = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        // If the password is null, remove it
        if (!utils.isNullOrEmpty($scope.data.password)) {
            $scope.usr.password = $scope.data.password;
        } else {
            delete $scope.usr.password;
        }

        ApiService.set($scope.usr, $scope.url, { show: "user_id,name" })
        .then(
        function (usr) {
            GrowlsService.addGrowl({ id: "edit_success", name: usr.name, type: "success", url: "#/users/" + usr.user_id + "/edit" });
            utils.redirect($location, "/users");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success_with_undelete", name: $scope.usr.name, type: "success", url: "#/users/" + $scope.usr.user_id + "/edit" });
            utils.redirect($location, "/users");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);


