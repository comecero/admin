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
    $scope.data = { refunds: [] };
    $scope.refundParams = { show: "refund_id,date_created,date_modified,status,success,total,currency,shipping,tax,items.*", expand: "items" };
    $scope.hideCapture = true;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/orders/" + $routeParams.id);
    $scope.resources.shipmentListUrl = $scope.url + "/shipments";
    $scope.resources.paymentListUrl = $scope.url + "/payments";
    $scope.resources.refundListUrl = $scope.url + "/refunds";
    $scope.resources.notificationListUrl = $scope.url + "/notifications";

    // Load the order
    var params = { expand: "customer,payments.response_data,payments.payment_method,refunds,items.product,items.subscription,items.download.file,items.license.license_service,shipments", hide: "items.product.images,items.license.license_service.configuration", formatted: true };
    ApiService.getItem($scope.url, params).then(function (order) {
        $scope.order = order;
        $scope.payment = order.payments.data[0];
        if (order.payment_status == "pending") {
            $scope.hideCapture = false;
        }
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

    $scope.$watch("order.payment_status", function (newVal, oldVal) {
        if (newVal) {
            if (newVal != "pending") {
                $scope.hideCapture = true;
            }
        }
    });

}]);



