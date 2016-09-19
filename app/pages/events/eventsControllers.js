
//#region Events

app.controller("EventsListCtrl", ['$scope', '$routeParams', '$location', '$q', 'GrowlsService', 'ApiService', function ($scope, $routeParams, $location, $q, GrowlsService, ApiService) {

    // Establish your scope containers
    $scope.events = {};
    $scope.nav = {};
    $scope.exception = {};
    
    // Establish your settings from query string parameters
    $scope.parseParams = function () {
        $scope.params = ($location.search())

        // Convert any string true/false to bool
        utils.stringsToBool($scope.params);
        
        if ($scope.params.status == null) {
            $scope.params.status = "delivered";
        }

        if ($scope.params.sort_by == null) {
            $scope.params.sort_by = "date_created";
        }

        if ($scope.params.desc == null) {
            $scope.params.desc = true;
        }

    }


    $scope.loadEvents = function () {

        ApiService.getList(ApiService.buildUrl("/events"), $scope.params).then(function (result) {
            $scope.events.eventList = result;
            $scope.eventsChecked = false;

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
    
    $scope.setParam = function (param, value) {
        $scope.params[param] = value;
        $scope.params.before_item = null;
        $scope.params.after_item = null;
        $scope.nav.scrollTop = true;
        $location.search($scope.params);
    }


    $scope.$on('$routeUpdate', function (e) {
        $scope.parseParams();
        $scope.loadEvents();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadEvents();

}]);

app.controller("EventViewCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'SettingsService', function ($scope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, SettingsService) {

    $scope.event = {};
    $scope.exception = {};

    // Set the url for interacting with this item
    $scope.url = ApiService.buildUrl("/events/" + $routeParams.id)

    // Load the service
    var params = {expand:"event_subscription,debug=true"};
    ApiService.getItem($scope.url, params).then(function (event) {
        $scope.event = event;

    }, function (error) {
        $scope.exception.error = error;
        window.scrollTo(0, 0);
    });
    
    
   
    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/events");
        }
        ConfirmService.showConfirm($scope, confirm);
    }
    
    $scope.retryEvent = function () {
      ApiService.create($scope.event.url+"/retry")
        .then(function(event){
          
      }, 
      function(error){
          
      });
    };

}]);

//#endregion Products



