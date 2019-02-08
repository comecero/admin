
//#region EventTestTemplates

app.controller("EventTestTemplatesListCtrl", ['$scope', '$routeParams', '$location', 'GrowlsService', 'ApiService',
  function ($scope, $routeParams, $location, GrowlsService, ApiService) {
    // Establish your scope containers
    $scope.eventTestTemplates = {};

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

    $scope.loadEventTestTemplates = function () {

        ApiService.getList(ApiService.buildUrl("/event_test_templates"), $scope.params).then(function (result) {
            $scope.eventTestTemplates.templatesList = result;
            $scope.eventTestTemplatesChecked = false;

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
            $scope.params.offset = $scope.eventTestTemplates.templatesList.next_page_offset;
        } else {
            $scope.params.offset = $scope.eventTestTemplates.templatesList.previous_page_offset;
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
        $scope.loadEventTestTemplates();
    });

    // Initial load
    $scope.parseParams();
    $scope.loadEventTestTemplates();

}]);

app.controller("EventTestTemplatesSetCtrl", ['$scope', '$rootScope', '$routeParams', '$location', 'GrowlsService', 'ApiService', 'ConfirmService', 'EventTypesService',
  function ($scope, $rootScope, $routeParams, $location, GrowlsService, ApiService, ConfirmService, EventTypesService) {
    $scope.eventTestTemplate = {};
    $scope.event_types = EventTypesService.getEventsTypes();
    $scope.exception = {};
    $scope.update = false;
    $scope.add = false;

    if ($routeParams.id != null) {

        // Indicate this is an edit

        // Set the url for interacting with this item
        $scope.url = ApiService.buildUrl("/event_test_templates/" + $routeParams.id)

        // Load the service
        ApiService.getItem($scope.url).then(function (eventTestTemplate) {
            $scope.eventTestTemplate = eventTestTemplate;
            var data = JSON.stringify($scope.eventTestTemplate.data, undefined, 2);
            $scope.payloadJSON = data;
            $scope.update = $rootScope.account.account_id == eventTestTemplate.account_id;
        }, function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    } else {
        $scope.eventTestTemplate = {'resource_id': 'example'};
        if ($rootScope.copyEventTestTemplate) {
          $scope.eventTestTemplate = $rootScope.copyEventTestTemplate
          $scope.payloadJSON = $rootScope.copyEventTestTemplate.payloadJSON;
          delete $scope.copyEventTestTemplate.payloadJSON;
          delete $rootScope.copyEventTestTemplate;
        }

        // Indicate this is an add
        $scope.update = false;
        $scope.add = true;
    }

    var prepareSubmit = function () {

        // Clear any previous errors
        $scope.exception.error = null;

        try {
          var data = JSON.parse($scope.payloadJSON);
          $scope.eventTestTemplate.data = data;
          $scope.form.$setValidity("payloadJSON", true);
        } catch(err) {
          $scope.form.$setValidity("payloadJSON", false);
          $scope.exception.error = "Event Test Template payload must be valid JSON.";
        }
    }

    $scope.suggestEventResource = function() {
      var suggest = $scope.eventTestTemplate.event_type.replace(/:.*/, '');
      if (suggest[suggest.length-1] != 's') suggest += 's';
      $scope.eventTestTemplate.event_resource = suggest;
    };

    $scope.suggestPayload = function() {
        var template = $scope.eventTestTemplate;
        if (!template.event_resource || !template.event_resource_id) return; // Don't suggest yet.
        if ($scope.payloadJSON) return;  // Already filled. don't suggest anything.

        var suggest = { object: template.event_resource.replace(/s$/,'') };
        suggest[template.event_resource.replace(/s$/,'_id')] = template.event_resource_id;
        $scope.payloadJSON = JSON.stringify(suggest, undefined, 2);
    };

    $scope.done = function() {
        utils.redirect($location, "/event_test_templates");
    };

    $scope.confirmCancel = function () {
        var confirm = { id: "changes_lost" };
        confirm.onConfirm = function () {
            utils.redirect($location, "/event_test_templates");
        }
        if ($scope.form.$pristine) {
          confirm.onConfirm();
        } else {
          ConfirmService.showConfirm($scope, confirm);
        }
    }

    $scope.addEventTestTemplate = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.eventTestTemplate, ApiService.buildUrl("/event_test_templates"), { show: "event_test_template_id,name" }).then(
        function (eventTestTemplate) {
            GrowlsService.addGrowl({ id: "add_success", name: eventTestTemplate.event_test_template_id, type: "success", event_test_template_id: eventTestTemplate.event_test_template_id, url: "#/event_test_templates/" + eventTestTemplate.event_test_template_id + "/edit" });
            window.location = "#/event_test_templates";
        },
        function (error) {
            $scope.exception.error = error;
            window.scrollTo(0, 0);
        });
    }

    $scope.updateEventTestTemplate = function () {

        prepareSubmit();

        if ($scope.form.$invalid) {
            window.scrollTo(0, 0);
            return;
        }

        ApiService.set($scope.eventTestTemplate, $scope.url, { show: "event_test_template_id,name" })
        .then(
        function (eventTestTemplate) {
            GrowlsService.addGrowl({ id: "edit_success", name: eventTestTemplate.event_test_template_id, type: "success", event_test_template_id: eventTestTemplate.event_test_template_id, url: "#/event_test_templates/" + eventTestTemplate.event_test_template_id + "/edit" });
            window.location = "#/event_test_templates";
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

        ApiService.remove($scope.eventTestTemplate.url).then(
        function (eventTestTemplate) {
            GrowlsService.addGrowl({ id: "delete_success", name: $scope.eventTestTemplate.event_test_template_id, type: "success" });
            utils.redirect($location, "/event_test_templates");
        },
        function (error) {
            window.scrollTo(0, 0);
            $scope.exception.error = error;
        });
    }

    $scope.copy = function() {
      $rootScope.copyEventTestTemplate = {
        'name': 'Copy ' + $scope.eventTestTemplate.name,
        'event_type': $scope.eventTestTemplate.event_type,
        'event_expand': $scope.eventTestTemplate.event_expand,
        'event_resource': $scope.eventTestTemplate.event_resource,
        'event_resource_id': $scope.eventTestTemplate.event_resource_id,
        'payloadJSON': $scope.payloadJSON,
      };
      utils.redirect($location, "/event_test_templates/add");
    }

}]);

//#endregion EventTestTemplates



