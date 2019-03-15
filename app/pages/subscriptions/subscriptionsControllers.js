
//#region Subscriptions

app.controller("SubscriptionsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.exception = {};
    $scope.resources = {};
    $scope.resources.subscriptionListUrl = ApiService.buildUrl("/subscriptions");

}]);

app.controller("SubscriptionsViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', '$timeout', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, $timeout) {

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

    $scope.allCurrencies = JSON.parse(localStorage.getItem("payment_currencies"));

    // Prep the billing history
    $scope.resources.invoiceListUrl = $scope.url + "/invoices";

    // Load the subscription
    var expand = "subscription_plan,customer.payment_methods,items.subscription_terms,items.subscription_plan,items.product";
    var expandItem = "subscription.subscription_plan,subscription.customer.payment_methods,subscription.items.subscription_terms,subscription.items.subscription_plan,subscription.items.product";
    ApiService.getItem($scope.url, { expand: expand, formatted: true }, { formatted: true }).then(function (subscription) {
        setPendingChanges(subscription);
        $scope.model.subscription = subscription;

        var currency = _.find(JSON.parse(localStorage.getItem("payment_currencies")), function (cur) {
            return cur.code == subscription.currency;
        });
        $scope.currencies = [currency];

        // If the payment currenceny is not equal to any one of the item reference currencies, set currencies to the value of the payment currency and the referernce currencies so a user can make them match, if desired.
        _.each(subscription.items, function (item) {
            if (item.reference_currency != subscription.currency) {
                var currency = _.find(JSON.parse(localStorage.getItem("payment_currencies")), function (cur) {
                    return cur.code == item.reference_currency;
                });
                if (_.find($scope.currencies, function (c) { return c.code == currency.code }) == null) {
                    $scope.currencies.push(currency);
                }
            }
        });

        $scope.currencies = _.uniq($scope.currencies);

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });

    $scope.uncancel = function () {

        var data = { cancel_at_current_period_end: false };

        ApiService.set(data, $scope.url, { expand: "subscription_plan,customer.payment_methods,items.subscription_terms", formatted: true }).then(function (subscription) {
            setPendingChanges(subscription);
            $scope.model.subscription = subscription;
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.uncancelItem = function (item) {

        ApiService.set(null, item.url + "/uncancel", { expand: expandItem, formatted: true }).then(function (item) {
            setPendingChanges(item.subscription);
            $scope.model.subscription = item.subscription;
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.showHistory = function () {

        ApiService.getItem($scope.model.subscription.history, { formatted: true }).then(function (history) {
            $scope.model.history = history;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.setEdit = function (item) {

        $scope.edit = true;
        $scope.editing = item.item_id;

        // Add this item to the list
        var convertedItem = { product_id: item.product_id, reference_price: item.reference_price, reference_discount: item.reference_discount, discount_apply_count: item.discount_apply_count, reference_currency: item.reference_currency, quantity: item.quantity, name: item.name, subscription_plan: $scope.model.subscription.subscription_plan }
        $scope.change_items = [convertedItem];

        if (!convertedItem.discount_apply_count) {
            $scope.model.apply_unlimited = true;
        } else {
            $scope.model.apply_unlimited = false;
        }

        $scope.selectItem(convertedItem);

        ApiService.getItem(item.product.url, { expand: "subscription_plan,subscription_change_products.subscription_plan,subscription_term_change_products.subscription_plan", formatted: true, currency: item.reference_currency }).then(function (product) {

            _.each(product.subscription_change_products.data, function (p) {
                $scope.change_items.push(convertToItem(p, item, p.subscription_plan));
            });

            _.each(product.subscription_term_change_products.data, function (p) {
                $scope.change_items.push(convertToItem(p, item, p.subscription_plan));
            });

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    function convertToItem(product, parentItem, subscriptionPlan) {
        return { product_id: product.product_id, reference_price: product.price, reference_discount: 0, discount_apply_count: parentItem.discount_apply_count, reference_currency: parentItem.reference_currency, quantity: parentItem.quantity, name: product.name, subscription_plan: subscriptionPlan };
    }

    function getItemForUpdate(newItem) {
        var updateItem = { product_id: newItem.product_id, reference_price: newItem.reference_price, reference_discount: newItem.reference_discount, reference_currency: newItem.reference_currency, quantity: newItem.quantity, discount_apply_count: newItem.discount_apply_count, apply_immediately: newItem.apply_immediately };

        if (!updateItem.reference_price) {
            delete updateItem.reference_price;
        }

        if (!updateItem.reference_discount) {
            delete updateItem.reference_discount;
        }

        if (!updateItem.quantity) {
            updateItem.quantity = 0;
        }

        if ($scope.model.apply_unlimited) {
            updateItem.discount_apply_count = null;
        }

        return updateItem;
    }

    $scope.cancelEdit = function () {
        $scope.edit = false;
        $scope.editing = null;
        $scope.selected = null;
        $scope.preview = null;
    }

    $scope.isEditing = function (item) {
        return $scope.editing == item.item_id;
    }

    $scope.selectItem = function (item) {
        item.apply_immediately = false;
        $scope.selected = item;
        $scope.preview = null;
    }

    $scope.isSelected = function (item) {
        return $scope.selected.product_id == item.product_id;
    }

    $scope.updateItem = function (item) {

        // Make a copy of the item
        var updateItem = getItemForUpdate($scope.selected);
        updateItem.date_effective = $scope.date_effective;
        var params = { expand: expandItem, formatted: true };

        var url = $scope.url + "/items";
        if ($scope.selected.product_id == item.product_id) {
            // An update to the current item.
            url += "/" + item.item_id;
        } else {
            // Replace the current item.
            params.remove_item_id = item.item_id;
        }

        ApiService.set(updateItem, url, params).then(function (i) {
            item = i;
            GrowlsService.addGrowl({ id: "edit_success_no_link", type: "success" });
            $scope.preview = null;
            $scope.editing = null;

            setPendingChanges(i.subscription);

            $scope.model.subscription = i.subscription;
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });

    }

    $scope.previewChanges = function (currentItem) {

        // Reset the current error
        if ($scope.exception && $scope.exception.error) {
            $scope.exception.error = null;
        }

        // Make a copy of the item
        var updateItem = getItemForUpdate($scope.selected);
        var params = { formatted: true };

        var url = $scope.url + "/items";
        if (updateItem.product_id == currentItem.product_id) {
            // An update to the current item.
            url += "/" + currentItem.item_id + "/preview";
        } else {
            // Replace the current item.
            url += "/preview"
            params.remove_item_id = currentItem.item_id;
        }

        ApiService.set(updateItem, url, params).then(function (p) {
            p.name = $scope.selected.name;
            $scope.preview = p;
            $scope.date_effective = p.date_effective;
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });

    }

    $scope.getSubscriptionInfo = function (subscription_plan) {
        var description = subscription_plan.billing_interval_description;
        if (subscription_plan.trial_interval_description) {
            description += " with trial";
        }
        return description;
    }

    $scope.$watch("selected", function (newVal, oldVal) {
        if (newVal != oldVal) {
            // If the selected item changes, reset the preview.
            $scope.preview = null;
        }
    }, true);

    function fastForward() {

        ApiService.set(null, $scope.url + "/fast_forward", { expand: expand, formatted: true }).then(function (s) {
            GrowlsService.addGrowl({ id: "action_success", type: "success" });
            setPendingChanges(s);
            $scope.model.subscription = s;
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });

    }

    $scope.confirmFastForward = function () {
        var confirm = { id: "fast_forward" };
        confirm.onConfirm = function () {
            fastForward();
        }
        ConfirmService.showConfirm($scope, confirm);
    }

    function setPendingChanges(subscription) {

        _.each(subscription.items, function (item) {
            var pendingChanges = [];
            if (item.change_at_current_period_end) {
                var changeItem = item.change_at_current_period_end;
                if (item.item_id != changeItem.item_id) {
                    pendingChanges.push({ name: "Product", from: item.name + " (" + item.item_id + ")", to: changeItem.name + " (" + changeItem.item_id + ")" });
                }

                if (item.reference_price != changeItem.reference_price) {
                    pendingChanges.push({ name: "Price", from: item.formatted.reference_price + " " + item.reference_currency, to: changeItem.formatted.reference_price + " " + changeItem.reference_currency });
                }

                if (item.reference_discount != changeItem.reference_discount) {
                    pendingChanges.push({ name: "Discount", from: item.formatted.reference_discount + " " + item.reference_currency, to: changeItem.formatted.reference_discount + " " + changeItem.reference_currency });
                }

                if (item.reference_currency != changeItem.reference_currency) {
                    pendingChanges.push({ name: "Currency", from: item.reference_currency, to: changeItem.reference_currency });
                }

                if (item.quantity != changeItem.quantity) {
                    pendingChanges.push({ name: "Quantity", from: item.quantity, to: changeItem.quantity });
                }

                if (item.discount_apply_count != changeItem.discount_apply_count) {
                    var from = item.discount_apply_count || "unset";
                    var to = changeItem.discount_apply_count || "unlimited";
                    pendingChanges.push({ name: "Times to apply the discount", from: from, to: to });
                }
            }
            if (pendingChanges.length > 0) {
                item.change_summary = pendingChanges;
            }
        });

    }

    function removeChanges(item) {

        // Make a copy of the item
        var updateItem = { change_at_current_period_end: null }
        var params = { expand: expandItem, formatted: true };

        var url = $scope.url + "/items/" + item.item_id;

        ApiService.set(updateItem, url, params).then(function (i) {
            item = i;
            setPendingChanges(i.subscription);
            $scope.model.subscription = i.subscription;
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });

    }

    $scope.confirmRemoveChanges = function (item) {
        var confirm = { id: "remove_changes" };
        confirm.onConfirm = function () {
            removeChanges(item);
        }
        ConfirmService.showConfirm($scope, confirm);
    }

}]);

//#endregion Subscriptions



