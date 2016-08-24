app.controller("LicenseServicesListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.license_services = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "name";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = false;
        }
    }

    $scope.loadLicenseServices = function () {

        ApiService.getList(ApiService.buildUrl("/license_services?show=license_service_id,name,type,configuration.license_count,configuration.notify_at_count,date_created"), $scope.params).then(function (result) {
            $scope.license_services.license_serviceList = result;

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

    $scope.movePage = function (direction) {
        if (direction == "+") {
            $scope.params.offset = $scope.license_services.license_serviceList.next_page_offset;
        } else {
            $scope.params.offset = $scope.license_services.license_serviceList.previous_page_offset;
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
        $scope.loadLicenseServices();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadLicenseServices();

}]);


app.controller("LicenseServicesSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.licenses = {};
    $scope.licenses.list = null;
    $scope.exception = {};

    // Set defaults
    $scope.license_service = {};
    $scope.license_service.type = "list";

    $scope.license_service.configuration = {};
    $scope.license_service.configuration.format = "json";
    $scope.license_service.configuration.per_quantity = false;
    $scope.license_service.configuration.remove_after_use = true;
    $scope.license_service.configuration.notify_at_count = 100;

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/license_services/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url).then(function (license_service) {
            $scope.license_service = license_service;

            if ($scope.license_service.type == "list") {
                // Split the array into a line-delimited string
                $scope.licenses.list = utils.arrayToString($scope.license_service.configuration.licenses);

                // Set defaults for remote_url in case they toggle to it.
                $scope.license_service.configuration.format = "json";

            }

            if ($scope.license_service.type == "remote_url") {
                // Set defaults for list in case they toggle to it.
                $scope.license_service.configuration.per_quantity = false;
                $scope.license_service.configuration.remove_after_use = true;
                $scope.license_service.configuration.notify_at_count = 100;
            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    // We don't make a copy and check the copy for changes on this page because the list of licenses may be huge and duplicating it could be expensive.
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/license_services");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.addLicenseService = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        if ($scope.licenses.list != null && $scope.license_service.type == "list") {
            $scope.license_service.configuration.licenses = utils.stringToArray($scope.licenses.list);
        }

        ApiService.set($scope.license_service, ApiService.buildUrl("/license_services"), { show: "license_service_id,name" })
        .then(
        function (license_service) {
            GrowlsService.addGrowl({ id: "add_success", name: license_service.name, type: "success", license_service_id: license_service.license_service_id, url: "#/license_services/" + license_service.license_service_id + "/edit" });
            window.location = "#/license_services";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateLicenseService = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        if ($scope.licenses.list != null && $scope.license_service.type == "list") {
            $scope.license_service.configuration.licenses = utils.stringToArray($scope.licenses.list);
        }

        ApiService.set($scope.license_service, $scope.url, { show: "license_service_id,name" })
        .then(
        function (license_service) {
            GrowlsService.addGrowl({ id: "edit_success", name: license_service.name, type: "success", license_service_id: license_service.license_service_id, url: "#/license_services/" + license_service.license_service_id + "/edit" });
            utils.redirect($location, "/license_services");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.license_service.url)
        .then(
        function (license_service) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.license_service.name, type: "success" });
            utils.redirect($location, "/license_services");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);
