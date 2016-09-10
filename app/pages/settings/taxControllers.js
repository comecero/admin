app.controller("TaxSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', "GeographiesService", function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/tax");
    
     //Load the countries
    $scope.countries = GeographiesService.getGeographies().countries;
    $scope.models = {};
    $scope.models.selectedTaxInclusiveCountries = [];
    $scope.models.selectedGrossDiscountCountries = [];

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;
        
        $scope.typeahead = {};
        
        // Load selected tax inclusive countries
        _.each(settings.tax_inclusive_countries , function (item) {
            var country = _.findWhere($scope.countries, { code: item });
            if (country != null) {
                $scope.models.selectedTaxInclusiveCountries.push(country);
            }
        });
        
        // Load selected gross discount countries
        _.each(settings.gross_discount_countries , function (item) {
            var country = _.findWhere($scope.countries, { code: item });
            if (country != null) {
                $scope.models.selectedGrossDiscountCountries.push(country);
            }
        });
        
        // map rules countries
        $scope.settings.rules = _.map(settings.rules , function (rule) {
             var country = _.findWhere($scope.countries, { code: rule.country });
            rule._country = country.name;
            rule._rate = rule.rate ? true : '';
           return rule;
        });
        

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
    
    $scope.confirmDelete = function (rule, index) {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteRule(rule, index);
        }
        ConfirmService.showConfirm($scope, confirm);
    }
    
     $scope.deleteRule = function(rule, index){  
       $scope.settings.rules.splice(index, 1);
    };
    
    $scope.setCountryCode = function(item, model, label, rule){
        rule.country = item.code;
    };
    
    
    $scope.onTaxInclusiveCountrySelect = function(item, model, label, type){ 
        if (!_.findWhere($scope.models.selectedTaxInclusiveCountries, { code: model.code })) {
            $scope.models.selectedTaxInclusiveCountries.push(model);
        }

        // Clear the form value
        $scope.typeahead.tax_inclusive_countries = null;
    };
    
    $scope.removeTaxInclusiveCountry = function (currency) {

        $scope.models.selectedTaxInclusiveCountries = _.reject($scope.models.selectedTaxInclusiveCountries, function (item) {
            return item.code == currency.code
        });

    }
    
    $scope.onGrossDiscountCountrySelect = function(item, model, label, type){
        if (!_.findWhere($scope.models.selectedGrossDiscountCountries, { code: model.code })) {
            $scope.models.selectedGrossDiscountCountries.push(model);
        }

        // Clear the form value
        $scope.typeahead.gross_discount_countries = null;
    };
    
    $scope.removeGrossDiscountCountry = function (currency) {

        $scope.models.selectedGrossDiscountCountries = _.reject($scope.models.selectedGrossDiscountCountries, function (item) {
            return item.code == currency.code
        });

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
