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



