app.controller("TaxSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', "GeographiesService", function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.exception = {};
    $scope.geo = GeographiesService;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/tax");
    
     //Load the countries
    $scope.countries = $scope.geo.getGeographies().countries;

    // Add "EU" as an alias for all EU countries, which the API will accept
    $scope.countries.push({ code: "EU", name: "European Union" });

    // Re-sort
    $scope.countries = _.sortBy($scope.countries, "name");

    // We can't have an "All countries" option for tax rules, so make a copy to use for rule countries
    $scope.ruleCountries = angular.copy($scope.countries);

    // Add an option for all countries
    $scope.countries.unshift({code: "*", name: "All countries"})

    // Set up some models to hold user input.
    $scope.models = {};
    $scope.models.tax_inclusive_countries = [];
    $scope.models.gross_discount_countries = [];
    $scope.typeahead = {};

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;
        
        // Convert our tax inclusive countries to a country object
        _.each(settings.tax_inclusive_countries , function (item) {
            var country = _.findWhere($scope.countries, { code: item });
            if (country != null) {
                $scope.models.tax_inclusive_countries.push(country);
            }
        });
        
        // Convert our gross discount countries to a country object
        _.each(settings.gross_discount_countries , function (item) {
            var country = _.findWhere($scope.countries, { code: item });
            if (country != null) {
                $scope.models.gross_discount_countries.push(country);
            }
        });

        // Modify our rules slightly to make the a little easier to work with in the UI.
        _.each($scope.settings.rules, function (rule) {
            rule.country = _.find($scope.countries, { code: rule.country });
            rule.manual_rate = false;
            if (rule.rate != null) {
                rule.manual_rate = true;
            }

            if (rule.state_prov) {
                rule.state_prov = rule.state_prov.toUpperCase();
            }

        });

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });
  
    $scope.addNewRule = function(){  
        $scope.settings.rules.unshift({ manual_rate: true });
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

     $scope.onCountrySelect = function (item, model, label, type) {
         if (!_.findWhere($scope.models[type], { code: model.code })) {
             $scope.models[type].push(model);
         }
         // Clear the form value
         $scope.typeahead[type] = null;
     };

     $scope.removeCountry = function (country, type) {
         $scope.models[type] = _.reject($scope.models[type], function (item) {
             return item.code == country.code
         });
         // If the type is tax inclusive, also remove the same country from the gross discount country list. Only tax inclusive countries can be gross discount countries.
         if (type == "tax_inclusive_countries") {
             $scope.removeCountry(country, "gross_discount_countries");
         }
     }
    
    $scope.onRuleCountrySelect = function (item, model, label, event, rule) {
        if (model.code == "US" || model.code == "CA" || model.code == "EU" || $scope.geo.isEuCountry(model.code)) {
            rule.manual_rate = false;
        } else {
            rule.manual_rate = true;
        }
    }

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
        
        _.each(settingsCopy.rules, function (rule) {

            // If the rate is not manual, set the rate to null.
            if (!rule.manual_rate) {
                rule.rate = null;
            }

            // Remove the property manual_rate since it's not a part of the API model.
            delete rule.manual_rate;

            // Set the country to the country code
            rule.country = rule.country.code;

        });

        // Copy the countries from the models to settings
        settingsCopy.tax_inclusive_countries = _.pluck($scope.models.tax_inclusive_countries, "code");
        settingsCopy.gross_discount_countries = _.pluck($scope.models.gross_discount_countries, "code");

        ApiService.set(settingsCopy, $scope.url).then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Tax Settings", type: "success", url: "#/settings/tax" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);
