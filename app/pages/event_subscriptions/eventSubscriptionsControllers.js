
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
    { name: "Order Payment Complete", code: "order:payment_completed" },
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

    if ($routeParams.id != null) {

        // Indicate this is an edit
        $scope.update = true;
        $scope.add = false;

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/event_subscriptions/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url).then(function (eventSubscription) {
            $scope.eventSubscription = eventSubscription;



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
    $scope.getDestinationType = function (method) {
        if (!method) {
            return 'text';
        } else if (method === "http") {
            return 'url';
        }
        return method;

    };

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/event_subscriptions");
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

    $scope.addEventSubscription = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }


        ApiService.set($scope.eventSubscription, ApiService.buildUrl("/event_subscriptions"), { show: "event_subscription_id,name" })
        .then(
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

        if ($scope.form.$invalid) {
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

    $scope.delete = function () {

        ApiService.remove($scope.eventSubscription.url)
        .then(
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



