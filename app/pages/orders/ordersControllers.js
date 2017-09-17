app.controller("OrdersListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.orderListUrl = ApiService.buildUrl("/orders");

}]);

app.controller("OrdersViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.order = {};  
    $scope.payment = {};
    $scope.exception = {};
    $scope.count = {};
    $scope.count.shipments = 0;
    $scope.resources = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/orders/" + $routeParams.id);
    $scope.resources.shipmentListUrl = $scope.url + "/shipments";
    $scope.resources.refundListUrl = $scope.url + "/refunds";
    $scope.resources.notificationListUrl = $scope.url + "/notifications";

    // Load the order
    var params = { expand: "customer,payment.response_data,payment.payment_method,payment.gateway,payment.refunds.items,items.product,items.subscription,items.download.file,items.license.license_service,shipments", hide: "items.product.images,items.license.license_service.configuration", formatted: true };
    ApiService.getItem($scope.url, params).then(function (order) {
        $scope.order = order;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.$watch('order.fulfilled', function (newvalue, oldvalue) {
    // If the order changes to fulfilled, indicate that the order will be captured in a moment.
        if (oldvalue == false && newvalue == true) {
            if ($scope.order.payment.status == "pending" && $scope.order.payment.payment_method.type == "credit_card") {
                GrowlsService.addGrowl({ id: "payment_capture_scheduled", type: "success" });
                $scope.order.hideCapture = true;
            }
        }

    });

    $scope.hasPermission = function (resource, method) {
        return utils.hasPermission(resource, method);
    }

    $scope.downloadPdf = function () {

        ApiService.getItemPdf($scope.url).then(function (data) {

            var file = new Blob([data], { type: "application/pdf" });
            saveAs(file, "Order_" + $scope.order.order_id + ".pdf");

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);



