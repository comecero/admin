app.controller("AppPackagesCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'CurrenciesService', 'TimezonesService', 'HelperService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, CurrenciesService, TimezonesService, HelperService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/app_packages/" + $routeParams.id);

    // Load the app package
    ApiService.getItem($scope.url).then(function (app_package) {
        $scope.app_package = app_package;

        // Make a copy of the original for comparision
        $scope.app_package_orig = angular.copy($scope.app_package);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.update = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.multipartForm($scope.app_package, null, $scope.url).then(function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "App Package " + $routeParams.id, type: "success", url: "#/app_packages/" + $routeParams.id + "/edit" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.download = function () {
        ApiService.set(null, $scope.url + "/download").then(function (download) {
            window.location = download.link;
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);



