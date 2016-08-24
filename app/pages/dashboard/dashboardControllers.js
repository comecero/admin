app.controller("DashboardViewCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    $scope.dashboard = {};
    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/dashboard")

    // Load the dashboard
    ApiService.getItem($scope.url).then(function (dashboard) {

        // Header
        $scope.currency = dashboard.currency;

        // Sales
        $scope.sales = [];
        _.each(dashboard.sales, function (item) {
            $scope.sales.push(item.total);
        })
        $scope.sales_today = dashboard.sales[29].total;
        $scope.sales_yesterday = dashboard.sales[28].total;
        for (var i = 0, sum = 0; i < $scope.sales.length; sum += $scope.sales[i++]);
        $scope.sales_month = sum;

        // New Subscriptions
        $scope.new_subscriptions = [];
        _.each(dashboard.new_subscriptions, function (item) {
            $scope.new_subscriptions.push(item.total);
        })
        $scope.new_subscriptions_today = dashboard.new_subscriptions[29].total;
        $scope.new_subscriptions_yesterday = dashboard.new_subscriptions[28].total;
        for (var i = 0, sum = 0; i < $scope.new_subscriptions.length; sum += $scope.new_subscriptions[i++]);
        $scope.new_subscriptions_month = sum;

        // Subscription Renewals
        $scope.subscription_renewals = [];
        _.each(dashboard.subscription_renewals, function (item) {
            $scope.subscription_renewals.push(item.total);
        })
        $scope.subscription_renewals_today = dashboard.subscription_renewals[29].total;
        $scope.subscription_renewals_yesterday = dashboard.subscription_renewals[28].total;
        for (var i = 0, sum = 0; i < $scope.subscription_renewals.length; sum += $scope.subscription_renewals[i++]);
        $scope.subscription_renewals_month = sum;

        // Total Subscriptions
        $scope.total_subscriptions = [];
        _.each($scope.new_subscriptions, function (item, index) {
            $scope.total_subscriptions.push(utils.roundCurrency(item + $scope.subscription_renewals[index]));
        })
        $scope.total_subscriptions_today = utils.roundCurrency($scope.new_subscriptions[29] + $scope.subscription_renewals[29]);
        $scope.total_subscriptions_yesterday = utils.roundCurrency($scope.new_subscriptions[28] + $scope.subscription_renewals[28]);
        for (var i = 0, sum = 0; i < $scope.total_subscriptions.length; sum += $scope.total_subscriptions[i++]);
        $scope.total_subscriptions_month = sum;

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

}]);