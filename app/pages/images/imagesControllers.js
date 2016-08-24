app.controller("ImagesListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.images = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = false;
        }
    }

    $scope.loadImages = function () {

        ApiService.getList(ApiService.buildUrl("/images?show=image_id,filename,link_square,link_large,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.images.imageList = result;

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
            $scope.params.offset = $scope.images.imageList.next_page_offset;
        } else {
            $scope.params.offset = $scope.images.imageList.previous_page_offset;
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
        $scope.loadImages();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadImages();

}]);


app.controller("ImagesAddCtrl", ['$scope', '$routeParams', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, GrowlsService, ApiService, ConfirmService) {

    // Set defaults
    $scope.image = {};
    $scope.exception = {};
    $scope.state = {};

    $scope.state.uploadSending = false;
    $scope.state.uploadComplete = false;

    var uploadSendingListener = $scope.$on('uploadSending', function (event, sending) {
        // Set uploadSending to the received value
        $scope.$apply(function () {
            $scope.state.uploadSending = sending;
        });
    });

    // If the user has permission, allow the user to delete the file after upload
    $scope.showDelete = false;
    if (utils.hasPermission("images", "delete")) {
        $scope.showDelete = true;
    }

    var uploadDeleteListener = $scope.$on('uploadDelete', function (event, uploadResponse, file) {

        var confirm = { id: "delete" };
        confirm.onConfirm = function () {

            // Let the upload directive know the user deleted the file so it can remove the upload preview display
            $scope.$broadcast("uploadDeleted", file);

            // If the user has permission, delete the file completely
            if (utils.hasPermission("images", "delete")) {
                ApiService.remove(uploadResponse.url, null, false);
            }
        }
        ConfirmService.showConfirm($scope, confirm);

    });

    var uploadCompleteListener = $scope.$on('uploadComplete', function (event, file) {
        $scope.state.uploadComplete = true;
    });

    // Allow easy cleanup of listeners when modal is closed / dismissed.
    var cancelListeners = function () {
        uploadSendingListener();
        uploadDeleteListener();
        uploadCompleteListener();
    }

    $scope.cancel = function () {
        if ($scope.state.uploadSending) {
            var confirm = { id: "upload_cancel" };
            confirm.onConfirm = function () {
                // Let the upload directive know the user cancelled the upload so it can stop sending data.
                $scope.$broadcast("uploadCanceled");
                utils.redirect($location, "/images");
            }
            ConfirmService.showConfirm($scope, confirm);
        } else {
            utils.redirect($location, "/images");
        }
    };

}]);


app.controller("ImagesViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    // Set defaults
    $scope.image = {};
    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/images/" + $routeParams.id)

    // Load the image
    ApiService.getItem($scope.url).then(function (image) {
        $scope.image = image;
    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteImage();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.deleteImage = function () {

        ApiService.remove($scope.image.url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.image.filename, type: "success" });
            utils.redirect($location, "/images");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception = error;
        });
    }

}]);
