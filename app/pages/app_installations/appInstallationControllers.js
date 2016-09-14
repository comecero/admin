
//#region App_Installations

app.controller("AppInstallationsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService, ConfirmService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.appInstallationListUrl = ApiService.buildUrl("/app_installations");
    $scope.meta = {};

    $scope.meta.test = localStorage.getItem("test");

    // Set the app installation url
    var alias = localStorage.getItem("alias");
    var host = alias + ".auth.comecero.com";

    if (window.location.hostname.indexOf("admin-staging.") > -1) {
        host = host.replace(".auth.comecero.com", ".auth-staging.comecero.com");
    }

    $scope.meta.app_install_url_base = "https://" + host + "/oauth/callback/#access_token=" + localStorage.getItem("token") + "&test=" + $scope.meta.test + "&redirect_uri=";

    $scope.functions = {};

    $scope.functions.uninstall = function (app_installation_id, app_name) {

        var url = ApiService.buildUrl("/app_installations/" + app_installation_id);

        ApiService.remove(url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "uninstall_success", name: app_name, type: "success" });
            $scope.functions.refresh();
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.functions.confirmUninstall = function (app_installation_id, app_name) {
        var confirm = { id: "app_uninstall" };
        confirm.onConfirm = function () {
            $scope.functions.uninstall(app_installation_id, app_name);
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.functions.setDefaultVersion = function (app_installation_id, version) {

        var url = ApiService.buildUrl("/app_installations/" + app_installation_id);

        var data = { is_default_version: true };

        ApiService.set(data, url, { show: "name" })
        .then(
        function (response) {
            GrowlsService.addGrowl({ id: "set_default_app_version", name: response.name, type: "success" });
            $scope.functions.refresh();
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.functions.confirmSetDefaultVersion = function (app_installation_id) {
        var confirm = { id: "set_default_app_version" };
        confirm.onConfirm = function () {
            $scope.functions.setDefaultVersion(app_installation_id);
        }
        ConfirmService.showConfirm($scope, confirm);
    }

}]);

app.controller("AppInstallationsSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.selections = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/app_installations/" + $routeParams.id)

    // An object to hold checkboxes to monitor their state changes
    $scope.checkboxState = {};

    // Load the app_installation settings
    ApiService.getItem($scope.url, { show: "app_installation_id,app_id,name,settings_fields.*,settings,alias,launch_url,location_url,allow_custom_javascript,custom_javascript" }).then(function (app_installation) {

        $scope.app_installation = app_installation;

        // Set style with current properties, if populated
        if (app_installation.settings != null) {
            $scope.selections = app_installation.settings;
        }

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.app_installation.settings);

        // Define the app host
        $scope.app_host = utils.left(app_installation.location_url, app_installation.location_url.length - app_installation.alias.length - 1);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.confirmCancel = function () {
        if (angular.equals($scope.app_installation.config, $scope.config_orig)) {
            utils.redirect($location, "/app_installations");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/app_installations");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateAppInstallation = function (apply) {

        // Set the style to the selections provided.
        $scope.app_installation.settings = $scope.selections;

        // Reset the error
        $scope.exception = {};

        ApiService.set($scope.app_installation, $scope.url, { show: "app_installation_id,name" })
        .then(
        function (app_installation) {
            GrowlsService.addGrowl({ id: "edit_success", name: $scope.app_installation.name, type: "success", url: "#/app_installations/" + $scope.app_installation.app_installation_id + "/settings" });

            if (!apply) {
                utils.redirect($location, "/app_installations");
            }

        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

app.controller("AppInstallationsStyleCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.selections = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/app_installations/" + $routeParams.id)

    // An object to hold checkboxes to monitor their state changes
    $scope.checkboxState = {};

    // Load the app_installation style
    ApiService.getItem($scope.url, { show: "app_installation_id,app_id,name,style_fields.*,style,allow_custom_css,custom_css" }).then(function (app_installation) {

        $scope.app_installation = app_installation;

        // Set style with current properties, if populated
        if (app_installation.style != null) {
            $scope.selections = app_installation.style;
        }

        // Make a copy of the original for comparision
        $scope.style_orig = angular.copy($scope.app_installation.style);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.confirmCancel = function () {
        if (angular.equals($scope.app_installation.style, $scope.style_orig)) {
            utils.redirect($location, "/app_installations");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/app_installations");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateAppInstallation = function (apply) {

        // Set the style to the selections provided.
        $scope.app_installation.style = $scope.selections;

        // Reset the error
        $scope.exception = {};

        ApiService.set($scope.app_installation, $scope.url, { show: "app_installation_id,name" })
        .then(
        function (app_installation) {
            GrowlsService.addGrowl({ id: "edit_success", name: $scope.app_installation.name, type: "success", url: "#/app_installations/" + $scope.app_installation.app_installation_id + "/style" });

            if (!apply) {
                utils.redirect($location, "/app_installations");
            }
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

//#endregion AppInstallations



