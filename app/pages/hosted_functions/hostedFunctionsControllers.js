app.controller("HostedFunctionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.hostedFunctions = {};
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

    $scope.loadHostedFunctions = function () {

        ApiService.getList(ApiService.buildUrl("/hosted_functions?show=hosted_function_id,filename,name,environment,bytes,date_created"), $scope.params).then(function (result) {
            $scope.hostedFunctions.hostedFunctionList = result;

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
            $scope.params.offset = $scope.hostedFunctions.hostedFunctionList.next_page_offset;
        } else {
            $scope.params.offset = $scope.hostedFunctions.hostedFunctionList.previous_page_offset;
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
        $scope.loadHostedFunctions();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadHostedFunctions();

}]);


app.controller("HostedFunctionsAddCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    // Set defaults
    $scope.hostedFunction = { environment_variables: {}};
    $scope.exception = {};
    $scope.environmentVariables = [];

    $scope.uploadSending = false;
    var uploadSendingListener = $scope.$on('uploadSending', function (event, sending) {
        // Set uploadSending to the received value
        $scope.$apply(function () {
            $scope.uploadSending = sending;
        });
    });

    var uploadDeleteListener = $scope.$on('uploadDelete', function (event, uploadResponse, hostedFunction) {

        var confirm = { id: "delete" };
        confirm.onConfirm = function () {

            // Let the upload directive know the user deleted the hostedFunction so it can remove the upload preview display
            $scope.$broadcast("uploadDeleted", hostedFunction);

            ApiService.remove(uploadResponse.url, null, false);
            utils.redirect($location, "/hosted_functions");
        }
        ConfirmService.showConfirm($scope, confirm);

    });

    var uploadCompleteListener = $scope.$on('uploadComplete', function (event, hostedFunction) {
        GrowlsService.addGrowl({ id: "add_success", name: hostedFunction.name, type: "success", hosted_function_id: hostedFunction.hosted_function_id, url: "#/hosted_functions/" + hostedFunction.hosted_function_id + "/edit" });
        utils.redirect($location, "/hosted_functions");
    });

    // TO_DO figure out when to call this. On route change?
    var cancelListeners = function () {
        uploadSendingListener();
        uploadDeleteListener();
        uploadCompleteListener();
    }

    $scope.addVariable = function () {
        $scope.environmentVariables.push({ name: null, value: null });
        $scope.setVariables();
    }

    $scope.removeVariable = function (variables, index) {
        variables.splice(index, 1);
        $scope.setVariables();
    }

    $scope.setVariables = function () {

        // Loop through all the variables and set any that have both a name and value.
        var variables = {};
        $.each($scope.environmentVariables, function (index, item) {
            if (!utils.isNullOrEmpty(item.name) && !utils.isNullOrEmpty(item.value)) {
                variables[item.name] = item.value;
            }
        });

        $scope.environment_variables_json = JSON.stringify(variables);
    }

    $scope.cancel = function () {
        if ($scope.uploadSending) {
            var confirm = { id: "upload_cancel" };
            confirm.onConfirm = function () {
                // Let the upload directive know the user cancelled the upload so it can stop sending data.
                $scope.$broadcast("uploadCanceled");
                utils.redirect($location, "/hosted_functions");
            }
            ConfirmService.showConfirm($scope, confirm);
        } else {
            utils.redirect($location, "/hosted_functions");
        }
    };

}]);


app.controller("HostedFunctionsEditCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    // Set defaults
    $scope.hostedFunction = {};
    $scope.exception = {};
    $scope.environmentVariables = [];

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/hosted_functions/" + $routeParams.id)
    $scope.uploadUrl = "/hosted_functions/" + $routeParams.id;

    // Load the hostedFunction
    ApiService.getItem($scope.url).then(function (hostedFunction) {
        $scope.hostedFunction = hostedFunction;

        if (hostedFunction.environment_variables) {
            for (var property in hostedFunction.environment_variables) {
                if (hostedFunction.environment_variables.hasOwnProperty(property)) {
                    $scope.environmentVariables.push({ name: property, value: hostedFunction.environment_variables[property] });
                }
            }
        }

        // Make a copy of the original for comparision
        $scope.hostedFunction_orig = angular.copy($scope.hostedFunction);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.confirmCancel = function () {
        if (angular.equals($scope.hostedFunction, $scope.hostedFunction_orig)) {
            utils.redirect($location, "/hosted_functions");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/hosted_functions");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.uploadSending = false;
    var uploadSendingListener = $scope.$on('uploadSending', function (event, sending) {
        // Set uploadSending to the received value
        $scope.$apply(function () {
            $scope.uploadSending = sending;
        });
    });

    var uploadResponseListener = $scope.$on('uploadComplete', function (event, uploadResponse) {
        $scope.$apply(function () {
            $scope.hostedFunction = uploadResponse;
        });
    });

    // TO_DO figure out when to call this. On route change? NEED TO DO FOR IMAGES AS WELL.
    var cancelListeners = function () {
        uploadSendingListener();
    }

    $scope.cancelUpload = function () {
        if ($scope.uploadSending) {
            var confirm = { id: "upload_cancel" };
            confirm.onConfirm = function () {
                // Let the upload directive know the user cancelled the upload so it can stop sending data.
                $scope.$broadcast("uploadCanceled");
                utils.redirect($location, "/hosted_functions");
            }
            ConfirmService.showConfirm($scope, confirm);
        } else {
            utils.redirect($location, "/hosted_functions");
        }
    };

    $scope.addVariable = function () {
        $scope.environmentVariables.push({ name: null, value: null });
    }

    $scope.removeVariable = function (variables, index) {
        variables.splice(index, 1);
    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;

        // Map variables array to object
        $scope.hostedFunction.environment_variables = {};
        for (var variable in $scope.environmentVariables) {
            if (!utils.isNullOrEmpty($scope.environmentVariables[variable].name) && !utils.isNullOrEmpty($scope.environmentVariables[variable].value))
            $scope.hostedFunction.environment_variables[$scope.environmentVariables[variable].name] = $scope.environmentVariables[variable].value;
        }
        $scope.hostedFunction.environment_variables = JSON.stringify($scope.hostedFunction.environment_variables);
    }

    $scope.updateHostedFunction = function () {

        prepareSubmit();

        ApiService.multipartForm($scope.hostedFunction, null, $scope.hostedFunction.url, { show: "hosted_function_id,name" }).then(function (hostedFunction) {
            GrowlsService.addGrowl({ id: "edit_success", name: hostedFunction.name, type: "success", hosted_function_id: hostedFunction.hosted_function_id, url: "#/hosted_functions/" + hostedFunction.hosted_function_id + "/edit" });
            utils.redirect($location, "/hosted_functions");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteHostedFunction();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.deleteHostedFunction = function () {

        ApiService.remove($scope.hostedFunction.url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.hostedFunction.name, type: "success" });
            utils.redirect($location, "/hosted_functions");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);
