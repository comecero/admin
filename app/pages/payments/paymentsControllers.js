
//#region Payments

app.controller("PaymentsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.paymentListUrl = ApiService.buildUrl("/payments");

}]);

app.controller("PaymentsViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.payment = {};
    $scope.exception = {};
    $scope.fee_currency = null;
    $scope.currencyType = "transaction";

    $scope.prefs = {}
    $scope.prefs.loadRefundDetails = false;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/payments/" + $routeParams.id)

    // Set the url for pulling the full refund details
    $scope.refundListUrl = $scope.url + "/refunds";

    // Load the payment
    var params = { expand: "customer,payment_method,response_data,gateway,fees,commissions,order,refunds.items" };
    ApiService.getItem($scope.url, params).then(function (payment) {
        $scope.payment = payment;

        if (payment.fees.data.length > 0) {
            $scope.fee_currency = payment.fees.data[0].currency;
        }

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

}]);

app.controller("PaymentsAddCtrl", ['$scope', '$location', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', 'GeographiesService', function ($scope, $location, $routeParams, ApiService, ConfirmService, GrowlsService, GeographiesService) {

    $scope.payment = { payment_method: { type: "credit_card" }, capture: true };
    $scope.exception = {};
    $scope.functions = {};
    $scope.data = {};
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

    var geo = GeographiesService.getGeographies(false);
    $scope.countries = geo.countries;

    $scope.typeahead = {};
    $scope.typeahead.country = {};

    // Pre-select USD if a valid currency
    if (_.find($scope.currencies, function (currency) { return currency.code == "USD" }) != null) {
        $scope.payment.currency = "USD";
    } else {
        // Select the top currency
        $scope.payment.currency = $scope.currencies[0].code;
    }

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/payments")

    $scope.removeCustomer = function () {
        delete $scope.payment.customer;
        delete $scope.payment.customer_id;
        delete $scope.payment.payment_method;
        $scope.payment_methods = null;
        $scope.payment.payment_method = { type: "credit_card" };
    }

    $scope.functions.onCustomerSelect = function (customer) {

        delete $scope.payment.customer_id;
        $scope.payment.payment_method = { type: "credit_card", capture: $scope.capture };

        if (customer.billing_address && customer.billing_address.country) {
            var country = _.find($scope.countries, function (c) { return c.code == customer.billing_address.country });
            $scope.typeahead.country = country;
        }

        // Get the payment methods for the customer
        ApiService.getItem(customer.payment_methods).then(function (paymentMethods) {

            $scope.payment_methods = paymentMethods;

            // Define the default
            if (paymentMethods.data.length) {
                $scope.payment.payment_method = _.find(paymentMethods.data, function (i) { return i.is_default == true });
            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.functions.setPaymentMethod = function (paymentMethod) {

        if (paymentMethod) {
            // Set the supplied payment method
            $scope.payment.payment_method = paymentMethod;
        } else {
            // Set a blank payment method
            $scope.payment.payment_method = { type: "credit_card" };
        }

    }

    $scope.createPayment = function () {

        $scope.exception = {};

        // Remove the username property
        if ($scope.payment.customer) {
            delete $scope.payment.customer.username;
            if ($scope.payment.customer.billing_address) {
                $scope.payment.customer.billing_address.country = $scope.typeahead.country.code;
            }
        }

        // If missing, set it to explicitly false.
        if (!$scope.payment.payment_method.save) {
            $scope.payment.payment_method.save = false;
        }

        // Get the payment methods for the customer
        ApiService.set($scope.payment, $scope.url, { formatted: true }).then(function (payment) {
            
            GrowlsService.addGrowl({ id: "payment_created_success", "payment_id": payment.payment_id, url: "#/payments/" + payment.payment_id, amount: payment.formatted.total, currency: payment.currency, type: "success" });
            utils.redirect($location, "/payments/" + payment.payment_id);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);

//#endregion Payments



