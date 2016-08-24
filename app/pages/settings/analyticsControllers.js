app.controller("AnalyticsSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/analytics");

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function (form) {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        if ($scope.refund_reasons != null) {
            $scope.settings.refund_reasons = utils.stringToArray($scope.refund_reasons);
        }

        if ($scope.chargeback_reasons != null) {
            $scope.settings.chargeback_reasons = utils.stringToArray($scope.chargeback_reasons);
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Analytics Settings", type: "success", url: "#/settings/analytics" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);



