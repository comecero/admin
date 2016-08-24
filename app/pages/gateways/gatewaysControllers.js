
//#region Gateways

app.controller("GatewaysListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.gateways = {};
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

    $scope.loadGateways = function () {

        ApiService.getList(ApiService.buildUrl("/gateways?show=gateway_id,name,active,payment_method_type,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.gateways.gatewayList = result;
            $scope.gatewaysChecked = false;

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

    $scope.setActive = function (active) {

        // Find the checked items
        var items = _.where($scope.gateways.gatewayList.data, { checked: true });

        // Keep track of the items that succeed and fail
        $scope.successItems = [];
        $scope.failItems = [];

        // Loop through the checked ones and update.
        var defer = $q.defer();
        var promises = [];

        _.each(items, function (gateway) {
            // We slim the request by trimming the resource since we're only modifying a couple properties.
            promises.push(ApiService.set({ gateway_id: gateway.gateway_id, active: active }, gateway.url).then(function (data) {
                gateway.active = data.active;
                $scope.successItems.push(gateway);
            }, function (error) {
                $scope.failItems.push(gateway);
                GrowlsService.addGrowl({ id: "active_change_failure", "name": gateway.name, type: "danger" });
            }));
        });

        $q.all(promises).then(complete);

        function complete() {

            if ($scope.successItems.length > 0) {
                if (active == true) {
                    GrowlsService.addGrowl({ id: "activate_success", count: $scope.successItems.length });

                } else {
                    GrowlsService.addGrowl({ id: "inactivate_success", count: $scope.successItems.length });
        }
    }

}
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
            $scope.params.offset = $scope.gateways.gatewayList.next_page_offset;
        } else {
            $scope.params.offset = $scope.gateways.gatewayList.previous_page_offset;
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
        $scope.loadGateways();
    });

    $scope.checkGateway = function (gateway) {
        if (gateway.checked) {
            gateway.checked = false;
            $scope.gatewaysChecked = false;
            _.each($scope.gateways.gatewayList.data, function (item) {
                if (item.checked) {
                    $scope.gatewaysChecked = true;
                }
            });
        } else {
            gateway.checked = true;
            $scope.gatewaysChecked = true;
        }
    }

    // Initial load
    $scope.parseParams();
    $scope.loadGateways();

}]);

app.controller("GatewaysSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.exception = {};
    $scope.models = {};
    $scope.models.selectedCurrencies = [];
    $scope.models.selectedCardTypes = [];
    $scope.showFields = false;
    $scope.gateway_config = {};

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/gateways/" + $routeParams.id)

        // Load the gateway
        ApiService.getItem($scope.url, { show_sensitive: true }).then(function (gateway) {
            $scope.gateway = gateway;

            // Get the gateway options object
            ApiService.getItem(ApiService.buildUrl("/gateways/options")).then(function (gatewayOptions) {

                $scope.gateway_configs = gatewayOptions.gateway_configs;
                $scope.currencies = gatewayOptions.currencies;
                $scope.card_types = gatewayOptions.card_types;

                // Load selected currencies
                _.each(gateway.currencies, function (item) {
                    var currency = _.findWhere($scope.currencies, { code: item });
                    if (currency != null) {
                        $scope.models.selectedCurrencies.push(currency);
                    }
                });

                // Load selected card types
                _.each(gateway.card_types, function (item) {
                    $scope.models.selectedCardTypes.push(item);
                });

                $scope.loadFields(gateway.provider_id);

            }, function (error) {
                $scope.exception.error = error;
            });

            // Make a copy of the original for comparision
            $scope.gateway_orig = angular.copy($scope.gateway);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.gateway = { active: false, payment_method_type: "credit_card", currencies: [], card_types: [], fields: {} };

        // Get the gateway options object
        ApiService.getItem(ApiService.buildUrl("/gateways/options")).then(function (gatewayOptions) {

            $scope.gateway_configs = gatewayOptions.gateway_configs;
            //$scope.payment_method_types = _.uniq(_.pluck($scope.gateway_configs, "payment_method_type"));
            $scope.currencies = gatewayOptions.currencies;
            $scope.card_types = gatewayOptions.card_types;

        }, function (error) {
            $scope.exception.error = error;
        });

    }

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

        // Convert the selected currencies to a list of currency codes
        $scope.gateway.currencies = _.pluck($scope.models.selectedCurrencies, "code");

        // Convert the selected card types to a list of currency codes
        $scope.gateway.card_types = $scope.models.selectedCardTypes;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.gateway, $scope.gateway_orig)) {
            utils.redirect($location, "/gateways");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/gateways");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.addGateway = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.gateway, ApiService.buildUrl("/gateways"), { show: "gateway_id,name" })
        .then(
        function (gateway) {
            GrowlsService.addGrowl({ id: "add_success", name: gateway.name, type: "success", gateway_id: gateway.gateway_id, url: "#/gateways/" + gateway.gateway_id + "/edit" });

            // Refresh the account meta since a gateway currency may have changed
            SettingsService.setAccountMeta();

            utils.redirect($location, "/gateways");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateGateway = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.gateway, $scope.url, { show: "gateway_id,name" })
        .then(
        function (gateway) {
            GrowlsService.addGrowl({ id: "edit_success", name: gateway.name, type: "success", url: "#/gateways/" + gateway.gateway_id + "/edit" });

            // Refresh the account meta since a gateway currency may have changed
            SettingsService.setAccountMeta();

            utils.redirect($location, "/gateways");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.loadGatewayConfig = function (provider_id) {

        $scope.gateway_config = _.findWhere($scope.gateway_configs, { provider_id: $scope.gateway.provider_id });
        
        if ($scope.gateway_config.payment_method_types.length == 1) {
            $scope.gateway.payment_method_type = $scope.gateway_config.payment_method_types[0];
        }

        $scope.loadFields(provider_id);

    }

    $scope.loadFields = function (provider_id) {

        var gatewayConfig = _.findWhere($scope.gateway_configs, { provider_id: provider_id });
        if (gatewayConfig) {
            if (gatewayConfig.fields.length > 0) {
                $scope.fields = gatewayConfig.fields;
            } else {
                $scope.fields = null;
            }
        }
    }

    $scope.onCurrencySelect = function (item, model, label) {

        if (!_.findWhere($scope.models.selectedCurrencies, { code: model.code })) {
            $scope.models.selectedCurrencies.push(model);
        }

        // Clear the form value
        $scope.typeahead.currency = null;
    }

    $scope.removeCurrency = function (currency) {

        $scope.models.selectedCurrencies = _.reject($scope.models.selectedCurrencies, function (item) {
            return item.code == currency.code
        });

    }

    $scope.onCardTypeSelect = function (item, model, label) {

        $scope.models.selectedCardTypes.push(model);

        // Clear the form value
        $scope.typeahead.card_types = null;
    }

    $scope.removeCardType = function (card_type) {

        $scope.models.selectedCardTypes = _.reject($scope.models.selectedCardTypes, function (item) {
            return item == card_type
        });

    }

    $scope.supportsCreditCard = function (provider_id) {

        if (provider_id && $scope.gateway_configs) {
            var gatewayConfig = _.findWhere($scope.gateway_configs, { provider_id: $scope.gateway.provider_id });
            if (gatewayConfig) {
                if (gatewayConfig.payment_method_types.indexOf("credit_card") > -1) {
                    return true;
                }
            }
        }

        return false;

    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.delete = function () {

        ApiService.remove($scope.url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.gateway.name, type: "success" });
            utils.redirect($location, "/gateways");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);

//#endregion Products



