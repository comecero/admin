app.controller("ProfileUpdateCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/users/me")

    // Load the user
    ApiService.getItem($scope.url).then(function (user) {
        $scope.user = user;

        // Make a copy of the original for comparision
        $scope.user_orig = angular.copy($scope.user);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.user, $scope.user_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateProfile = function (form) {

        prepareSubmit();

        if ($scope.user.password || $scope.user.password2) {
            if ($scope.user.password != $scope.user.password2) {
                form.password2.$setValidity("match", false);
                return;
            } else {
                form.password2.$setValidity("match", true);
            }
        } else {
            form.password2.$setValidity("match", true);
        }

        if ($scope.form.$invalid) {
            return;
        }

        if (utils.isNullOrEmpty($scope.user.password)) {
            delete $scope.user.password;
            delete $scope.user.password2;
        }

        ApiService.set($scope.user, $scope.url)
        .then(
        function (user) {
            GrowlsService.addGrowl({ id: "edit_success", name: "your profile", type: "success", url: "#/profile" });
            utils.redirect($location, "/");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);



