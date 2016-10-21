
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

app.controller("ShippingMethodsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', 'GeographiesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService, GeographiesService) {

    $scope.shippingMethod = {};
    $scope.exception = {};
    $scope.geo = GeographiesService;

    //Load the countries
    $scope.countries = $scope.geo.getGeographies().countries;

    // Add "EU" as an alias for all EU countries, which the API will accept
    $scope.countries.push({ code: "EU", name: "European Union" });

    // Re-sort
    $scope.countries = _.sortBy($scope.countries, "name");

    // Set up some models to hold user input.
    $scope.models = {};
    $scope.models.shipping_method_countries = [];
    $scope.typeahead = {};


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
            

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

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
     }

     $scope.addNewAdjustments = function () {
         $scope.shippingMethod.adjustments.unshift({});
     };
   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/shipping_methods");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.addShippingMethod = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.shippingMethod, ApiService.buildUrl("/shipping_methods"), { show: "shipping_method_id,name" }).then(function (shippingMethod) {
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
            return;
        }

        ApiService.set($scope.shippingMethod, $scope.url, { show: "shipping_method_id,name" })
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



