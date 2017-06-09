
//#region ShippingMethods

app.controller("ShippingMethodsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.shippingMethods = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadShippingMethods = function () {

        ApiService.getList(ApiService.buildUrl("/shipping_methods"), $scope.params).then(function (result) {
            $scope.shippingMethods.shippingMethodList = result;
            $scope.shippingMethodsChecked = false;

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    
    $scope.setParam = function (param, value) {
        $scope.params[param] = value;
        $scope.params.before_item = null;
        $scope.params.after_item = null;
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }

    $scope.search = function () {
        if ($scope.params.q != null) {

            // Reset the view to the first page
            $scope.params.offset = null;
            $scope.nav.scrollTop = true;

            // If empty, reset to null
            if ($scope.params.q == "") {
                $scope.params.q = null;
            }

            $location.search($scope.params);
        }
    }

    $scope.movePage = function (direction) {
        if (direction == "+") {
            $scope.params.offset = $scope.shippingMethods.shippingMethodList.next_page_offset;
        } else {
            $scope.params.offset = $scope.shippingMethods.shippingMethodList.previous_page_offset;
        }
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }

    $scope.sort = function (sort_by, desc) {
        $scope.params.sort_by = sort_by;
        $scope.params.desc = desc;
        $location.search($scope.params);
    }

    $scope.$on('$routeUpdate', function (e) {
        $scope.parseParams();
        $scope.loadShippingMethods();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadShippingMethods();

}]);

app.controller("ShippingMethodsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', 'GeographiesService', 'gettextCatalog', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService, GeographiesService, gettextCatalog) {

    $scope.shippingMethod = {
        quantity_config: { prices_per_quantity: [{ price: null, currency: null }], rules: [] },
        weight_config: { prices_per_unit: [{ price: null, currency: null }], rules: [] },
        subtotal_config: { rules: [] },
    };

    $scope.exception = {};
    $scope.geo = GeographiesService;
    var geographies =  $scope.geo.getGeographies();

    //Load the countries
    $scope.countries = geographies.countries;
    // Add a wildcard country option
    $scope.countries.push({ name: "All Countries", code: "*" });

    $scope.us_states = geographies.us_states;
    $scope.ca_provinces = geographies.ca_provinces;

    // Re-sort
    $scope.countries = _.sortBy($scope.countries, "name");

    //Adjustment countries
    $scope.adjustmentsEligibleCountries = ["US", "CA"];
    $scope.adjustmentCountries = [];

    // Get the pricing currencies available for the account
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

    // Set up some models to hold user input.
    $scope.models = {};
    $scope.models.shipping_method_countries = [];
    $scope.typeahead = {};
    $scope.shipping_method_config_type = null;
    $scope.units = [{ code: 'lb', name: 'pound' }, { code: 'oz', name: 'ounce' }, { code: 'kg', name: 'kilogram' }, { code: 'g', name: 'gram' }];

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/shipping_methods/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url).then(function (shippingMethod) {
            $scope.shippingMethod = shippingMethod;
            // Convert our tax inclusive countries to a country object
            _.each(shippingMethod.countries, function (item) {
                var country = _.findWhere($scope.countries, { code: item });
                if (country != null) {
                    $scope.models.shipping_method_countries.push(country);
                }
            });

            // Update adjustments creatable countries
            updateAdjustmentCountries('shipping_method_countries');

            // Update adjustments
            $scope.shippingMethod.adjustments = _.map($scope.shippingMethod.adjustments, mapAdjustments);

            // Set config type
            if ($scope.shippingMethod.subtotal_config) {
                $scope.shipping_method_config_type = 'subtotal';
                $scope.shippingMethod.quantity_config = { prices_per_quantity: [{ price: null, currency: null }] };
                $scope.shippingMethod.weight_config = { prices_per_unit: [{ price: null, currency: null }] };
                $scope.shippingMethod.subtotal_config.percent_of_subtotal = utils.decimalToPercent($scope.shippingMethod.subtotal_config.percent_of_subtotal);
            } else if($scope.shippingMethod.quantity_config){
                $scope.shipping_method_config_type = 'quantity';
                $scope.shippingMethod.weight_config = { prices_per_unit: [{ price: null, currency: null }] };
                $scope.shippingMethod.subtotal_config = {};
            } else if ($scope.shippingMethod.weight_config) {
                $scope.shipping_method_config_type = 'weight';
                $scope.shippingMethod.quantity_config = { prices_per_quantity: [{ price: null, currency: null }] };
                $scope.shippingMethod.subtotal_config = {};
            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

    }

    function mapAdjustments(adjustment) {
        adjustment._states = [];
        adjustment.typeahead = {};

        if (adjustment.percentage) {
            adjustment.adjustment_type = 'percentage';
            adjustment.percentage = utils.decimalToPercent(adjustment.percentage);
            adjustment.amounts = [];
        } else if (adjustment.amounts) {
            adjustment.adjustment_type = 'amounts';
        }

        if (adjustment.country == "US") {
            setAdjustmentStates(adjustment, 'us_states');
        } else if (adjustment.country == "CA") {
            setAdjustmentStates(adjustment, 'ca_provinces');
        }

        return adjustment;
    }

    function setAdjustmentStates(adjustment, states) {
        _.each(adjustment.regions, function (item) {
            var state_prev = _.findWhere($scope[states], { code: item });
            if (state_prev != null) {
                adjustment._states.push(state_prev);
            }
        });
        return adjustment;
    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    //Country handlers
     $scope.onCountrySelect = function (item, model, label, type) {
         if (!_.findWhere($scope.models[type], { code: model.code })) {
             $scope.models[type].push(model);
         }
         // Clear the form value
         $scope.typeahead[type] = null;
         updateAdjustmentCountries(type);
     };

     $scope.removeCountry = function (country, type) {
         $scope.models[type] = _.reject($scope.models[type], function (item) {
             return item.code == country.code;
         });

         updateAdjustmentCountries(type);
     };

     $scope.onRuleCurrencySelect = function (item, model, label, event, rule) {
         rule.currency = model.code;
     }

    //Adjustments handlers
     function updateAdjustmentCountries(type) {
         $scope.adjustmentCountries = _.filter($scope.models[type], function (model) {
             return $scope.adjustmentsEligibleCountries.indexOf(model.code) != -1;
         });
     }

     function canHaveAdjustments() {
         return !!$scope.adjustmentCountries.length;
     }

     $scope.addNewAdjustment = function () {
         var adjustment = {
             amounts: [{ price: null, currency: null }],
             _states: [],
             typeahead: {},
         };
         $scope.shippingMethod.adjustments ? $scope.shippingMethod.adjustments.unshift(adjustment) : $scope.shippingMethod.adjustments = [adjustment];
     };

     $scope.removeAdjustment = function (method, adjustment, index) {
         $scope.shippingMethod.adjustments.splice(index, 1);
     };

    //Adjustment state handlers
     $scope.onStateSelect = function (adjustment, item, model, label) {
         if (!_.findWhere(adjustment._states, { code: model.code })) {
             adjustment._states.push(model);
         }
         // Clear the form value
         adjustment.typeahead.state_prov = null;
     };

     $scope.removeState = function (adjustment, state) {
         adjustment._states = _.reject(adjustment._states, function (item) {
             return item.code == state.code;
         });
     };

    //Subtotal config rules handlers
     $scope.addNewRule = function (config, defaultConfig) {
         if (!$scope.shippingMethod[config].rules) {
             $scope.shippingMethod[config].rules = [];
         }
         $scope.shippingMethod[config].rules.unshift(defaultConfig || {});
     };

     $scope.removeRule = function (method, config, rule, index) {
         $scope.shippingMethod[config].rules.splice(index, 1);
     };
   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/shipping_methods");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.confirmDelete = function (method, configType, ruleObj, index, arg1) {
        var confirm = { id: "delete" };
        confirm.onConfirm = method.bind($scope, method, configType, ruleObj, index, arg1);
        ConfirmService.showConfirm($scope, confirm);
    }

    function getShippingMethodCopy() {
        // Map our UI to our rules before sending them to the API. We'll make a copy to preserve the UI.
        var shippingMethodCopy = angular.copy($scope.shippingMethod);

        // Copy the countries from the models to settings
        shippingMethodCopy.countries = _.pluck($scope.models.shipping_method_countries, "code");

        //Update adjustments
        if (!canHaveAdjustments()) {
            shippingMethodCopy.adjustments = null;
        } else {
            shippingMethodCopy.adjustments = _.map(shippingMethodCopy.adjustments, reMapAdjustments);
        }

        //Update config
        if ($scope.shipping_method_config_type == 'subtotal') {
            shippingMethodCopy.quantity_config = null;
            shippingMethodCopy.weight_config = null;
            shippingMethodCopy.subtotal_config.percent_of_subtotal = utils.percentToDecimal(shippingMethodCopy.subtotal_config.percent_of_subtotal);
        } else if ($scope.shipping_method_config_type == 'quantity') {
            shippingMethodCopy.subtotal_config = null;
            shippingMethodCopy.weight_config = null;
        } else if ($scope.shipping_method_config_type = 'weight') {
            shippingMethodCopy.subtotal_config = null;
            shippingMethodCopy.quantity_config = null;
        }

        return shippingMethodCopy;
    }

    function reMapAdjustments(adjustment) {
        adjustment.adjustment_type == 'percentage' ? adjustment.amounts = null : adjustment.percentage = null;
        adjustment.regions = _.pluck(adjustment._states, "code");
        if (adjustment.percentage) {
            adjustment.percentage = utils.percentToDecimal(adjustment.percentage);
        }
        delete adjustment.adjustment_type;
        return adjustment;
    }

    $scope.addShippingMethod = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return;
        }

        var shippingMethodCopy = getShippingMethodCopy();

        ApiService.set(shippingMethodCopy, ApiService.buildUrl("/shipping_methods"), { show: "shipping_method_id,name" }).then(function (shippingMethod) {
            GrowlsService.addGrowl({ id: "add_success", name: shippingMethod.shipping_method_id, type: "success", shipping_method_id: shippingMethod.shipping_method_id, url: "#/shipping_methods/" + shippingMethod.shipping_method_id + "/edit" });
            window.location = "#/shipping_methods";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateShippingMethod = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return;
        }

        var shippingMethodCopy = getShippingMethodCopy();

        ApiService.set(shippingMethodCopy, $scope.url, { show: "shipping_method_id,name" })
        .then(
        function (shippingMethod) {
            GrowlsService.addGrowl({ id: "edit_success", name: shippingMethod.shipping_method_id, type: "success", shipping_method_id: shippingMethod.shipping_method_id, url: "#/shipping_methods/" + shippingMethod.shipping_method_id + "/edit" });
            window.location = "#/shipping_methods";
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.shippingMethod.url)
        .then(
        function (shippingMethod) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.shippingMethod.shipping_method_id, type: "success" });
            utils.redirect($location, "/shipping_methods");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

//#endregion Products



