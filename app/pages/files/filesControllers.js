app.controller("FilesListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.files = {};
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

    $scope.loadFiles = function () {

        ApiService.getList(ApiService.buildUrl("/files?show=file_id,filename,name,version,bytes,date_created"), $scope.params).then(function (result) {
            $scope.files.fileList = result;

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
            $scope.params.offset = $scope.files.fileList.next_page_offset;
        } else {
            $scope.params.offset = $scope.files.fileList.previous_page_offset;
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
        $scope.loadFiles();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadFiles();

}]);


app.controller("FilesAddCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    // Set defaults
    $scope.file = {};
    $scope.file.expires_in_days = 7;
    $scope.file.expires_in_clicks = 10;
    $scope.options = { by_url: false };
    $scope.exception = {};

    $scope.uploadSending = false;
    var uploadSendingListener = $scope.$on('uploadSending', function (event, sending) {
        // Set uploadSending to the received value
        $scope.$apply(function () {
            $scope.uploadSending = sending;
        });
    });

    var uploadDeleteListener = $scope.$on('uploadDelete', function (event, uploadResponse, file) {

        var confirm = { id: "delete" };
        confirm.onConfirm = function () {

            // Let the upload directive know the user deleted the file so it can remove the upload preview display
            $scope.$broadcast("uploadDeleted", file);

            ApiService.remove(uploadResponse.url, null, false);
            utils.redirect($location, "/files");
        }
        ConfirmService.showConfirm($scope, confirm);

    });

    var uploadCompleteListener = $scope.$on('uploadComplete', function (event, file) {
        GrowlsService.addGrowl({ id: "add_success", name: file.name, type: "success", file_id: file.file_id, url: "#/files/" + file.file_id + "/edit" });
        utils.redirect($location, "/files");
    });

    $scope.uploadByUrl = function () {

        // Make a copy so you can modify what you send without changing the model in the UI
        var file = angular.copy($scope.file);
        file.file_url = $scope.options.url;
        file.http_authorization_username = $scope.options.http_authorization_username;
        file.http_authorization_password = $scope.options.http_authorization_password;

        ApiService.multipartForm(file, null, ApiService.buildUrl("/files")).then(function (newFile) {
            GrowlsService.addGrowl({ id: "add_success", name: newFile.name, type: "success", file_id: newFile.file_id, url: "#/files/" + newFile.file_id + "/edit" });
            utils.redirect($location, "/files");
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    };

    // TO_DO figure out when to call this. On route change?
    var cancelListeners = function () {
        uploadSendingListener();
        uploadDeleteListener();
        uploadCompleteListener();
    }

    $scope.cancel = function () {
        if ($scope.uploadSending) {
            var confirm = { id: "upload_cancel" };
            confirm.onConfirm = function () {
                // Let the upload directive know the user cancelled the upload so it can stop sending data.
                $scope.$broadcast("uploadCanceled");
                utils.redirect($location, "/files");
            }
            ConfirmService.showConfirm($scope, confirm);
        } else {
            utils.redirect($location, "/files");
        }
    };

}]);


app.controller("FilesEditCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    // Set defaults
    $scope.file = {};
    $scope.exception = {};
    $scope.options = { by_url: false };

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/files/" + $routeParams.id)
    $scope.uploadUrl = "/files/" + $routeParams.id;

    // Load the file
    ApiService.getItem($scope.url).then(function (file) {
        $scope.file = file;

        // Make a copy of the original for comparision
        $scope.file_orig = angular.copy($scope.file);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.confirmCancel = function () {
        if (angular.equals($scope.file, $scope.file_orig)) {
            utils.redirect($location, "/files");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/files");
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

    var uploadResponseListener = $scope.$on('uploadComplete', function (event, file) {
        $scope.$apply(function () {
            GrowlsService.addGrowl({ id: "edit_success", name: file.name, type: "success", file_id: file.file_id, url: "#/files/" + file.file_id + "/edit" });
            utils.redirect($location, "/files");
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
                utils.redirect($location, "/files");
            }
            ConfirmService.showConfirm($scope, confirm);
        } else {
            utils.redirect($location, "/files");
        }
    };

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    $scope.updateFile = function () {

        prepareSubmit();

        ApiService.multipartForm($scope.file, null, $scope.file.url, { show: "file_id,name" }).then(
        function (file) {
            GrowlsService.addGrowl({ id: "edit_success", name: file.name, type: "success", file_id: file.file_id, url: "#/files/" + file.file_id + "/edit" });
            utils.redirect($location, "/files");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.uploadByUrl = function () {

        prepareSubmit();

        // Make a copy so you can modify what you send without changing the model in the UI
        var file = angular.copy($scope.file);
        file.file_url = $scope.options.url;
        file.http_authorization_username = $scope.options.http_authorization_username;
        file.http_authorization_password = $scope.options.http_authorization_password;

        ApiService.multipartForm(file, null, ApiService.buildUrl("/files/" + file.file_id)).then(function (newFile) {
            GrowlsService.addGrowl({ id: "edit_success", name: newFile.name, type: "success", file_id: newFile.file_id, url: "#/files/" + newFile.file_id + "/edit" });
            utils.redirect($location, "/files");
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    };

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteFile();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.deleteFile = function () {

        ApiService.remove($scope.file.url).then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.file.name, type: "success" });
            utils.redirect($location, "/files");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);
