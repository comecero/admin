app.controller("CartsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.cartListUrl = ApiService.buildUrl("/carts");

}]);

app.controller("CartsViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.cart = {};  
    $scope.payment = {};
    $scope.exception = {};
    $scope.count = {};
    $scope.count.payments = 0;
    $scope.resources = {};
    $scope.functions = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/carts/" + $routeParams.id);
    $scope.resources.paymentListUrl = $scope.url + "/payments";

    // Load the cart
    var params = {expand: "customer,items.product,payments,payments.payment_method", hide: "items.product.images", formatted: true};
    ApiService.getItem($scope.url, params).then(function (cart) {

        $scope.cart = cart;
        
        // If one of the payments was successful, pluck it.
        $scope.successful_payment = _.findWhere($scope.cart.payments.data, { success: true });

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.hasPermission = function (resource, method) {
        return utils.hasPermission(resource, method);
    }

    // Watch for a captured payment
    $scope.$watch('successful_payment.status', function (newvalue, oldvalue) {
        // Update the payment in the cart payment 
        if ($scope.successful_payment && oldvalue != undefined) {
            $scope.cart.payment_status = $scope.successful_payment.status;
        }
    });

}]);


