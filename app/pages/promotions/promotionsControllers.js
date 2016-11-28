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



