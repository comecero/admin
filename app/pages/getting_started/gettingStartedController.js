app.controller("GettingStartedViewCtrl", ['$scope', '$q', '$routeParams', 'ApiService', 'GrowlsService', function ($scope, $q, $routeParams, ApiService, GrowlsService) {

    var getLimitedAuth = function (test) {

        return $q(function (resolve, reject) {
            ApiService.set(null, ApiService.buildUrl("/auths/limited"), { test: test })
            .then(
            function (auth) {
                resolve(auth);
            },
            function (error) {
                reject(error);
            });
        });
    }

    var setCartUrl = function (test) {

        $scope.cartUrl = "/#/app_installations";

    }
    $scope.onNavigate = function GSCtrl_onNavigate() {
        $(window).trigger('openSubMenu');
    };

    $scope.account_id = localStorage.getItem("account_id");

    setCartUrl(utils.stringToBool(localStorage.getItem("test")));

}]);