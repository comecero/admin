app.controller("CrossSellSetCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', 'gettextCatalog', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService, gettextCatalog) {

    $scope.promotion = { apply_to_recurring: false, active: false };
    $scope.promotion.config = { discount_amount: [{ price: null, currency: null }], apply_to_recurring_count: null, weight: 1    };
    $scope.exception = {};
    $scope.options = {};
    $scope.options.discount_type = "percentage";
    $scope.options.qualifies = "selected";

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

            if (promotion.expires) {
                $scope.datepicker.expires = new Date(promotion.expires);
            }

            $scope.promotion.config.discount_amount = $scope.promotion.config.discount_amount || [];
            if ($scope.promotion.config.discount_percent) {
                $scope.promotion.config._discount_percent = utils.decimalToPercent($scope.promotion.config.discount_percent);
            }

            $scope.options.offer_with_products = _.map($scope.promotion.config.offer_with_product_ids, function (product) {
                return { 'product_id': product };
            });

            if ($scope.promotion.config.offer_with_product_ids.indexOf("*") > -1) {
                $scope.options.offer_with_products = null;
                $scope.options.qualifies = "any";
            }

            // Get the product from the product_id
            ApiService.getItem(ApiService.buildUrl("/products/" + promotion.config.product_id), { show: "name,product_id" }).then(function (product) {
                $scope.options.product = [product];
            }, function (error) {
                $scope.exception.error = error;
                window.scrollTo(0, 0);
            });

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

        if ($scope.options.discount_type == "percentage") {
            delete $scope.promotion.config.discount_amount;
        }

        if ($scope.options.discount_type == "amounts") {
            delete $scope.promotion.config.discount_percent;
        }

        if ($scope.options.discount_type == "none") {
            $scope.promotion.config.discount_amount = null;
            $scope.promotion.config.discount_percent = null;
        }
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

        if (validate() == false) {
            return;
        }

        $scope.promotion.expires = $scope.datepicker.expires;

        if ($scope.options.discount_type == 'percentage') {
            $scope.promotion.config.discount_percent = utils.percentToDecimal($scope.promotion.config._discount_percent);
            $scope.promotion.config.discount_amount = undefined;
        } else if ($scope.options.discount_type == 'amounts') {
            $scope.promotion.config.discount_percent = undefined;
        }

        $scope.promotion.config.product_id = $scope.options.product[0].product_id;

        if ($scope.options.qualifies == "selected") {
            $scope.promotion.config.offer_with_product_ids = _.pluck($scope.options.offer_with_products, 'product_id');

            // Remove product_id from offer_with_product_ids.
            $scope.promotion.config.offer_with_product_ids = _.reject($scope.promotion.config.offer_with_product_ids, function (i) { return i == $scope.promotion.config.product_id });
        }

        if ($scope.options.qualifies == "any") {
            $scope.promotion.config.offer_with_product_ids = ["*"];
        }

        $scope.promotion.type = 'cross_sell';

        ApiService.set($scope.promotion, ApiService.buildUrl("/promotions"), { show: "promotion_id,name" }).then(function (promotion) {
            GrowlsService.addGrowl({ id: "add_success", name: promotion.name, type: "success", promotion_id: promotion.promotion_id, url: "#/promotions/cross-sell/" + promotion.promotion_id + "/edit" });
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

        if (validate() == false) {
            return;
        }

        $scope.promotion.expires = $scope.datepicker.expires;

        if ($scope.options.discount_type == 'percentage') {
            $scope.promotion.config.discount_percent = utils.percentToDecimal($scope.promotion.config._discount_percent);
            $scope.promotion.config.discount_amount = undefined;
        } else if ($scope.options.discount_type == 'amounts') {
            $scope.promotion.config.discount_percent = undefined;
        }

        if ($scope.options.qualifies === "selected") {
            $scope.promotion.config.offer_with_product_ids = _.pluck($scope.options.offer_with_products, 'product_id');

            // Remove product_id from offer_with_product_ids.
            $scope.promotion.config.offer_with_product_ids = _.reject($scope.promotion.config.offer_with_product_ids, function (i) { return i == $scope.promotion.config.product_id });
        }

        if ($scope.options.qualifies == "any") {
            $scope.promotion.config.offer_with_product_ids = ["*"];
        }

        ApiService.set($scope.promotion, $scope.url, { show: "promotion_id,name" }).then(function (promotion) {
            GrowlsService.addGrowl({ id: "edit_success", name: promotion.name, type: "success", promotion_id: promotion.promotion_id, url: "#/promotions/cross-sell/" + promotion.promotion_id + "/edit" });
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

    function validate() {

        if ($scope.form.$invalid) {
            $scope.exception = { error: { message: gettextCatalog.getString("Please review and correct the fields highlighted below.") } };
            window.scrollTo(0, 0);
            return false;
        }

        if (!$scope.options.product || !$scope.options.product.length) {
            $scope.exception = { error: { message: gettextCatalog.getString("You must select the product to offer as a cross sell.") } };
            window.scrollTo(0, 0);
            return false;
        }

        if ($scope.options.qualifies == "selected" && (!$scope.options.offer_with_products || !$scope.options.offer_with_products.length)) {
            $scope.exception = { error: { message: gettextCatalog.getString("You must select the products that will trigger this cross sell, or select 'Any product'.") } };
            window.scrollTo(0, 0);
            return false;
        }

    }

}]);



