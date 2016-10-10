app.controller("PricingSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', "GeographiesService", function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/pricing");

    //Get currencies
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));
    $scope.currencies.unshift({ code: null, name: 'All other countries' });

    $scope.methods = [{ name: 'Highest', value: 'highest' }, { name: 'Lowest', value: 'lowest' }, { name: 'Closest', value: 'closest' }];

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {
        _.each(settings.currency_rounding_rules, function (rule) {
            rule._positions = _.map(rule.positions, function (pos) {
                return { value: pos };
            });
        });

        _.each(settings.currency_markup_rules, function (rule) {
            rule.markup_percentage_value = rule.markup_percentage * 100;
        });

        $scope.settings = settings;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });
  
    $scope.addNew = function(prop, val){  
        $scope.settings[prop].unshift(val);
    };
    
    $scope.confirmDelete = function (prop, rule, index) {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteRule(prop, rule, index);
        }
        ConfirmService.showConfirm($scope, confirm);
    }
    
     $scope.deleteRule = function(prop, rule, index){  
       $scope.settings[prop].splice(index, 1);
     };

     $scope.addRoundingPosition = function (rule) {
         rule._positions.push({});
     };

     $scope.removeRoundingPosition = function (rule, index) {
         rule._positions.splice(index, 1);
     };

   

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.updateSettings = function (form) {

        // Clear any previous errors
        $scope.exception.error = null;

        if ($scope.form.$invalid) {
            return;
        }

        // Map our UI to our rules before sending them to the API. We'll make a copy to preserve the UI.
        var settingsCopy = angular.copy($scope.settings);
        _.each(settingsCopy.currency_rounding_rules, function (rule) {
            rule.positions = _.map(rule._positions, function (pos) {
                return pos.value;
            });
        });

        _.each(settingsCopy.currency_markup_rules, function (rule) {
            rule.markup_percentage = rule.markup_percentage_value / 100;
        });

        ApiService.set(settingsCopy, $scope.url).then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Pricing Settings", type: "success", url: "#/settings/pricing" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);
