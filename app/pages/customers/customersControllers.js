
//#region Customers

app.controller("CustomersListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.customers = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.date_type == null) {
            $scope.params.date_type = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadCustomers = function () {

        ApiService.getList(ApiService.buildUrl("/customers?show=customer_id,name,email,has_payments,date_created&date_type=" + $scope.params.date_type + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.customers.customerList = result;

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

            // Set pagination
            $scope.setPagination($scope.customers.customerList);

        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.setPagination = function (customerList) {

        $scope.nav.before_item = null;
        $scope.nav.after_item = null;

        if (customerList.data.length > 0) {
            if (customerList.previous_page_url != null) {
                $scope.nav.before_item = customerList.data[0].customer_id;
            }
            if (customerList.next_page_url != null) {
                $scope.nav.after_item = customerList.data[customerList.data.length - 1].customer_id;
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
            $scope.params.after_item = $scope.nav.after_item;
            $scope.params.before_item = null;
        } else {
            $scope.params.after_item = null;
            $scope.params.before_item = $scope.nav.before_item;
        }
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }

    $scope.sort = function (date_type, desc) {
        $scope.params.date_type = date_type;
        $scope.params.desc = desc;
        $location.search($scope.params);
    }

    $scope.$on('$routeUpdate', function (e) {
        $scope.parseParams();
        $scope.loadCustomers();
    });

    // Initial load
    $scope.parseParams();
    $scope.params.has_payments = true;
    $scope.loadCustomers();

}]);

app.controller("CustomersViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'GeographiesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.customer = {};
    $scope.billing_address = {};
    $scope.shipping_address = {};
    $scope.cards = [];
    $scope.resources = {};
    $scope.edit = false;
    $scope.exception = {};

    $scope.count = {};
    $scope.count.orders = 0;
    $scope.count.payments = 0;
    $scope.count.subscriptions = 0;
    $scope.count.refunds = 0;
    $scope.count.invoices = 0;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/customers/" + $routeParams.id);
    $scope.resources.orderListUrl = $scope.url + "/orders";
    $scope.resources.subscriptionListUrl = $scope.url + "/subscriptions";
    $scope.resources.paymentListUrl = $scope.url + "/payments";
    $scope.resources.refundListUrl = $scope.url + "/refunds";
    $scope.resources.invoiceListUrl = $scope.url + "/invoices";

    // Load the customer
    ApiService.getItem($scope.url, { expand: "payment_methods" }).then(function (customer) {

        $scope.customer = customer;
        $scope.payment_methods = customer.payment_methods;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.hasPermission = function (resource, method) {
        return utils.hasPermission(resource, method);
    }

    $scope.refreshPaymentMethods = function () {

        // Refresh the "is_default" parameter of all payment methods since it may have changed when one of the cards was changed.
        ApiService.getList($scope.url + "/payment_methods").then(function (payment_methods) {
            $scope.payment_methods = payment_methods;
        });

    }

}]);

//#endregion Customers



