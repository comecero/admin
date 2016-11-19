
//#region LicenseRequests

app.controller("LicenseRequestsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.licenseRequests = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.status == null) {
            $scope.params.status = "completed";
        }

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadLicenseRequests = function () {
        
        ApiService.getList(ApiService.buildUrl("/license_requests", { expand: "order", show: "license_request_id,status,date_created,order.order_id" }), $scope.params).then(function (result) {
            $scope.licenseRequests.licenseRequestList = result;
            $scope.licenseRequestsChecked = false;

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

    $scope.movePage = function (direction, value) {

        if (direction == "+") {
            $scope.params.after_item = value;
            $scope.params.before_item = null;
        } else {
            $scope.params.after_item = null;
            $scope.params.before_item = value;
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
        $scope.loadLicenseRequests();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadLicenseRequests();

}]);

app.controller("LicenseRequestViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.licenseRequest = {};
    $scope.exception = {};
    $scope.options = {};

    $scope.options.raw = true;
    $scope.options.html = true;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/license_requests/" + $routeParams.id)

    // Load the service
    var params = { expand: "license,license_service", debug: true };
    ApiService.getItem($scope.url, params).then(function (licenseRequest) {

        $scope.licenseRequest = licenseRequest;

        if (licenseRequest.license) {

            // If the license is provided, prepare it for presentation.
            $scope.renderedLicenseText = licenseRequest.license.label + ":\n" + licenseRequest.license.text;
            if (licenseRequest.license.instructions) {
                $scope.renderedLicenseText += "\n\n" + licenseRequest.license.instructions;
            }

            $scope.renderedLicenseHtml = licenseRequest.license.label + "<br>" + licenseRequest.license.html;
            if (licenseRequest.license.instructions) {
                $scope.renderedLicenseHtml += "<br><br>" + licenseRequest.license.instructions;
            }

        }

        // Pretty format the licenseRequest data
        $scope.licenseRequest.order = JSON.stringify($scope.licenseRequest.order, null, 4)

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.retry = function () {

        // Clear any previous errors
        $scope.exception = {};

        ApiService.set(null, $scope.licenseRequest.url + "/retry").then(function (evnt) {
            GrowlsService.addGrowl({ id: "license_request_resend", type: "success" });
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    };

}]);

//#endregion Products



