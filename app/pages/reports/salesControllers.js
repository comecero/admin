app.controller("ReportSalesCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'TimezonesService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, TimezonesService) {

    $scope.exception = {};

    // Load the timezones
    $scope.timezones = TimezonesService.getTimezones();

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/reports/sales");

    // Set defaults
    $scope.options = {};
    $scope.options.type = "combined";
    $scope.options.segment = "all";
    $scope.options.group_by = "day";
    $scope.options.timezone = "UTC";
    $scope.options.dates = "last_30";
    $scope.options.labels = [];
    $scope.options.values = [];

    // Set the currencies
    $scope.options.currencies = [];
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_primary"));
    $scope.options.currencies.push(localStorage.getItem("reporting_currency_secondary"));
    $scope.options.currency = $scope.options.currencies[0];

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

    $scope.run = function () {

        // Clear any previous errors
        $scope.exception = {};

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

        ApiService.getItem($scope.url, { type: $scope.options.type, group_by: $scope.options.group_by, timezone: $scope.options.timezone, segment: $scope.options.segment, date_start: date_start, date_end: date_end, currency: $scope.options.currency, formatted: true }).then(function (report) {

            $scope.report = report;

            // Trim the data down for the chart.
            $scope.data = [];
            $scope.options.labels = [];
            $scope.options.values = [];
            _.each(report.data, function (item) {
                $scope.data.push(item.total - item.tax);

                // Fill the labels for the bar chart
                $scope.options.labels.push(item.total);
                $scope.options.values.push(item.formatted.total);
            })

        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });

    }

    $scope.downloadCsv = function (data) {

        // Determine the filename
        var filename = "sales_" + $scope.report.type + "_" + $scope.report.segment + "_" + utils.replaceAll($scope.report.date_start, "-", "").substring(0, 8) + "-" + utils.replaceAll($scope.report.date_end, "-", "").substring(0, 8) + "_" + utils.replaceAll($scope.report.timezone, " ", "_").replace("/", "_");

       utils.jsonToCsvDownload(data, filename);

    }

    // Perform the initial load
    $scope.run();

}]);
