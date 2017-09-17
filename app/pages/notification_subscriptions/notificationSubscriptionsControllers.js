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


