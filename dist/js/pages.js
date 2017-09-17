app.controller("AccountsUpdateCtrl", ['$scope', '$location', 'ApiService', 'ConfirmService', 'GrowlsService', 'GeographiesService', function ($scope, $location, ApiService, ConfirmService, GrowlsService, GeographiesService) {

    $scope.exception = {};

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/accounts/" + localStorage.getItem("account_id"));

    $scope.confirmCancel = function () {
        if (angular.equals($scope.account, $scope.account_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    var geo = GeographiesService.getGeographies(false);
    $scope.countries = geo.countries;
    $scope.us_states = geo.us_states;
    $scope.ca_provinces = geo.ca_provinces;
    $scope.au_states = geo.au_states;

    // Load the account info
    if (utils.inTestMode() == false) {
        ApiService.getItem($scope.url).then(function (account) {
            $scope.account = account;

            // Make a copy of the original for comparision
            $scope.account_orig = angular.copy($scope.account);

            $scope.typeahead = {};
            $scope.typeahead.country = {};
            $scope.typeahead.state_prov = {};

            if ($scope.account.country != null) {
                $scope.typeahead.country = _.find($scope.countries, { code: $scope.account.country });
            }

            if ($scope.account.state_prov != null) {

                if ($scope.account.country == "US") {
                    $scope.typeahead.state_prov = _.find($scope.us_states, { code: $scope.account.state_prov });
                }

                if ($scope.account.country == "CA") {
                    $scope.typeahead.state_prov = _.find($scope.ca_provinces, { code: $scope.account.state_prov });
                }

                if ($scope.account.country == "AU") {
                    $scope.typeahead.state_prov = _.find($scope.au_states, { code: $scope.account.state_prov });
                }

            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.onCountrySelect = function (item, model, label) {
        $scope.account.country = model.code;
    }

    $scope.onStateSelect = function (item, model, label) {
        $scope.account.state_prov = model.code;
    }

    $scope.updateAccount = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.account, $scope.url)
        .then(
        function (account) {
            GrowlsService.addGrowl({ id: "edit_success_no_link", type: "success" });
            utils.redirect($location, "/");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.downloadContractPdf = function () {

        // Get the current contract
        ApiService.getItemPdf(ApiService.buildUrl("/contracts/current")).then(function (data) {

            var file = new Blob([data], { type: "application/pdf" });
            saveAs(file, "Contract_" + localStorage.getItem("account_id") + ".pdf");

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);

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





//#region Auths

app.controller("AuthsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.auths = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadAuths = function () {

        ApiService.getList(ApiService.buildUrl("/auths?show=auth_id,token,comments,expires,date_created&sort_by=" + $scope.params.date_type + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.auths.authList = result;

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
            $scope.params.offset = $scope.auths.authList.next_page_offset;
        } else {
            $scope.params.offset = $scope.auths.authList.previous_page_offset;
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
        $scope.loadAuths();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadAuths();

}]);

app.controller("AuthsSetCtrl", ['$scope', '$rootScope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', '$http', function ($scope, $rootScope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, $http) {

    $scope.exception = {};
    $scope.data = {};

    // Set default values
    $scope.data.type = "secret";
    $scope.data.test = true;

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/auths/" + $routeParams.id)

        // Load the auth
        ApiService.getItem($scope.url).then(function (auth) {
            $scope.auth = auth;

            // Make a copy of the original for comparision
            $scope.auth_orig = angular.copy($scope.auth);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.auth = {};

    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.auth, $scope.auth_orig)) {
            utils.redirect($location, "/auths");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/auths");
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

    $scope.addAuth = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.auth, ApiService.buildUrl("/auths/secret"), { show: "auth_id,token", test: $rootScope.settings.test })
        .then(
        function (auth) {
            $scope.showToken = true;
            $scope.auth.token = auth.token;
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateAuth = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        // Remove effective_permissions to save bandwidth on the way up
        delete $scope.auth.effective_permissions;

        ApiService.set($scope.auth, $scope.url, { show: "auth_id,token" })
        .then(
        function (auth) {
            GrowlsService.addGrowl({ id: "edit_success", name: auth.name, type: "success", name: auth.token, url: "#/auths/" + auth.auth_id + "/edit" });
            utils.redirect($location, "/auths");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.url).then(
        function (auth) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.auth.token, type: "success" });
            utils.redirect($location, "/auths");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.addLimitedAuth = function (test) {

        prepareSubmit();

        var config = {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token"),
                "Accept": "application/json;"
            }
        };

        if (test == false) {
            delete config.headers["Authorization"];
        }

        var request = $http.post("https://" + $rootScope.apiHost + "/api/v1/auths/limited?account_id=" + localStorage.getItem("account_id") + "&test=" + test, null, config);

        request.success(function (auth) {
            $scope.showToken = true;
            $scope.auth.token = auth.token;
        });

        request.error(function (error) {
            $scope.exception.error = error.error;
            window.scrollTo(0, 0);
        });

    }

}]);

//#endregion Auths




app.controller("CartsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.cartListUrl = ApiService.buildUrl("/carts");

}]);

app.controller("CartsViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.cart = {};  
    $scope.payment = {};
    $scope.exception = {};
    $scope.count = {};
    $scope.count.payments = 0;
    $scope.resources = {};
    $scope.functions = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/carts/" + $routeParams.id);
    $scope.resources.paymentListUrl = $scope.url + "/payments";

    // Load the cart
    var params = {expand: "customer,items.product,payments,payments.payment_method", hide: "items.product.images", formatted: true};
    ApiService.getItem($scope.url, params).then(function (cart) {

        $scope.cart = cart;
        
        // If one of the payments was successful, pluck it.
        $scope.successful_payment = _.findWhere($scope.cart.payments.data, { success: true });

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.hasPermission = function (resource, method) {
        return utils.hasPermission(resource, method);
    }

    // Watch for a captured payment
    $scope.$watch('successful_payment.status', function (newvalue, oldvalue) {
        // Update the payment in the cart payment 
        if ($scope.successful_payment && oldvalue != undefined) {
            $scope.cart.payment_status = $scope.successful_payment.status;
        }
    });

}]);




//#region Customers

app.controller("CustomersListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.customers = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.date_type == null) {
            $scope.params.date_type = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadCustomers = function () {

        ApiService.getList(ApiService.buildUrl("/customers?show=customer_id,name,email,has_payments,date_created&date_type=" + $scope.params.date_type + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.customers.customerList = result;

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

            // Set pagination
            $scope.setPagination($scope.customers.customerList);

        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.setPagination = function (customerList) {

        $scope.nav.before_item = null;
        $scope.nav.after_item = null;

        if (customerList.data.length > 0) {
            if (customerList.previous_page_url != null) {
                $scope.nav.before_item = customerList.data[0].customer_id;
            }
            if (customerList.next_page_url != null) {
                $scope.nav.after_item = customerList.data[customerList.data.length - 1].customer_id;
            }
        }
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
            $scope.params.after_item = $scope.nav.after_item;
            $scope.params.before_item = null;
        } else {
            $scope.params.after_item = null;
            $scope.params.before_item = $scope.nav.before_item;
        }
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }

    $scope.sort = function (date_type, desc) {
        $scope.params.date_type = date_type;
        $scope.params.desc = desc;
        $location.search($scope.params);
    }

    $scope.$on('$routeUpdate', function (e) {
        $scope.parseParams();
        $scope.loadCustomers();
    });

    // Initial load
    $scope.parseParams();
    $scope.params.has_payments = true;
    $scope.loadCustomers();

}]);

app.controller("CustomersViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'GeographiesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.customer = {};
    $scope.billing_address = {};
    $scope.shipping_address = {};
    $scope.cards = [];
    $scope.resources = {};
    $scope.edit = false;
    $scope.exception = {};

    $scope.count = {};
    $scope.count.orders = 0;
    $scope.count.payments = 0;
    $scope.count.subscriptions = 0;
    $scope.count.refunds = 0;
    $scope.count.invoices = 0;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/customers/" + $routeParams.id);
    $scope.resources.orderListUrl = $scope.url + "/orders";
    $scope.resources.subscriptionListUrl = $scope.url + "/subscriptions";
    $scope.resources.paymentListUrl = $scope.url + "/payments";
    $scope.resources.refundListUrl = $scope.url + "/refunds";
    $scope.resources.invoiceListUrl = $scope.url + "/invoices";

    // Load the customer
    ApiService.getItem($scope.url, { expand: "payment_methods" }).then(function (customer) {

        $scope.customer = customer;
        $scope.payment_methods = customer.payment_methods;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.hasPermission = function (resource, method) {
        return utils.hasPermission(resource, method);
    }

    $scope.refreshPaymentMethods = function () {

        // Refresh the "is_default" parameter of all payment methods since it may have changed when one of the cards was changed.
        ApiService.getList($scope.url + "/payment_methods").then(function (payment_methods) {
            $scope.payment_methods = payment_methods;
        });

    }

}]);

//#endregion Customers




app.controller("DashboardViewCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    $scope.dashboard = {};
    $scope.exception = {};

    // Set the currencies
    $scope.options = {};
    $scope.options.currencies = [];
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_primary"));
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_secondary"));
    $scope.options.currency = $scope.options.currencies[0];

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/dashboard")

    // Setup the function to load the dashboard
    $scope.loadDashboard = function (currency) {

        ApiService.getItem($scope.url, { currency: currency, formatted:true }).then(function (dashboard) {

            // Header
            $scope.currency = dashboard.currency;

            // Sales
            $scope.sales = [];
            _.each(dashboard.sales, function (item) {
                $scope.sales.push(item.total);
            });
            $scope.sales_today = dashboard.sales[29].formatted.total;
            $scope.sales_yesterday = dashboard.sales[28].formatted.total;
            $scope.sales_month = dashboard.sales_summary.formatted.total;

            // New Subscriptions
            $scope.new_subscriptions = [];
            _.each(dashboard.new_subscriptions, function (item) {
                $scope.new_subscriptions.push(item.total);
            });
            $scope.new_subscriptions_today = dashboard.new_subscriptions[29].formatted.total;
            $scope.new_subscriptions_yesterday = dashboard.new_subscriptions[28].formatted.total;
            $scope.new_subscriptions_month = dashboard.new_subscriptions_summary.formatted.total;

            // Subscription Renewals
            $scope.subscription_renewals = [];
            _.each(dashboard.subscription_renewals, function (item) {
                $scope.subscription_renewals.push(item.total);
            });
            $scope.subscription_renewals_today = dashboard.subscription_renewals[29].formatted.total;
            $scope.subscription_renewals_yesterday = dashboard.subscription_renewals[28].formatted.total;
            $scope.subscription_renewals_month = dashboard.subscription_renewals_summary.formatted.total;

            // Total Subscriptions
            $scope.subscriptions = [];
            _.each(dashboard.subscriptions, function (item) {
                $scope.subscriptions.push(item.total);
            });
            $scope.subscriptions_today = dashboard.subscriptions[29].formatted.total;
            $scope.subscriptions_yesterday = dashboard.subscriptions[28].formatted.total;
            $scope.subscriptions_month = dashboard.subscriptions_summary.formatted.total;

            // Cart visitors
            $scope.cart_visitors = [];
            $scope.cart_visitors = _.pluck(dashboard.cart_visitors, 'value');
            $scope.cart_visitors_today = dashboard.cart_visitors[29].value;
            $scope.cart_visitors_yesterday = dashboard.cart_visitors[28].value;
            for (var i = 0, sum = 0; i < $scope.cart_visitors.length; sum += $scope.cart_visitors[i++]);
            $scope.cart_visitors_month = sum;

            // Cart conversions
            $scope.cart_conversions = [];
            $scope.cart_conversions = _.pluck(dashboard.cart_conversions, 'value');
            $scope.cart_conversions_today = dashboard.cart_conversions[29].value;
            $scope.cart_conversions_yesterday = dashboard.cart_conversions[28].value;
            for (var i = 0, sum = 0; i < $scope.cart_conversions.length; sum += $scope.cart_conversions[i++]);
            $scope.cart_conversions_month = sum;

            // Cart conversions rate
            $scope.cart_conversion_rates = [];
            $scope.cart_conversion_rates = _.pluck(dashboard.cart_conversion_rates, 'value');
            $scope.cart_conversion_rates_today = dashboard.cart_conversion_rates[29].value;
            $scope.cart_conversion_rates_yesterday = dashboard.cart_conversion_rates[28].value;
            $scope.cart_conversion_rates_month = dashboard.average_cart_conversion_rate;

            // Operating System
            utils.renameProperty(dashboard.customer_operating_systems, "item", "label");
            $scope.customer_operating_systems = dashboard.customer_operating_systems;

            // Customer Languages
            utils.renameProperty(dashboard.customer_languages, "item", "label");
            $scope.customer_languages = dashboard.customer_languages;

            // Customer Browsers
            utils.renameProperty(dashboard.customer_browsers, "item", "label");
            $scope.customer_browsers = dashboard.customer_browsers;

            // Customer Locations
            utils.renameProperty(dashboard.customer_locations, "item", "label");
            $scope.customer_locations = dashboard.customer_locations;

            // Customer Devices
            utils.renameProperty(dashboard.customer_devices, "item", "label");
            $scope.customer_devices = dashboard.customer_devices;

            // Customer New vs Returning
            utils.renameProperty(dashboard.customer_new_vs_returning, "item", "label");
            $scope.customer_new_vs_returning = dashboard.customer_new_vs_returning;


        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    // Load the dashboard on page load
    $scope.loadDashboard($scope.options.currency);

}]);

//#region Events

app.controller("EventsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.events = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.status == null) {
            $scope.params.status = "delivered";
        }

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadEvents = function () {
        
        ApiService.getList(ApiService.buildUrl("/events"), $scope.params).then(function (result) {
            $scope.events.eventList = result;
            $scope.eventsChecked = false;

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
        $scope.loadEvents();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadEvents();

}]);

app.controller("EventViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.event = {};
    $scope.exception = {};
    $scope.options = {};

    $scope.options.raw = true;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/events/" + $routeParams.id)

    // Load the service
    var params = { expand: "event_subscription", debug: true };
    ApiService.getItem($scope.url, params).then(function (event) {

        $scope.event = event;

        // Pretty format the event data
        $scope.event.data = JSON.stringify($scope.event.data, null, 4)

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.retryEvent = function () {

        // Clear any previous errors
        $scope.exception = {};

        ApiService.set(null, $scope.event.url + "/retry").then(function (evnt) {
            GrowlsService.addGrowl({ id: "event_resend", type: "success" });
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    };

}]);

//#endregion Products





//#region EventSubscriptions

app.controller("EventSubscriptionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.eventSubscriptions = {};

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
            $scope.params.desc = true;
        }

    }

    $scope.loadEventSubscriptions = function () {

        ApiService.getList(ApiService.buildUrl("/event_subscriptions"), $scope.params).then(function (result) {
            $scope.eventSubscriptions.subscriptionList = result;
            $scope.eventSubscriptionsChecked = false;

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
            $scope.params.offset = $scope.eventSubscriptions.subscriptionList.next_page_offset;
        } else {
            $scope.params.offset = $scope.eventSubscriptions.subscriptionList.previous_page_offset;
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
        $scope.loadEventSubscriptions();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadEventSubscriptions();

}]);

app.controller("EventSubscriptionsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService, TimezonesService) {

    $scope.eventSubscription = {};
    $scope.timezones = TimezonesService.getTimezones();
    $scope.environmentVariables = [];

    $scope.event_types = [
    { name: "Account Modified", code: "account:modified" },
    { name: "Cart Payment Completed", code: "cart:payment_completed" },
    { name: "Gateway Created", code: "gateway:created" },
    { name: "Gateway Modified", code: "gateway:modified" },
    { name: "Event Subscription Created", code: "event_subscription:created" },
    { name: "Event Subscription Modified", code: "event_subscription:modified" },
    { name: "Event Subscription Deleted", code: "event_subscription:deleted" },
    { name: "License Service Low Licenses", code: "license_service:low_licenses" },
    { name: "Invoice Created", code: "invoice:created" },
    { name: "Invoice Payment Completed", code: "invoice:payment_completed" },
    { name: "Order Created", code: "order:created" },
    { name: "Order Licenses Assigned", code: "order:licenses_assigned" },
    { name: "Order Payment Completed", code: "order:payment_completed" },
    { name: "Order Fulfilled", code: "order:fulfilled" },
    { name: "Payment Created Success", code: "payment:created_success" },
    { name: "Payment Created Failure", code: "payment:created_failure" },
    { name: "Payment Captured Success", code: "payment:captured_success" },
    { name: "Payment Captured Failure", code: "payment:captured_failure" },
    { name: "Payment Voided", code: "payment:voided" },
    { name: "Product Created", code: "product:created" },
    { name: "Product Modified", code: "product:modified" },
    { name: "Product Deleted", code: "product:deleted" },
    { name: "Refund Created Success", code: "refund:created_success" },
    { name: "Refund Created Failure", code: "refund:created_failure" },
    { name: "Refund Deleted", code: "refund:deleted" },
    { name: "User Created", code: "user:created" },
    { name: "User Modified", code: "user:modified" },
    { name: "Shipment Created", code: "shipment:created" },
    { name: "Shipment Modified", code: "shipment:modified" },
    { name: "Shipment Deleted", code: "shipment:deleted" },
    { name: "Subscription Created", code: "subscription:created" },
    { name: "Subscription Cancelled", code: "subscription:cancelled" },
    { name: "Subscription Completed", code: "subscription:completed" },
    { name: "Subscription Converted", code: "subscription:converted" },
    { name: "Subscription Renewal Success", code: "subscription:renewal_success" },
    { name: "Subscription Renewal Failure", code: "subscription:renewal_failure" }];
    $scope.exception = {};
    $scope.options = { email: null, url: null };

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/event_subscriptions/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url).then(function (eventSubscription) {
            $scope.eventSubscription = eventSubscription;

            // Copy in the email or url as the desination, depending on the selection
            if ($scope.eventSubscription.method == "http") {
                $scope.options.url = $scope.eventSubscription.destination;
            } else {
                $scope.options.email = $scope.eventSubscription.destination;
            }

            if (eventSubscription.environment_variables) {
                for (var property in eventSubscription.environment_variables) {
                    if (eventSubscription.environment_variables.hasOwnProperty(property)) {
                        $scope.environmentVariables.push({ name: property, value: eventSubscription.environment_variables[property] });
                    }
                }
            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set some defaults
        $scope.eventSubscription.method = "http";
        $scope.eventSubscription.format = "json";
        $scope.eventSubscription.active = true;

    }

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

        // Copy in the email or url as the desination, depending on the selection
        if ($scope.eventSubscription.method == "http") {
            $scope.eventSubscription.destination = $scope.options.url;
        } else {
            $scope.eventSubscription.destination = $scope.options.email;
        }

        // Map variables array to object
        $scope.eventSubscription.environment_variables = {};
        for (var variable in $scope.environmentVariables) {
            if (!utils.isNullOrEmpty($scope.environmentVariables[variable].name) && !utils.isNullOrEmpty($scope.environmentVariables[variable].value))
                $scope.eventSubscription.environment_variables[$scope.environmentVariables[variable].name] = $scope.environmentVariables[variable].value;
        }
        $scope.eventSubscription.environment_variables = $scope.eventSubscription.environment_variables;

    }

    $scope.addVariable = function () {
        $scope.environmentVariables.push({ name: null, value: null });
    }

    $scope.removeVariable = function (variables, index) {
        variables.splice(index, 1);
    }

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/event_subscriptions");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.addEventSubscription = function () {

        prepareSubmit();

        // If the destination is http, skip email errors. If the destination is email, skip URL errors.
        if ($scope.eventSubscription.method == "http") {
            $scope.form.email.$setValidity("characters", true);
            $scope.form.email.$setValidity("required", true);
        }

        if ($scope.eventSubscription.method == "email") {
            $scope.form.url.$setValidity("characters", true);
            $scope.form.url.$setValidity("required", true);
        }

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.eventSubscription, ApiService.buildUrl("/event_subscriptions"), { show: "event_subscription_id,name" }).then(
        function (eventSubscription) {
            GrowlsService.addGrowl({ id: "add_success", name: eventSubscription.event_subscription_id, type: "success", event_subscription_id: eventSubscription.event_subscription_id, url: "#/event_subscriptions/" + eventSubscription.event_subscription_id + "/edit" });
            window.location = "#/event_subscriptions";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateEventSubscription = function () {

        prepareSubmit();

        // If the destination is http, skip email errors. If the destination is email, skip URL errors.
        if ($scope.eventSubscription.method == "http") {
            $scope.form.email.$setValidity("characters", true);
            $scope.form.email.$setValidity("required", true);
        }

        if ($scope.eventSubscription.method == "email") {
            $scope.form.url.$setValidity("characters", true);
            $scope.form.url.$setValidity("required", true);
        }

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.eventSubscription, $scope.url, { show: "event_subscription_id,name" })
        .then(
        function (eventSubscription) {
            GrowlsService.addGrowl({ id: "edit_success", name: eventSubscription.event_subscription_id, type: "success", event_subscription_id: eventSubscription.event_subscription_id, url: "#/event_subscriptions/" + eventSubscription.event_subscription_id + "/edit" });
            window.location = "#/event_subscriptions";
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.delete = function () {

        ApiService.remove($scope.eventSubscription.url).then(
        function (eventSubscription) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.eventSubscription.event_subscription_id, type: "success" });
            utils.redirect($location, "/event_subscriptions");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

//#endregion eventSubscription




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


//#region Gateways

app.controller("GatewaysListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.gateways = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadGateways = function () {

        ApiService.getList(ApiService.buildUrl("/gateways?show=gateway_id,name,active,payment_method_type,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.gateways.gatewayList = result;
            $scope.gatewaysChecked = false;

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

    $scope.setActive = function (active) {

        // Find the checked items
        var items = _.where($scope.gateways.gatewayList.data, { checked: true });

        // Keep track of the items that succeed and fail
        $scope.successItems = [];
        $scope.failItems = [];

        // Loop through the checked ones and update.
        var defer = $q.defer();
        var promises = [];

        _.each(items, function (gateway) {
            // We slim the request by trimming the resource since we're only modifying a couple properties.
            promises.push(ApiService.set({ gateway_id: gateway.gateway_id, active: active }, gateway.url).then(function (data) {
                gateway.active = data.active;
                $scope.successItems.push(gateway);
            }, function (error) {
                $scope.failItems.push(gateway);
                GrowlsService.addGrowl({ id: "active_change_failure", "name": gateway.name, type: "danger" });
            }));
        });

        $q.all(promises).then(complete);

        function complete() {

            if ($scope.successItems.length > 0) {
                if (active == true) {
                    GrowlsService.addGrowl({ id: "activate_success", count: $scope.successItems.length });

                } else {
                    GrowlsService.addGrowl({ id: "inactivate_success", count: $scope.successItems.length });
        }
    }

}
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
            $scope.params.offset = $scope.gateways.gatewayList.next_page_offset;
        } else {
            $scope.params.offset = $scope.gateways.gatewayList.previous_page_offset;
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
        $scope.loadGateways();
    });

    $scope.checkGateway = function (gateway) {
        if (gateway.checked) {
            gateway.checked = false;
            $scope.gatewaysChecked = false;
            _.each($scope.gateways.gatewayList.data, function (item) {
                if (item.checked) {
                    $scope.gatewaysChecked = true;
                }
            });
        } else {
            gateway.checked = true;
            $scope.gatewaysChecked = true;
        }
    }

    // Initial load
    $scope.parseParams();
    $scope.loadGateways();

}]);

app.controller("GatewaysSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.exception = {};
    $scope.models = {};
    $scope.models.selectedCurrencies = [];
    $scope.models.selectedCardTypes = [];
    $scope.showFields = false;
    $scope.gateway_config = {};

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/gateways/" + $routeParams.id)

        // Load the gateway
        ApiService.getItem($scope.url, { show_sensitive: true }).then(function (gateway) {
            $scope.gateway = gateway;

            // Get the gateway options object
            ApiService.getItem(ApiService.buildUrl("/gateways/options")).then(function (gatewayOptions) {

                $scope.gateway_configs = gatewayOptions.gateway_configs;
                $scope.currencies = gatewayOptions.currencies;
                $scope.card_types = gatewayOptions.card_types;

                // Load selected currencies
                _.each(gateway.currencies, function (item) {
                    var currency = _.findWhere($scope.currencies, { code: item });
                    if (currency != null) {
                        $scope.models.selectedCurrencies.push(currency);
                    }
                });

                // Load selected card types
                _.each(gateway.card_types, function (item) {
                    $scope.models.selectedCardTypes.push(item);
                });

                $scope.loadFields(gateway.provider_id);

            }, function (error) {
                $scope.exception.error = error;
            });

            // Make a copy of the original for comparision
            $scope.gateway_orig = angular.copy($scope.gateway);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.gateway = { active: false, payment_method_type: "credit_card", currencies: [], card_types: [], fields: {} };

        // Get the gateway options object
        ApiService.getItem(ApiService.buildUrl("/gateways/options")).then(function (gatewayOptions) {

            $scope.gateway_configs = gatewayOptions.gateway_configs;
            //$scope.payment_method_types = _.uniq(_.pluck($scope.gateway_configs, "payment_method_type"));
            $scope.currencies = gatewayOptions.currencies;
            $scope.card_types = gatewayOptions.card_types;

        }, function (error) {
            $scope.exception.error = error;
        });

    }

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

        // Convert the selected currencies to a list of currency codes
        $scope.gateway.currencies = _.pluck($scope.models.selectedCurrencies, "code");

        // Convert the selected card types to a list of currency codes
        $scope.gateway.card_types = $scope.models.selectedCardTypes;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.gateway, $scope.gateway_orig)) {
            utils.redirect($location, "/gateways");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/gateways");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.addGateway = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.gateway, ApiService.buildUrl("/gateways"), { show: "gateway_id,name" })
        .then(
        function (gateway) {
            GrowlsService.addGrowl({ id: "add_success", name: gateway.name, type: "success", gateway_id: gateway.gateway_id, url: "#/gateways/" + gateway.gateway_id + "/edit" });

            // Refresh the account meta since a gateway currency may have changed
            SettingsService.setAccountMeta();

            utils.redirect($location, "/gateways");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateGateway = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.gateway, $scope.url, { show: "gateway_id,name" })
        .then(
        function (gateway) {
            GrowlsService.addGrowl({ id: "edit_success", name: gateway.name, type: "success", url: "#/gateways/" + gateway.gateway_id + "/edit" });

            // Refresh the account meta since a gateway currency may have changed
            SettingsService.setAccountMeta();

            utils.redirect($location, "/gateways");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.loadGatewayConfig = function (provider_id) {

        $scope.gateway_config = _.findWhere($scope.gateway_configs, { provider_id: $scope.gateway.provider_id });
        
        if ($scope.gateway_config.payment_method_types.length == 1) {
            $scope.gateway.payment_method_type = $scope.gateway_config.payment_method_types[0];
        }

        $scope.loadFields(provider_id);

    }

    $scope.loadFields = function (provider_id) {

        var gatewayConfig = _.findWhere($scope.gateway_configs, { provider_id: provider_id });
        if (gatewayConfig) {
            if (gatewayConfig.fields.length > 0) {
                $scope.fields = gatewayConfig.fields;
            } else {
                $scope.fields = null;
            }
        }
    }

    $scope.onCurrencySelect = function (item, model, label) {

        if (!_.findWhere($scope.models.selectedCurrencies, { code: model.code })) {
            $scope.models.selectedCurrencies.push(model);
        }

        // Clear the form value
        $scope.typeahead.currency = null;
    }

    $scope.removeCurrency = function (currency) {

        $scope.models.selectedCurrencies = _.reject($scope.models.selectedCurrencies, function (item) {
            return item.code == currency.code
        });

    }

    $scope.onCardTypeSelect = function (item, model, label) {

        $scope.models.selectedCardTypes.push(model);

        // Clear the form value
        $scope.typeahead.card_types = null;
    }

    $scope.removeCardType = function (card_type) {

        $scope.models.selectedCardTypes = _.reject($scope.models.selectedCardTypes, function (item) {
            return item == card_type
        });

    }

    $scope.supportsCreditCard = function (provider_id) {

        if (provider_id && $scope.gateway_configs) {
            var gatewayConfig = _.findWhere($scope.gateway_configs, { provider_id: $scope.gateway.provider_id });
            if (gatewayConfig) {
                if (gatewayConfig.payment_method_types.indexOf("credit_card") > -1) {
                    return true;
                }
            }
        }

        return false;

    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.delete = function () {

        ApiService.remove($scope.url)
        .then(
        function () {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.gateway.name, type: "success" });
            utils.redirect($location, "/gateways");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);

//#endregion Products




app.controller("GettingStartedViewCtrl", ['$scope', '$q', '$routeParams', 'ApiService', 'GrowlsService', function ($scope, $q, $routeParams, ApiService, GrowlsService) {

    var getLimitedAuth = function (test) {

        return $q(function (resolve, reject) {
            ApiService.set(null, ApiService.buildUrl("/auths/limited"), { test: test })
            .then(
            function (auth) {
                resolve(auth);
            },
            function (error) {
                reject(error);
            });
        });
    }

    var setCartUrl = function (test) {

        $scope.cartUrl = "/#/app_installations";

    }
    $scope.onNavigate = function GSCtrl_onNavigate() {
        $(window).trigger('openSubMenu');
    };

    $scope.account_id = localStorage.getItem("account_id");

    setCartUrl(utils.stringToBool(localStorage.getItem("test")));

}]);
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

app.controller("InvoicesListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.invoiceListUrl = ApiService.buildUrl("/invoices");

}]);

app.controller("InvoicesSetCtrl", ['$scope', '$routeParams', '$location', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, $location, ApiService, ConfirmService, GrowlsService) {

    $scope.invoice = {};
    $scope.payment = {};
    $scope.exception = {};
    $scope.count = {};
    $scope.count.payments = 0;
    $scope.count.refunds = 0;
    $scope.count.notifications = 0;
    $scope.resources = {};
    $scope.functions = {};
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));
    $scope.params = { expand: "customer.payment_methods,options,payments.payment_method,items.subscription_terms,subscription", formatted: true };
    $scope.invoice.currency = localStorage.getItem("default_payment_currency");
    $scope.suppress_customer_notification = false;

    var d = new Date();
    d.setMonth(d.getMonth() + 1);
    $scope.invoice.date_due = d;

    // If only one currency, auto-select it.
    if ($scope.currencies.length == 1) {
        $scope.invoice.currency = $scope.currencies[0].code;
    }

    // Create an object to hold your price edits
    $scope.itemPriceEdits = {};
    $scope.itemQuantityEdits = {};

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.date_due = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/invoices/" + $routeParams.id);
        $scope.resources.paymentListUrl = $scope.url + "/payments";
        $scope.resources.refundListUrl = $scope.url + "/refunds";
        $scope.resources.notificationListUrl = $scope.url + "/notifications";

        // Load the invoice
        ApiService.getItem($scope.url, $scope.params).then(function (invoice) {

            $scope.invoice = invoice;
            $scope.date_due = Date.parse(invoice.date_due);

            if ($scope.invoice.date_due) {
                $scope.invoice.date_due = new Date($scope.invoice.date_due);
            }

            // If one of the payments was successful, pluck it.
            $scope.successful_payment = _.findWhere($scope.invoice.payments.data, { success: true });

            $scope.draft = $scope.invoice.draft;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

        $scope.hasPermission = function (resource, method) {
            return utils.hasPermission(resource, method);
        }

    } else {

        // Indicate this is an add
        $scope.url = ApiService.buildUrl("/invoices");
        $scope.invoice.items = [];
        $scope.invoice.autopay = false;
        $scope.draft = true;
        $scope.update = false;
        $scope.add = true;

    }

    // Watch for a captured payment
    $scope.$watch("successful_payment.status", function (newvalue, oldvalue) {
        // Update the payment in the invoice payment 
        if ($scope.successful_payment && oldvalue != undefined) {
            $scope.invoice.payment_status = $scope.successful_payment.status;
        }
    });

    $scope.functions.onCustomerSet = function (customer) {

        // If the invoice has already been saved, updated with the customer on change
        if ($scope.invoice.url) {
            $scope.invoice.customer = customer;
            $scope.backgroundUpdate();
        }

    }

    $scope.backgroundUpdate = function () {

        var autopay = $scope.invoice.autopay;

        return ApiService.set($scope.invoice, $scope.url, $scope.params).then(function (invoice) {

            $scope.invoice = invoice;

            if ($scope.invoice.date_due) {
                $scope.invoice.date_due = Date.parse($scope.invoice.date_due);
            }

            // If the customer in the invoice has payment methods and autopay was previously true, set to true.
            if ($scope.invoice.customer) {
                if ($scope.invoice.customer.payment_methods) {
                    if ($scope.invoice.customer.payment_methods.length > 0) {
                        $scope.invoice.autopay = true;
                    }
                }
            }

        }, function(error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.editItemPrice = function (item) {

        // Copy the current reference price and currency
        var itemEdit = {
            reference_price: item.reference_price,
            reference_currency: item.reference_currency
        }

        if (item.reference_price == null) {
            item.reference_price = item.price;
        }

        if (item.reference_currency == null) {
            item.reference_currency = item.currency;
        }

        $scope.itemPriceEdits[item.item_id] = itemEdit;
        $scope.itemEdits = true;

    }

    $scope.editItemQuantity = function (item, previousQuantity) {

        // Copy the current quantity, if not already provided
        if ($scope.itemQuantityEdits[item.item_id]) {
            return;
        }

        var itemEdit = {
            quantity: previousQuantity
        }

        $scope.itemQuantityEdits[item.item_id] = itemEdit;
        $scope.itemEdits = true;

    }

    $scope.cancelItemsEdit = function (items) {

        // Loop through the properties and revert to previous values
        for (var property in $scope.itemPriceEdits) {
            if ($scope.itemPriceEdits.hasOwnProperty(property)) {
                var item = _.findWhere(items, { item_id: property });
                if (item) {
                    item.reference_price = $scope.itemPriceEdits[property].reference_price;
                    item.reference_currency = $scope.itemPriceEdits[property].reference_currency;
                }
            }
        }

        for (var property in $scope.itemQuantityEdits) {
            if ($scope.itemQuantityEdits.hasOwnProperty(property)) {
                var item = _.findWhere(items, { item_id: property });
                if (item) {
                    item.quantity = $scope.itemQuantityEdits[property].quantity;
                }
            }
        }

        $scope.itemPriceEdits = {};
        $scope.itemQuantityEdits = {};
        $scope.itemEdits = false;
    }

    $scope.applyItemEdits = function () {

        $scope.exception.error = null;

        $scope.backgroundUpdate().then(function(invoice) {
            $scope.itemPriceEdits = {};
            $scope.itemQuantityEdits = {};
            $scope.itemEdits = false;
        }, function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.removeCustomer = function () {

        $scope.invoice.customer = null;
        $scope.invoice.customer_id = null;

        // If the invoice has already been saved, updated with the customer on change
        if ($scope.invoice.url) {
            $scope.backgroundUpdate();
        }

    }

    $scope.save = function () {

        // Set the draft status, based on user input.
        var previousDraft = $scope.invoice.draft;
        $scope.invoice.draft = $scope.draft;
        $scope.invoice.suppress_customer_notification = $scope.suppress_customer_notification;

        ApiService.set($scope.invoice, $scope.url, $scope.params).then(function (invoice) {
            GrowlsService.addGrowl({ id: "edit_success", name: "invoice " + invoice.invoice_id, type: "success", url: "#/invoices/" + invoice.invoice_id });
            utils.redirect($location, "/invoices");
        }, function (error) {
            $scope.exception.error = error;
            $scope.invoice.draft = previousDraft;
            window.scrollTo(0, 0);
        });

    }

    $scope.setShipping = function (shipping_method_id) {

        $scope.invoice.shipping_method_id = shipping_method_id;
        return $scope.backgroundUpdate();

    }

    $scope.publish = function () {

        $scope.draft = false;
        $scope.invoice.draft = false;

        ApiService.set($scope.invoice, $scope.url, $scope.params).then(function (invoice) {
            GrowlsService.addGrowl({ id: "invoice_published", type: "success" });
        }, function (error) {
            $scope.draft = true;
            $scope.invoice.draft = true;
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.send = function () {

        ApiService.set(null, $scope.url + "/send").then(function (invoice) {
            GrowlsService.addGrowl({ id: "invoice_sent", type: "success" });
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.delete = function () {

        ApiService.remove($scope.url).then(function () {
            GrowlsService.addGrowl({ id: "delete_success", name: "invoice " + $scope.invoice.invoice_id, type: "success" });
            utils.redirect($location, "/invoices");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/invoices");
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

    $scope.downloadPdf = function () {

        ApiService.getItemPdf($scope.url).then(function (data) {

            var file = new Blob([data], { type: "application/pdf" });
            saveAs(file, "Invoice_" + $scope.invoice.invoice_id + ".pdf");

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.getInvoiceLink = function () {

        ApiService.set(null, $scope.url + "/links").then(function (link) {
            $scope.link = link.link_url;
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);





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




app.controller("NotificationSubscriptionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.notificationSubscriptions = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadNotificationSubscriptions = function () {

        ApiService.getList(ApiService.buildUrl("/notification_subscriptions"), $scope.params).then(function (result) {
            $scope.notificationSubscriptions.notificationSubscriptionList = result;
            $scope.notificationSubscriptionsChecked = false;

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
            $scope.params.offset = $scope.notificationSubscriptions.notificationSubscriptionList.next_page_offset;
        } else {
            $scope.params.offset = $scope.notificationSubscriptions.notificationSubscriptionList.previous_page_offset;
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
        $scope.loadNotificationSubscriptions();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadNotificationSubscriptions();

}]);

app.controller("NotificationSubscriptionsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.notificationSubscription = {};
    $scope.exception = {};
    $scope.showTemplate = false;

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/notification_subscriptions/" + $routeParams.id)

        // Load the service
        var params = {expand:"template"};
        ApiService.getItem($scope.url, params).then(function (notificationSubscription) {
            $scope.notificationSubscription = notificationSubscription;
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
   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/notification_subscriptions");
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

    $scope.addNotificationSubscription = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }
        
        if(!$scope.notificationSubscription.method){
            $scope.notificationSubscription.method = 'email';
        }
        
        if ($scope.notificationSubscription.template && $scope.notificationSubscription.template.template_id) {
            $scope.notificationSubscription.template_id = $scope.notificationSubscription.template.template_id;
        }

        ApiService.set($scope.notificationSubscription, ApiService.buildUrl("/notification_subscriptions"), { show: "notification_subscription_id,name" })
        .then(
        function (notificationSubscription) {
            GrowlsService.addGrowl({ id: "add_success", name: notificationSubscription.notification_subscription_id, type: "success", notification_subscription_id: notificationSubscription.notification_subscription_id, url: "#/notification_subscriptions/" + notificationSubscription.notification_subscription_id + "/edit" });
            window.location = "#/notification_subscriptions";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateNotificationSubscription = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }
        
        if ($scope.notificationSubscription.template && $scope.notificationSubscription.template.template_id) {
            $scope.notificationSubscription.template_id = $scope.notificationSubscription.template.template_id;
        }

        ApiService.set($scope.notificationSubscription, $scope.url, { show: "notification_subscription_id,name" }).then(function (notificationSubscription) {
            GrowlsService.addGrowl({ id: "edit_success", name: notificationSubscription.notification_subscription_id, type: "success", notification_subscription_id: notificationSubscription.notification_subscription_id, url: "#/notification_subscriptions/" + notificationSubscription.notification_subscription_id + "/edit" });
            window.location = "#/notification_subscriptions";
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.notificationSubscription.url).then(function (notificationSubscription) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.notificationSubscription.notification_subscription_id, type: "success" });
            utils.redirect($location, "/notification_subscriptions");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }
    
    $scope.removeTemplate = function(){
        $scope.notificationSubscription.template = null;
        $scope.showTemplate = false;
    }

}]);



app.controller("OrdersListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.orderListUrl = ApiService.buildUrl("/orders");

}]);

app.controller("OrdersViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.order = {};  
    $scope.payment = {};
    $scope.exception = {};
    $scope.count = {};
    $scope.count.shipments = 0;
    $scope.resources = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/orders/" + $routeParams.id);
    $scope.resources.shipmentListUrl = $scope.url + "/shipments";
    $scope.resources.refundListUrl = $scope.url + "/refunds";
    $scope.resources.notificationListUrl = $scope.url + "/notifications";

    // Load the order
    var params = { expand: "customer,payment.response_data,payment.payment_method,payment.gateway,payment.refunds.items,items.product,items.subscription,items.download.file,items.license.license_service,shipments", hide: "items.product.images,items.license.license_service.configuration", formatted: true };
    ApiService.getItem($scope.url, params).then(function (order) {
        $scope.order = order;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.$watch('order.fulfilled', function (newvalue, oldvalue) {
    // If the order changes to fulfilled, indicate that the order will be captured in a moment.
        if (oldvalue == false && newvalue == true) {
            if ($scope.order.payment.status == "pending" && $scope.order.payment.payment_method.type == "credit_card") {
                GrowlsService.addGrowl({ id: "payment_capture_scheduled", type: "success" });
                $scope.order.hideCapture = true;
            }
        }

    });

    $scope.hasPermission = function (resource, method) {
        return utils.hasPermission(resource, method);
    }

    $scope.downloadPdf = function () {

        ApiService.getItemPdf($scope.url).then(function (data) {

            var file = new Blob([data], { type: "application/pdf" });
            saveAs(file, "Order_" + $scope.order.order_id + ".pdf");

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);





//#region Payments

app.controller("PaymentsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.paymentListUrl = ApiService.buildUrl("/payments");

}]);

app.controller("PaymentsViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.payment = {};
    $scope.exception = {};
    $scope.fee_currency = null;
    $scope.currencyType = "transaction";

    $scope.prefs = {}
    $scope.prefs.loadRefundDetails = false;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/payments/" + $routeParams.id)

    // Set the url for pulling the full refund details
    $scope.refundListUrl = $scope.url + "/refunds";

    // Load the payment
    var params = { expand: "customer,payment_method,response_data,gateway,fees,commissions,order,refunds.items" };
    ApiService.getItem($scope.url, params).then(function (payment) {
        $scope.payment = payment;

        if (payment.fees.data.length > 0) {
            $scope.fee_currency = payment.fees.data[0].currency;
        }

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

}]);

app.controller("PaymentsAddCtrl", ['$scope', '$location', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', 'GeographiesService', function ($scope, $location, $routeParams, ApiService, ConfirmService, GrowlsService, GeographiesService) {

    $scope.payment = { payment_method: { type: "credit_card" }, capture: true };
    $scope.exception = {};
    $scope.functions = {};
    $scope.data = {};
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

    var geo = GeographiesService.getGeographies(false);
    $scope.countries = geo.countries;

    $scope.typeahead = {};
    $scope.typeahead.country = {};

    // Pre-select USD if a valid currency
    if (_.find($scope.currencies, function (currency) { return currency.code == "USD" }) != null) {
        $scope.payment.currency = "USD";
    } else {
        // Select the top currency
        $scope.payment.currency = $scope.currencies[0].code;
    }

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/payments")

    $scope.removeCustomer = function () {
        delete $scope.payment.customer;
        delete $scope.payment.customer_id;
        delete $scope.payment.payment_method;
        $scope.payment_methods = null;
        $scope.payment.payment_method = { type: "credit_card" };
    }

    $scope.functions.onCustomerSelect = function (customer) {

        delete $scope.payment.customer_id;
        $scope.payment.payment_method = { type: "credit_card", capture: $scope.capture };

        if (customer.billing_address && customer.billing_address.country) {
            var country = _.find($scope.countries, function (c) { return c.code == customer.billing_address.country });
            $scope.typeahead.country = country;
        }

        // Get the payment methods for the customer
        ApiService.getItem(customer.payment_methods).then(function (paymentMethods) {

            $scope.payment_methods = paymentMethods;

            // Define the default
            if (paymentMethods.data.length) {
                $scope.payment.payment_method = _.find(paymentMethods.data, function (i) { return i.is_default == true });
            }

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.functions.setPaymentMethod = function (paymentMethod) {

        if (paymentMethod) {
            // Set the supplied payment method
            $scope.payment.payment_method = paymentMethod;
        } else {
            // Set a blank payment method
            $scope.payment.payment_method = { type: "credit_card" };
        }

    }

    $scope.createPayment = function () {

        $scope.exception = {};

        // Remove the username property
        if ($scope.payment.customer) {
            delete $scope.payment.customer.username;
            if ($scope.payment.customer.billing_address) {
                $scope.payment.customer.billing_address.country = $scope.typeahead.country.code;
            }
        }

        if (!$scope.payment.payment_method.save) {
            $scope.payment.payment_method.save = false;
        }

        // Get the payment methods for the customer
        ApiService.set($scope.payment, $scope.url, { formatted: true }).then(function (payment) {
            
            GrowlsService.addGrowl({ id: "payment_created_success", "payment_id": payment.payment_id, url: "#/payments/" + payment.payment_id, amount: payment.formatted.total, currency: payment.currency, type: "success" });
            utils.redirect($location, "/payments/" + payment.payment_id);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

}]);

//#endregion Payments




app.controller("ProductsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.products = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadProducts = function () {

        ApiService.getList(ApiService.buildUrl("/products?show=product_id,name,active,price,currency,deleted,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.products.productList = result;
            $scope.productsChecked = false;

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

    $scope.setActive = function (active) {

        // Find the checked items
        var items = _.where($scope.products.productList.data, { checked: true });

        // Keep track of the items that succeed and fail
        $scope.successItems = [];
        $scope.failItems = [];

        // Loop through the checked ones and update.
        var defer = $q.defer();
        var promises = [];

        _.each(items, function (product) {
            // We slim the request by trimming the resource since we're only modifying a couple properties.
            promises.push(ApiService.set({ product_id: product.product_id, active: active }, product.url).then(function (data) {
                product.deleted = data.deleted;
                product.active = data.active;
                $scope.successItems.push(product);
            }, function (error) {
                $scope.failItems.push(product);
                GrowlsService.addGrowl({ id: "active_change_failure", "name": product.name, type: "danger" });
            }));
        });

        $q.all(promises).then(complete);

        function complete() {

            if ($scope.successItems.length > 0) {
                if (active == true) {
                    GrowlsService.addGrowl({ id: "activate_success", count: $scope.successItems.length });

                } else {
            GrowlsService.addGrowl({ id: "inactivate_success", count: $scope.successItems.length });
        }
    }

}
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
            $scope.params.offset = $scope.products.productList.next_page_offset;
        } else {
            $scope.params.offset = $scope.products.productList.previous_page_offset;
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
        $scope.loadProducts();
    });

    $scope.checkProduct = function (product) {
        if (product.checked) {
            product.checked = false;
            $scope.productsChecked = false;
            _.each($scope.products.productList.data, function (item) {
                if (item.checked) {
                    $scope.productsChecked = true;
                }
            });
        } else {
            product.checked = true;
            $scope.productsChecked = true;
        }
    }

    // Initial load
    $scope.parseParams();
    $scope.loadProducts();

}]);

app.controller("ProductsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.data = {}

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/products/" + $routeParams.id)

        // Load the product
        ApiService.getItem($scope.url, { expand: "file,images,subscription_plan,license_service" }).then(function (product) {
            $scope.product = product;

            // If weight is null, set defaults
            if ($scope.product.weight == null) {
                $scope.product.weight = { unit: "oz" };
            }

            // Copy these items to their own scope, then delete from product since we don't need it.
            $scope.data.file = product.file;
            $scope.data.images = product.images;
            $scope.data.subscription_plan = product.subscription_plan;
            $scope.data.license_service = product.license_service;
            delete $scope.product.file;
            delete $scope.product.images;
            delete $scope.product.subscription_plan;
            delete $scope.product.license_service;

            // Clean up the prices for display.
            for (var i = 0; i < $scope.product.prices.length; i++) {
                $scope.product.prices[i].price = utils.cleanPrice($scope.product.prices[i].price);
            }

            // Make a copy of the original for comparision
            $scope.product_orig = angular.copy($scope.product);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.product = { active: false, description: "", prices: [], weight: {} };
        $scope.data.images = [];
        $scope.account_id = localStorage.getItem("account_id");
        $scope.product.active = false;
        $scope.product.hidden = false;
        $scope.product.weight.unit = "oz";

        // Add one blank price to the prices array.
        $scope.product.prices.push({ price: "", currency: "" });

    }

    // Get the pricing currencies available for the account
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

    $scope.removeFile = function () {
        $scope.product.file_id = null;
        $scope.data.file = null;
        $scope.showFile = false;
    };

    $scope.removeSubscriptionPlan = function () {
        $scope.product.subscription_plan_id = null;
        $scope.data.subscription_plan = null;
        $scope.showSubscriptionPlan = false;
    };

    $scope.removeLicenseService = function () {
        $scope.product.license_service_id = null;
        $scope.data.license_service = null;
        $scope.showLicenseService = false;
    };

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;

        // Remove any prices that are completely empty.
        $scope.product.prices = utils.removeEmptyPrices($scope.product.prices);

        // If weight amount is null, set entire weight object to null
        if ($scope.product.weight) {
            if ($scope.product.weight.amount == null || $scope.product.weight.amount == "") {
                $scope.product.weight = null;
            }
        }

        // If the length of prices is 0, add an empty price
        if ($scope.product.prices.length == 0) {
            $scope.product.prices.push({ price: "", currency: "" });
        }

        // Add the related items
        if ($scope.data.file != null) {
            $scope.product.file_id = $scope.data.file.file_id;
        }

        if ($scope.data.images != null) {
            _.each($scope.data.images, function (item) {
                if ($scope.product.image_ids == null) {
                    $scope.product.image_ids = [];
                }
                $scope.product.image_ids.push(item.image_id);
            })
        }

        if ($scope.data.subscription_plan != null) {
            $scope.product.subscription_plan_id = $scope.data.subscription_plan.subscription_plan_id;
        }

        if ($scope.data.license_service != null) {
            $scope.product.license_service_id = $scope.data.license_service.license_service_id;
        }

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.product, $scope.product_orig)) {
            utils.redirect($location, "/products");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/products");
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

    $scope.addProduct = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.product, ApiService.buildUrl("/products"), { show: "product_id,name" })
        .then(
        function (product) {
            GrowlsService.addGrowl({ id: "add_success", name: product.name, type: "success", product_id: product.product_id, url: "#/products/" + product.product_id + "/edit" });
            utils.redirect($location, "/products");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateProduct = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.product, $scope.url, { show: "product_id,name" })
        .then(
        function (product) {
            GrowlsService.addGrowl({ id: "edit_success", name: product.name, type: "success", url: "#/products/" + product.product_id + "/edit" });
            utils.redirect($location, "/products");
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
            GrowlsService.addGrowl({ id: "delete_success_with_undelete", name: $scope.product.name, type: "success", url: "#/products/" + $scope.product.product_id + "/edit" });
            utils.redirect($location, "/products");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.undelete = function () {

        ApiService.set({ deleted: false }, $scope.url, { show: "product_id,name" })
        .then(
        function (product) {
            GrowlsService.addGrowl({ id: "undelete_success", name: $scope.product.name, type: "success", product_id: $scope.product.product_id, url: "#/products/" + product.product_id + "/edit" });
            utils.redirect($location, "/products");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);

//#endregion Products




app.controller("ProfileUpdateCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/users/me")

    // Load the user
    ApiService.getItem($scope.url).then(function (user) {
        $scope.user = user;

        // Make a copy of the original for comparision
        $scope.user_orig = angular.copy($scope.user);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.user, $scope.user_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateProfile = function (form) {

        prepareSubmit();

        if ($scope.user.password || $scope.user.password2) {
            if ($scope.user.password != $scope.user.password2) {
                form.password2.$setValidity("match", false);
                return;
            } else {
                form.password2.$setValidity("match", true);
            }
        } else {
            form.password2.$setValidity("match", true);
        }

        if ($scope.form.$invalid) {
            return;
        }

        if (utils.isNullOrEmpty($scope.user.password)) {
            delete $scope.user.password;
            delete $scope.user.password2;
        }

        ApiService.set($scope.user, $scope.url)
        .then(
        function (user) {
            GrowlsService.addGrowl({ id: "edit_success", name: "your profile", type: "success", url: "#/profile" });
            utils.redirect($location, "/");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);




app.controller("PromotionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.promotions = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadPromotions = function () {

        ApiService.getList(ApiService.buildUrl("/promotions"), $scope.params).then(function (result) {
            $scope.promotions.promotionList = result;
            $scope.promotionsChecked = false;

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
            $scope.params.offset = $scope.promotions.promotionList.next_page_offset;
        } else {
            $scope.params.offset = $scope.promotions.promotionList.previous_page_offset;
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
        $scope.loadPromotions();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadPromotions();

}]);

app.controller("PromotionsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', 'gettextCatalog', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService, gettextCatalog) {

    $scope.promotion = { apply_to_recurring: false, active: false };
    $scope.promotion.config = { max_uses_per_customer: null, discount_amount: [{ price: null, currency: null }] };
    $scope.exception = {};
    $scope.options = {};
    $scope.options.discount_type = "percentage";
    $scope.options.coupon_code_type = "single";
    $scope.data = {};
    $scope.data.generate_number = 100;

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.expires = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/promotions/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url, { expand: "config.product_ids" }).then(function (promotion) {
            $scope.promotion = promotion;

            $scope.options.discount_type = promotion.config.discount_percent ? 'percentage' : 'amounts';
            $scope.options.coupon_code_type = promotion.config.code ? 'single' : 'unique';

            if (promotion.expires) {
                $scope.datepicker.expires = new Date(promotion.expires);
            }

            $scope.promotion.config.discount_amount = $scope.promotion.config.discount_amount || [];
            if ($scope.promotion.config.discount_percent) {
                $scope.promotion.config._discount_percent = utils.decimalToPercent($scope.promotion.config.discount_percent);
            }

            if ($scope.promotion.config.type === 'product' && $scope.promotion.config.product_ids) {
                $scope.promotion.config.product_ids = _.map($scope.promotion.config.product_ids, function (product) {
                    return { 'product_id': product };
                });
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

    // Get the pricing currencies available for the account
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/promotions");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.addPromotion = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return;
        }

        $scope.promotion.expires = $scope.datepicker.expires;

        if ($scope.options.discount_type == 'percentage') {
            $scope.promotion.config.discount_percent = utils.percentToDecimal($scope.promotion.config._discount_percent);
            $scope.promotion.config.discount_amount = undefined;
        } else if ($scope.options.discount_type == 'amounts') {
            $scope.promotion.config.discount_percent = undefined;
        }

        if ($scope.options.coupon_code_type == 'single') {
            $scope.promotion.config.generator_prefix = undefined;
            $scope.promotion.config.generator_secret_key = undefined;
        } else if ($scope.options.coupon_code_type == 'unique') {
            $scope.promotion.config.code = undefined;
        }

        if ($scope.promotion.config.type === 'product' && $scope.promotion.config.product_ids && $scope.promotion.config.product_ids.length) {
            $scope.promotion.config.product_ids = _.pluck($scope.promotion.config.product_ids, 'product_id');
        }

        $scope.promotion.type = 'coupon';

        ApiService.set($scope.promotion, ApiService.buildUrl("/promotions"), { show: "promotion_id,name" }).then(function (promotion) {
            GrowlsService.addGrowl({ id: "add_success", name: promotion.name, type: "success", promotion_id: promotion.promotion_id, url: "#/promotions/" + promotion.promotion_id + "/edit" });
            window.location = "#/promotions";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updatePromotion = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return;
        }

        $scope.promotion.expires = $scope.datepicker.expires;

        if ($scope.options.discount_type == 'percentage') {
            $scope.promotion.config.discount_percent = utils.percentToDecimal($scope.promotion.config._discount_percent);
            $scope.promotion.config.discount_amount = undefined;
        } else if ($scope.options.discount_type == 'amounts') {
            $scope.promotion.config.discount_percent = undefined;
        }

        if ($scope.options.coupon_code_type == 'single') {
            $scope.promotion.config.generator_prefix = undefined;
            $scope.promotion.config.generator_secret_key = undefined;
        } else if ($scope.options.coupon_code_type == 'unique') {
            $scope.promotion.config.code = undefined;
        }

        if ($scope.promotion.config.type === 'product' && $scope.promotion.config.product_ids && $scope.promotion.config.product_ids.length) {
            $scope.promotion.config.product_ids = _.pluck($scope.promotion.config.product_ids, 'product_id');
        }

        ApiService.set($scope.promotion, $scope.url, { show: "promotion_id,name" }).then(function (promotion) {
            GrowlsService.addGrowl({ id: "edit_success", name: promotion.name, type: "success", promotion_id: promotion.promotion_id, url: "#/promotions/" + promotion.promotion_id + "/edit" });
            window.location = "#/promotions";
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.delete = function () {

        ApiService.remove($scope.promotion.url).then(function (promotion) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.promotion.name, type: "success" });
            utils.redirect($location, "/promotions");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.generateCode = function (model) {

        // Generate 12 character string without ambigious characters.
        var possible = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

        var code = utils.getRandomString(possible, 12);

        // Insert dashes every four characters
        var chunks = code.match(/.{1,4}/g);
        code = chunks.join("-");

        $scope.promotion.config.code = code;

    }

    $scope.generateCodes = function (prefix, secret, num) {


        var possible = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        var codes = [];

        for (var i = num; i > 0; --i) {
            var shaObj = new jsSHA("SHA-256", "TEXT");
            shaObj.setHMACKey(secret, "TEXT");
            var code = prefix.toUpperCase() + "-" + utils.getRandomString(possible, 12);
            shaObj.update(code);
            var hmac = shaObj.getHMAC("HEX");
            codes.push(code + "-" + hmac.substring(0, 7).toUpperCase());
        }

        $scope.data.codes = codes.join("\n");

    }

}]);





//#region Refunds

app.controller("RefundsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.refundListUrl = ApiService.buildUrl("/refunds");

}]);

app.controller("RefundsViewCtrl", ['$scope', '$routeParams', 'ApiService', 'ConfirmService', 'GrowlsService', function ($scope, $routeParams, ApiService, ConfirmService, GrowlsService) {

    $scope.refund = {};
    $scope.exception = {};
    $scope.fee_currency = null;
    $scope.items = [];
    $scope.currencyType = "transaction";

    $scope.prefs = {}
    $scope.prefs.loadRefundDetails = false;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/refunds/" + $routeParams.id)

    // Load the refund
    var params = { expand: "payment,customer,payment_method,gateway,fees,commissions,order,refunds.items" };
    ApiService.getItem($scope.url, params).then(function (refund) {
        $scope.refund = refund;

        if (refund.fees.data.length > 0) {
            $scope.fee_currency = refund.fees.data[0].currency;
        }

        if (refund.order != null) {
            $scope.items = refund.order.items;
        }

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

}]);

//#endregion Refunds




app.controller("ReportCommissionsController", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, TimezonesService) {

    $scope.exception = {};

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/reports/commissions");

    // Set defaults
    $scope.options = {};
    $scope.options.category = null;
    $scope.options.desc = "true";
    $scope.options.sort_by = "total";
    $scope.options.timezone = "UTC";
    $scope.options.dates = "this_month";
    $scope.options.search_by = "date";
    $scope.options.accounting_id = null;

    // Set the currencies
    $scope.options.currencies = ["Actual", localStorage.getItem("reporting_currency_primary"), localStorage.getItem("reporting_currency_secondary")];
    $scope.options.currency = $scope.options.currencies[0];

    // For scrolling
    $scope.nav = {};

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.date_start = {
        opened: false
    };

    $scope.datepicker.status.date_end = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    $scope.run = function (reset) {

        // Clear any previous errors
        $scope.exception = {};

        if (reset) {
            $scope.options.offset = "0";
        }

        // Determine your start date and end date
        var date_start = $scope.options.dates;
        date_end = $scope.options.dates;

        // Override if necessary
        switch($scope.options.dates) {
            case "last_30":
                date_start = -29;
                date_end = 0;
                break;
            case "last_7":
                date_start = -6;
                date_end = 0;
                break;
            case "custom":

                if (!$scope.datepicker.date_end) {
                    $scope.datepicker.date_end = new Date();
                }

                if (!$scope.datepicker.date_start) {
                    $scope.datepicker.date_start = $scope.datepicker.date_end;
                }

                date_start = $scope.datepicker.date_start.toISOString().substring(0, 10);
                date_end = $scope.datepicker.date_end.toISOString().substring(0, 10);
                break;
        }

        if ($scope.options.search_by == "doc") {
            date_start = null;
            date_end = null;
        }

        var accounting_id = $scope.options.accounting_id;
        if ($scope.options.search_by == "date") {
            accounting_id = null;
        }

        var currency = $scope.options.currency;
        if (currency == "Actual") {
            currency = null;
        }

        ApiService.getItem($scope.url, { category: $scope.options.category, currency: currency, accounting_id: accounting_id, sort_by: $scope.options.sort_by, timezone: $scope.options.timezone, desc: $scope.options.desc, date_start: date_start, date_end: date_end, offset: $scope.options.offset, formatted: true }, true, 90000).then(function (report) {

            $scope.report = report;

            // Trim the data down for the chart.
            $scope.data = {};
            _.each(report.data, function (item) {
                $scope.data[item.currency] = {};
                $scope.data[item.currency].data = [];
                $scope.data[item.currency].labels = [];
                $scope.data[item.currency].values = [];
                _.each(item.breakdowns, function (breakdown) {
                    $scope.data[item.currency].data.push(breakdown.total);
                    $scope.data[item.currency].labels.push(breakdown.type.split("_").join(" "));
                    $scope.data[item.currency].values.push(breakdown.formatted.total);
                });
            });

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.getChartData = function (reportGroup) {

        // Trim the data down for the chart.
        var dataSet = {};
        var data = [];
        var labels = [];
        var values = [];

        _.each(reportGroup.breakdowns, function (item) {
            data.push(item.total);
            // Fill the labels for the bar chart
            labels.push(item.name);
            values.push(item.formatted.total);
        });

        dataSet.data = data;
        dataSet.labels = labels;
        dataSet.values = values;
        return dataSet;

    }

    $scope.downloadCsv = function (data, currency) {

        // Determine the filename
        var category = "all";
        if ($scope.options.category) {
            category = $scope.options.category;
        }

        if ($scope.options.search_by == "doc") {
            var filename = "commissionss_" + category + "_" + currency + "_" + $scope.options.accounting_id;
        }

        var accounting_id = $scope.options.accounting_id;
        if ($scope.options.search_by == "date") {
            var filename = "commissionss_" + category + "_" + currency + "_" + utils.replaceAll($scope.report.date_start, "-", "").substring(0, 8) + "-" + utils.replaceAll($scope.report.date_end, "-", "").substring(0, 8) + "_" + utils.replaceAll($scope.report.timezone, " ", "_").replace("/", "_");
        }

        // Slip the currency into the recordset
        _.each(data, function (item) {
            item.currency = currency;
        });

        utils.jsonToCsvDownload(data, filename);

    }

    // Perform the initial load
    $scope.run();

}]);

app.controller("ReportFeesController", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, TimezonesService) {

    $scope.exception = {};

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/reports/fees");

    // Set defaults
    $scope.options = {};
    $scope.options.category = null;
    $scope.options.desc = "true";
    $scope.options.sort_by = "total";
    $scope.options.timezone = "UTC";
    $scope.options.dates = "this_month";
    $scope.options.search_by = "date";
    $scope.options.accounting_id = null;

    // Set the currencies
    $scope.options.currencies = ["Actual", localStorage.getItem("reporting_currency_primary"), localStorage.getItem("reporting_currency_secondary")];
    $scope.options.currency = $scope.options.currencies[0];

    // For scrolling
    $scope.nav = {};

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.date_start = {
        opened: false
    };

    $scope.datepicker.status.date_end = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    $scope.run = function (reset) {

        // Clear any previous errors
        $scope.exception = {};

        if (reset) {
            $scope.options.offset = "0";
        }

        // Determine your start date and end date
        var date_start = $scope.options.dates;
        date_end = $scope.options.dates;

        // Override if necessary
        switch($scope.options.dates) {
            case "last_30":
                date_start = -29;
                date_end = 0;
                break;
            case "last_7":
                date_start = -6;
                date_end = 0;
                break;
            case "custom":

                if (!$scope.datepicker.date_end) {
                    $scope.datepicker.date_end = new Date();
                }

                if (!$scope.datepicker.date_start) {
                    $scope.datepicker.date_start = $scope.datepicker.date_end;
                }

                date_start = $scope.datepicker.date_start.toISOString().substring(0, 10);
                date_end = $scope.datepicker.date_end.toISOString().substring(0, 10);
                break;
        }

        if ($scope.options.search_by == "doc") {
            date_start = null;
            date_end = null;
        }

        var accounting_id = $scope.options.accounting_id;
        if ($scope.options.search_by == "date") {
            accounting_id = null;
        }

        var currency = $scope.options.currency;
        if (currency == "Actual") {
            currency = null;
        }

        ApiService.getItem($scope.url, { category: $scope.options.category, currency: currency, accounting_id: accounting_id, sort_by: $scope.options.sort_by, timezone: $scope.options.timezone, desc: $scope.options.desc, date_start: date_start, date_end: date_end, offset: $scope.options.offset, formatted: true }, true, 90000).then(function (report) {

            $scope.report = report;

            // Trim the data down for the chart.
            $scope.data = {};
            _.each(report.data, function (item) {
                $scope.data[item.currency] = {};
                $scope.data[item.currency].data = [];
                $scope.data[item.currency].labels = [];
                $scope.data[item.currency].values = [];
                _.each(item.breakdowns, function (breakdown) {
                    $scope.data[item.currency].data.push(breakdown.total);
                    $scope.data[item.currency].labels.push(breakdown.type.split("_").join(" "));
                    $scope.data[item.currency].values.push(breakdown.formatted.total);
                });
            });

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.getChartData = function (reportGroup) {

        // Trim the data down for the chart.
        var dataSet = {};
        var data = [];
        var labels = [];
        var values = [];

        _.each(reportGroup.breakdowns, function (item) {
            data.push(item.total);
            // Fill the labels for the bar chart
            labels.push(item.name);
            values.push(item.formatted.total);
        });

        dataSet.data = data;
        dataSet.labels = labels;
        dataSet.values = values;
        return dataSet;

    }

    $scope.downloadCsv = function (data, currency) {

        // Determine the filename
        var category = "all";
        if ($scope.options.category) {
            category = $scope.options.category;
        }

        if ($scope.options.search_by == "doc") {
            var filename = "fees_" + category + "_" + currency + "_" + $scope.options.accounting_id;
        }

        var accounting_id = $scope.options.accounting_id;
        if ($scope.options.search_by == "date") {
            var filename = "fees_" + category + "_" + currency + "_" + utils.replaceAll($scope.report.date_start, "-", "").substring(0, 8) + "-" + utils.replaceAll($scope.report.date_end, "-", "").substring(0, 8) + "_" + utils.replaceAll($scope.report.timezone, " ", "_").replace("/", "_");
        }

        // Slip the currency into the recordset
        _.each(data, function (item) {
            item.currency = currency;
        });

        utils.jsonToCsvDownload(data, filename);

    }

    // Perform the initial load
    $scope.run();

}]);

app.controller("ReportItemsController", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, TimezonesService) {

    $scope.exception = {};

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/reports/items");

    // Set defaults
    $scope.options = {};
    $scope.options.type = "combined";
    $scope.options.desc = "true";
    $scope.options.sort_by = "subtotal";
    $scope.options.timezone = "UTC";
    $scope.options.dates = "yesterday";
    $scope.options.offset = "0";
    $scope.options.labels = [];
    $scope.options.values = [];

    // Set the currencies
    $scope.options.currencies = [];
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_primary"));
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_secondary"));
    $scope.options.currency = $scope.options.currencies[0];

    // For scrolling
    $scope.nav = {};

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.date_start = {
        opened: false
    };

    $scope.datepicker.status.date_end = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    $scope.run = function (reset) {

        // Clear any previous errors
        $scope.exception = {};

        if (reset) {
            $scope.options.offset = "0";
        }

        // Determine your start date and end date
        var date_start = $scope.options.dates;
        date_end = $scope.options.dates;

        // Override if necessary
        switch($scope.options.dates) {
            case "last_30":
                date_start = -29;
                date_end = 0;
                break;
            case "last_7":
                date_start = -6;
                date_end = 0;
                break;
            case "custom":

                if (!$scope.datepicker.date_end) {
                    $scope.datepicker.date_end = new Date();
                }

                if (!$scope.datepicker.date_start) {
                    $scope.datepicker.date_start = $scope.datepicker.date_end;
                }

                date_start = $scope.datepicker.date_start.toISOString().substring(0, 10);
                date_end = $scope.datepicker.date_end.toISOString().substring(0, 10);
                break;
        }

        ApiService.getItem($scope.url, { type: $scope.options.type, sort_by: $scope.options.sort_by, timezone: $scope.options.timezone, desc: $scope.options.desc, date_start: date_start, date_end: date_end, currency: $scope.options.currency, offset: $scope.options.offset, formatted: true }, true, 90000).then(function (report) {

            $scope.report = report;

            // Trim the data down for the chart.
            $scope.data = [];
            $scope.options.labels = [];
            $scope.options.values = [];
            _.each(report.data, function (item) {
                $scope.data.push(item.total);

                // Fill the labels for the bar chart
                $scope.options.labels.push(item.name);
                $scope.options.values.push(item.formatted.total);
            });

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.movePage = function (direction) {
        if (direction == "+") {
            $scope.options.offset = $scope.report.next_page_offset;
        } else {
            $scope.options.offset = $scope.report.previous_page_offset;
        }
        $scope.nav.scrollTop = true;
        $scope.run();
    }

    $scope.downloadCsv = function (data) {

        // Determine the filename
        var filename = "sales_by_product_" + $scope.report.type + "_" + utils.replaceAll($scope.report.date_start, "-", "").substring(0, 8) + "-" + utils.replaceAll($scope.report.date_end, "-", "").substring(0, 8) + "_" + utils.replaceAll($scope.report.timezone, " ", "_").replace("/", "_");

        utils.jsonToCsvDownload(data, filename);

    }

    // Perform the initial load
    $scope.run();

}]);

app.controller("ReportSalesCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, TimezonesService) {

    $scope.exception = {};

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/reports/sales");

    // Set defaults
    $scope.options = {};
    $scope.options.type = "combined";
    $scope.options.segment = "all";
    $scope.options.group_by = "day";
    $scope.options.timezone = "UTC";
    $scope.options.dates = "last_30";
    $scope.options.labels = [];
    $scope.options.values = [];

    // Set the currencies
    $scope.options.currencies = [];
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_primary"));
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_secondary"));
    $scope.options.currency = $scope.options.currencies[0];

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.date_start = {
        opened: false
    };

    $scope.datepicker.status.date_end = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    $scope.run = function () {

        // Clear any previous errors
        $scope.exception = {};

        // Determine your start date and end date
        var date_start = $scope.options.dates;
        date_end = $scope.options.dates;

        // Override if necessary
        switch($scope.options.dates) {
            case "last_30":
                date_start = -29;
                date_end = 0;
                break;
            case "last_7":
                date_start = -6;
                date_end = 0;
                break;
            case "custom":

                if (!$scope.datepicker.date_end) {
                    $scope.datepicker.date_end = new Date();
                }

                if (!$scope.datepicker.date_start) {
                    $scope.datepicker.date_start = $scope.datepicker.date_end;
                }

                date_start = $scope.datepicker.date_start.toISOString().substring(0, 10);
                date_end = $scope.datepicker.date_end.toISOString().substring(0, 10);
                break;
        }

        ApiService.getItem($scope.url, { type: $scope.options.type, group_by: $scope.options.group_by, timezone: $scope.options.timezone, segment: $scope.options.segment, date_start: date_start, date_end: date_end, currency: $scope.options.currency, formatted: true }).then(function (report) {

            $scope.report = report;

            // Trim the data down for the chart.
            $scope.data = [];
            $scope.options.labels = [];
            $scope.options.values = [];
            _.each(report.data, function (item) {
                $scope.data.push(item.total - item.tax);

                // Fill the labels for the bar chart
                $scope.options.labels.push(item.total);
                $scope.options.values.push(item.formatted.total);
            })

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.downloadCsv = function (data) {

        // Determine the filename
        var filename = "sales_" + $scope.report.type + "_" + $scope.report.segment + "_" + utils.replaceAll($scope.report.date_start, "-", "").substring(0, 8) + "-" + utils.replaceAll($scope.report.date_end, "-", "").substring(0, 8) + "_" + utils.replaceAll($scope.report.timezone, " ", "_").replace("/", "_");

       utils.jsonToCsvDownload(data, filename);

    }

    // Perform the initial load
    $scope.run();

}]);

app.controller("AnalyticsSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/analytics");

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function (form) {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        if ($scope.refund_reasons != null) {
            $scope.settings.refund_reasons = utils.stringToArray($scope.refund_reasons);
        }

        if ($scope.chargeback_reasons != null) {
            $scope.settings.chargeback_reasons = utils.stringToArray($scope.chargeback_reasons);
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Analytics Settings", type: "success", url: "#/settings/analytics" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);




app.controller("FulfillmentSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/fulfillment");

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function (form) {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Fulfillment Settings", type: "success", url: "#/settings/fulfillment" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);




app.controller("GeneralSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'CurrenciesService', 'TimezonesService', 'HelperService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, CurrenciesService, TimezonesService, HelperService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/general");

    // Load the currencies
    $scope.currencies = CurrenciesService.getCurrencies();

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    $scope.helperService = HelperService;

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {
        $scope.settings = settings;

        $scope.typeahead = {};
        $scope.typeahead.reporting_currency_primary = _.find($scope.currencies, { code: settings.reporting_currency_primary });
        $scope.typeahead.reporting_currency_secondary = _.find($scope.currencies, { code: settings.reporting_currency_secondary });

        $scope.app_hosts = utils.arrayToString(settings.app_hosts);
        $scope.cors_allowed_origins = utils.arrayToString(settings.cors_allowed_origins);
        $scope.oauth_redirect_uris = utils.arrayToString(settings.oauth_redirect_uris);
        $scope.notification_from_addresses = utils.arrayToString(settings.notification_from_addresses);

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.onCurrencySelect = function (item, model, label, type) {
        $scope.settings["reporting_currency_" + type] = model.code;
    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        if ($scope.app_hosts != null) {
            $scope.settings.app_hosts = utils.stringToArray($scope.app_hosts);
        }

        if ($scope.cors_allowed_origins != null) {
            $scope.settings.cors_allowed_origins = utils.stringToArray($scope.cors_allowed_origins);
        }

        if ($scope.oauth_redirect_uris != null) {
            $scope.settings.oauth_redirect_uris = utils.stringToArray($scope.oauth_redirect_uris);
        }

        if ($scope.notification_from_addresses != null) {
            $scope.settings.notification_from_addresses = utils.stringToArray($scope.notification_from_addresses);
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "General Settings", type: "success", url: "#/settings/general" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);




app.controller("PaymentSettingsCtrl", ['$scope', '$routeParams', '$location', '$timeout', 'GrowlsService', 'ApiService', 'ConfirmService', 'CurrenciesService', 'HelperService', function ($scope, $routeParams, $location, $timeout, GrowlsService, ApiService, ConfirmService, CurrenciesService, HelperService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/payment");

    // Load the currencies
    $scope.currencies = CurrenciesService.getCurrencies();

    // Load a place to hold your required fields settings
    $scope.required_fields = {};
    $scope.optional_fields = {};

    $scope.helperService = HelperService;

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        $scope.typeahead = {};
        $scope.typeahead.default_payment_currency = _.find($scope.currencies, { code: settings.default_payment_currency });

        $scope.refund_reasons = utils.arrayToString(settings.refund_reasons);
        $scope.chargeback_reasons = utils.arrayToString(settings.chargeback_reasons);
        $scope.blocked_countries = utils.arrayToString(settings.blocked_countries);

        // Load the fields into objects
        $scope.required_fields = loadFields(settings.customer_required_fields, $scope.required_fields);
        $scope.optional_fields = loadFields(settings.customer_optional_fields, $scope.optional_fields);

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.onCurrencySelect = function (item, model, label, type) {
        $scope.settings[type] = model.code;
    }

    $scope.toggleCustomerRequiredField = function (field) {
        if ($scope.required_fields[field]) {
            $scope.optional_fields[field] = false;
        }
    }

    $scope.toggleCustomerOptionalField = function (field) {
        if ($scope.optional_fields[field]) {
            $scope.required_fields[field] = false;
        }
    }

    function loadFields(fields, obj) {
        _.each(fields, function (item) {
            obj[item] = true;
        });
        return obj;
    }

    function loadList(obj) {
        var list = [];
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (obj[property] == true) {
                    list.push(property);
                }
            }
        }
        return list;
    }

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function (form) {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        if ($scope.refund_reasons != null) {
            $scope.settings.refund_reasons = utils.stringToArray($scope.refund_reasons);
        }

        if ($scope.chargeback_reasons != null) {
            $scope.settings.chargeback_reasons = utils.stringToArray($scope.chargeback_reasons);
        }

        if ($scope.blocked_countries != null) {
            $scope.settings.blocked_countries = utils.stringToArray($scope.blocked_countries);
        }

        // Load the lists 
        $scope.settings.customer_required_fields = loadList($scope.required_fields);
        $scope.settings.customer_optional_fields = loadList($scope.optional_fields);

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Payment Settings", type: "success", url: "#/settings/payment" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);




app.controller("PricingSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', "GeographiesService", function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/pricing");

    //Get currencies
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));
    $scope.currencies.unshift({ code: null, name: 'All other currencies (default)' });

    $scope.methods = [{ name: 'Highest', value: 'highest' }, { name: 'Closest', value: 'closest' }, { name: 'Lowest', value: 'lowest' }];

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {
        _.each(settings.currency_rounding_rules, function (rule) {
            rule._positions = _.map(rule.positions, function (pos) {
                return { value: pos };
            });
        });

        _.each(settings.currency_markup_rules, function (rule) {
            rule.markup_percentage_value = utils.decimalToPercent(rule.markup_percentage);
        });

        $scope.settings = settings;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });
  
    $scope.addNew = function (prop, val) {

        if (prop == 'currency_rounding_rules') {
            // Add some default values
            val.method = "highest";
            val.minimum = "3";
            val._positions.push({value: 0});
            val._positions.push({ value: 0.5 });
            val._positions.push({ value: 0.95 });
            val._positions.push({ value: 0.99 });
        }

        $scope.settings[prop].unshift(val);
    };
    
    $scope.confirmDelete = function (prop, rule, index) {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteRule(prop, rule, index);
        }
        ConfirmService.showConfirm($scope, confirm);
    }
    
     $scope.deleteRule = function(prop, rule, index){  
       $scope.settings[prop].splice(index, 1);
     };

     $scope.addRoundingPosition = function (rule) {
         rule._positions.push({});
     };

     $scope.removeRoundingPosition = function (rule, index) {
         rule._positions.splice(index, 1);
     };

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.updateSettings = function (form) {

        // Clear any previous errors
        $scope.exception.error = null;

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: "Please review the fields highlighted below." } };
            window.scrollTo(0, 0);
            return;
        }

        // Map our UI to our rules before sending them to the API. We'll make a copy to preserve the UI.
        var settingsCopy = angular.copy($scope.settings);
        _.each(settingsCopy.currency_rounding_rules, function (rule) {
            rule.positions = _.map(rule._positions, function (pos) {
                return pos.value;
            });
            // Remove the _positions object from the copy
            delete rule._positions;
        });

        _.each(settingsCopy.currency_markup_rules, function (rule) {
            rule.markup_percentage = rule.markup_percentage_value / 100;
        });

        ApiService.set(settingsCopy, $scope.url).then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Pricing Settings", type: "success", url: "#/settings/pricing" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

app.controller("SubscriptionsSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/subscription");

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);
        $scope.cancellation_reasons = utils.arrayToString(settings.cancellation_reasons);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function (form) {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        if ($scope.cancellation_reasons != null) {
            $scope.settings.cancellation_reasons = utils.stringToArray($scope.cancellation_reasons);
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Subscription Settings", type: "success", url: "#/settings/subscription" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

app.controller("TaxSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', "GeographiesService", function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, GeographiesService) {

    $scope.exception = {};
    $scope.geo = GeographiesService;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/tax");
    
     //Load the countries
    $scope.countries = $scope.geo.getGeographies().countries;

    // Add "EU" as an alias for all EU countries, which the API will accept
    $scope.countries.push({ code: "EU", name: "European Union" });

    // Re-sort
    $scope.countries = _.sortBy($scope.countries, "name");

    // We can't have an "All countries" option for tax rules, so make a copy to use for rule countries
    $scope.ruleCountries = angular.copy($scope.countries);

    // Add an option for all countries
    $scope.countries.unshift({code: "*", name: "All countries"})

    // Set up some models to hold user input.
    $scope.models = {};
    $scope.models.tax_inclusive_countries = [];
    $scope.models.gross_discount_countries = [];
    $scope.typeahead = {};

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {

        $scope.settings = settings;
        
        // Convert our tax inclusive countries to a country object
        _.each(settings.tax_inclusive_countries , function (item) {
            var country = _.findWhere($scope.countries, { code: item });
            if (country != null) {
                $scope.models.tax_inclusive_countries.push(country);
            }
        });
        
        // Convert our gross discount countries to a country object
        _.each(settings.gross_discount_countries , function (item) {
            var country = _.findWhere($scope.countries, { code: item });
            if (country != null) {
                $scope.models.gross_discount_countries.push(country);
            }
        });

        // Modify our rules slightly to make the a little easier to work with in the UI.
        _.each($scope.settings.rules, function (rule) {
            rule.country = _.find($scope.countries, { code: rule.country });
            rule.manual_rate = false;
            if (rule.rate != null) {
                rule.manual_rate = true;
            }

            if (rule.state_prov) {
                rule.state_prov = rule.state_prov.toUpperCase();
            }

        });

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });
  
    $scope.addNewRule = function(){  
        $scope.settings.rules.unshift({ manual_rate: true });
    };
    
    $scope.confirmDelete = function (rule, index) {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.deleteRule(rule, index);
        }
        ConfirmService.showConfirm($scope, confirm);
    }
    
     $scope.deleteRule = function(rule, index){  
       $scope.settings.rules.splice(index, 1);
     };

     $scope.onCountrySelect = function (item, model, label, type) {
         if (!_.findWhere($scope.models[type], { code: model.code })) {
             $scope.models[type].push(model);
         }
         // Clear the form value
         $scope.typeahead[type] = null;
     };

     $scope.removeCountry = function (country, type) {
         $scope.models[type] = _.reject($scope.models[type], function (item) {
             return item.code == country.code
         });
         // If the type is tax inclusive, also remove the same country from the gross discount country list. Only tax inclusive countries can be gross discount countries.
         if (type == "tax_inclusive_countries") {
             $scope.removeCountry(country, "gross_discount_countries");
         }
     }
    
    $scope.onRuleCountrySelect = function (item, model, label, event, rule) {
        if (model.code == "US" || model.code == "CA" || model.code == "EU" || $scope.geo.isEuCountry(model.code)) {
            rule.manual_rate = false;
        } else {
            rule.manual_rate = true;
        }
    }

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.updateSettings = function (form) {

        // Clear any previous errors
        $scope.exception.error = null;

        if ($scope.form.$invalid) {
            return;
        }

        // Map our UI to our rules before sending them to the API. We'll make a copy to preserve the UI.
        var settingsCopy = angular.copy($scope.settings);
        
        _.each(settingsCopy.rules, function (rule) {

            // If the rate is not manual, set the rate to null.
            if (!rule.manual_rate) {
                rule.rate = null;
            }

            // Remove the property manual_rate since it's not a part of the API model.
            delete rule.manual_rate;

            // Set the country to the country code
            rule.country = rule.country.code;

        });

        // Copy the countries from the models to settings
        settingsCopy.tax_inclusive_countries = _.pluck($scope.models.tax_inclusive_countries, "code");
        settingsCopy.gross_discount_countries = _.pluck($scope.models.gross_discount_countries, "code");

        ApiService.set(settingsCopy, $scope.url).then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Tax Settings", type: "success", url: "#/settings/tax" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

app.controller("TechnicalSettingsCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'CurrenciesService', 'TimezonesService', 'HelperService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, CurrenciesService, TimezonesService, HelperService) {

    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/settings/technical");

    // Load the currencies
    $scope.currencies = CurrenciesService.getCurrencies();

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    $scope.helperService = HelperService;

    // Load the settings
    ApiService.getItem($scope.url).then(function (settings) {
        $scope.settings = settings;

        $scope.typeahead = {};
        $scope.typeahead.reporting_currency_primary = _.find($scope.currencies, { code: settings.reporting_currency_primary });
        $scope.typeahead.reporting_currency_secondary = _.find($scope.currencies, { code: settings.reporting_currency_secondary });

        $scope.app_hosts = utils.arrayToString(settings.app_hosts);
        $scope.cors_allowed_origins = utils.arrayToString(settings.cors_allowed_origins);
        $scope.oauth_redirect_uris = utils.arrayToString(settings.oauth_redirect_uris);
        $scope.notification_from_addresses = utils.arrayToString(settings.notification_from_addresses);

        // Make a copy of the original for comparision
        $scope.settings_orig = angular.copy($scope.settings);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

    }

    $scope.onCurrencySelect = function (item, model, label, type) {
        $scope.settings["reporting_currency_" + type] = model.code;
    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.settings, $scope.settings_orig)) {
            utils.redirect($location, "/");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/");
            }
            ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.updateSettings = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        if ($scope.app_hosts != null) {
            $scope.settings.app_hosts = utils.stringToArray($scope.app_hosts);
        }

        if ($scope.cors_allowed_origins != null) {
            $scope.settings.cors_allowed_origins = utils.stringToArray($scope.cors_allowed_origins);
        }

        if ($scope.oauth_redirect_uris != null) {
            $scope.settings.oauth_redirect_uris = utils.stringToArray($scope.oauth_redirect_uris);
        }

        if ($scope.notification_from_addresses != null) {
            $scope.settings.notification_from_addresses = utils.stringToArray($scope.notification_from_addresses);
        }

        ApiService.set($scope.settings, $scope.url)
        .then(
        function (settings) {
            GrowlsService.addGrowl({ id: "edit_success", name: "Technical Settings", type: "success", url: "#/settings/technical" });
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);





//#region Shipments

app.controller("ShipmentsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.shipments = {};
    $scope.nav = {};
    $scope.exception = {};

    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_shipped";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }

    $scope.loadShipments = function () {

        ApiService.getList(ApiService.buildUrl("/shipments"), $scope.params).then(function (result) {
            $scope.shipments.shipmentList = result;
            $scope.shipmentsChecked = false;

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
            $scope.params.offset = $scope.shipments.shipmentList.next_page_offset;
        } else {
            $scope.params.offset = $scope.shipments.shipmentList.previous_page_offset;
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
        $scope.loadShipments();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadShipments();

}]);

app.controller("ShipmentsViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.shipment = {};
    $scope.exception = {};
    $scope.count = {};
    $scope.resources = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/shipments/" + $routeParams.id)
    $scope.resources.notificationListUrl = $scope.url + "/notifications";

    // Load the service
    ApiService.getItem($scope.url, { expand: "order.customer" }).then(function (shipment) {
        $scope.shipment = shipment;
    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.confirmDelete = function () {
        var confirm = { id: "delete" };
        confirm.onConfirm = function () {
            $scope.delete();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.delete = function () {

        ApiService.remove($scope.shipment.url).then(
        function (eventSubscription) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.shipment.shipment_id, type: "success" });
            utils.redirect($location, "/shipments");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

//#endregion Products





//#region ShippingMethods

app.controller("ShippingMethodsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.shippingMethods = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadShippingMethods = function () {

        ApiService.getList(ApiService.buildUrl("/shipping_methods"), $scope.params).then(function (result) {
            $scope.shippingMethods.shippingMethodList = result;
            $scope.shippingMethodsChecked = false;

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
            $scope.params.offset = $scope.shippingMethods.shippingMethodList.next_page_offset;
        } else {
            $scope.params.offset = $scope.shippingMethods.shippingMethodList.previous_page_offset;
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
        $scope.loadShippingMethods();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadShippingMethods();

}]);

app.controller("ShippingMethodsSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', 'GeographiesService', 'gettextCatalog', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService, GeographiesService, gettextCatalog) {

    $scope.shippingMethod = {
        quantity_config: { prices_per_quantity: [{ price: null, currency: null }], rules: [] },
        weight_config: { prices_per_unit: [{ price: null, currency: null }], rules: [] },
        subtotal_config: { rules: [] },
    };

    $scope.exception = {};
    $scope.geo = GeographiesService;
    var geographies =  $scope.geo.getGeographies();

    //Load the countries
    $scope.countries = geographies.countries;
    // Add a wildcard country option
    $scope.countries.push({ name: "All Countries", code: "*" });

    $scope.us_states = geographies.us_states;
    $scope.ca_provinces = geographies.ca_provinces;

    // Re-sort
    $scope.countries = _.sortBy($scope.countries, "name");

    //Adjustment countries
    $scope.adjustmentsEligibleCountries = ["US", "CA"];
    $scope.adjustmentCountries = [];

    // Get the pricing currencies available for the account
    $scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

    // Set up some models to hold user input.
    $scope.models = {};
    $scope.models.shipping_method_countries = [];
    $scope.typeahead = {};
    $scope.shipping_method_config_type = null;
    $scope.units = [{ code: 'lb', name: 'pound' }, { code: 'oz', name: 'ounce' }, { code: 'kg', name: 'kilogram' }, { code: 'g', name: 'gram' }];

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/shipping_methods/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url).then(function (shippingMethod) {
            $scope.shippingMethod = shippingMethod;
            // Convert our tax inclusive countries to a country object
            _.each(shippingMethod.countries, function (item) {
                var country = _.findWhere($scope.countries, { code: item });
                if (country != null) {
                    $scope.models.shipping_method_countries.push(country);
                }
            });

            // Update adjustments creatable countries
            updateAdjustmentCountries('shipping_method_countries');

            // Update adjustments
            $scope.shippingMethod.adjustments = _.map($scope.shippingMethod.adjustments, mapAdjustments);

            // Set config type
            if ($scope.shippingMethod.subtotal_config) {
                $scope.shipping_method_config_type = 'subtotal';
                $scope.shippingMethod.quantity_config = { prices_per_quantity: [{ price: null, currency: null }] };
                $scope.shippingMethod.weight_config = { prices_per_unit: [{ price: null, currency: null }] };
                $scope.shippingMethod.subtotal_config.percent_of_subtotal = utils.decimalToPercent($scope.shippingMethod.subtotal_config.percent_of_subtotal);
            } else if($scope.shippingMethod.quantity_config){
                $scope.shipping_method_config_type = 'quantity';
                $scope.shippingMethod.weight_config = { prices_per_unit: [{ price: null, currency: null }] };
                $scope.shippingMethod.subtotal_config = {};
            } else if ($scope.shippingMethod.weight_config) {
                $scope.shipping_method_config_type = 'weight';
                $scope.shippingMethod.quantity_config = { prices_per_quantity: [{ price: null, currency: null }] };
                $scope.shippingMethod.subtotal_config = {};
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

    function mapAdjustments(adjustment) {
        adjustment._states = [];
        adjustment.typeahead = {};

        if (adjustment.percentage) {
            adjustment.adjustment_type = 'percentage';
            adjustment.percentage = utils.decimalToPercent(adjustment.percentage);
            adjustment.amounts = [];
        } else if (adjustment.amounts) {
            adjustment.adjustment_type = 'amounts';
        }

        if (adjustment.country == "US") {
            setAdjustmentStates(adjustment, 'us_states');
        } else if (adjustment.country == "CA") {
            setAdjustmentStates(adjustment, 'ca_provinces');
        }

        return adjustment;
    }

    function setAdjustmentStates(adjustment, states) {
        _.each(adjustment.regions, function (item) {
            var state_prev = _.findWhere($scope[states], { code: item });
            if (state_prev != null) {
                adjustment._states.push(state_prev);
            }
        });
        return adjustment;
    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    //Country handlers
     $scope.onCountrySelect = function (item, model, label, type) {
         if (!_.findWhere($scope.models[type], { code: model.code })) {
             $scope.models[type].push(model);
         }
         // Clear the form value
         $scope.typeahead[type] = null;
         updateAdjustmentCountries(type);
     };

     $scope.removeCountry = function (country, type) {
         $scope.models[type] = _.reject($scope.models[type], function (item) {
             return item.code == country.code;
         });

         updateAdjustmentCountries(type);
     };

     $scope.onRuleCurrencySelect = function (item, model, label, event, rule) {
         rule.currency = model.code;
     }

    //Adjustments handlers
     function updateAdjustmentCountries(type) {
         $scope.adjustmentCountries = _.filter($scope.models[type], function (model) {
             return $scope.adjustmentsEligibleCountries.indexOf(model.code) != -1;
         });
     }

     function canHaveAdjustments() {
         return !!$scope.adjustmentCountries.length;
     }

     $scope.addNewAdjustment = function () {
         var adjustment = {
             amounts: [{ price: null, currency: null }],
             _states: [],
             typeahead: {},
         };
         $scope.shippingMethod.adjustments ? $scope.shippingMethod.adjustments.unshift(adjustment) : $scope.shippingMethod.adjustments = [adjustment];
     };

     $scope.removeAdjustment = function (method, adjustment, index) {
         $scope.shippingMethod.adjustments.splice(index, 1);
     };

    //Adjustment state handlers
     $scope.onStateSelect = function (adjustment, item, model, label) {
         if (!_.findWhere(adjustment._states, { code: model.code })) {
             adjustment._states.push(model);
         }
         // Clear the form value
         adjustment.typeahead.state_prov = null;
     };

     $scope.removeState = function (adjustment, state) {
         adjustment._states = _.reject(adjustment._states, function (item) {
             return item.code == state.code;
         });
     };

    //Subtotal config rules handlers
     $scope.addNewRule = function (config, defaultConfig) {
         if (!$scope.shippingMethod[config].rules) {
             $scope.shippingMethod[config].rules = [];
         }
         $scope.shippingMethod[config].rules.unshift(defaultConfig || {});
     };

     $scope.removeRule = function (method, config, rule, index) {
         $scope.shippingMethod[config].rules.splice(index, 1);
     };
   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/shipping_methods");
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    $scope.confirmDelete = function (method, configType, ruleObj, index, arg1) {
        var confirm = { id: "delete" };
        confirm.onConfirm = method.bind($scope, method, configType, ruleObj, index, arg1);
        ConfirmService.showConfirm($scope, confirm);
    }

    function getShippingMethodCopy() {
        // Map our UI to our rules before sending them to the API. We'll make a copy to preserve the UI.
        var shippingMethodCopy = angular.copy($scope.shippingMethod);

        // Copy the countries from the models to settings
        shippingMethodCopy.countries = _.pluck($scope.models.shipping_method_countries, "code");

        //Update adjustments
        if (!canHaveAdjustments()) {
            shippingMethodCopy.adjustments = null;
        } else {
            shippingMethodCopy.adjustments = _.map(shippingMethodCopy.adjustments, reMapAdjustments);
        }

        //Update config
        if ($scope.shipping_method_config_type == 'subtotal') {
            shippingMethodCopy.quantity_config = null;
            shippingMethodCopy.weight_config = null;
            shippingMethodCopy.subtotal_config.percent_of_subtotal = utils.percentToDecimal(shippingMethodCopy.subtotal_config.percent_of_subtotal);
        } else if ($scope.shipping_method_config_type == 'quantity') {
            shippingMethodCopy.subtotal_config = null;
            shippingMethodCopy.weight_config = null;
        } else if ($scope.shipping_method_config_type = 'weight') {
            shippingMethodCopy.subtotal_config = null;
            shippingMethodCopy.quantity_config = null;
        }

        return shippingMethodCopy;
    }

    function reMapAdjustments(adjustment) {
        adjustment.adjustment_type == 'percentage' ? adjustment.amounts = null : adjustment.percentage = null;
        adjustment.regions = _.pluck(adjustment._states, "code");
        if (adjustment.percentage) {
            adjustment.percentage = utils.percentToDecimal(adjustment.percentage);
        }
        delete adjustment.adjustment_type;
        return adjustment;
    }

    $scope.addShippingMethod = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return;
        }

        var shippingMethodCopy = getShippingMethodCopy();

        ApiService.set(shippingMethodCopy, ApiService.buildUrl("/shipping_methods"), { show: "shipping_method_id,name" }).then(function (shippingMethod) {
            GrowlsService.addGrowl({ id: "add_success", name: shippingMethod.shipping_method_id, type: "success", shipping_method_id: shippingMethod.shipping_method_id, url: "#/shipping_methods/" + shippingMethod.shipping_method_id + "/edit" });
            window.location = "#/shipping_methods";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateShippingMethod = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return;
        }

        var shippingMethodCopy = getShippingMethodCopy();

        ApiService.set(shippingMethodCopy, $scope.url, { show: "shipping_method_id,name" })
        .then(
        function (shippingMethod) {
            GrowlsService.addGrowl({ id: "edit_success", name: shippingMethod.shipping_method_id, type: "success", shipping_method_id: shippingMethod.shipping_method_id, url: "#/shipping_methods/" + shippingMethod.shipping_method_id + "/edit" });
            window.location = "#/shipping_methods";
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.shippingMethod.url)
        .then(
        function (shippingMethod) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.shippingMethod.shipping_method_id, type: "success" });
            utils.redirect($location, "/shipping_methods");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

//#endregion Products





//#region Subscriptions

app.controller("SubscriptionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.subscriptionListUrl = ApiService.buildUrl("/subscriptions");

}]);

app.controller("SubscriptionsViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.payment_method = null;
    $scope.invoices = {};
    $scope.model = {};
    $scope.model.subscription = {};
    $scope.resources = {};
    $scope.count = {};
    $scope.count.invoices = 0;

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/subscriptions/" + $routeParams.id)

    // Prep the billing history
    $scope.resources.invoiceListUrl = $scope.url + "/invoices";

    // Load the subscription
    ApiService.getItem($scope.url, { expand: "subscription_plan,customer.payment_methods,items.subscription_terms,promotion", hide: "product.images", formatted: true }, {formatted: true}).then(function (subscription) {
        $scope.model.subscription = subscription;
    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.uncancel = function () {

        var data = { cancel_at_current_period_end: false };

        ApiService.set(data, $scope.url, { expand: "subscription_plan,customer.cards,product", hide: "product.images" }).then(function (subscription) {
            $scope.model.subscription = subscription;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);

//#endregion Subscriptions




app.controller("SubscriptionPlansListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.subscription_plans = {};
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

    $scope.loadSubscriptionPlans = function () {

        ApiService.getList(ApiService.buildUrl("/subscription_plans?show=subscription_plan_id,name,billing_interval,billing_interval_unit,trial_interval,trial_interval_unit,end_at_billing_count,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.subscription_plans.subscription_planList = result;

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
            $scope.params.offset = $scope.subscription_plans.subscription_planList.next_page_offset;
        } else {
            $scope.params.offset = $scope.subscription_plans.subscription_planList.previous_page_offset;
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
        $scope.loadSubscriptionPlans();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadSubscriptionPlans();

}]);


app.controller("SubscriptionPlansSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/subscription_plans/" + $routeParams.id)

        // Load the plan
        ApiService.getItem($scope.url).then(function (subscription_plan) {
            $scope.subscription_plan = subscription_plan;

            // Make a copy of the original for comparision
            $scope.subscription_plan_orig = angular.copy($scope.subscription_plan);

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;

        // Set defaults
        $scope.subscription_plan = {};
        $scope.subscription_plan.fulfill_on_renewal = false;
        $scope.subscription_plan.order_confirmation_on_renewal = true;
        $scope.subscription_plan.trial_interval_unit = null;
        $scope.subscription_plan.billing_interval_unit = "month";

    }

    var prepareSubmit = function () {
        // Clear any previous errors
        $scope.exception.error = null;
    }

    $scope.confirmCancel = function () {
        if (angular.equals($scope.subscription_plan, $scope.subscription_plan_orig)) {
            utils.redirect($location, "/subscription_plans");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/subscription_plans");
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

    $scope.addSubscriptionPlan = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.subscription_plan, ApiService.buildUrl("/subscription_plans"), { show: "subscription_plan_id,name" })
        .then(
        function (subscription_plan) {
            GrowlsService.addGrowl({ id: "add_success", name: subscription_plan.name, type: "success", subscription_plan_id: subscription_plan.subscription_plan_id, url: "#/subscription_plans/" + subscription_plan.subscription_plan_id + "/edit" });
            utils.redirect($location, "/subscription_plans");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateSubscriptionPlan = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        if (utils.isNullOrEmpty($scope.subscription_plan.trial_interval_unit) || utils.isNullOrEmpty($scope.subscription_plan.trial_interval)) {
            $scope.subscription_plan.trial_interval_unit = null;
            $scope.subscription_plan.trial_interval = null;
        }

        ApiService.set($scope.subscription_plan, $scope.url, { show: "subscription_plan_id,name" })
        .then(
        function (subscription_plan) {
            GrowlsService.addGrowl({ id: "edit_success", name: subscription_plan.name, type: "success", subscription_plan_id: subscription_plan.subscription_plan_id, url: "#/subscription_plans/" + subscription_plan.subscription_plan_id + "/edit" });
            utils.redirect($location, "/subscription_plans");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.url)
        .then(
        function (subscription_plan) {
            GrowlsService.addGrowl({ id: "delete_success_with_undelete", name: $scope.subscription_plan.name, type: "success", subscription_plan_id: $scope.subscription_plan.subscription_plan_id, url: "#/subscription_plans/" + $scope.subscription_plan.subscription_plan_id + "/edit" });
            utils.redirect($location, "/subscription_plans");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.undelete = function () {

        ApiService.set({ deleted: false }, $scope.url, { show: "subscription_plan_id,name" })
        .then(
        function (subscription_plan) {
            GrowlsService.addGrowl({ id: "undelete_success", name: $scope.subscription_plan.name, type: "success", subscription_plan_id: $scope.subscription_plan.subscription_plan_id, url: "#/subscription_plans/" + subscription_plan.subscription_plan_id + "/edit" });
            utils.redirect($location, "/subscription_plans");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);


//#region Templates

app.controller("TemplatesListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.templates = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadTemplates = function () {

        ApiService.getList(ApiService.buildUrl("/templates"), $scope.params).then(function (result) {
            $scope.templates.templateList = result;
            $scope.templatesChecked = false;

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
            $scope.params.offset = $scope.templates.templateList.next_page_offset;
        } else {
            $scope.params.offset = $scope.templates.templateList.previous_page_offset;
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
        $scope.loadTemplates();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadTemplates();

}]);

app.controller("TemplatesSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.template = {};
    $scope.exception = {};

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/templates/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url, { expand: "wrapper_template" }).then(function (template) {
            $scope.template = template;

            if (template.wrapper_template) {
                $scope.template.wrapper_template_id = template.wrapper_template.template_id;
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
   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/templates");
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

    $scope.addTemplate = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.template, ApiService.buildUrl("/templates"), { show: "template_id,name" }).then(function (template) {
            GrowlsService.addGrowl({ id: "add_success", name: template.template_id, type: "success", template_id: template.template_id, url: "#/templates/" + template.template_id + "/edit" });
            window.location = "#/templates";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateTemplate = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        ApiService.set($scope.template, $scope.url, { show: "template_id,name" })
        .then(
        function (template) {
            GrowlsService.addGrowl({ id: "edit_success", name: template.template_id, type: "success", template_id: template.template_id, url: "#/templates/" + template.template_id + "/edit" });
            window.location = "#/templates";
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.delete = function () {

        ApiService.remove($scope.template.url)
        .then(
        function (template) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.template.template_id, type: "success" });
            utils.redirect($location, "/templates");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

}]);

//#endregion Products




app.controller("UsersListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.users = {};
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
            $scope.params.desc = true;
        }

    }

    $scope.loadUsers = function () {

        ApiService.getList(ApiService.buildUrl("/users?show=user_id,name,date_last_login,date_created&sort_by=" + $scope.params.sort_by + "&desc=" + $scope.params.desc), $scope.params).then(function (result) {
            $scope.users.userList = result;
            $scope.usersChecked = false;

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
            $scope.params.offset = $scope.users.userList.next_page_offset;
        } else {
            $scope.params.offset = $scope.users.userList.previous_page_offset;
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
        $scope.loadUsers();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadUsers();

}]);

app.controller("UsersSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService) {

    $scope.exception = {};
    $scope.data = {}

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/users/" + $routeParams.id)

        // Load the user
        ApiService.getItem($scope.url).then(function (user) {
            $scope.usr = user;

            // Make a copy of the original for comparision
            $scope.usr_orig = angular.copy($scope.usr);

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

    $scope.confirmCancel = function () {
        if (angular.equals($scope.usr, $scope.usr_orig)) {
            utils.redirect($location, "/users");
        } else {
            var confirm = { id: "changes_lost" };
            confirm.onConfirm = function () {
                utils.redirect($location, "/users");
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

    $scope.addUser = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        $scope.usr.password = $scope.data.password;

        ApiService.set($scope.usr, ApiService.buildUrl("/users"), { show: "user_id,name" })
        .then(
        function (usr) {
            GrowlsService.addGrowl({ id: "add_success", name: usr.name, type: "success", user_id: usr.usr_id, url: "#/users/" + usr.user_id + "/edit" });
            utils.redirect($location, "/users");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateUser = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            return;
        }

        // If the password is null, remove it
        if (!utils.isNullOrEmpty($scope.data.password)) {
            $scope.usr.password = $scope.data.password;
        } else {
            delete $scope.usr.password;
        }

        ApiService.set($scope.usr, $scope.url, { show: "user_id,name" })
        .then(
        function (usr) {
            GrowlsService.addGrowl({ id: "edit_success", name: usr.name, type: "success", url: "#/users/" + usr.user_id + "/edit" });
            utils.redirect($location, "/users");
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
            GrowlsService.addGrowl({ id: "delete_success_with_undelete", name: $scope.usr.name, type: "success", url: "#/users/" + $scope.usr.user_id + "/edit" });
            utils.redirect($location, "/users");
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

}]);



$("document").ready(function () {

    // Get the token
    var token = localStorage.getItem("token");

    // Define the host
    var host = "api.comecero.com";
    if (window.location.hostname.indexOf("admin-staging.") > -1) {
        host = "api-staging.comecero.com";
    }

    // Get the query parameters
    var params = utils.getPageQueryParameters();

    // Define the URL
    var url = "https://" + host + "/api/v1/notifications/" + params["notification_id"] + "?show=body";

    // Make a request to get the notification body
    if (params["notification_id"]) {
        $.ajax
          ({
              type: "GET",
              url: url,
              beforeSend: function (xhr) {
                  xhr.setRequestHeader('Authorization', "Bearer " + token);
              },
              success: function (data) {

                  document.open();
                  document.write(data.body);
                  document.close();

              }
          });
    }

});