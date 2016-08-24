app.controller("NotificationsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.notificationListUrl = ApiService.buildUrl("/notifications");

}]);

app.controller("NotificationsViewCtrl", ['$scope', '$routeParams', 'ApiService', 'GrowlsService', '$sce', function ($scope, $routeParams, ApiService, GrowlsService, $sce) {

    $scope.notification = {};
    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/notifications/" + $routeParams.id);
    $scope.previewUrl = null;
    $scope.showResend = false;

    // Load the notification
    var params = { expand: "customer", hide: "data" };
    ApiService.getItem($scope.url, params).then(function (notification) {
        $scope.notification = notification;
        $scope.previewUrl = $sce.trustAsResourceUrl("/app/pages/notifications/preview/index.html?notification_id=" + notification.notification_id);
        $scope.email = notification.customer.email;
    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.resend = function (form) {

        if (form.$invalid) {
            return;
        }

        var body = { destination: $scope.email };
        ApiService.set(body, $scope.url + "/resend", { show: "notification_id" } ).then(function (response) {
            GrowlsService.addGrowl({ id: "notification_resend", email: $scope.email, type: "success" });
            $scope.showResend = false;
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);

app.controller("NotificationsPreviewCtrl", ['$scope', '$routeParams', 'ApiService', function ($scope, $routeParams, ApiService) {

    $scope.notification = {};
    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/notifications/" + $routeParams.id)

    // Load the notification
    var params = { show: "body" };
    ApiService.getItem($scope.url, params).then(function (notification) {
        $scope.notification = notification;
    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

}]);



