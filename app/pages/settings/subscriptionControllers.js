app.controller("SubscriptionsSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/subscription");

    $scope.immediate_upgrades = {};
    $scope.immediate_downgrades = {};

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);
        $scope.cancellation_reasons = utils.arrayToString(settings.cancellation_reasons);

        $scope.immediate_upgrades = loadFields(settings.immediate_upgrade_product_types, $scope.immediate_upgrades);
        $scope.immediate_downgrades = loadFields(settings.immediate_downgrade_product_types, $scope.immediate_downgrades);

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

        if ($scope.cancellation_reasons != null) {
            $scope.settings.cancellation_reasons = utils.stringToArray($scope.cancellation_reasons);
        }

        $scope.settings.immediate_upgrade_product_types = loadList($scope.immediate_upgrades);
        $scope.settings.immediate_downgrade_product_types = loadList($scope.immediate_downgrades);

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Subscription Settings", type: "success", url: "#/settings/subscriptions" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    function loadFields(fields, obj) {
        _.each(fields, function (item) {
            obj[item] = true;
        });
        return obj;
    }

    function loadList(obj) {
        var list = [];
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (obj[property] == true) {
                    list.push(property);
                }
            }
        }
        return list;
    }

}]);
