app.controller("GeneralSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'CurrenciesService', 'TimezonesService', 'HelperService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, CurrenciesService, TimezonesService, HelperService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/general");

    // Load the currencies
    $scope.currencies = CurrenciesService.getCurrencies();

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    $scope.helperService = HelperService;

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {
        $scope.settings = settings;

        $scope.typeahead = {};
        $scope.typeahead.reporting_currency_primary = _.find($scope.currencies, { code: settings.reporting_currency_primary });
        $scope.typeahead.reporting_currency_secondary = _.find($scope.currencies, { code: settings.reporting_currency_secondary });

        $scope.app_hosts = utils.arrayToString(settings.app_hosts);
        $scope.cors_allowed_origins = utils.arrayToString(settings.cors_allowed_origins);
        $scope.oauth_redirect_uris = utils.arrayToString(settings.oauth_redirect_uris);
        $scope.notification_from_addresses = utils.arrayToString(settings.notification_from_addresses);

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

    $scope.onCurrencySelect = function (item, model, label, type) {
        $scope.settings["reporting_currency_" + type] = model.code;
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

    $scope.updateSettings = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        if ($scope.app_hosts != null) {
            $scope.settings.app_hosts = utils.stringToArray($scope.app_hosts);
        }

        if ($scope.cors_allowed_origins != null) {
            $scope.settings.cors_allowed_origins = utils.stringToArray($scope.cors_allowed_origins);
        }

        if ($scope.oauth_redirect_uris != null) {
            $scope.settings.oauth_redirect_uris = utils.stringToArray($scope.oauth_redirect_uris);
        }

        if ($scope.notification_from_addresses != null) {
            $scope.settings.notification_from_addresses = utils.stringToArray($scope.notification_from_addresses);
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "General Settings", type: "success", url: "#/settings/general" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);



