app.controller("AccountsUpdateCtrl", ['$scope', '$location', 'ApiService', 'ConfirmService', 'GrowlsService', 'GeographiesService', function ($scope, $location, ApiService, ConfirmService, GrowlsService, GeographiesService) {

    $scope.exception = {};

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/accounts/" + localStorage.getItem("account_id"));

    $scope.confirmCancel = function () {
        if (angular.equals($scope.account, $scope.account_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    var geo = GeographiesService.getGeographies(false);
    $scope.countries = geo.countries;
    $scope.us_states = geo.us_states;
    $scope.ca_provinces = geo.ca_provinces;
    $scope.au_states = geo.au_states;

    // Load the account info
    if (utils.inTestMode() == false) {
        ApiService.getItem($scope.url).then(function (account) {
            $scope.account = account;

            // Make a copy of the original for comparision
            $scope.account_orig = angular.copy($scope.account);

            $scope.typeahead = {};
            $scope.typeahead.country = {};
            $scope.typeahead.state_prov = {};

            if ($scope.account.country != null) {
                $scope.typeahead.country = _.find($scope.countries, { code: $scope.account.country });
            }

            if ($scope.account.state_prov != null) {

                if ($scope.account.country == "US") {
                    $scope.typeahead.state_prov = _.find($scope.us_states, { code: $scope.account.state_prov });
                }

                if ($scope.account.country == "CA") {
                    $scope.typeahead.state_prov = _.find($scope.ca_provinces, { code: $scope.account.state_prov });
                }

                if ($scope.account.country == "AU") {
                    $scope.typeahead.state_prov = _.find($scope.au_states, { code: $scope.account.state_prov });
                }

            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.onCountrySelect = function (item, model, label) {
        $scope.account.country = model.code;
    }

    $scope.onStateSelect = function (item, model, label) {
        $scope.account.state_prov = model.code;
    }

    $scope.updateAccount = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.account, $scope.url)
        .then(
        function (account) {
            GrowlsService.addGrowl({ id: "edit_success_no_link", type: "success" });
            utils.redirect($location, "/");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.downloadContractPdf = function () {

        // Get the current contract
        ApiService.getItemPdf(ApiService.buildUrl("/contracts/current")).then(function (data) {

            var file = new Blob([data], { type: "application/pdf" });
            saveAs(file, "Contract_" + localStorage.getItem("account_id") + ".pdf");

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);