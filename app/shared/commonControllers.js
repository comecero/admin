app.controller("GrowlsCtrl", ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.growls = [];

    $scope.$on('event:growl', function (event, message) {
        $scope.growls.push(message);

        if (message.duration > 0) {
            $timeout(function () {
                $scope.growls = _.without($scope.growls, _.findWhere($scope.growls, { id: message.id }));
            }, (message.duration * 1000), true);
        }

    });

    $scope.clearGrowl = function (id) {
        $scope.growls = _.without($scope.growls, _.findWhere($scope.growls, { id: id }));
    }

}]);

app.controller("LangCtrl", ['$scope', 'gettextCatalog', 'ApiService', 'tmhDynamicLocale', function ($scope, gettextCatalog, ApiService, tmhDynamicLocale) {
    $scope.switchLanguage = function (language) {

        // The default language does not need to be loaded (English - it's embedded in the HTML).
        if (language != "en") {
            gettextCatalog.loadRemote("/languages/" + language + "/" + language + ".json");
        }

        gettextCatalog.setCurrentLanguage(language);
        localStorage.setItem("language", language)

        // Pull in the locale settings.
        tmhDynamicLocale.set(utils.getLocale(localStorage.getItem("language")));

        // Save the user's preference.
        ApiService.set({ language: language }, ApiService.buildUrl("/users/me"));
    };
}]);