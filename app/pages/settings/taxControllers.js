app.controller("TaxSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', "GeographiesService", function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/tax");
    
     //Load the countries
    $scope.countries = GeographiesService.getGeographies().countries;

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;
        
        $scope.typeahead = {};
        

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
    
    $scope.addNewRule = function(){  
       $scope.settings.rules.unshift({});
    };
    
     $scope.deleteRule = function(rule, index){  
       $scope.settings.rules.splice(index, 1);
    };
    
    $scope.setCountryCode = function(item, model, label, rule){
        rule.country = item.code;
    };
    
    $scope.onTaxInclusiveCountrySelect = function(item, model, label, type){ 
        $scope.settings.tax_inclusive_countries.push(item.code);
    };
    
    $scope.onGrossDiscountCountrySelect = function(item, model, label, type){
        $scope.settings.gross_discount_countries.push(item.code);
    };

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

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Tax Settings", type: "success", url: "#/settings/tax" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);
