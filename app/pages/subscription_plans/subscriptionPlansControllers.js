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
