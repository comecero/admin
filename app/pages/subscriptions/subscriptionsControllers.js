
//#region Subscriptions

app.controller("SubscriptionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.subscriptionListUrl = ApiService.buildUrl("/subscriptions");

}]);

app.controller("SubscriptionsViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.payment_method = null;
    $scope.invoices = {};
    $scope.model = {};
    $scope.model.subscription = {};
    $scope.resources = {};
    $scope.count = {};
    $scope.count.invoices = 0;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/subscriptions/" + $routeParams.id)

    // Prep the billing history
    $scope.resources.invoiceListUrl = $scope.url + "/invoices";

    // Load the subscription
    ApiService.getItem($scope.url, { expand: "subscription_plan,customer.payment_methods,items.subscription_terms,promotion", hide: "product.images", formatted: true }, {formatted: true}).then(function (subscription) {
        $scope.model.subscription = subscription;
    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.uncancel = function () {

        var data = { cancel_at_current_period_end: false };

        ApiService.set(data, $scope.url, { expand: "subscription_plan,customer.cards,product", hide: "product.images" }).then(function (subscription) {
            $scope.model.subscription = subscription;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);

//#endregion Subscriptions



