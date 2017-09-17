var app = angular.module("admin", ['ngRoute', 'ngAnimate', 'ngMessages', 'ui.bootstrap', 'angular-loading-bar', 'http-auth-interceptor', 'gettext', 'tmh.dynamicLocale', 'colorpicker.module', 'ngSanitize']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$provide', 'cfpLoadingBarProvider', 'tmhDynamicLocaleProvider', '$sceDelegateProvider', function ($httpProvider, $routeProvider, $locationProvider, $provide, cfpLoadingBarProvider, tmhDynamicLocaleProvider, $sceDelegateProvider) {

    // Allow CORS
    $httpProvider.defaults.useXDomain = true;

    // Remove Content-Type header
    delete $httpProvider.defaults.headers.post["Content-Type"];

    // Loading bar
    cfpLoadingBarProvider.latencyThreshold = 300;
    cfpLoadingBarProvider.includeSpinner = false;

    // Dynamically load locale files
    tmhDynamicLocaleProvider.localeLocationPattern("https://cdnjs.cloudflare.com/ajax/libs/angular-i18n/1.5.5/angular-locale_{{locale}}.js");

    // Routes

    // Getting Started
    $routeProvider.when("/", { templateUrl: "/app/pages/getting_started/index.html", reloadOnSearch: false });

    // Products
    $routeProvider.when("/products", { templateUrl: "/app/pages/products/list.html", reloadOnSearch: false });
    $routeProvider.when("/products/add", { templateUrl: "/app/pages/products/set.html", reloadOnSearch: true });
    $routeProvider.when("/products/:id/edit", { templateUrl: "/app/pages/products/set.html", reloadOnSearch: true });

    // Promotions
    $routeProvider.when("/promotions", { templateUrl: "/app/pages/promotions/list.html", reloadOnSearch: false });
    $routeProvider.when("/promotions/add", { templateUrl: "/app/pages/promotions/set.html", reloadOnSearch: true });
    $routeProvider.when("/promotions/:id/edit", { templateUrl: "/app/pages/promotions/set.html", reloadOnSearch: true });

    // Gateways
    $routeProvider.when("/gateways", { templateUrl: "/app/pages/gateways/list.html", reloadOnSearch: false });
    $routeProvider.when("/gateways/add", { templateUrl: "/app/pages/gateways/set.html", reloadOnSearch: true });
    $routeProvider.when("/gateways/:id/edit", { templateUrl: "/app/pages/gateways/set.html", reloadOnSearch: true });
    
    // Templates
    $routeProvider.when("/templates", { templateUrl: "/app/pages/templates/list.html", reloadOnSearch: false });
    $routeProvider.when("/templates/add", { templateUrl: "/app/pages/templates/set.html", reloadOnSearch: true });
    $routeProvider.when("/templates/:id/edit", { templateUrl: "/app/pages/templates/set.html", reloadOnSearch: true });
    
    // Events
    $routeProvider.when("/events", { templateUrl: "/app/pages/events/list.html", reloadOnSearch: false });
    $routeProvider.when("/events/:id", { templateUrl: "/app/pages/events/view.html", reloadOnSearch: true });

    // Event Subscriptions
    $routeProvider.when("/event_subscriptions", { templateUrl: "/app/pages/event_subscriptions/list.html", reloadOnSearch: false });
    $routeProvider.when("/event_subscriptions/add", { templateUrl: "/app/pages/event_subscriptions/set.html", reloadOnSearch: true });
    $routeProvider.when("/event_subscriptions/:id/edit", { templateUrl: "/app/pages/event_subscriptions/set.html", reloadOnSearch: true });

    $routeProvider.when("/templates/:id/edit", { templateUrl: "/app/pages/templates/set.html", reloadOnSearch: true });
    
     // Notification Subscriptions
    $routeProvider.when("/notification_subscriptions", { templateUrl: "/app/pages/notification_subscriptions/list.html", reloadOnSearch: false });
    $routeProvider.when("/notification_subscriptions/add", { templateUrl: "/app/pages/notification_subscriptions/set.html", reloadOnSearch: true });
    $routeProvider.when("/notification_subscriptions/:id/edit", { templateUrl: "/app/pages/notification_subscriptions/set.html", reloadOnSearch: true });

    // Subscription Plans
    $routeProvider.when("/subscription_plans", { templateUrl: "/app/pages/subscription_plans/list.html", reloadOnSearch: false });
    $routeProvider.when("/subscription_plans/add", { templateUrl: "/app/pages/subscription_plans/set.html", reloadOnSearch: true });
    $routeProvider.when("/subscription_plans/:id/edit", { templateUrl: "/app/pages/subscription_plans/set.html", reloadOnSearch: true });

    // License Services
    $routeProvider.when("/license_services", { templateUrl: "/app/pages/license_services/list.html", reloadOnSearch: false });
    $routeProvider.when("/license_services/add", { templateUrl: "/app/pages/license_services/set.html", reloadOnSearch: true });
    $routeProvider.when("/license_services/:id/edit", { templateUrl: "/app/pages/license_services/set.html", reloadOnSearch: true });

    // License Requests
    $routeProvider.when("/license_requests", { templateUrl: "/app/pages/license_requests/list.html", reloadOnSearch: false });
    $routeProvider.when("/license_requests/:id", { templateUrl: "/app/pages/license_requests/view.html", reloadOnSearch: true });

    // Images
    $routeProvider.when("/images", { templateUrl: "/app/pages/images/list.html", reloadOnSearch: false });
    $routeProvider.when("/images/add", { templateUrl: "/app/pages/images/add.html", reloadOnSearch: true });
    $routeProvider.when("/images/:id", { templateUrl: "/app/pages/images/view.html", reloadOnSearch: true });

    // Files
    $routeProvider.when("/files", { templateUrl: "/app/pages/files/list.html", reloadOnSearch: false });
    $routeProvider.when("/files/add", { templateUrl: "/app/pages/files/add.html", reloadOnSearch: true });
    $routeProvider.when("/files/:id/edit", { templateUrl: "/app/pages/files/edit.html", reloadOnSearch: true });

    // Hosted Functions
    $routeProvider.when("/hosted_functions", { templateUrl: "/app/pages/hosted_functions/list.html", reloadOnSearch: false });
    $routeProvider.when("/hosted_functions/add", { templateUrl: "/app/pages/hosted_functions/add.html", reloadOnSearch: true });
    $routeProvider.when("/hosted_functions/:id/edit", { templateUrl: "/app/pages/hosted_functions/edit.html", reloadOnSearch: true });

    // Shipments
    $routeProvider.when("/shipments", { templateUrl: "/app/pages/shipments/list.html", reloadOnSearch: false });
    $routeProvider.when("/shipments/:id", { templateUrl: "/app/pages/shipments/view.html", reloadOnSearch: false });

    // Orders
    $routeProvider.when("/orders", { templateUrl: "/app/pages/orders/list.html", reloadOnSearch: false });
    $routeProvider.when("/orders/:id", { templateUrl: "/app/pages/orders/view.html", reloadOnSearch: false });

    // Payments
    $routeProvider.when("/payments", { templateUrl: "/app/pages/payments/list.html", reloadOnSearch: false });
    $routeProvider.when("/payments/add", { templateUrl: "/app/pages/payments/add.html", reloadOnSearch: false });
    $routeProvider.when("/payments/:id", { templateUrl: "/app/pages/payments/view.html", reloadOnSearch: true });

    // Refunds
    $routeProvider.when("/refunds", { templateUrl: "/app/pages/refunds/list.html", reloadOnSearch: false });
    $routeProvider.when("/refunds/:id", { templateUrl: "/app/pages/refunds/view.html", reloadOnSearch: true });

    // Subscriptions
    $routeProvider.when("/subscriptions", { templateUrl: "/app/pages/subscriptions/list.html", reloadOnSearch: false });
    $routeProvider.when("/subscriptions/:id", { templateUrl: "/app/pages/subscriptions/view.html", reloadOnSearch: true });

    // Apps
    $routeProvider.when("/apps", { templateUrl: "/app/pages/apps/list.html", reloadOnSearch: false });
    $routeProvider.when("/apps/add", { templateUrl: "/app/pages/apps/set.html", reloadOnSearch: true });
    $routeProvider.when("/apps/:id/edit", { templateUrl: "/app/pages/apps/set.html", reloadOnSearch: true });

    // App Installations
    $routeProvider.when("/app_installations", { templateUrl: "/app/pages/app_installations/list.html", reloadOnSearch: false });
    $routeProvider.when("/app_installations/:id", { templateUrl: "/app/pages/app_installations/view.html", reloadOnSearch: true });
    $routeProvider.when("/app_installations/:id/settings", { templateUrl: "/app/pages/app_installations/settings.html", reloadOnSearch: true });
    $routeProvider.when("/app_installations/:id/style", { templateUrl: "/app/pages/app_installations/style.html", reloadOnSearch: true });

    // App Packages
    $routeProvider.when("/app_packages/:id/edit", { templateUrl: "/app/pages/app_packages/set.html", reloadOnSearch: true });

    // Carts
    $routeProvider.when("/carts", { templateUrl: "/app/pages/carts/list.html", reloadOnSearch: false });
    $routeProvider.when("/carts/:id", { templateUrl: "/app/pages/carts/view.html", reloadOnSearch: true });

    // Invoices
    $routeProvider.when("/invoices", { templateUrl: "/app/pages/invoices/list.html", reloadOnSearch: false });
    $routeProvider.when("/invoices/add", { templateUrl: "/app/pages/invoices/set.html", reloadOnSearch: true });
    $routeProvider.when("/invoices/:id", { templateUrl: "/app/pages/invoices/set.html", reloadOnSearch: true });

    // Customers
    $routeProvider.when("/customers", { templateUrl: "/app/pages/customers/list.html", reloadOnSearch: false });
    $routeProvider.when("/customers/:id", { templateUrl: "/app/pages/customers/view.html", reloadOnSearch: true });

    // Auths
    $routeProvider.when("/auths", { templateUrl: "/app/pages/auths/list.html", reloadOnSearch: false });
    $routeProvider.when("/auths/add", { templateUrl: "/app/pages/auths/set.html", reloadOnSearch: true });
    $routeProvider.when("/auths/:id/edit", { templateUrl: "/app/pages/auths/set.html", reloadOnSearch: true });

    // Accounts
    $routeProvider.when("/account/edit", { templateUrl: "/app/pages/accounts/update.html", reloadOnSearch: true });

    // Profile
    $routeProvider.when("/profile", { templateUrl: "/app/pages/profile/update.html", reloadOnSearch: true })

    // Dashboard
    $routeProvider.when("/dashboard", { templateUrl: "/app/pages/dashboard/view.html", reloadOnSearch: false });

    // Reports
    $routeProvider.when("/reports/sales", { templateUrl: "/app/pages/reports/sales.html", reloadOnSearch: false });
    $routeProvider.when("/reports/items", { templateUrl: "/app/pages/reports/items.html", reloadOnSearch: false });
    $routeProvider.when("/reports/fees", { templateUrl: "/app/pages/reports/fees.html", reloadOnSearch: false });
    $routeProvider.when("/reports/commissions", { templateUrl: "/app/pages/reports/commissions.html", reloadOnSearch: false });

    // Settings
    $routeProvider.when("/settings/general", { templateUrl: "/app/pages/settings/general.html", reloadOnSearch: false });
    $routeProvider.when("/settings/payment", { templateUrl: "/app/pages/settings/payment.html", reloadOnSearch: false });
    $routeProvider.when("/settings/fulfillment", { templateUrl: "/app/pages/settings/fulfillment.html", reloadOnSearch: false });
    $routeProvider.when("/settings/analytics", { templateUrl: "/app/pages/settings/analytics.html", reloadOnSearch: false });
    $routeProvider.when("/settings/technical", { templateUrl: "/app/pages/settings/technical.html", reloadOnSearch: false });
    $routeProvider.when("/settings/subscriptions", { templateUrl: "/app/pages/settings/subscriptions.html", reloadOnSearch: false });
    $routeProvider.when("/settings/tax", { templateUrl: "/app/pages/settings/tax.html", reloadOnSearch: false });
    $routeProvider.when("/settings/pricing", { templateUrl: "/app/pages/settings/pricing.html", reloadOnSearch: false });

    // Settings Shipping methods
    $routeProvider.when("/shipping_methods", { templateUrl: "/app/pages/shipping_methods/list.html", reloadOnSearch: false });
    $routeProvider.when("/shipping_methods/add", { templateUrl: "/app/pages/shipping_methods/set.html", reloadOnSearch: true });
    $routeProvider.when("/shipping_methods/:id/edit", { templateUrl: "/app/pages/shipping_methods/set.html", reloadOnSearch: true });

    // Users
    $routeProvider.when("/users", { templateUrl: "/app/pages/users/list.html", reloadOnSearch: false });
    $routeProvider.when("/users/add", { templateUrl: "/app/pages/users/set.html", reloadOnSearch: true });
    $routeProvider.when("/users/:id/edit", { templateUrl: "/app/pages/users/set.html", reloadOnSearch: true });

    // Notifications
    $routeProvider.when("/notifications", { templateUrl: "/app/pages/notifications/list.html", reloadOnSearch: false });
    $routeProvider.when("/notifications/:id", { templateUrl: "/app/pages/notifications/view.html", reloadOnSearch: true });
    $routeProvider.when("/notifications/:id/preview", { templateUrl: "/app/pages/notifications/preview.html" });

    // Routes End

    $httpProvider.interceptors.push(['$q', '$rootScope', function ($q, $rootScope) {
        return {

            'request': function (config) {

                // If a call to the apiService endpoint, append the Authorization token
                config.headers = config.headers || {};

                // Append the current bearer if not already in the request. This is useful on replays of requests that occured after a login timeout.
                if (config.isApi == true) {
                    var token = localStorage.getItem("token");
                    if (token) {
                        config.headers.Authorization = "Bearer " + token;
                    }
                }

                if (!config.headers["Content-Type"] && !config.isMultipart) {
                    config.headers["Content-Type"] = "application/json";
                }

                return config;
            },

            'response': function (response) {
                return (response);
            },

            'responseError': function (response) {
                if (angular.isObject(response.data) == false || !response.data.error) {
                    // Unhandled error, build a response that can be handled downstream.
                    response.data = {};
                    response.data.error = {};
                    response.data.error.message = "An unknown error occurred. Please try your request again. If the problem persists, please contact support."
                    return ($q.reject(response));
                }

                if (response.data.error.status === 403) {
                    response.data.error.message = "You do not have permission to perform the requested action. Please contact an account administrator for assistance.";
                    return ($q.reject(response));
                }

                if (response.data.error.status === 401) {
                    // Bad token, delete it from storage
                    localStorage.removeItem("token");
                }

                return $q.reject(response);

            }
        };
    }]);

}]);

app.run(['$rootScope', '$route', '$templateCache', '$location', 'ApiService', 'SettingsService', 'GrowlsService', 'gettextCatalog', 'tmhDynamicLocale', function ($rootScope, $route, $templateCache, $location, ApiService, SettingsService, GrowlsService, gettextCatalog, tmhDynamicLocale) {

    // Define the API and auth hosts
    var apiHost = "api.comecero.com";
    if (window.location.hostname.indexOf("admin-staging.") > -1) {
        apiHost = "api-staging.comecero.com";
    }
    $rootScope.apiHost = apiHost;

    var authHost = "signin.comecero.com"; // Just the default, uncommon that this would be actually used.
    if (localStorage.getItem("alias") != null) {
        var authHost = localStorage.getItem("alias") + ".auth.comecero.com";

        if (window.location.hostname.indexOf("admin-staging.") > -1) {
            authHost = localStorage.getItem("alias") + ".auth-staging.comecero.com";
        }

    }
    $rootScope.authHost = authHost;

    // Define default language
    var language = "en";

    // The default language does not need to be loaded (English - it's embedded in the HTML).
    if (localStorage.getItem("language") != null) {
        // Load the language file.
        language = localStorage.getItem("language");
    }

    // Set the language, don't need to for English since it's embedded in the HTML.
    if (language != "en") {
        gettextCatalog.loadRemote("/languages/" + language + "/" + language + ".json");
        gettextCatalog.setCurrentLanguage(language);
    }

    // Pull in the locale settings.
    tmhDynamicLocale.set(utils.getLocale(language));

    SettingsService.setUserSettings();

    // Watch for a swap between test and live
    $rootScope.$watch("settings.test", function (newValue, oldValue) {

        if (newValue != oldValue) {
            // If we are going from live to test, get a test token
            if (newValue == true) {
                $rootScope.settings.test = true;
                ApiService.set(null, ApiService.buildUrl("/auths/trusted"), { test: true })
                .then(
                function (auth) {

                    localStorage.setItem("token_live", localStorage.getItem("token"));
                    localStorage.setItem("token", auth.token);
                    localStorage.setItem("test", true);

                    // Refresh account meta
                    SettingsService.setAccountMeta().then(function() {
                        $location.search({});
                        $route.reload();
                    });

                },
                function (error) {
                    $rootScope.settings.test = false;
                    GrowlsService.addGrowl({ id: "switch_test_failure", type: "warning" });
                });
            } else {
                // Copy the saved live token back into token. If it timed out it will be refrehsed on the first request.
                $rootScope.settings.test = false;
                localStorage.setItem("token", localStorage.getItem("token_live"));
                localStorage.setItem("test", false);
                localStorage.removeItem("token_live");

                // Refresh account meta
                SettingsService.setAccountMeta().then(function () {
                    $location.search({});
                    $route.reload();
                });
            }
        }

    });
}])


