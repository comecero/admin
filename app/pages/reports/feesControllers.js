app.controller("ReportFeesController", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, TimezonesService) {

    $scope.exception = {};

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/reports/fees");

    // Set defaults
    $scope.options = {};
    $scope.options.category = null;
    $scope.options.desc = "true";
    $scope.options.sort_by = "total";
    $scope.options.timezone = "UTC";
    $scope.options.dates = "this_month";
    $scope.options.search_by = "date";
    $scope.options.accounting_id = null;

    // Set the currencies
    $scope.options.currencies = ["Actual", localStorage.getItem("reporting_currency_primary"), localStorage.getItem("reporting_currency_secondary")];
    $scope.options.currency = $scope.options.currencies[0];

    // For scrolling
    $scope.nav = {};

    // Datepicker options
    $scope.datepicker = {};
    $scope.datepicker.status = {};
    $scope.datepicker.options = {
        startingDay: 1,
        showWeeks: false,
        initDate: new Date(),
        yearRange: 10
    };

    $scope.datepicker.status.date_start = {
        opened: false
    };

    $scope.datepicker.status.date_end = {
        opened: false
    };

    $scope.datepicker.open = function ($event, which) {
        $scope.datepicker.status[which].opened = true;
    };

    $scope.run = function (reset) {

        // Clear any previous errors
        $scope.exception = {};

        if (reset) {
            $scope.options.offset = "0";
        }

        // Determine your start date and end date
        var date_start = $scope.options.dates;
        date_end = $scope.options.dates;

        // Override if necessary
        switch($scope.options.dates) {
            case "last_30":
                date_start = -29;
                date_end = 0;
                break;
            case "last_7":
                date_start = -6;
                date_end = 0;
                break;
            case "custom":

                if (!$scope.datepicker.date_end) {
                    $scope.datepicker.date_end = new Date();
                }

                if (!$scope.datepicker.date_start) {
                    $scope.datepicker.date_start = $scope.datepicker.date_end;
                }

                date_start = $scope.datepicker.date_start.toISOString().substring(0, 10);
                date_end = $scope.datepicker.date_end.toISOString().substring(0, 10);
                break;
        }

        if ($scope.options.search_by == "doc") {
            date_start = null;
            date_end = null;
        }

        var accounting_id = $scope.options.accounting_id;
        if ($scope.options.search_by == "date") {
            accounting_id = null;
        }

        var currency = $scope.options.currency;
        if (currency == "Actual") {
            currency = null;
        }

        ApiService.getItem($scope.url, { category: $scope.options.category, currency: currency, accounting_id: accounting_id, sort_by: $scope.options.sort_by, timezone: $scope.options.timezone, desc: $scope.options.desc, date_start: date_start, date_end: date_end, offset: $scope.options.offset, formatted: true }, true, 90000).then(function (report) {

            $scope.report = report;

            // Trim the data down for the chart.
            $scope.data = {};
            _.each(report.data, function (item) {
                $scope.data[item.currency] = {};
                $scope.data[item.currency].data = [];
                $scope.data[item.currency].labels = [];
                $scope.data[item.currency].values = [];
                _.each(item.breakdowns, function (breakdown) {
                    $scope.data[item.currency].data.push(breakdown.total);
                    $scope.data[item.currency].labels.push(breakdown.type.split("_").join(" "));
                    $scope.data[item.currency].values.push(breakdown.formatted.total);
                });
            });

            // If instructed, scroll to the top upon completion
            if ($scope.nav.scrollTop == true) {
                window.scrollTo(0, 0);
            }
            $scope.nav.scrollTop = null;

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.getChartData = function (reportGroup) {

        // Trim the data down for the chart.
        var dataSet = {};
        var data = [];
        var labels = [];
        var values = [];

        _.each(reportGroup.breakdowns, function (item) {
            data.push(item.total);
            // Fill the labels for the bar chart
            labels.push(item.name);
            values.push(item.formatted.total);
        });

        dataSet.data = data;
        dataSet.labels = labels;
        dataSet.values = values;
        return dataSet;

    }

    $scope.downloadCsv = function (data, currency) {

        // Determine the filename
        var category = "all";
        if ($scope.options.category) {
            category = $scope.options.category;
        }

        if ($scope.options.search_by == "doc") {
            var filename = "fees_" + category + "_" + currency + "_" + $scope.options.accounting_id;
        }

        var accounting_id = $scope.options.accounting_id;
        if ($scope.options.search_by == "date") {
            var filename = "fees_" + category + "_" + currency + "_" + utils.replaceAll($scope.report.date_start, "-", "").substring(0, 8) + "-" + utils.replaceAll($scope.report.date_end, "-", "").substring(0, 8) + "_" + utils.replaceAll($scope.report.timezone, " ", "_").replace("/", "_");
        }

        // Slip the currency into the recordset
        _.each(data, function (item) {
            item.currency = currency;
        });

        utils.jsonToCsvDownload(data, filename);

    }

    // Perform the initial load
    $scope.run();

}]);
