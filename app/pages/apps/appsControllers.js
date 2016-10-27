
//#region Apps

app.controller("AppsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.appListUrl = ApiService.buildUrl("/apps");
    $scope.meta = {};

    // Set the app installation url
    var alias = localStorage.getItem("alias");
    var host = alias + ".auth.comecero.com";

    if (window.location.hostname.indexOf("admin-staging.") > -1) {
        host = host.replace(".auth.comecero.com", ".auth-staging.comecero.com");
    }

    $scope.meta.app_install_url_base = "https://" + host + "/oauth/callback/#access_token=" + localStorage.getItem("token") + "&redirect_uri=";

    $scope.meta.test = localStorage.getItem("test");

}]);

app.controller("AppsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.app_display = {};

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/apps/" + $routeParams.id)

        // Load the app
        ApiService.getItem($scope.url, { expand: "images,app_package,source_app_package" }).then(function (app) {

            $scope.app = app;

            // To enable us to display of raw json in the form fields
            if (app.settings_fields) {
                $scope.app_display.settings_fields = JSON.stringify(app.settings_fields, null, 4);
            }

            if (app.style_fields) {
                $scope.app_display.style_fields = JSON.stringify(app.style_fields, null, 4);
            }

            // Copy these items to their own scope, then delete from app since we don't need it.
            $scope.images = app.images;

            // If the only image is the default image, remove it
            if (app.images[0].image_id == "app_default") {
                $scope.images = [];
            }

            // Convert the list of strings to a line-feed delimited strings
            $scope.redirect_uris = utils.arrayToString(app.redirect_uris);
            $scope.csp_hosts = utils.arrayToString(app.csp_hosts);

            if (app.app_package != null) {
                $scope.app_package = app.app_package;
                $scope.app_package_id = app.app_package.app_package_id;
            }

            if (app.source_app_package != null) {
                $scope.source_app_package = app.source_app_package;
                $scope.source_app_package_id = app.source_app_package.app_package_id;
            }

            delete $scope.app.app_package;
            delete $scope.app.source_app_package;
            delete $scope.app.images;

            // Make a copy of the original for comparision
            $scope.app_orig = angular.copy($scope.app);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.app = { is_public: false, active: false, hash_navigation: false, allow_custom_css: false, allow_custom_javascript: false, };
        $scope.images = [];

    }

    $scope.$watch('app_package', function (newVal, oldValue) {
        if (newVal != null) {
            $scope.app_package_id = newVal.app_package_id;
        }
    });

    $scope.$watch('source_app_package', function (newVal, oldValue) {
        if (newVal != null) {
            $scope.source_app_package_id = newVal.app_package_id;
        }
    });

    $scope.removeAppPackage = function () {
        $scope.app.app_package_id = null;
        $scope.app_package.app_package_id = null;
        $scope.showAppPackage = false;
    };

    $scope.removeSourceAppPackage = function () {
        $scope.app.source_app_package_id = null;
        $scope.source_app_package.source_app_package_id = null;
        $scope.showSourceAppPackage = false;
    };

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;

        // Add the related items
        if ($scope.app_package != null) {
            $scope.app.app_package_id = $scope.app_package.app_package_id;
        }

        if ($scope.source_app_package != null) {
            $scope.app.source_app_package_id = $scope.source_app_package.app_package_id;
        }

        if ($scope.images != null) {
            _.each($scope.images, function (item) {
                if ($scope.app.image_ids == null) {
                    $scope.app.image_ids = [];
                }
                $scope.app.image_ids.push(item.image_id);
            })
        }

        // Reset any conditionals that shouldn't be set based on the selected input.
        if ($scope.app.client_side == false) {
            $scope.app.type = null;
        }

        if ($scope.app.platform_hosted == false) {
            $scope.app.app_package_id = null;
            $scope.app.source_app_package = null;
            $scope.app.allow_source_download = false;
            $scope.app.version = null;
            $scope.app.csp_hosts = null;
        }

        if ($scope.app.type == "storefront") {
            $scope.redirect_uris = null;
            $scope.app.permissions = [];
        }

        // Convert the redirect_uris and csp_hosts from delimited string to a list
        if ($scope.redirect_uris != null) {
            $scope.app.redirect_uris = utils.stringToArray($scope.redirect_uris);
        }

        if ($scope.csp_hosts != null) {
            $scope.app.csp_hosts = utils.stringToArray($scope.csp_hosts);
        }

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.app, $scope.app_orig)) {
            utils.redirect($location, "/apps");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/apps");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.setConditionals = function () {

        // Set or unset any conditionals that shouldn't be set based on other selected input.
        if ($scope.app.client_side == false) {
            $scope.app.type = null;
            $scope.app.platform_hosted = false;
        }

        if ($scope.app.type == "storefront") {
            $scope.app.platform_hosted = true;
        }
    }

    $scope.addApp = function () {

        prepareSubmit();

        $scope.form.settings_fields.$setValidity("json", true);
        if (utils.emptyToNull($scope.app_display.settings_fields) != null) {
            // Validate JSON
            try {
                $scope.app.settings_fields = JSON.parse($scope.app_display.settings_fields);
            } catch (err) {
                $scope.form.settings_fields.$setValidity("json", false);
            }
        }
        else {
            $scope.app.settings_fields = null;
        }

        $scope.form.style_fields.$setValidity("json", true);
        if (utils.emptyToNull($scope.app_display.style_fields) != null) {
            try {
                $scope.app.style_fields = JSON.parse($scope.app_display.style_fields);
            } catch (err) {
                $scope.form.style_fields.$setValidity("json", false);
            }
        } else {
            $scope.app.style_fields = null;
        }

        if ($scope.redirect_uris != null) {
            $scope.app.redirect_uris = utils.stringToArray($scope.redirect_uris);
        }

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.app, ApiService.buildUrl("/apps"), { show: "app_id,name" })
        .then(
        function (app) {
            GrowlsService.addGrowl({ id: "add_success", name: app.name, type: "success", url: "#/apps/" + app.app_id + "/edit" });
            utils.redirect($location, "/apps");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateApp = function () {

        prepareSubmit();

        $scope.form.settings_fields.$setValidity("json", true);
        if (utils.emptyToNull($scope.app_display.settings_fields) != null) {
            // Validate JSON
            try {
                $scope.app.settings_fields = JSON.parse($scope.app_display.settings_fields);
            } catch (err) {
                $scope.form.settings_fields.$setValidity("json", false);
            }
        } else {
            $scope.app.settings_fields = null;
        }

        $scope.form.style_fields.$setValidity("json", true);
        if (utils.emptyToNull($scope.app_display.style_fields) != null) {
            try {
                $scope.app.style_fields = JSON.parse($scope.app_display.style_fields);
            } catch (err) {
                $scope.form.style_fields.$setValidity("json", false);
            }
        } else {
            $scope.app.style_fields = null;
        }

        if ($scope.redirect_uris != null) {
            $scope.app.redirect_uris = utils.stringToArray($scope.redirect_uris);
        }

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        // Remove effective_permissions to save bandwidth on the way up
        delete $scope.app.effective_permissions;

        ApiService.set($scope.app, $scope.url, { show: "app_id,name" })
        .then(
        function (app) {
            GrowlsService.addGrowl({ id: "edit_success", name: app.name, type: "success", app_id: app.app_id, url: "#/apps/" + app.app_id + "/edit" });
            utils.redirect($location, "/apps");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success_with_undelete", name: $scope.app.name, type: "success", url: "#/apps/" + $scope.app.app_id + "/edit" });
            utils.redirect($location, "/apps");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.undelete = function () {

        ApiService.set({ deleted: false }, $scope.url, { show: "app_id,name" })
        .then(
        function (app) {
            GrowlsService.addGrowl({ id: "undelete_success", name: $scope.app.name, type: "success", app_id: $scope.app.app_id, url: "#/apps/" + app.app_id + "/edit" });
            utils.redirect($location, "/apps");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.stringify = function(obj) {
        return Json.stringify(obj);
    }

}]);

//#endregion Apps



