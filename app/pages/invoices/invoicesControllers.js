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



