
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

//#endregion Payments



