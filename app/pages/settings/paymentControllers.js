app.controller("PaymentSettingsCtrl", ['$scope', '$routeParams', '$location', '$timeout', 'GrowlsService', 'ApiService', 'ConfirmService', 'CurrenciesService', 'HelperService', function ($scope, $routeParams, $location, $timeout, GrowlsService, ApiService, ConfirmService, CurrenciesService, HelperService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/payment");

    // Load the currencies
    $scope.currencies = CurrenciesService.getCurrencies();

    // Load a place to hold your required fields settings
    $scope.required_fields = {};
    $scope.optional_fields = {};

    $scope.helperService = HelperService;

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        $scope.typeahead = {};
        $scope.typeahead.default_payment_currency = _.find($scope.currencies, { code: settings.default_payment_currency });

        $scope.refund_reasons = utils.arrayToString(settings.refund_reasons);
        $scope.chargeback_reasons = utils.arrayToString(settings.chargeback_reasons);
        $scope.blocked_countries = utils.arrayToString(settings.blocked_countries);

        // Load the fields into objects
        $scope.required_fields = loadFields(settings.customer_required_fields, $scope.required_fields);
        $scope.optional_fields = loadFields(settings.customer_optional_fields, $scope.optional_fields);

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.onCurrencySelect = function (item, model, label, type) {
        $scope.settings[type] = model.code;
    }

    $scope.toggleCustomerRequiredField = function (field) {
        if ($scope.required_fields[field]) {
            $scope.optional_fields[field] = false;
        }
    }

    $scope.toggleCustomerOptionalField = function (field) {
        if ($scope.optional_fields[field]) {
            $scope.required_fields[field] = false;
        }
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

        if ($scope.blocked_countries != null) {
            $scope.settings.blocked_countries = utils.stringToArray($scope.blocked_countries);
        }

        // Load the lists 
        $scope.settings.customer_required_fields = loadList($scope.required_fields);
        $scope.settings.customer_optional_fields = loadList($scope.optional_fields);

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Payment Settings", type: "success", url: "#/settings/payment" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);



