
//#region App_Installations

app.controller("AppInstallationsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService, ConfirmService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.appInstallationListUrl = ApiService.buildUrl("/app_installations");
    $scope.params = { is_default_version: true };
    $scope.meta = {};

    $scope.meta.test = localStorage.getItem("test");

    $scope.functions = {};

    $scope.functions.uninstall = function (app_installation_id, app_name, version) {

        var url = ApiService.buildUrl("/app_installations/" + app_installation_id);

        ApiService.remove(url).then(function () {
            GrowlsService.addGrowl({ id: "uninstall_success", name: app_name, version: version, type: "success" });
            $scope.functions.refresh();
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.functions.confirmUninstall = function (app_installation_id, app_name, version) {
        var confirm = { id: "app_uninstall", name: app_installation.name, version: app_installation.version, platform_hosted: app_installation.platform_hosted };
        confirm.onConfirm = function () {
            $scope.functions.uninstall(app_installation_id, app_name, version);
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.functions.setDefaultVersion = function (app_installation_id, version) {

        var url = ApiService.buildUrl("/app_installations/" + app_installation_id);

        var data = { is_default_version: true };

        ApiService.set(data, url, { show: "name" }).then(function (response) {
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

    $scope.functions.getLaunchUrl = function (app_installation) {
        if (app_installation) {
            var url = localStorage.getItem("oauth_callback_url") + "#access_token=" + localStorage.getItem("token") + "&redirect_uri=";
            var redirect = app_installation.launch_url;
            if (app_installation.version)
                redirect += "&target_version=" + app_installation.version;
            url += encodeURIComponent(redirect);
            return url;
        }
    }

    $scope.functions.getInstallUrl = function (app_installation) {
        if (app_installation) {
            var url = localStorage.getItem("oauth_callback_url") + "#access_token=" + localStorage.getItem("token") + "&redirect_uri=";
            var redirect = app_installation.install_url;
            if (app_installation.updated_version_available)
                redirect += "&target_version=" + app_installation.current_app_version;
            url += encodeURIComponent(redirect);
            return url;
        }
    }

    $scope.functions.getInfoUrl = function (app_installation, test) {

        // If client side and the info URL is within the app, run the info URL through the app launcher to inject an API token for use within the info pages.
        if (app_installation.platform_hosted && app_installation.info_url) {
            if (utils.left(app_installation.info_url, app_installation.location_url.length) == app_installation.location_url) {
                // The info URL is within the app. Set the redirect URI as a relative path.
                var url = localStorage.getItem("oauth_callback_url") + "#access_token=" + localStorage.getItem("token") + "&redirect_uri=";
                return url + "&redirect_uri=" + encodeURIComponent(app_installation.info_url);
            }
        }
        return app_installation.info_url;
    }

}]);

app.controller("AppInstallationsManageCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService, ConfirmService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.appInstallationListUrl = ApiService.buildUrl("/app_installations");
    $scope.params = { app_id: $routeParams.id, sort_by: "version_date", desc: true };
    $scope.meta = {};
    $scope.default = {};

    $scope.meta.test = localStorage.getItem("test");

    $scope.functions = {};

    $scope.functions.refresh = function () {

        ApiService.getList($scope.resources.appInstallationListUrl, $scope.params).then(function (result) {
            $scope.list = result;
            $scope.count = result.total_items;
            $scope.data = result.data;

            if (result.total_items) {
                $scope.latest = result.data[0];

                // Get the default version if platform hosted, otherwise just get the first in the list.
                $scope.default = _.find(result.data, function (app) { return app.is_default_version == true }) || result.data[0];

                // Load the technical settings
                var settingsUrl = ApiService.buildUrl("/settings/technical");
                ApiService.getItem(settingsUrl, { show: "app_hosts" }).then(function (settings) {

                    $scope.settings = settings;

                }, function (error) {
                    $scope.exception.error = error;
                    window.scrollTo(0, 0);
                });

            } else {
                $scope.exception.error = { message: "The app you are looking for is not installed in your account." };
            }

        },
        function (error) {
            $scope.error = error;
        });

    }

    $scope.functions.uninstall = function (app_installation) {

        var url = ApiService.buildUrl("/app_installations/" + app_installation.app_installation_id);

        ApiService.remove(url).then(function () {
            GrowlsService.addGrowl({ id: "uninstall_success", name: app_installation.name, version: app_installation.version, type: "success" });
            $scope.functions.refresh();
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.functions.confirmUninstall = function (app_installation) {
        var confirm = { id: "app_uninstall", name: app_installation.name, version: app_installation.version, platform_hosted: app_installation.platform_hosted };
        confirm.onConfirm = function () {
            $scope.functions.uninstall(app_installation);
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.functions.setDefaultVersion = function (appInstallation) {

        var url = ApiService.buildUrl("/app_installations/" + appInstallation.app_installation_id);

        var data = { is_default_version: true };

        ApiService.set(data, url, { show: "name" }).then(function (response) {
            GrowlsService.addGrowl({ id: "set_default_app_version", name: response.name, type: "success" });
            $scope.functions.refresh();
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.functions.confirmSetDefaultVersion = function (appInstallation) {
        var confirm = { id: "set_default_app_version", version: appInstallation.version, name: appInstallation.name };
        confirm.onConfirm = function () {
            $scope.functions.setDefaultVersion(appInstallation);
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.functions.getLaunchUrl = function (app_installation) {
        if (app_installation) {
            var url = localStorage.getItem("oauth_callback_url") + "#access_token=" + localStorage.getItem("token") + "&redirect_uri=";
            var redirect = app_installation.launch_url;
            if (app_installation.version)
                redirect += "&target_version=" + app_installation.version;
            url += encodeURIComponent(redirect);
            return url;
        }
    }

    $scope.functions.getInstallUrl = function (app_installation) {
        if (app_installation) {
            var url = localStorage.getItem("oauth_callback_url") + "#access_token=" + localStorage.getItem("token") + "&redirect_uri=";
            var redirect = app_installation.install_url;
            if (app_installation.updated_version_available)
                redirect += "&target_version=" + app_installation.current_app_version;
            url += encodeURIComponent(redirect);
            return url;
        }
    }

    $scope.functions.getInfoUrl = function (app_installation, test) {

        // If client side and the info URL is within the app, run the info URL through the app launcher to inject an API token for use within the info pages.
        if (app_installation.platform_hosted && app_installation.info_url) {
            if (utils.left(app_installation.info_url, app_installation.location_url.length) == app_installation.location_url) {
                // The info URL is within the app. Set the redirect URI as a relative path.
                var url = localStorage.getItem("oauth_callback_url") + "#access_token=" + localStorage.getItem("token") + "&redirect_uri=";
                return url + "&redirect_uri=" + encodeURIComponent(app_installation.info_url);
            }
        }
        return app_installation.info_url;
    }

    $scope.functions.setLocation = function () {
        var url = ApiService.buildUrl("/app_installations/" + $scope.default.app_installation_id);
        var data = { preferred_hostname: $scope.default.preferred_hostname, alias: $scope.default.alias };
        ApiService.set(data, url).then(function (response) {
            GrowlsService.addGrowl({ id: "edit_success_no_link", type: "success" });
            $scope.default = response;
            $scope.editLocation = false;
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    // Do the initial load
    $scope.functions.refresh();

}]);

app.controller("AppInstallationsSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.selections = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/app_installations/" + $routeParams.id);
    var settingsUrl = ApiService.buildUrl("/settings/technical");

    // An object to hold checkboxes to monitor their state changes
    $scope.checkboxState = {};

    // Load the app_installation settings
    ApiService.getItem($scope.url, { show: "app_installation_id,app_id,name,settings_fields.*,settings,alias,launch_url,location_url,allow_custom_javascript,custom_javascript,preferred_hostname" }).then(function (app_installation) {

        $scope.app_installation = app_installation;

        // Set style with current properties, if populated
        if (app_installation.settings != null) {
            $scope.selections = app_installation.settings;
        }

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.app_installation.settings);

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