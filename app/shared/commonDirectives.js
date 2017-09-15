app.directive('isValidPrice', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (attrs.allowEmptyPrice == "true" && (value == "" || value == null)) {
                    return true;
                }
                var cleanPrice = utils.cleanPrice(value)
                if (utils.isValidNumber(cleanPrice) == false) {
                    return false;
                }
                if (attrs.lessThanOrEqual) {
                    if (parseFloat(cleanPrice) > parseFloat(attrs.lessThanOrEqual)) {
                        return false;
                    }
                }
                if (attrs.lessThan) {
                    if (parseFloat(cleanPrice) >= parseFloat(attrs.lessThan)) {
                        return false;
                    }
                }
                if (attrs.greaterThanOrEqual) {
                    if (cleanPrice < attrs.greaterThanOrEqual) {
                        return false;
                    }
                }
                if (attrs.greaterThan) {
                    if (cleanPrice <= attrs.greaterThan) {
                        return false;
                    }
                }
                return true;
            }
        }
    };
});


app.directive('isValidInteger', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (attrs.allowEmptyValue == "true" && (value == "" || value == null)) {
                    return true;
                }
                if (utils.isValidInteger(value) == false) {
                    return false;
                }
                if (attrs.lessThanOrEqual) {
                    if (Number(value) > Number(attrs.lessThanOrEqual)) {
                        return false;
                    }
                }
                if (attrs.lessThan) {
                    if (Number(value) >= Number(attrs.lessThan)) {
                        return false;
                    }
                }
                if (attrs.greaterThanOrEqual) {
                    if (Number(value) < Number(attrs.greaterThanOrEqual)) {
                        return false;
                    }
                }
                if (attrs.greaterThan) {
                    if (Number(value) <= Number(attrs.greaterThan)) {
                        return false;
                    }
                }
                return true;
            }
        }
    };
});


app.directive('isValidNumber', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;

                // Allows you to turn off the rule by passing false to the attribute. Useful for conditional validation.
                if (attrs.isValidNumber == "false") {
                    return true;
                }

                if (attrs.allowEmptyValue == "true" && (value == "" || value == null)) {
                    return true;
                }
                if (utils.isValidNumber(value) == false) {
                    return false;
                }
                if (attrs.lessThanOrEqual) {
                    if (Number(value) > Number(attrs.lessThanOrEqual)) {
                        return false;
                    }
                }
                if (attrs.lessThan) {
                    if (Number(value) >= Number(attrs.lessThan)) {
                        return false;
                    }
                }
                if (attrs.greaterThanOrEqual) {
                    if (Number(value) < Number(attrs.greaterThanOrEqual)) {
                        return false;
                    }
                }
                if (attrs.greaterThan) {
                    if (Number(value) <= Number(attrs.greaterThan)) {
                        return false;
                    }
                }
                return true;
            }
        }
    };
});


app.directive('isValidUrl', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (attrs.allowEmptyValue == "true" && (value == "" || value == null)) {
                    return true;
                }
                // https://gist.github.com/dperini/729294
                return /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i.test(value);
            }
        }
    };
});


app.directive('isValidEmail', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (attrs.allowEmptyValue == "true" && (value == "" || value == null)) {
                    return true;
                }
                // http://stackoverflow.com/a/46181/2002383 anystring@anystring.anystring
                return /\S+@\S+\.\S+/.test(value);
            }
        }
    };
});


app.directive('allowEmpty', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (attrs.allowEmpty == "true") {
                    return true;
                }
                if (utils.isNullOrEmpty(value)) {
                    return false;
                }
                return true;
            }
        }
    };
});


app.directive('isUsernameAvailable', ['$http', '$q', 'ApiService', function ($http, $q, ApiService) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            ctrl.$validators.invalid_characters = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                // Using a negative lookahead http://stackoverflow.com/a/977294/2002383
                return /^(?:(?!A-Za-z0-9\-\_\.).)+$/.test(value);
            }

            ctrl.$asyncValidators.unavailable = function (modelValue, viewValue) {
                var value = modelValue || viewValue;
                var deferred = $q.defer();

                // If blank, return resolved
                if (value == "" || value == null || value == undefined) {
                    ctrl.$setValidity("isUsernameAvailable", null);
                    deferred.resolve();
                    return deferred.promise;
                }

                var result = ApiService.getItem(ApiService.buildUrl("/users/" + value), false).then(function (data) {
                    // A 404 (aka an error) is our "success" in this case because it means the user_id is available.
                    deferred.reject(data);
                },
                function (error) {
                    if (error.status == 404) {
                        // The user_id is available
                        deferred.resolve(error);
                    } else {
                        // Unexpected error. We don't know if valid or invalid, so return true so it will pass to the model, and it will be picked up on future validation or on the server side. We'll set a flag so the form can know not to show it as successfully validated.
                        ctrl.validationUnknown = true;
                        deferred.resolve();
                    }
                });

                return deferred.promise;
            }
        }

    }
}])


app.directive('cleanPrice', [function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            var clean = function (value) {
                if (angular.isUndefined(value)) {
                    return;
                }
                var cleanedPrice = utils.cleanPrice(value);
                if (cleanedPrice !== value) {
                    ctrl.$setViewValue(cleanedPrice);
                    ctrl.$render();
                }
                return cleanedPrice;
            }

            ctrl.$parsers.unshift(clean);
            clean(scope[attrs.ngModel]);
        }
    };
}]);


app.directive('maxLength', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            item: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            scope.$watch('item.$viewValue', function (value) {
            var msg = "";
            var warning = false;
            var danger = false;

            var currentCount = 0;
            if (scope.item) {
                if (scope.item.$viewValue) {
                    currentCount = scope.item.$viewValue.length;
                }
            }

            if ((Number(attrs.maxLength) - Number(currentCount)) >= 0) {
                if (Number(currentCount) < 10) {
                    msg = attrs.maxLength + " characters maximum";
                    warning = false;
                    danger = false;
                } else if ((Number(attrs.maxLength) - Number(currentCount)) < 20) {
                    msg = (Number(attrs.maxLength) - Number(currentCount)) + " characters remaining";
                    warning = true;
                    danger = false;
                } else {
                    msg = "About " + Math.round((Number(attrs.maxLength) + 4 - Number(currentCount)) / 10) * 10 + " characters remaining";
                    warning = false;
                    danger = false;
                }

                scope.item.$setValidity("maxlength", true);

            } else {
                msg = "Whoops! You've entered too many characters.";
                warning = false;
                danger = true;
                scope.item.$setValidity("maxlength", false);
            }

            // Clear out any previous
            elem.removeClass("text-warning text-danger");

            if (danger == true) {
                elem.addClass("text-danger");
            }

            if (warning == true) {
                elem.addClass("text-warning");
            }

            // Set the message
            elem.text(msg);

        });
        }
    };
}]);


app.directive('sparkline', function () {
    return {
        restrict: 'A',
        scope: {
            data: '=?sparkline',
            labels: '=?labels',
            values: '=?values',
        },
        link: function (scope, elem, attrs) {

            scope.$watch('data', function (data) {

                var config = { type: 'line', width: '100%', height: '50px', fillColor: '', lineColor: '#fff', lineWidth: 2, spotColor: '#ffffff', minSpotColor: '#ffffff', maxSpotColor: '#ffffff', highlightSpotColor: '#ffffff', highlightLineColor: '#ffffff', spotRadius: 4, highlightLineColor: '#ffffff' };

                if (scope.labels) {

                    var offset = {};
                    _.each(scope.labels, function (item, index) {
                        offset[index] = scope.values[index];
                    });

                    config.tooltipFormat = "{{offset:offset}}";
                    config.tooltipValueLookups = {
                        'offset': offset
                    }
                }

                elem.pixelSparkline(data, config);

            });
        }
    };
});


app.directive('sparkbar', function () {
    return {
        restrict: 'A',
        scope: {
            data: '=?sparkbar',
            labels: '=?labels',
            values: '=?values',
        },
        link: function (scope, elem, attrs) {

            scope.$watch('data', function (data) {

                var barWidth = 10;
                var graph = document.getElementById(attrs.id);

                if (graph != null && data != null) {
                    var graphWidth = graph.offsetWidth;
                    if (!isNaN(graphWidth)) {
                        barWidth = parseInt((graphWidth / (data.length))) - 2;
                    }
                }

                if (barWidth < 10) {
                    barWidth = 10;
                }

                if (barWidth > 40) {
                    barWidth = 40;
                }

                var config = { type: 'bar', height: '50px', barColor: '#fff', barSpacing: 3, barWidth: barWidth, zeroColor: '#ffffff', negBarColor: '#e66454' };

                if (scope.labels) {

                    var offset = {};
                    _.each(scope.labels, function (item, index) {
                        offset[index] = item + " " + scope.values[index];
                    });

                    config.tooltipFormat = "{{offset:offset}}";
                    config.tooltipValueLookups = {
                        'offset': offset
                    }
                }

                elem.pixelSparkline(data, config);
            });
        }
    };
});


app.directive('donut', function () {
    return {
        restrict: 'A',
        scope: {
            data: '=?donut'
        },
        link: function (scope, elem, attrs) {
            scope.$watch('data', function (data) {

                // Inject color 
                _.each(data, function (item, index) {
                    item.color = utils.getColor(index);
                    item.highlight = utils.getRelatedColor(item.color, -0.15);
                    item.label = utils.ucaseFirstLetter(item.label);
                })

                // Add a percentage sign if needed
                toolTip = "<%if (label){%><%=label%>: <%}%><%= value %>%"
                if (attrs.donutPercentage == false) {
                    toolTip = "<%if (label){%><%=label%>: <%}%><%= value %>"
                }

                // Define animations
                var animations = ["easeInQuad", "easeInCubic", "easeInQuart", "easeInQuint", "easeInSine", "easeInExpo", "easeInCirc"];
                var animation = animations[Math.floor(Math.random() * animations.length)];

                var context = document.getElementById(attrs.id).getContext("2d");
                var chart = new Chart(context).Doughnut(data, { responsive: true, percentageInnerCutout: 60, tooltipTemplate: toolTip, animationEasing: "easeInCubic", animationSteps: 50 });
            });
        }
    };
});


app.directive('login', ['$uibModal', 'authService', 'SettingsService', '$sce', '$rootScope', function ($uibModal, authService, SettingsService, $sce, $rootScope) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs, ctrl) {

            scope.$on("event:auth-loginRequired", function (event) {

                // Only show if a modal is not already displayed
                if (scope.openLogin == null) {
                    scope.openLogin = $uibModal.open({
                        size: 'sm',
                        templateUrl: '/login/login.html',
                        backdrop: 'static',
                        keyboard: 'false'
                    });

                    // Prepare to recieve a message back from the iframe upon successful login.
                    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
                    var eventer = window[eventMethod];
                    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

                    scope.getLoginUrl = function () {
                        return $sce.trustAsResourceUrl("https://" + $rootScope.authHost + "/?iframe=true&msg=true&test=" + $rootScope.settings.test);
                    }

                    // Listen to message from child window
                    eventer(messageEvent, function (e) {
                        var key = e.message ? "message" : "data";
                        var data = e[key];

                        if (data == "loginSuccess") {

                            // Close and delete the dialoge if open.
                            if (scope.openLogin != null) {
                                scope.openLogin.close();
                                delete scope.openLogin;
                            }

                            // Broadcast the login event so controllers can respond to it as necessary.
                            scope.$broadcast("event:loginSuccess");

                            // Set the user settings
                            SettingsService.setUserSettings();

                            // Tell the http interceptor that the login succeeded so it can re-run the failed HTTP requests.
                            authService.loginConfirmed();

                        } else {
                            // Only in rare cases will this happen - only in a case after a successful login we were unable to properly set the login cookie. Typical login failures are handled within the iFrame.
                            // As such, we don't specially handle - the login will fail and the next action the user takes will ask them to login again. This could be updated to provide more explicit help.
                            // Broadcast the login event so controllers can respond to it as necessary.
                            scope.$broadcast("event:loginFailure");
                            delete scope.openLogin;
                        }

                    }, false);

                }

            });
        }
    }
}]);


app.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            elem.on('click', function () {
                this.select();
            });
        }
    };
});


app.directive('focus', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            elem[0].focus();
        }
    };
});


app.directive('resource', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {

            if (utils.hasPermission(attrs.resource, attrs.method) == false) {
                elem[0].remove();
            }

        }
    };
});


app.directive('dropzone', ['ApiService', function (ApiService) {

    return function (scope, element, attrs) {

        // This passes through the supplied url's query string parameters but appends timezone if not explicitly provided.
        var url = attrs.dropzoneUrl;
        var queryParameters = utils.getQueryParameters(url);

        if (queryParameters["timezone"] == null) {
            queryParameters["timezone"] = "UTC";
        }

        // Remove the current query string
        if (url.indexOf("?") > 0) {
            url = url.substring(0, url.indexOf("?"))
        }

        // Append the parameters
        url = utils.appendParams(url, queryParameters);

        // Define your settings
        var maxFiles = parseInt(attrs.dropzoneMaxFiles);
        if (isNaN(maxFiles)) {
            maxFiles = 1;
        };

        var maxSize = parseInt(attrs.dropzoneMaxSize);
        if (isNaN(maxSize)) {
            maxSize = 10000000; // 10 MB default
        }

        var autoUpload = false;
        if (attrs.dropzoneAutoUpload != null) {
            if (attrs.dropzoneAutoUpload == "true") {
                autoUpload = true;
            }
        }

        var showDelete = true;
        if (attrs.dropzoneShowDelete != null) {
            if (attrs.dropzoneShowDelete == "false") {
                showDelete = false;
            }
        }

        var imageUrlName = attrs.dropzoneImageUrlName;
        var template = attrs.dropzoneTemplateId;

        var filetypes = attrs.dropzoneFiletypes;
        if (filetypes != null) {
            var fileExtensions = filetypes.split(",");
        }

        // Get the default drop template
        var elements = document.querySelectorAll(".dropzone-max-size");
        _.each(elements, function (element) {
            element.innerHTML = (maxSize / 1000000) + " MB";
        });

        elements = document.querySelectorAll(".dropzone-max-files");
        _.each(elements, function (element) {
            element.innerHTML = maxFiles;
        });

        elements = document.querySelectorAll(".dropzone-filetypes");
        _.each(elements, function (element) {
            if (filetypes != null) {
                element.innerHTML = filetypes.split(",").join(", ")
            }
        });

        var template = document.querySelector("#" + template).innerHTML;

        if (autoUpload == true) {
            // Don't show the "upload" and remove buttons in the preview
            document.querySelector("#dz-file-upload-button").classList.add("hidden");
            document.querySelector("#dz-file-remove-button").classList.add("hidden");
        }

        var previewTemplate = document.querySelector("#dz-preview").innerHTML;

        var options = {
            url: ApiService.buildUrl(url),
            paramName: attrs.dropzoneParameterName,
            dictDefaultMessage: template,
            previewTemplate: previewTemplate,
            headers: { Authorization: "Bearer " + localStorage.getItem("token") },
            autoProcessQueue: autoUpload,
            uploadMultiple: false,
            parallelUploads: 4,
            maxFiles: maxFiles,
            maxFilesize: 2000000000 // This is just a default setting that is higher than any upload size we'd actually allow. This prevents dropzone from calling the "failedUpload" when a dropped file is larger than it's default limit.
        };

        var hideDefault = function (dropzone) {
            // Hide the default messaging
            var els = document.querySelectorAll(".dz-default");
            _.each(els, function (element) {
                element.classList.add("hidden");
            });
        }

        var showDefault = function () {
            // Show the default messaging
            var el = document.querySelectorAll(".dz-default");
            el[0].classList.remove("hidden");
        };

        var enableUpload = function (file) {
            file.previewTemplate.querySelector("#dz-file-upload-button").classList.remove("hidden");
            file.previewTemplate.querySelector("#dz-file-remove-button").classList.remove("hidden");
        };

        var disableUpload = function (file) {
            file.previewTemplate.querySelector("#dz-file-upload-button").classList.add("hidden");
            file.previewTemplate.querySelector("#dz-file-remove-button").classList.add("hidden");
        };

        var resetError = function (file) {
            var el = file.previewTemplate.querySelector("#dz-file-upload-progress");
            el.classList.add("progress-striped");
            el.classList.add("active");

            el = file.previewTemplate.querySelector("#dz-file-upload-progress-bar");
            el.classList.add("progress-bar-info");
            el.classList.remove("progress-bar-danger");
            el.style.width = 0;

            file.previewTemplate.querySelector("#dz-file-upload-error").classList.add("hidden");
            file.previewTemplate.querySelector("#dz-file-upload-error-message").innerHTML = "";
        }

        var startUpload = function (file) {
            resetError(file);
            disableUpload(file);
            scope.$emit("uploadSending", true);
        };

        var successfulUpload = function (dropzone, file, serverResponse) {
            var el = file.previewTemplate.querySelector("#dz-file-upload-progress");
            el.classList.remove("progress-striped");
            el.classList.remove("active");
            el = file.previewTemplate.querySelector("#dz-file-upload-progress-bar");
            el.classList.remove("progress-bar-info");
            el.classList.add("progress-bar-success");
            scope.$emit("uploadComplete", serverResponse);
            scope.$emit("uploadSending", false);

            // Show the image specified in the request (if provided)
            if (imageUrlName != null) {
                if (serverResponse[imageUrlName] != null) {
                    el = file.previewTemplate.querySelector("#dz-image-preview");
                    el.src = serverResponse[imageUrlName];
                    el.classList.remove("hidden");
                }
            }

            if (showDelete == true) {
                el = file.previewTemplate.querySelector("#dz-file-delete-button");
                el.classList.remove("hidden");
                el.addEventListener("click", function (event) {
                    scope.$emit("uploadDelete", serverResponse, file);
                });
            }

        };

        var failedUpload = function (dropzone, file, errorMessage) {

            var el = file.previewTemplate.querySelector("#dz-file-upload-progress");
            el.classList.remove("progress-striped");
            el.classList.remove("active");

            el = file.previewTemplate.querySelector("#dz-file-upload-progress-bar");
            el.classList.remove("progress-bar-info");
            el.classList.add("progress-bar-danger");

            scope.$emit("uploadSending", false);

            file.previewTemplate.querySelector("#dz-file-upload-error").classList.remove("hidden");

            if (errorMessage.error) {
                file.previewTemplate.querySelector("#dz-file-upload-error-message").innerHTML = errorMessage.error.message;
            }

            enableUpload(file);

            // Cancel autoprocess or the upload will automatically retry forever as soon as we re-queue the files.
            dropzone.options.autoProcessQueue = false;

            // Requeue the files so the user can choose to send them again (in the event the failure was due 
            for (var i = 0, l = dropzone.files.length, file; i < l; i++) {
                file = dropzone.files[i];
                file.status = Dropzone.QUEUED;
                file.upload.progress = 0;
                file.upload.bytesSent = 0;
                file.upload.total = 0;
            }
        };

        var removedFile = function (dropzone) {
            if (dropzone.files.length == 0) {
                showDefault();
            }
        };

        var addedFile = function (dropzone, file) {

            // Show by default
            file.previewTemplate.querySelector("#dz-file-upload-button").classList.remove("hidden");
            file.previewTemplate.querySelector("#dz-file-remove-button").classList.remove("hidden");

            if (dropzone.files.length >= maxFiles) {
                hideDefault(dropzone);
            }

            // If adding more files than allowed, remove it.
            if (dropzone.files.length > maxFiles) {
                dropzone.removeFile(file);
            }

            // If adding a file that has an unsupported extension, show an error
            if (fileExtensions) {
                var ext = file.name.substr(file.name.lastIndexOf('.') + 1);

                if (fileExtensions.indexOf(ext) == -1) {
                    file.previewTemplate.querySelector("#dz-file-upload-button").classList.add("hidden");
                    file.previewTemplate.querySelector("#dz-file-upload-error").classList.remove("hidden");
                    file.previewTemplate.querySelector("#dz-file-upload-error-message").innerHTML = "Invalid file type. Allowed types are: " + fileExtensions.join(", ");
                }
            }

            if (file.size > maxSize) {
                file.previewTemplate.querySelector("#dz-file-upload-button").classList.add("hidden");
                file.previewTemplate.querySelector("#dz-file-upload-error").classList.remove("hidden");
                file.previewTemplate.querySelector("#dz-file-upload-error-message").innerHTML = "File too large. Max size: " + (maxSize / 1000000) + " MB";
            }

            // Wire up the upload event
            var submitButton = file.previewTemplate.querySelector("#dz-file-upload-button");
            submitButton.addEventListener("click", function () {
                if (dropzone.getQueuedFiles().length > 0) {
                    dropzone.processQueue();
                }
                else {
                    // Upload without files (useful if doing a post to update metadata of an existing file without providing a new file)
                    dropzone.uploadFiles([]);
                }
            });
        };

        // Create a Dropzone for the element with the given options
        var dropzone = new Dropzone(element[0], options);

        // Bind the given event handlers
        dropzone.on("sending", function (file, xhr, formData) {
            startUpload(file);
        });

        // Bind the given event handlers
        dropzone.on("success", function (file, serverResponse) {
            successfulUpload(this, file, serverResponse);
        });

        // Bind the given event handlers
        dropzone.on("error", function (file, errorMessage) {
            failedUpload(this, file, errorMessage);
        });

        // Bind the given event handlers
        dropzone.on("removedfile", function (file) {
            removedFile(this);
        });

        // Bind the given event handlers
        dropzone.on("addedfile", function (file) {
            addedFile(this, file);
        });

        // Listen for a cancel event
        var cancelListener = scope.$on('uploadCanceled', function () {
            cancelListener();
            dropzone.removeAllFiles(true);
        });

        // Listen for a delete event
        var deleteListener = scope.$on('uploadDeleted', function (event, file) {
            // TO_DO figure out when to delete this listener. Probably when the dialogue is closed.
            file.previewTemplate.classList.add("hidden");
        });

        // Watch to see if you should hide the dropzone UI.
        scope.$watch(attrs.dropzoneHide, function (newVal, oldVal) {

            if (newVal != oldVal) {
                if (newVal == true) {
                    var el = document.querySelectorAll(".dz-default");
                    for (var i = 0; i < el.length; i++) {
                        el[i].classList.add("hidden");
                    }
                } else {
                    var el = document.querySelectorAll(".dz-default");
                    for (var i = 0; i < el.length; i++) {
                        el[i].classList.remove("hidden");
                    }
                }
            }

        });
    };
}]);


app.directive('permissions', ['ApiService', function (ApiService) {
    return {
        restrict: 'E',
        templateUrl: "app/templates/permissions.html",
        scope: {
            effectivePermissions: '=?effective',
            result: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            scope.$watch('effectivePermissions', function (newVal, oldValue) {
                // Precheck based on the items and the effective permissions
                precheck(scope.permissionItems, scope.effectivePermissions);
            }, true);

            scope.checkedItems = [];
            scope.permissionItems = [];
            scope.allow = {};
            scope.allow.all = true;

            var getPermissionItems = function () {
                // Get the permissions schema
                ApiService.getItem(ApiService.buildUrl("/auths/options"), { type: attrs.authType }).then(function (response) {
                    scope.permissionItems = response.permissions;

                    // Add a set of wildcard options
                    scope.permissionItems.unshift({ resource: "*", methods: ["read", "create", "update", "delete"] });

                    // Precheck with configured permissions
                    precheck(scope.permissionItems, scope.effectivePermissions);

                });
            }

            // Load the permissions grid
            getPermissionItems();

            var checkItem = function (resource, method) {
                // Find the item
                var foundResource = _.findWhere(scope.checkedItems, { resource: resource });
                if (foundResource == null) {

                    var permission = {};
                    permission.methods = [];

                    permission.resource = resource;
                    permission.methods.push(method);
                    scope.checkedItems.push(permission);

                } else {
                    // Just add it and de-dupe if it already existed.
                    foundResource.methods.push(method);
                    foundResource.methods = _.uniq(foundResource.methods);
                }
            }

            var uncheckItem = function (resource, method) {

                // Find the item
                var foundResource = _.findWhere(scope.checkedItems, { resource: resource });
                if (foundResource == null) {
                    return;
                } else {
                    foundResource.methods = _.without(foundResource.methods, method);
                }

                // Uncheck the associated wildcard resource
                if (resource != "*") {
                    uncheckItem("*", method);
                }
            }

            var checkAll = function (method) {
                _.each(scope.permissionItems, function (item) {
                    checkItem(item.resource, method);
                });
            }

            var uncheckAll = function (method) {
                _.each(scope.permissionItems, function (item) {
                    uncheckItem(item.resource, method);
                });
            }

            scope.checkToggle = function (resource, method) {
                if (scope.isChecked(resource, method)) {
                    uncheckItem(resource, method);

                    if (resource == "*") {
                        uncheckAll(method);
                    }
                } else {
                    checkItem(resource, method);

                    if (resource == "*") {
                        checkAll(method);
                    } else {
                        // If this click checked all the items, check the wildcard
                        var checkWildcard = true;
                        _.each(scope.permissionItems, function (item) {
                            if (item.methods.indexOf(method) >= 0 && item.resource != "*") {
                                if (scope.isChecked(item.resource, method) == false) {
                                    checkWildcard = false;
                                }
                            }
                        });

                        if (checkWildcard == true) {
                            checkItem("*", method);
                        }
                    }
                }

                scope.result = slimPermissions(scope.checkedItems);
            }

            scope.isChecked = function (resource, method) {

                var foundResource = _.findWhere(scope.checkedItems, { resource: resource });
                if (foundResource == null) {
                    return false;
                }

                if (_.indexOf(foundResource.methods, method) < 0) {
                    return false;
                }

                return true;
            }

            var precheck = function (permissionItems, effectivePermissions) {

                if (effectivePermissions == null || permissionItems == null) {
                    return;
                }

                // Set default checked items
                _.each(permissionItems, function (item) {
                    if (utils.hasProperty(effectivePermissions, item.resource)) {
                        _.each(effectivePermissions[item.resource], function (value, prop) {
                            if (value == true) {
                                checkItem(item.resource, prop);
                            }
                        });
                    }
                });

                // Check the wildcards for any methods that have are true for all objects
                var check = {};
                check.read = true; check.create = true; check.update = true; check.delete = true;
                _.each(permissionItems, function (item) {
                    _.each(item.methods, function (method) {
                        if (scope.isChecked(item.resource, method) == false && item.resource != "*") {
                            check[method] = false;
                        }
                    });
                });

                _.each(check, function (value, prop) {
                    if (value == true) {
                        checkItem("*", prop);
                    } else {
                        uncheckItem("*", prop);
                    }
                });
            }

            scope.allowsMethod = function (resource, method) {
                var foundResource = _.findWhere(scope.permissionItems, { resource: resource });
                if (foundResource != null) {
                    // We found it. Does it support the method?
                    if (_.indexOf(foundResource.methods, method) >= 0) {
                        return true;
                    }
                }
                return false;
            }

            var slimPermissions = function (checked) {

                // We don't want to modify checked, so copy it into a new object
                var checkedCopy = angular.copy(checked);

                var wildcard = _.findWhere(checkedCopy, { resource: "*" });
                if (wildcard != null) {
                    _.each(wildcard.methods, function (method) {
                        // Remove this method from all non-wildcard resources as it is redundant
                        _.each(checkedCopy, function (item) {
                            if (item.resource != "*") {
                                item.methods = _.without(item.methods, method);
                            }
                        });
                    });
                }

                var slimmed = [];

                // Loop through all and remove all resources that have empty method lists
                _.each(checkedCopy, function (item) {
                    if (item.methods.length > 0) {
                        slimmed.push(item);
                    }
                });

                // Loop through each and add the allow flag, based on the input
                _.each(slimmed, function (item) {
                    item.allow = scope.allow.all;
                });

                // if allow = false, then we need to create a wildcard allow for all resources / methods which enables the concept of permissions presented in the UI meaning "all permissions but"
                if (scope.allow.all == false) {
                    slimmed.push({ resource: "*", methods: ["*"], allow: true });
                }

                return slimmed;
            }
        }
    };
}]);


app.directive('refund', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            payment: '=?',
            items: '=?',
            shippingItem: '=?',
            gatewayAccountId: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Hide by default
            elem.hide();

            // Watch to see if you should show or hide the button
            scope.$watch('payment.status', function () {
                if (scope.payment) {
                    if (scope.payment.status == "completed" && scope.payment.total > 0) {
                        elem.show();
                    } else {
                        elem.hide();
                    }
                }
            }, true);

            elem.click(function () {

                // Set defaults
                scope.refund = {};
                scope.refund.currency = scope.payment.currency;
                scope.refund.disabled = false;
                scope.refund.reason = null;
                scope.refund.reasons = [];
                
                scope.refund.show_chargeback = false;
                if (scope.gatewayAccountId != "platform" || localStorage.getItem("token").substring(0, 6) == "admin.") {
                    scope.refund.show_chargeback = true;
                }

                // Get the refund and chargeback reasons
                ApiService.getItem(ApiService.buildUrl("/refunds/options"))
                .then(
                function (data) {
                    scope.refund.reasons = data.refund_reasons;
                    scope.refund.chargeback_reasons = data.chargeback_reasons;
                },
                function (error) {
                    window.scrollTo(0, 0);
                    scope.modalError = error;
                });

                // Determine the active tab
                scope.refundTabs = [
                  { active: true },
                  { active: false }
                ];
                scope.showItemsTab = true;

                // We will derive our refund items from the order items.
                scope.refund.items = [];

                _.each(scope.items, function (item, index) {
                    var item = _.pick(item, "item_id", "name", "quantity", "price", "subtotal", "tax", "total", "tax_rate");

                    // Rename quantity so you can differentiate between ordered quantity and refunded quantity
                    item.order_quantity = item.quantity;

                    // Set the default value for quantity, which is null so the user can define
                    item.quantity = null;

                    scope.refund.items.push(item);

                    if (scope.refund.items.length == 0) {
                        scope.refundTabs = [
                          { active: false },
                          { active: true }
                        ];
                        scope.showItemsTab = false;
                    };

                });

                scope.refund.shipping_item = null;
                if (scope.shippingItem) {
                    scope.refund.shipping_item = scope.shippingItem;
                }

                var refundModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/refund.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                refundModal.result.then(function (result) {
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.refund.ok = function (form) {

                    // Clear any previous errors
                    scope.modalError = null;

                    if (form.$invalid) {
                        return;
                    }

                    // If nothing has been selected to refund, show an error.
                    if (utils.sumProperties(scope.refund.items, "quantity") == 0 && (scope.refund.shipping_quantity == 0 || !scope.refund.shipping_quantity) && (scope.refund.total == null || parseFloat(scope.refund.total) == 0)) {
                        scope.modalError = { message: "Please supply an amount or select items to refund." };
                        return;
                    }

                    // If the total to refund is greater than the amount left to refund, show an error
                    if (parseFloat(scope.refund.getItemsTotal(scope.refund.items, scope.refund.shipping_quantity)) > parseFloat(scope.refund.getUnrefundedTotal()) || parseFloat(scope.refund.total) > parseFloat(scope.refund.getUnrefundedTotal()).toFixed(2)) {
                        scope.modalError = { message: "The refund amount plus any previous refund amounts cannot be greater than the payment total. The maximum remaining refund for this payment is: " + parseFloat(scope.refund.getUnrefundedTotal()).toFixed(2) + " " + scope.refund.currency };
                        return;
                    }

                    if (scope.refund.total == null && scope.refund.getItemTotalQuantities(scope.refund.items) == 0 && !scope.refund.shipping_quantity) {
                        scope.modalError = { message: "Please indicate what should be refunded" };
                        return;
                    }

                    if (scope.refund.is_chargeback == true) {
                        var confirm = { id: "process_chargeback" };
                    } else {
                        var confirm = { id: "process_refund" };
                    }

                    confirm.onConfirm = function () {
                        execute(scope.refund.items, scope.refund.total);
                    }

                    ConfirmService.showConfirm(scope, confirm);

                };

                var execute = function (items, total) {

                    scope.refund.disabled = true;
                    var data = {};

                    // If total is not supplied, use items
                    if (!total) {
                        data.items = [];
                        _.each(scope.refund.items, function (item) {
                            if (item.quantity) {
                                data.items.push(_.pick(item, "quantity", "item_id"));
                            }
                        });

                        if (scope.refund.shipping_quantity == 1) {
                            data.shipping = scope.shippingItem.total;
                        }

                    } else {
                        // If there are no items, use the total
                        data.total = total;
                    }

                    // Set the reason
                    data.reason = scope.refund.reason;

                    // Set the chargeback status
                    data.is_chargeback = scope.refund.is_chargeback;

                    // Process the refund
                    ApiService.set(data, scope.payment.url + "/refunds", { expand: "fees,items" })
                    .then(
                    function (refund) {
                        // Update the payment properties from the new refund and return.
                        scope.payment.refunds.data.push(refund);

                        // If the entire amount has been refunded, change the status on payment to refunded.
                        if (utils.roundCurrency(scope.refund.getUnrefundedTotal()) <= 0) {
                            scope.payment.status = 'refunded';
                        }

                        if (refund.is_chargeback == false) {
                            GrowlsService.addGrowl({ id: "refund_success", type: "success", amount: refund.total.toFixed(2) + " " + refund.currency, url: "/#/refunds/" + refund.refund_id });
                        } else {
                            GrowlsService.addGrowl({ id: "chargeback_success", type: "success", amount: refund.total.toFixed(2) + " " + refund.currency, url: "/#/refunds/" + refund.refund_id });
                        }
                        refundModal.close();
                    },
                    function (error) {
                        // if the error status is 422, the payment was previously refunded. Get the refunded payment to return it.
                        if (error.status == 422) {
                            ApiService.getItem(scope.payment.url).then(function (payment) {
                                scope.payment = payment;
                                refundModal.close();
                            }, function (error) {
                                // You had a problem getting the payment, just show the error on the modal.
                                window.scrollTo(0, 0);
                                scope.modalError = error;
                            });
                        } else {
                            // Otherwise, return an error.
                            window.scrollTo(0, 0);
                            scope.modalError = error;
                        }
                    });
                }

                scope.refund.cancel = function () {
                    refundModal.dismiss();
                };

                scope.refund.getItemTotal = function (price, tax_rate, quantity) {
                    if (quantity) {
                        return ((price * quantity) * (1 + tax_rate)).toFixed(2);
                    } else {
                        return 0;
                    }
                };

                scope.refund.getShippingTotal = function (quantity) {
                    if (quantity) {
                        return scope.shippingItem.total;
                    } else {
                        return 0;
                    }
                };

                scope.refund.getItemsTotal = function (items, shipping_quantity) {

                    var total = 0;

                    _.each(items, function (item) {
                        if (item.quantity) {
                            total += Math.round(parseFloat((item.price * parseInt(item.quantity)) * (1 + item.tax_rate)) * 100) / 100;
                        }
                    });

                    if (shipping_quantity) {
                        total += scope.shippingItem.total;
                    }

                    if (total > 0) {
                        return total.toFixed(2)
                    }

                    return (0).toFixed(2);
                };

                scope.refund.getItemTotalQuantities = function (items) {
                    var total = 0;
                    _.each(items, function (item) {
                        if (item.quantity) {
                            total = total + parseInt(item.quantity);
                        }
                    });
                    return total;
                };

                scope.refund.clearTotal = function () {
                    scope.refund.total = null;
                }

                scope.refund.clearQuantities = function () {
                    _.each(scope.refund.items, function (item) {
                        item.quantity = null;
                    });
                    scope.refund.shipping_quantity = null;
                }

                scope.refund.getAmountShipping = function (refund_total) {
                    // The shipping that will be refunded will be multiplied by the percentage of the total that refund total represents. Note this is for display only as the actual amounts are calculated on the server.
                    if (refund_total == scope.payment.total) {
                        return scope.payment.shipping;
                    }

                    var refund_percentage = refund_total / scope.payment.total;
                    return Math.round((scope.payment.shipping * refund_percentage) * 100) / 100;

                }

                scope.refund.getAmountTax = function (refund_total) {
                    // The tax that will be refunded will be multiplied by the percentage of the total that refund total represents. Note this is for display only as the actual amounts are calculated on the server.
                    if (refund_total == scope.payment.total) {
                        return scope.payment.tax;
                    }

                    var refund_percentage = refund_total / scope.payment.total;
                    return Math.round((scope.payment.tax * refund_percentage) * 100) / 100;

                }

                scope.refund.getAmountSubtotal = function (refund_total) {
                    return refund_total - scope.refund.getAmountShipping(refund_total) - scope.refund.getAmountTax(refund_total);
                }

                scope.refund.getAmountTotal = function (refund_total) {
                    if (refund_total == null) {
                        return 0;
                    }
                    return refund_total;
                }

                scope.refund.getUnrefundedTotal = function () {

                    // Narrow to refunds that are completed or pending
                    var successful_refunds = _.filter(scope.payment.refunds.data, function (item) { return _.contains(['completed', 'pending'], item.status) });

                    var refundTotal = utils.sumProperties(successful_refunds, "total");
                    return utils.roundCurrency(scope.payment.total - refundTotal);
                }

                scope.refund.getUnrefundedQuantity = function (item) {

                    // Count the total refunded for this item
                    var refundQuantity = 0;

                    // Narrow to refunds that are completed or pending
                    var successful_refunds = _.filter(scope.payment.refunds.data, function (item) { return _.contains(['completed', 'pending'], item.status) });

                    _.each(successful_refunds, function (refund) {
                        if (refund.items != null) {
                            var refundItems = _.where(refund.items, { "item_id": item.item_id });
                            _.each(refundItems, function (refundItem) {
                                refundQuantity += refundItem.quantity;
                            });
                        }
                    });

                    // Return the sum of the original quantity ordered minus any past refund quantities processed.
                    return _.find(scope.items, { "item_id": item.item_id }).quantity - refundQuantity;
                }

                // If the unrefunded amount is less than the total of any individual item, don't show the items tab
                var itemLessThan = false;
                _.each(scope.items, function (item) {
                    if ((item.price + (item.tax / item.quantity)) <= parseFloat(scope.refund.getUnrefundedTotal()) && scope.refund.getUnrefundedQuantity(item) > 0) {
                        itemLessThan = true;
                        return;
                    }
                });

                if (itemLessThan == false) {
                    scope.refundTabs = [
                      { active: false },
                      { active: true }
                    ];
                    scope.showItemsTab = false;
                }

            });
        }
    };
}]);


app.directive('void', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            payment: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Hide by default
            elem.hide();

            // Watch to see if you should show or hide the button
            scope.$watch('payment.status', function () {
                if (scope.payment) {
                    if (scope.payment.status == "pending" && scope.payment.payment_method.type == "credit_card") {
                        elem.show();
                    } else {
                        elem.hide();
                    }
                }
            }, true);

            elem.click(function () {

                var execute = function () {

                    // Void the payment
                    ApiService.set(null, scope.payment.url + "/void")
                    .then(
                    function (refund) {

                        // Update the payment properties from the new refund and return.
                        scope.payment.status = "cancelled";

                        GrowlsService.addGrowl({ id: "void_success", type: "success" });
                    },
                    function (error) {
                        // if the error status is 422, the payment was previously voided. Just set the status and return.
                        if (error.status == 422) {
                            scope.payment.status = "cancelled";
                        } else {
                            // Otherwise, return an error.
                            window.scrollTo(0, 0);
                            scope.error = error;
                        }
                    });
                }

                var confirm = { id: "void_payment" };
                confirm.onConfirm = function () {
                    execute();
                }

                ConfirmService.showConfirm(scope, confirm);

            });
        }
    };
}]);


app.directive('capture', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            payment: '=?',
            items: '=?',
            shippingItem: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Hide by default
            elem.hide();

            // Watch to see if you should show or hide the button
            scope.$watch('payment.status', function () {
                if (scope.payment) {
                    if (scope.payment.status == "pending" && (scope.payment.payment_method.type == "credit_card" || scope.payment.payment_method.type == "paypal" || scope.payment.payment_method.type == "amazon_pay")) {
                        elem.show();
                    } else {
                        elem.hide();
                    }
                }
            }, true);

            elem.click(function () {

                // Set defaults
                scope.capturePayment = {}
                scope.capturePayment.currency = scope.payment.currency;
                scope.capturePayment.original_total = scope.payment.total;
                scope.capturePayment.original_tax = scope.payment.tax;
                scope.capturePayment.original_shipping = scope.payment.shipping;
                scope.capturePayment.disabled = false;
                scope.capturePayment.shipping_quantity = null;

                // We will derive our capture items from the order items.
                scope.capturePayment.items = [];
                if (scope.items) {
                    _.each(scope.items, function (item, index) {
                        var item = _.pick(item, "order_id", "item_id", "name", "description", "quantity", "price", "subtotal", "tax", "total", "tax_rate");

                        // Rename quantity so you can differentiate between ordered quantity and captured quantity
                        item.order_quantity = item.quantity;

                        // Set the default value for quantity, which is null so the user can define
                        item.quantity = null;

                        scope.capturePayment.items.push(item);
                    })
                }

                if (scope.shippingItem) {
                    scope.capturePayment.shipping_item = scope.shippingItem;
                }

                // Determine which tabs is active and shown.
                scope.showItemsTab = true;
                if (scope.payment.order) {
                    scope.capturePaymentTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.capturePaymentTabs = [
                      { active: false },
                      { active: true }
                    ];
                    scope.showItemsTab = false;
                }

                var capturePaymentModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/capture_payment.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                capturePaymentModal.result.then(function (result) {
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.capturePayment.ok = function (form) {

                    // Clear any previous errors
                    scope.modalError = null;

                    if (form.$invalid) {
                        return;
                    }

                    var partialCapture = false;
                    if (scope.capturePayment.getItemTotalQuantities(scope.capturePayment.items) > 0 && (scope.capturePayment.getItemTotalQuantities(scope.capturePayment.items) < scope.capturePayment.getItemTotalQuantities(scope.items))) {
                        partialCapture = true;
                    }

                    if (scope.capturePayment.shipping_quantity && scope.capturePayment.getItemTotalQuantities(scope.capturePayment.items) == 0) {
                        partialCapture = true;
                    }

                    if (!scope.capturePayment.shipping_quantity && scope.shippingItem && !scope.capturePayment.total) {
                        partialCapture = true;
                    }

                    if (scope.capturePayment.total && parseFloat(scope.capturePayment.total) < scope.payment.total) {
                        partialCapture = true;
                    }

                    if (scope.capturePayment.total == null && scope.capturePayment.getItemTotalQuantities(scope.capturePayment.items) == 0 && !scope.capturePayment.shipping_quantity) {
                        scope.modalError = { message: "Please indicate what should be captured" };
                        return;
                    }

                    // If they are capture less than the full amount, ask for confirmation
                    if (partialCapture) {
                        var confirm = { id: "partial_capture_warning" };
                        confirm.onConfirm = function () {
                            execute(scope.capturePayment.items, scope.capturePayment.total);
                        }
                        ConfirmService.showConfirm(scope, confirm);
                    } else {
                        execute(scope.capturePayment.items, scope.capturePayment.total);
                    }

                };

                var execute = function (items, total) {
            
                    scope.capturePayment.disabled = true;

                    // If total is not supplied, use items
                    var data = {};
                    if (!total) {
                        // Get only the properties we need for each item
                        data.items = [];
                        _.each(scope.capturePayment.items, function (item) {
                            if (item.quantity) {
                                data.items.push(_.pick(item, "quantity", "item_id"));
                            }
                        });

                        if (scope.capturePayment.shipping_quantity == 1) {
                            data.shipping = scope.shippingItem.total;
                        }

                    } else {
                        // Use total
                        data.total = total;
                    }

                    // Capture the payment
                    var params = { expand: "customer,response_data,items.shipments,gateway,fees,commissions,order,refunds,payment_method" };
                    ApiService.set(data, scope.payment.url + "/capture", params)
                    .then(
                    function (payment) {

                        // Populate the updated payment.
                        scope.payment = payment;

                        GrowlsService.addGrowl({ id: "payment_capture_success", type: "success" });
                        capturePaymentModal.close(payment);
                    },
                    function (error) {
                        // if the error status is 422, the payment was previously captured. Get the captured payment to return it.
                        if (error.status == 422) {
                            ApiService.getItem(scope.payment.url).then(function (payment) {
                                capturePaymentModal.close(payment);
                            }, function () {
                                // You had a problem getting the payment. Return the original error.
                                capturePaymentModal.close(error);
                            });
                        } else {
                            // Otherwise, return an error.
                            window.scrollTo(0, 0);
                            scope.modalError = error;
                        }
                    });
                }

                scope.capturePayment.cancel = function () {
                    capturePaymentModal.dismiss();
                };

                scope.capturePayment.getItemTotal = function (price, tax_rate, quantity) {
                    if (quantity) {
                        return ((price * quantity) * (1 + tax_rate)).toFixed(2);
                    } else {
                        return 0;
                    }
                };

                scope.capturePayment.getShippingTotal = function (quantity) {
                    if (quantity) {
                        return scope.shippingItem.total;
                    } else {
                        return 0;
                    }
                };

                scope.capturePayment.getItemsTotal = function (items, shipping_quantity) {

                    var total = 0;

                    _.each(items, function (item) {
                        if (item.quantity) {
                            total += Math.round(parseFloat((item.price * parseInt(item.quantity)) * (1 + item.tax_rate)) * 100) / 100;
                        }
                    });

                    if (shipping_quantity) {
                        total += scope.shippingItem.total;
                    }

                    if (total > 0) {
                        return total.toFixed(2)
                    }

                    return (0).toFixed(2);
                };

                scope.capturePayment.getItemTotalQuantities = function (items) {
                    var total = 0;
                    if (items != null) {
                        _.each(items, function (item) {
                            if (item.quantity) {
                                total = total + parseInt(item.quantity);
                            }
                        });
                    }
                    return total;
                };

                scope.capturePayment.clearTotal = function () {
                    scope.capturePayment.total = null;
                }

                scope.capturePayment.clearQuantities = function () {
                    _.each(scope.capturePayment.items, function (item) {
                        item.quantity = null;
                    })
                }

                scope.capturePayment.getAmountShipping= function (capture_total) {
                    // The shipping that will be captured will be multiplied by the percentage of the total that capture total represents. Note this is for display only as the actual amounts are calculated on the server.
                    if (capture_total == scope.capturePayment.original_total) {
                        return scope.capturePayment.original_shipping;
                    }

                    var capture_percentage = capture_total / scope.capturePayment.original_total;
                    return Math.round((scope.capturePayment.original_shipping * capture_percentage) * 100) / 100;

                }

                scope.capturePayment.getAmountTax = function (capture_total) {
                    // The tax that will be captured will be multiplied by the percentage of the total that capture total represents. Note this is for display only as the actual amounts are calculated on the server.
                    if (capture_total == scope.capturePayment.original_total) {
                        return scope.capturePayment.original_tax;
                    }

                    var capture_percentage = capture_total / scope.capturePayment.original_total;
                    return Math.round((scope.capturePayment.original_tax * capture_percentage) * 100) / 100;

                }

                scope.capturePayment.getAmountSubtotal = function (capture_total) {
                    return capture_total - scope.capturePayment.getAmountShipping(capture_total) - scope.capturePayment.getAmountTax(capture_total);
                }

                scope.capturePayment.getAmountTotal = function (capture_total) {
                    if (capture_total == null) {
                        return 0;
                    }
                    return capture_total;
                }

                scope.loadTotal = function (total) {
                    return utils.cleanPrice(total);
                }

            });
        }
    };
}]);


app.directive('ship', ['ApiService', 'ConfirmService', 'GrowlsService', 'CouriersService', '$uibModal', '$q', function (ApiService, ConfirmService, GrowlsService, CouriersService, $uibModal, $q) {
    return {
        restrict: 'A',
        scope: {
            order: '=?',
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // orders: The order to which the shipments belong

            // Hide by default
            elem.hide();

            // Watch to see if you should show or hide the button
            scope.$watch('order.fulfilled', function () {
                if (scope.order) {
                    if (scope.order.fulfilled == false) {
                        elem.show();
                    } else {
                        elem.hide();
                    }
                }
            }, true);

            elem.click(function () {

                // Set defaults
                scope.shipItems = {};
                scope.shipItems.disabled = false;

                scope.shipItems.isFulfilled = function (shipment) {
                    if (shipment.shippableQuantity == 0) {
                        return true;
                    }
                    return false;
                }

                scope.shipItems.getShippableQuantity = function (item) {
                    // The shipment quantity is the item quantity of the item minus the quantity already shipped
                    var shippedQuantity = 0;

                    // Loop through the shipments to find shipments for this item
                    _.each(scope.order.shipments.data, function (shipment) {
                        var items = _.filter(shipment.items, function (i) { return i.item_id == item.item_id });
                        _.each(items, function(i) {
                            shippedQuantity += i.quantity;
                        });
                    });

                    // If the items quantites have all be shipped, mark the item as fulfilled.
                    if (item.quantity - shippedQuantity == 0) {
                        item.fulfilled = true;
                    }

                    return item.quantity - shippedQuantity;

                }

                // We will derive our shipment items from the order items.
                scope.shipItems.shipments = [];
                _.each(scope.order.items, function (item, index) {

                    // Don't present items that have been marked as fulfilled, regardless of quatities and shipments.
                    if (item.fulfilled == false) {

                        var shipment = _.pick(item, "order_id", "item_id", "name", "quantity");

                        // Rename quantity so you can differentiate between ordered quantity and shipped quantity
                        shipment.order_quantity = shipment.quantity;

                        // Set the default value for quantity, which is null so the user can define
                        shipment.quantity = null;

                        // Specify the shippable quantity (quantity ordered - quantity already shipped)
                        shipment.shippableQuantity = scope.shipItems.getShippableQuantity(item);

                        scope.shipItems.shipments.push(shipment);
                    }
                })

                // Define the possible shipment dates (order_date - today + 5 days)
                scope.shipItems.dates = [];

                // Bump the order date down by one to handle any timezone differences and set time to midnight and convert to timestamp for easy comparision in the view
                var order_date = utils.addDays(new Date(scope.order.date_created), -1).setHours(0, 0, 0, 0);

                for (i = 1; i < utils.daysDiff(order_date, utils.addDays((new Date), 5)) ; i++) {
                    scope.shipItems.dates.push(utils.addDays(new Date(order_date), i).setHours(0, 0, 0, 0));

                    // This shouldn't happen but catch if otherwise: Max out at 30 days. The alternative is to add a datepicker but they often are not friendly on mobile.
                    if (i == 30) {
                        break;
                    }
                }

                // Set the default shipping date, which is today
                scope.shipItems.date_shipped = new Date().setHours(0, 0, 0, 0);

                // Set the default courier
                scope.shipItems.courier = null;

                // Define the couriers
                scope.shipItems.couriers = CouriersService.getCouriers();

                var shipItemsModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/ship_items.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                shipItemsModal.result.then(function (result) {
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.shipItems.ok = function (form) {

                    // Clear any previous errors
                    scope.modalError = null;

                    if (form.$invalid) {
                        return;
                    }

                    scope.shipItems.disabled = false;

                    // Create the shipment object
                    var shipment = {};

                    // Set the courier and tracking info
                    shipment.tracking_number = scope.shipItems.tracking_number;
                    shipment.tracking_url = scope.shipItems.tracking_url;

                    // We're going to assume the date the user entered is the date in their own timezone. As such, add the user's offset to the date shipped.
                    shipment.date_shipped = new Date(scope.shipItems.date_shipped + (new Date(scope.shipItems.date_shipped).getTimezoneOffset() * 60)).toISOString();

                    if (utils.isNullOrEmpty(scope.shipItems.courier) == false) {
                        shipment.courier = scope.shipItems.courier;
                    }

                    shipment.items = [];

                    // Load in the items
                    var totalItemsShipped = 0;
                    _.each(scope.shipItems.shipments, function (item, index) {
                        if (item.quantity && item.quantity != 0) {
                            shipment.items.push(item);
                            totalItemsShipped++;
                        }
                    });

                    // Send
                    ApiService.set(shipment, ApiService.buildUrl("/orders/" + scope.order.order_id + "/shipments")).then(
                    function (response) {
                        GrowlsService.addGrowl({ id: "shipment_success", count: totalItemsShipped });

                        // Push the response to the list of shipments
                        scope.order.shipments.data.push(response);

                        // If all items in the order are now fulfilled, mark the order as fulfilled
                        var unshipped = 0;
                        _.each(scope.order.items, function (item) {
                            // Don't count those that are marked as fulfilled, regardless of quantities or shipments
                            if (item.fulfilled == false) {
                                unshipped += scope.shipItems.getShippableQuantity(item);
                            }
                        });

                        if (unshipped == 0) {
                            scope.order.fulfilled = true;
                        }

                        shipItemsModal.close();

                    },
                    function (error) {
                        scope.modalError = error;
                    });

                }

                scope.shipItems.cancel = function () {
                    shipItemsModal.dismiss();
                }

            });
        }
    };
}]);


app.directive('cancelSubscription', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            subscription: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Hide by default
            elem.hide();

            // Watch to see if you should show or hide the button
            scope.$watch('subscription', function () {
                if (scope.subscription) {
                    if ((scope.subscription.status == "active" || scope.subscription.status == "trial") && scope.subscription.cancel_at_current_period_end == false) {
                        elem.show();
                    } else {
                        elem.hide();
                    }
                }
            }, true);

            elem.click(function () {

                // Set defaults
                scope.subscription_cancel = {};
                scope.subscription_cancel.request = {};
                scope.subscription_cancel.request.cancel_at_current_period_end = true;
                scope.subscription_cancel.request.cancellation_reason = null;
                scope.cancellation_reasons = [];

                // Get the subscription cancellation reasons
                ApiService.getItem(ApiService.buildUrl("/subscriptions/options"))
                .then(
                function (data) {
                    scope.cancellation_reasons = data.cancellation_reasons;
                },
                function (error) {
                    window.scrollTo(0, 0);
                    scope.modalError = error;
                });

                var subscriptionModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/cancel_subscription.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                subscriptionModal.result.then(function (result) {
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.subscription_cancel.ok = function (form) {

                    // Clear any previous errors
                    scope.modalError = null;

                    var confirm = { id: "cancel_subscription" };
                    confirm.onConfirm = function () {
                        execute();
                    }

                    ConfirmService.showConfirm(scope, confirm);

                };

                var execute = function () {

                    // If cancel at period end is false, set the status to cancelled.
                    var request = {};
                    if (scope.subscription_cancel.request.cancel_at_current_period_end == true) {
                        request.cancel_at_current_period_end = true;
                    } else {
                        request.status = "cancelled";
                    }

                    // Cancel the subscription
                    ApiService.set(request, scope.subscription.url, { expand: "subscription_plan,customer,product" })
                    .then(
                    function (subscription) {
                        scope.subscription = subscription;
                        subscriptionModal.dismiss();
                        GrowlsService.addGrowl({ id: "subscription_cancel_success", type: "success" });
                    },
                    function (error) {
                        window.scrollTo(0, 0);
                        scope.modalError = error;
                    });
                }

                scope.subscription_cancel.cancel = function () {
                    subscriptionModal.dismiss();
                };

            });
        }
    };
}]);


app.directive('objectList', ['ApiService', '$location', function (ApiService, $location) {
    return {
        restrict: 'A',
        templateUrl: function(elem, attrs) {
            return attrs.templateUrl
        },
        scope: {
            error: '=?',
            count: '=?',
            refreshOnChange: '=?',
            functions: '=?',
            refresh: '=?',
            meta: '=?',
            params: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Attributes to use this directive:
            // url: The API's url for the list (required).
            // pagination: (possible values: offset or cursor). Indicates if the endpoint returns offset or cursor pagination.
            // limit: The number of results per page (optional).
            // type: The type of object that the list contains. This is used to be able to supply specific limits on what is returned in the payload.
            // templateUrl: The url to the template that this list will be rendered into.
            // embedded: Indicates if the list is embedded into a page as a child section (i.e. order list embedded on the customer page). When embedded == false, userParams changes are handled via querystring parameter, which allows the URL to store list state.
            // search: true / false to determine if you display the search box. Defaults to true.
            // params: If you need to override the default params in your request

            // Shared scope:
            // error: The parent page error object, so errors within the directive can be passed up and displayed.
            // count: Shares the result count back to the parent. Only supplies a value for offset-based paginated lists that return an item count in the payload header.
            // refresh-on-change: If other items on the page do functions that may cause the list to change (such as a processing a refund or shipping an item), place the collection of those items here and when it changes, it will trigger a refresh in the list.
            // functions: If your list needs to call external functions, the functions can be passed in as properties of the functions object
            // meta: An object that can be used to pass external data into the list
            // refresh: A function that an external function can use to manually refresh the list

            // Establish your scope containers
            scope.list = {};
            scope.userParams = {};
            scope.settings = {};
            var default_sort = null;

            // Establish what you need in your response based on the object type. If not configured things will still work but your response payload will be much heavier than necessary.
            var baseParams = scope.params || {};

            if (!scope.params) {

                if (attrs.type == "order") {
                    baseParams.show = "date_created,order_id,fulfilled,total,payment_status,currency";
                    default_sort = "date_created";
                }
                if (attrs.type == "subscription") {
                    baseParams.show = "subscription_id,subscription_plan.name,subscription_plan.subscription_plan_id,reference_price,reference_currency,status,item.name,item.product.product_id,date_modified,in_grace_period;";
                    baseParams.expand = "subscription_plan";
                    default_sort = "date_modified";
                }
                if (attrs.type == "payment") {
                    baseParams.show = "payment_id,date_created,date_modified,status,success,total,currency";
                    default_sort = "date_created";
                }
                if (attrs.type == "refund") {
                    baseParams.show = "refund_id,date_created,date_modified,status,success,total,currency";
                    default_sort = "date_created";
                }
                if (attrs.type == "shipment") {
                    baseParams.show = "shipment_id,courier,tracking_url,tracking_number,date_shipped,items.name,items.quantity";
                    default_sort = "date_shipped";
                }
                if (attrs.type == "cart") {
                    baseParams.show = "cart_id,date_created,payment_status,total,date_modified,currency";
                    default_sort = "date_modified";
                }
                if (attrs.type == "invoice") {
                    baseParams.show = "invoice_id,date_created,date_due,payment_status,total,date_modified,currency";
                    default_sort = "date_modified";
                }
                if (attrs.type == "app") {
                    baseParams.show = "name,app_id,date_created,active,deleted,date_modified,images.link_square,installed,install_url,app_installation.launch_url,app_installation.app_installation_id";
                    baseParams.expand = "images,app_installation";
                    default_sort = "date_created";
                }
                if (attrs.type == "app_installation") {
                    baseParams.show = "name,app_installation_id,date_created,image_url,short_description,info_url,launch_url,settings_fields,style_fields,version,is_default_version,updated_version_available,install_url,platform_hosted";
                    baseParams.expand = "images";
                    default_sort = "name";
                    scope.userParams.desc = false;
                }
                if (attrs.type == "notification") {
                    baseParams.show = "notification_id,date_created,type,status";
                    baseParams.limit = 25;
                    default_sort = "date_created";
                }

            }

            // Convert string bools to actual bools
            utils.stringsToBool(attrs);

            // Set pagination variable
            scope.settings.page = attrs.page;

            // Seat search variable
            scope.settings.search = true;
            if (attrs.search == false) {
                scope.settings.search = false;
            }

            var parseSearch = function () {

                // Reset the userParams
                resetParams();

                // Load the querystring into your userParams
                scope.userParams = ($location.search())

                // Convert any string true/false to bool
                utils.stringsToBool(scope.userParams);

                // Set defaults for the remaining userParams
                setDefaultParams();
            }

            var getList = function (scrollTop) {

                // We keep show out of the userParams object to keep them out of the page's visible query string.
                var url = utils.appendParams(attrs.url, baseParams);

                ApiService.getList(url, scope.userParams).then(function (result) {
                    scope.list = result;
                    scope.count = result.total_items;

                    // If instructed, scroll to the top upon completion
                    if (scrollTop == true & attrs.embedded == false) {
                        window.scrollTo(0, 0);
                    }

                    // Set pagination
                    setPagination(scope.list);

                },
                function (error) {
                    scope.error = error;
                });
            }

            var refresh = function (scrollTop) {
                getList(scrollTop);
            }

            scope.refresh = function () {
                refresh();
            }

            var setPagination = function (list) {
                scope.userParams.before_item = list.previous_page_before_item;
                scope.userParams.after_item = list.previous_page_after_item;
                scope.previous_page_offset = list.previous_page_offset;
                scope.next_page_offset = list.next_page_offset;
            }

            var setDefaultParams = function () {
                // This sets the default values for certain parameters, if unpopulated

                if (scope.settings.page == "cursor") {
                    if (scope.userParams.date_type == null) {
                        scope.userParams.date_type = default_sort;
                    }
                } else {
                    if (scope.userParams.sort_by == null) {
                        scope.userParams.sort_by = default_sort;
                    }
                }

                if (scope.userParams.desc == null) {
                    scope.userParams.desc = true;
                }

                if (attrs.limit != null) {
                    scope.userParams.limit = attrs.limit;
                }
            }

            var resetParams = function () {
                scope.userParams = {};
            }

            var resetNavParams = function () {
                scope.userParams.before_item = null;
                scope.userParams.after_item = null;
                scope.previous_page_offset = null;
                scope.next_page_offset = null;
            }

            scope.movePage = function (direction, value) {

                if (scope.settings.page == 'cursor') {
                    if (direction == "+") {
                        scope.userParams.after_item = value;
                        scope.userParams.before_item = null;
                    } else {
                        scope.userParams.after_item = null;
                        scope.userParams.before_item = value;
                    }
                } else {
                    scope.userParams.offset = value;
                }

                // If embedded, don't mess with the parent's query string parameters.
                if (attrs.embedded == false) {
                    $location.search(scope.userParams);
                } else {
                    refresh(false);
                }
            }

            scope.setParam = function (param, value) {

                // Reset all userParams
                resetParams();

                // Set this param
                scope.userParams[param] = value;

                // Set defaults for unpopulated userParams
                setDefaultParams();

                // If embedded, don't mess with the parent's query string parameters.
                if (attrs.embedded == false) {
                    $location.search(scope.userParams);
                } else {
                    refresh(false);
                }

            }

            scope.search = function (q) {

                // Reset navigation userParams, preserve the others.
                resetNavParams();

                // Set this param
                scope.userParams.q = q;

                // Set defaults for unpopulated userParams
                setDefaultParams();

                // If embedded, don't mess with the parent's query string parameters.
                if (attrs.embedded == false) {
                    $location.search(scope.userParams);
                } else {
                    refresh(false);
                }

            }

            scope.sort = function (sort_by, desc) {

                if (scope.settings.page == "cursor") {
                    scope.userParams.date_type = sort_by;

                    // Since we are reversing the order, switch before_item to after_item or vice versa, depending on what's populated.
                    if (scope.userParams.before_item) {
                        scope.userParams.after_item = scope.userParams.before_item;
                        scope.userParams.before_item = null;
                    }

                    if (scope.userParams.after_item) {
                        scope.userParams.before_item = scope.userParams.after_item;
                        scope.userParams.after_item = null;
                    }
                } else {
                    scope.userParams.sort_by = sort_by;
                    scope.userParams.offset = null;
                }

                scope.userParams.desc = desc;

                // If embedded, don't mess with the parent's query string parameters.
                if (attrs.embedded == false) {
                    $location.search(scope.userParams);
                } else {
                    refresh();
                }
            }

            scope.getSortValue = function () {
                if (scope.settings.page == "cursor") {
                    return scope.userParams.date_type;
                } else {
                    return scope.userParams.sort_by;
                }
            }

            // Listen for route updates (which happen when the the querystring changes) and reload. We don't respond when embedded as those changes are not targeted to this list (but to the parent).
            if (attrs.embedded == false) {
                var routeUpdateListener = scope.$on('$routeUpdate', function (e) {
                    parseSearch();
                    getList(true);
                });
            }

            // Kill listeners when scope is destroyed.
            scope.$on("$destroy", function () {
                if (routeUpdateListener) {
                    routeUpdateListener();
                }
            });

            // Load the initial list
            parseSearch();
            setDefaultParams();
            getList(true);

            var lastLength = null;
            scope.$watchCollection('refreshOnChange', function () {

                // If an external source that is displaying this list triggers an action that will cause the values in the list to change (such as a refund processed or a shipment recorded),
                // this function will notice the change and will trigger a list refresh. 

                // We need to allow the collection to stabilize from initial load before we trigger a refresh. The initial changes will take the list from undefined to fully populated with the initial data
                // and we don't want to trigger a refresh on all these initialization mutations.

                if (scope.refreshOnChange != null) {
                    if (Array.isArray(scope.refreshOnChange) && lastLength == null) {
                        // This will only hit the first time the collection is fully loaded due to the conditions above.
                        lastLength = scope.refreshOnChange.length;
                    }
                }

                // This watches for the ongoing changes in the collection and triggers the refresh as needed.
                if (lastLength != null) {
                    if (Array.isArray(scope.refreshOnChange)) {
                        if (lastLength != scope.refreshOnChange.length) {
                            refresh();
                            lastLength = scope.refreshOnChange.length
                        }
                    }
                }

            });

        }
    };
}]);


app.directive('objectEdit', ['ApiService', 'GrowlsService', 'GeographiesService', function (ApiService, GrowlsService, GeographiesService) {
    return {
        restrict: 'E',
        templateUrl: function (elem, attrs) {
            return attrs.templateUrl
        },
        scope: {
            object: '=?',
            error: '=?',
            options: '=?',
            successCallback: '&'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // object: The item that contains the object you wish to update (i.e. customer)
            // error: The error object from the parent so that if there is an error response on save it can be displayed by the parent.
            // success-callback: A callback when an update is successfully completed. (optional)
            // options: An object with preferences you want to pass to the view. For example { compressedView: true }. (optional)

            // Attributes:
            // property: If the item that is being updated belongs to a parent object, this is the name of the property that holds the item (for example, if you are updating customer.billing_address, provided "billing_address" so the request payload can be properly built).
            // panel-title: The name you want to dispaly on the panel title bar (optional but not really)
            // require: optional, if you want to make items required. A csv list such as "name,country" (optional, default == require none)
            // hide: fields that you don't want to display. A csv such as "object2,email" (optional, default == show all)
            // allow-edit: A boolean to indicate if you want to allow the object to be edited. If false, the "Edit" button will not display in the panel. (optional, default == true)
            // template-url: The url to the template you want to use for this edit.
            // update-url: The url to make the update to this object

            // Create a container to hold the object you are updating
            scope.item = null;

            // Convert attribute strong bools to actual bools
            utils.stringsToBool(attrs);

            // Create a value to hold the item count of the number of items that are displayed, used by some views to know when to clear a row.
            scope.displayCount = 0;

            scope.edit = false;
            scope.allowEdit = true;
            if (attrs.allowEdit == false) {
                scope.allowEdit = false;
            }

            scope.panelTitle = attrs.panelTitle;

            var property = null;
            if (utils.isNullOrEmpty(attrs.property) == false) {
                property = attrs.property;
            }

            scope.$watch('object', function () {
                scope.item = scope.object;
            });

            var hide = [];
            if (attrs.hide != null) {
                hide = attrs.hide.split(',');
            };

            var require = [];
            if (attrs.require != null) {
                require = attrs.require.split(',');
            };

            var geo = GeographiesService.getGeographies();
            scope.countries = geo.countries;

            scope.showItem = function (item) {
                if (hide.indexOf(item) >= 0) {
                    return false;
                }
                return true;
            };

            scope.allowEmpty = function (item) {
                // You won't require an item, even if requested, if the item is hidden.
                if (require.indexOf(item) >= 0 && hide.indexOf(item) < 0) {
                    return false;
                }
                return true;
            };

            scope.openEdit = function () {
                // Make a copy of the item so on cancel you can revert to the original
                scope.orig = angular.copy(scope.item);
                scope.edit = true;
            }

            scope.closeEdit = function () {
                // Replace the model with the copy
                scope.item = scope.orig;
                scope.edit = false;
            }

            scope.update = function (form) {

                if (form.$invalid) {
                    return;
                }

                // Create a non-scoped variable to hold the object for your update call.
                var request = {};

                // If we are updating the child of the parent object, set the object as a child property.
                if (property) {
                    request[property] = scope.item;
                } else {
                    request = scope.item;
                }

                ApiService.set(request, attrs.updateUrl, { show: property })
                .then(
                function (response) {

                    // Update the scoped item with the new data.
                    if (property) {
                        scope.object[property] = response[property];
                    } else {
                        scope.object = response;
                    }

                    GrowlsService.addGrowl({ id: "edit_success_no_link", type: "success" });
                    scope.edit = false;
                    // Example of how to return a local value to the callback: scope.successCallback({ this: "that" });
                    scope.successCallback();
                },
                function (error) {
                    window.scrollTo(0, 0);
                    scope.error = error;
                });
            }

        }
    };
}]);


app.directive('ledgerBreakdown', [function () {
    return {
        restrict: 'E',
        templateUrl: "app/templates/ledgerBreakdown.html",
        scope: {
            currencyType: '=?',
            transactions: '=?',
            loadDetails: '=?',
            detailsUrl: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // currency-type: allows the selected currency to be propogates to other copies of the same ledger on the parent page (so that when you change the currency on one, they all change)
            // transactions: A list of payments or a list of refunds. You can also supply a single payment or single refund and it will be handled correctly. You can't mix and match payments and refunds.
            // load-details: A bool that indicates if the associated details are shown. If supplied (true or false), a link will be supplied that allows the user to toggle viewing the details. If null, no link will be displayed. Should not be used if details-url is provided.
            // details-url: A link that will direct the user to a page to see details of the transaction. If null, no link will be displayed. Should not be used if load-details is provided.

            // Attributes:
            // panel-title: The title of the panel
            // include-status: The transaction status or statuses you want included in the calculation. For example "completed" or "completed,pending" to include completed or completed and pending transactions, respectively.

            // Define a place to hold our transactions array. If an array is provided, we just copy it to this array. If a single transaction is provided, we push it into this array.
            scope.transactionItems = [];

            // Define an object to hold the selected display amounts
            scope.selected = {};

            scope.panelTitle = attrs.panelTitle;

            // Set defaults
            if (scope.currencyType == null) {
                scope.currencyType = "transaction";
            }

            scope.toggleLoadDetails = function () {
                scope.loadDetails = !scope.loadDetails;
            }

            scope.load = function (currency_type) {

                scope.transactionItems = [];

                if (Array.isArray(scope.transactions)) {
                    scope.transactionItems = scope.transactions;
                } else {
                    if (utils.hasProperty(scope.transactions, "object")) {
                        // Make sure that the object has been loaded
                        scope.transactionItems.push(scope.transactions);
                    }
                }

                scope.selected.subtotal = 0;
                scope.selected.shipping = 0;
                scope.selected.tax = 0;
                scope.selected.total = 0;

                scope.currencyType = currency_type;

                if (scope.transactionItems.length > 0) {

                    var prefix = currency_type + "_";
                    if (currency_type == "transaction") {
                        prefix = "";
                    }

                    if (scope.transactionItems[0].object == "refund") {
                        scope.isRefund = true;
                    }

                    scope.transaction_currency = scope.transactionItems[0].currency;
                    scope.settlement_currency = scope.transactionItems[0].settlement_currency;
                    scope.reporting_currency = scope.transactionItems[0].reporting_currency;
                    scope.reporting_alt_currency = scope.transactionItems[0].reporting_alt_currency;

                    scope.selected.currency = scope.transactionItems[0][prefix + "currency"];

                    _.each(scope.transactionItems, function (transaction) {
                        var include = true;

                        if (attrs.includeStatus != null) {
                            if (attrs.includeStatus.indexOf(transaction.status) == -1) {
                                include = false;
                            }
                        }

                        if (include) {
                            scope.selected.subtotal = scope.selected.subtotal + parseFloat(transaction[prefix + "subtotal"]);
                            scope.selected.shipping = scope.selected.shipping + parseFloat(transaction[prefix + "shipping"]);
                            scope.selected.tax = scope.selected.tax + parseFloat(transaction[prefix + "tax"]);
                            scope.selected.total = scope.selected.total + parseFloat(transaction[prefix + "total"]);
                        }
                    });

                    if (scope.transactionItems[0].object == "refund") {
                        scope.selected.subtotal = scope.selected.subtotal * -1;
                        scope.selected.shipping = scope.selected.shipping * -1;
                        scope.selected.tax = scope.selected.tax * -1;
                        scope.selected.total = scope.selected.total * -1;
                    }
                }

            }

            scope.showCurrencies = function () {
                if (scope.transactionItems.length > 0) {
                    if (scope.transactionItems[0].reporting_alt_currency) {
                        return !(utils.areEqual(scope.transactionItems[0].currency, scope.transactionItems[0].settlement_currency, scope.transactionItems[0].reporting_currency, scope.transactionItems[0].reporting_alt_currency));
                    } else {
                        return !(utils.areEqual(scope.transactionItems[0].currency, scope.transactionItems[0].settlement_currency, scope.transactionItems[0].reporting_currency));
                    }
                }
                return false;
            }

            // Watch for data load
            scope.$watchCollection('transactions', function () {
                scope.load(scope.currencyType);
            });

            scope.$watch('currencyType', function () {
                scope.load(scope.currencyType);
            });

        }
    };
}]);


app.directive('ledgerItems', [function () {
    return {
        restrict: 'E',
        templateUrl: "app/templates/ledgerItems.html",
        scope: {
            items: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // items: The items to list.

            // Attributes:
            // panel-title: The title of the panel
            // no-items-message: The message to display if there are no items.
            // description-property: The name of the property that holds the description of the item

            scope.panelTitle = attrs.panelTitle;
            scope.total = 0;
            scope.noItemsMessage = attrs.noItemsMessage;

            scope.$watchCollection('items', function () {
                if (scope.items) {
                    if (scope.items.length > 0) {
                        scope.currency = scope.items[0].currency

                        for (i = 0; i < scope.items.length; i++) {
                            scope.items[i].description = scope.items[i][attrs.descriptionProperty];
                            scope.total += scope.items[i].total;
                        }
                    }
                }
            });

        }
    };
}]);


app.directive('paymentMethod', [function () {
    return {
        restrict: 'E',
        templateUrl: "app/templates/paymentMethod.html",
        scope: {
            paymentMethodData: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // transaction-method-data: The transaction method data object

            // Attributes:
            // transaction-id: The transaction_id (either payment_id or refund_id) that this transaction is associated with. (optional, if not supplied the field will be hidden)

            scope.panelTitle = attrs.panelTitle;
            scope.transaction_type = attrs.transactionType;

            scope.$watch('paymentMethodData', function () {
                if (scope.paymentMethodData) {
                    scope.transaction_id = attrs.transactionId;
                }
            });

            scope.showItem = function (item) {
                if (hide.indexOf(item) >= 0) {
                    return false;
                }
                return true;
            };

        }
    };
}]);


app.directive('ledgerSale', [function () {
    return {
        restrict: 'E',
        templateUrl: "app/templates/sale.html",
        scope: {
            sale: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // sale: A cart, order or invoice object

            // Set defaults
            scope.prefs = {};
            scope.prefs.currency = "transaction";

        }
    };
}]);


app.directive('fileSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            file: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.fileSelect = { file: {} };
                scope.fileSelect.params = {};
                scope.fileSelect.params.show = "file_id,name,filename,version,bytes,description,date_created,date_modified";
                scope.fileSelect.params.limit = 5;
                scope.fileSelect.params.sort_by = "name";
                scope.fileSelect.params.desc = false;
                scope.options = { by_url: false };

                var loadFiles = function (url) {
                    ApiService.getList(url, scope.fileSelect.params).then(function (fileList) {
                        scope.fileList = fileList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                scope.uploadByUrl = function () {

                    // Make a copy so you can modify what you send without changing the model in the UI
                    var file = angular.copy(scope.fileSelect.file);
                    file.url = scope.options.url;
                    file.http_authorization_username = scope.options.http_authorization_username;
                    file.http_authorization_password = scope.options.http_authorization_password;

                    ApiService.multipartForm(file, null, ApiService.buildUrl("/files")).then(function (newFile) {
                        fileSelectModal.close(newFile);
                    }, function (error) {
                        scope.modalError = error;
                    });

                };

                var uploadSending = false;
                var uploadSendingListener = scope.$on('uploadSending', function (event, sending) {
                    uploadSending = sending;
                });

                var uploadResponseListener = scope.$on('uploadComplete', function (event, uploadResponse) {
                    fileSelectModal.close(uploadResponse);
                });

                // Allow easy cleanup of listeners when modal is closed / dismissed.
                var cancelListeners = function () {
                    uploadResponseListener();
                    uploadSendingListener();
                }

                // Load the initial list of files
                loadFiles(ApiService.buildUrl("/files"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new file" option.
                if (utils.hasPermission("files", "create")) {
                    scope.fileSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.fileSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var fileSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/file_select.html",
                    scope: scope,
                    backdrop: "static"
                });


                // Handle when the modal is closed or dismissed
                fileSelectModal.result.then(function (file) {
                    cancelListeners();
                    scope.file = file;
                    scope.modalError = null;
                }, function () {
                    cancelListeners();
                    scope.modalError = null;
                });

                scope.fileSelect.ok = function (result) {
                    fileSelectModal.close(result);
                };

                scope.fileSelect.cancel = function () {
                    if (uploadSending) {
                        var confirm = { id: "upload_cancel" };
                        confirm.onConfirm = function () {
                            // Let the upload directive know the user cancelled the upload so it can stop sending data.
                            scope.$broadcast("uploadCanceled");
                            fileSelectModal.dismiss();
                        }
                        ConfirmService.showConfirm(scope, confirm);
                    } else {
                        fileSelectModal.dismiss();
                    }
                };

                scope.fileSelect.search = function () {
                    scope.fileSelect.params.q = scope.fileSelect.q;
                    loadFiles(ApiService.buildUrl("/files"));
                };

                scope.fileSelect.sort = function (sort_by, desc) {
                    scope.fileSelect.params.sort_by = sort_by;
                    scope.fileSelect.params.desc = desc;
                    loadFiles(ApiService.buildUrl("/files"));
                }

                scope.fileSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadFiles(scope.fileList.next_page_url);
                    } else {
                        loadFiles(scope.fileList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('subscriptionPlanSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', '$rootScope', function (ApiService, ConfirmService, GrowlsService, $uibModal, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            subscriptionPlan: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.subscriptionPlanSelect = {};
                scope.subscriptionPlanSelect.params = {};
                scope.subscriptionPlanSelect.params.show = "subscription_plan_id,name,billing_interval,billing_interval_unit,trial_interval,trial_interval_unit,description,date_created,end_at_billing_count,date_modified";
                scope.subscriptionPlanSelect.params.limit = 5;
                scope.subscriptionPlanSelect.params.sort_by = "name";
                scope.subscriptionPlanSelect.params.desc = false;
                scope.subscriptionPlanSelect.order_confirmation_on_renewal = true;
                scope.subscriptionPlanSelect.fulfill_on_renewal = true;
                scope.subscription_plan = {};
                scope.subscription_plan.fulfill_on_renewal = false;
                scope.subscription_plan.order_confirmation_on_renewal = true;
                scope.settings = $rootScope.settings;

                var loadSubscriptionPlans = function (url) {
                    ApiService.getList(url, scope.subscriptionPlanSelect.params).then(function (subscriptionPlanList) {
                        scope.subscriptionPlanList = subscriptionPlanList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the initial list of subscriptionPlans
                loadSubscriptionPlans(ApiService.buildUrl("/subscription_plans"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new subscriptionPlan" option.
                if (utils.hasPermission("subscription_plans", "create")) {
                    scope.subscriptionPlanSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.subscriptionPlanSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var subscriptionPlanSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/subscription_plan_select.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                subscriptionPlanSelectModal.result.then(function (subscription_plan) {
                    scope.subscriptionPlan = subscription_plan;
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.subscriptionPlanSelect.ok = function (result) {
                    subscriptionPlanSelectModal.close(result);
                };

                scope.subscriptionPlanSelect.cancel = function () {
                    subscriptionPlanSelectModal.dismiss();
                };

                scope.subscriptionPlanSelect.search = function () {
                    scope.subscriptionPlanSelect.params.q = scope.subscriptionPlanSelect.q;
                    loadSubscriptionPlans(ApiService.buildUrl("/subscription_plans"));
                };

                scope.subscriptionPlanSelect.sort = function (sort_by, desc) {
                    scope.subscriptionPlanSelect.params.sort_by = sort_by;
                    scope.subscriptionPlanSelect.params.desc = desc;
                    loadSubscriptionPlans(ApiService.buildUrl("/subscription_plans"));
                }

                scope.subscriptionPlanSelect.setParam = function (param, value) {
                    scope.subscriptionPlanSelect.params[param] = value;
                    loadSubscriptionPlans(ApiService.buildUrl("/subscription_plans"));
                }

                scope.subscriptionPlanSelect.create = function (form) {

                    if (form.$invalid) {
                        return;
                    }

                    ApiService.set(scope.subscription_plan, ApiService.buildUrl("/subscription_plans"))
                        .then(
                        function (subscription_plan) {
                            subscriptionPlanSelectModal.close(subscription_plan);
                        },
                        function (error) {
                            scope.modalError = error;
                        });
                }

                scope.subscriptionPlanSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadSubscriptionPlans(scope.subscriptionPlanList.next_page_url);
                    } else {
                        loadSubscriptionPlans(scope.subscriptionPlanList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('templateSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', '$rootScope', function (ApiService, ConfirmService, GrowlsService, $uibModal, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            template: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.templateSelect = {};
                scope.templateSelect.params = {};
                scope.templateSelect.params.show = "template_id,comments,date_created,date_modified";
                scope.templateSelect.params.limit = 5;
                scope.templateSelect.params.sort_by = "name";
                scope.templateSelect.params.desc = false;
                scope.template = {};
                scope.settings = $rootScope.settings;

                var loadtemplates = function (url) {
                    ApiService.getList(url, scope.templateSelect.params).then(function (templateList) {
                        scope.templateList = templateList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the initial list of templates
                loadtemplates(ApiService.buildUrl("/templates"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new template" option.
                if (utils.hasPermission("templates", "create")) {
                    scope.templateSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.templateSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var templateSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/template_select.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                templateSelectModal.result.then(function (template) {
                    scope.template = template;
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.templateSelect.ok = function (result) {
                    templateSelectModal.close(result);
                };

                scope.templateSelect.cancel = function () {
                    templateSelectModal.dismiss();
                };

                scope.templateSelect.search = function () {
                    scope.templateSelect.params.q = scope.templateSelect.q;
                    loadtemplates(ApiService.buildUrl("/templates"));
                };

                scope.templateSelect.sort = function (sort_by, desc) {
                    scope.templateSelect.params.sort_by = sort_by;
                    scope.templateSelect.params.desc = desc;
                    loadtemplates(ApiService.buildUrl("/templates"));
                }

                scope.templateSelect.setParam = function (param, value) {
                    scope.templateSelect.params[param] = value;
                    loadtemplates(ApiService.buildUrl("/templates"));
                }

                scope.templateSelect.create = function (form) {

                    if (form.$invalid) {
                        return;
                    }

                    ApiService.set(scope.template, ApiService.buildUrl("/templates"))
                        .then(
                        function (template) {
                            templateSelectModal.close(template);
                        },
                        function (error) {
                            scope.modalError = error;
                        });
                }

                scope.templateSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadtemplates(scope.templateList.next_page_url);
                    } else {
                        loadtemplates(scope.templateList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('imagesSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            images: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.imagesSelect = {};

                // Specify the max number of images that can be selected / uploaded. 15 if not supplied.
                scope.imagesSelect.limit = attrs.limit || 15;

                scope.imagesSelect.params = {};
                scope.imagesSelect.params.show = "image_id,filename,reference,link_large,link_medium,link_small,link_square,link,date_created,date_modified";
                scope.imagesSelect.params.limit = 5; // The number of images to show per page.
                scope.imagesSelect.params.sort_by = "filename";
                scope.imagesSelect.params.desc = false;

                var loadImages = function (url) {
                    ApiService.getList(url, scope.imagesSelect.params).then(function (imageList) {
                        scope.imageList = imageList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                var uploadSending = false;
                var uploadSendingListener = scope.$on('uploadSending', function (event, sending) {
                    // Set uploadSending to the received value
                    uploadSending = sending;
                });

                var uploadResponseListener = scope.$on('uploadComplete', function (event, uploadResponse) {
                    scope.$apply(function () {
                        scope.imagesSelect.queueImage(uploadResponse);
                    });
                });

                var uploadDeleteListener = scope.$on('uploadDelete', function (event, uploadResponse, file) {

                    var confirm = { id: "delete" };
                    confirm.onConfirm = function () {

                        // Let the upload directive know the user deleted the file so it can remove the upload preview display
                        scope.$broadcast("uploadDeleted", file);
                        scope.imagesSelect.dequeueImage(uploadResponse);

                        // If the user has permission, we will also delete the file completely
                        if (utils.hasPermission("images", "delete")) {
                            ApiService.remove(uploadResponse.url, null, false);
                        }
                    }
                    ConfirmService.showConfirm(scope, confirm);

                });

                // Allow easy cleanup of listeners when modal is closed / dismissed.
                var cancelListeners = function () {
                    uploadResponseListener();
                    uploadSendingListener();
                    uploadDeleteListener();
                }

                // Load the initial list of images
                loadImages(ApiService.buildUrl("/images"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new image" option.
                if (utils.hasPermission("images", "create")) {
                    scope.imagesSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.imagesSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var imagesSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/image_select.html",
                    scope: scope,
                    backdrop: "static"
                });

                // Handle when the modal is closed or dismissed
                imagesSelectModal.result.then(function () {
                    cancelListeners();
                    scope.images = scope.imagesSelect.queue;
                    scope.modalError = null;
                }, function () {
                    cancelListeners();
                    scope.modalError = null;
                });

                // Put a place to queue images that are being selected
                scope.imagesSelect.queue = [];

                scope.imagesSelect.queueToggle = function (image) {
                    // If it's not in the queue, add. If it is, remove.
                    if (scope.imagesSelect.isQueued(image)) {
                        scope.imagesSelect.dequeueImage(image);
                    } else {
                        scope.imagesSelect.queueImage(image);
                    }
                }

                scope.imagesSelect.queueImage = function (image) {
                    if (scope.imagesSelect.queue.length >= scope.imagesSelect.limit) {
                        // Remove the last one from the list.
                        scope.imagesSelect.queue.shift();
                    }
                    scope.imagesSelect.queue.push(image);
                }

                scope.imagesSelect.dequeueImage = function (image) {
                    // If it's not in the queue, add. If it is, remove.
                    scope.imagesSelect.queue = _.reject(scope.imagesSelect.queue, { image_id: image.image_id });
                }

                scope.imagesSelect.isQueued = function (image) {
                    if (_.findWhere(scope.imagesSelect.queue, { image_id: image.image_id }) != null) {
                        return true;
                    }
                    return false;
                }

                // Load any current images into the queue so they show as already selected.
                _.each(scope.images, function (item) {
                    scope.imagesSelect.queueImage(item);
                });

                scope.imagesSelect.ok = function (result) {
                    imagesSelectModal.close(result);
                };

                scope.imagesSelect.cancel = function () {
                    if (uploadSending) {
                        var confirm = { id: "upload_cancel" };
                        confirm.onConfirm = function () {
                            // Let the upload directive know the user cancelled the upload so it can stop sending data.
                            scope.$broadcast("uploadCanceled");
                            imagesSelectModal.dismiss();
                        }
                        ConfirmService.showConfirm(scope, confirm);
                    } else {
                        imagesSelectModal.dismiss();
                    }
                };

                scope.imagesSelect.search = function () {
                    scope.imagesSelect.params.q = scope.imagesSelect.q;
                    loadImages(ApiService.buildUrl("/images"));
                };

                scope.imagesSelect.sort = function (sort_by, desc) {
                    scope.imagesSelect.params.sort_by = sort_by;
                    scope.imagesSelect.params.desc = desc;
                    loadImages(ApiService.buildUrl("/images"));
                }

                scope.imagesSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadImages(scope.imageList.next_page_url);
                    } else {
                        loadImages(scope.imageList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('productsSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            products: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.productsSelect = {};

                // Specify the max number of products that can be selected / uploaded. 15 if not supplied.
                scope.productsSelect.limit = attrs.limit || 15;

                scope.productsSelect.params = {};
                scope.productsSelect.params.show = "product_id,name,date_created,date_modified,price,currency";
                scope.productsSelect.params.limit = 10; // The number of products to show per page.
                scope.productsSelect.params.sort_by = "name";
                scope.productsSelect.params.desc = false;

                var loadProducts = function (url) {
                    ApiService.getList(url, scope.productsSelect.params).then(function (productList) {
                        scope.productList = productList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the initial list of products
                loadProducts(ApiService.buildUrl("/products"));

                var productsSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/product_select.html",
                    scope: scope 
                });

                // Handle when the modal is closed or dismissed
                productsSelectModal.result.then(function () {

                    scope.products = scope.productsSelect.queue;
                    scope.modalError = null;
                }, function () {

                    scope.modalError = null;
                });

                // Put a place to queue products that are being selected
                scope.productsSelect.queue = [];

                scope.productsSelect.queueToggle = function (product) {
                    // If it's not in the queue, add. If it is, remove.
                    if (scope.productsSelect.isQueued(product)) {
                        scope.productsSelect.dequeueProduct(product);
                    } else {
                        scope.productsSelect.queueProduct(product);
                    }
                }

                scope.productsSelect.queueProduct = function (product) {
                    if (scope.productsSelect.queue.length >= scope.productsSelect.limit) {
                        // Remove the last one from the list.
                        scope.productsSelect.queue.shift();
                    }
                    scope.productsSelect.queue.push(product);
                }

                scope.productsSelect.dequeueProduct = function (product) {
                    // If it's not in the queue, add. If it is, remove.
                    scope.productsSelect.queue = _.reject(scope.productsSelect.queue, { product_id: product.product_id });
                }

                scope.productsSelect.isQueued = function (product) {
                    if (_.findWhere(scope.productsSelect.queue, { product_id: product.product_id }) != null) {
                        return true;
                    }
                    return false;
                }

                // Load any current products into the queue so they show as already selected.
                _.each(scope.products, function (item) {
                    scope.productsSelect.queueProduct(item);
                });

                scope.productsSelect.ok = function (result) {
                    productsSelectModal.close(result);
                };

                scope.productsSelect.cancel = function () {

                    productsSelectModal.dismiss();

                };

                scope.productsSelect.search = function () {
                    scope.productsSelect.params.q = scope.productsSelect.q;
                    loadProducts(ApiService.buildUrl("/products"));
                };

                scope.productsSelect.sort = function (sort_by, desc) {
                    scope.productsSelect.params.sort_by = sort_by;
                    scope.productsSelect.params.desc = desc;
                    loadProducts(ApiService.buildUrl("/products"));
                }

                scope.productsSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadProducts(scope.productList.next_page_url);
                    } else {
                        loadProducts(scope.productList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('licenseServiceSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            licenseService: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.licenseServiceSelect = {};
                scope.licenseServiceSelect.params = {};
                scope.licenseServiceSelect.params.show = "license_service_id,name,type,configuration.license_count,configuration.notify_at_count,configuration.url,date_created,date_modified";
                scope.licenseServiceSelect.params.limit = 5;
                scope.licenseServiceSelect.params.sort_by = "name";
                scope.licenseServiceSelect.params.desc = false;

                // Set defaults
                scope.licenseServiceSelect.type = "list";
                scope.licenses = {};

                scope.license_service = {};
                scope.license_service.type = "list";
                scope.license_service.configuration = {};
                scope.license_service.configuration.format = "json";
                scope.license_service.configuration.per_quantity = false;
                scope.license_service.configuration.remove_after_use = true;
                scope.license_service.configuration.notify_at_count = 100;

                var loadLicenseServices = function (url) {
                    ApiService.getList(url, scope.licenseServiceSelect.params).then(function (licenseServiceList) {
                        scope.licenseServiceList = licenseServiceList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the initial list of licenseServices
                loadLicenseServices(ApiService.buildUrl("/license_services"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new License Service" option.
                if (utils.hasPermission("license_services", "create")) {
                    scope.licenseServiceSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.licenseServiceSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var licenseServiceSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/license_service_select.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                licenseServiceSelectModal.result.then(function (license_service) {
                    scope.licenseService = license_service;
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                scope.licenseServiceSelect.ok = function (result) {
                    licenseServiceSelectModal.close(result);
                };

                scope.licenseServiceSelect.cancel = function () {
                    licenseServiceSelectModal.dismiss();
                };

                scope.licenseServiceSelect.search = function () {
                    scope.licenseServiceSelect.params.q = scope.licenseServiceSelect.q;
                    loadLicenseServices(ApiService.buildUrl("/license_services"));
                };

                scope.licenseServiceSelect.sort = function (sort_by, desc) {
                    scope.licenseServiceSelect.params.sort_by = sort_by;
                    scope.licenseServiceSelect.params.desc = desc;
                    loadLicenseServices(ApiService.buildUrl("/license_services"));
                }

                scope.licenseServiceSelect.setParam = function (param, value) {
                    scope.licenseServiceSelect.params[param] = value;
                    loadLicenseServices(ApiService.buildUrl("/license_services"));
                }

                scope.licenseServiceSelect.create = function (form) {

                    if (form.$invalid) {
                        return;
                    }

                    if (scope.licenses.list != null && scope.licenseServiceSelect.type == "list") {
                        scope.license_service.configuration.licenses = utils.stringToArray(scope.licenses.list);
                    }

                    ApiService.set(scope.license_service, ApiService.buildUrl("/license_services"))
                        .then(
                        function (licenseService) {
                            licenseServiceSelectModal.close(licenseService);
                        },
                        function (error) {
                            scope.modalError = error;
                        });
                }

                scope.licenseServiceSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadLicenseServices(scope.licenseServiceList.next_page_url);
                    } else {
                        loadLicenseServices(scope.licenseServiceList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('imageGroup', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'E',
        templateUrl: "app/templates/image_group.html",
        scope: {
            images: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            scope.showMoreSizesList = [];
            scope.limit = attrs.limit || 15;

            scope.toggleMoreSizes = function (image_id) {

                if (scope.showMoreSizesList.indexOf(image_id) == -1) {
                    scope.showMoreSizesList.push(image_id);
                } else {
                    scope.showMoreSizesList = _.without(scope.showMoreSizesList, image_id);
                }
            };

            scope.showMoreSizes = function (image_id) {
                if (scope.showMoreSizesList.indexOf(image_id) >= 0) {
                    return true;
                }
                return false;
            };

            scope.removeAll = function () {
                scope.images = null;
            }

        }
    };
}]);


app.directive('productGroup', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'E',
        templateUrl: "app/templates/product_group.html",
        scope: {
            products: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {


            scope.limit = attrs.limit || 15;

            scope.removeAll = function () {
                scope.products = null;
            }

        }
    };
}]);


app.directive('fields', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {

    // AN IMPORTANT NOTE ABOUT FIELD NAMES
    // We append -search as a suffix of all custom field names in the HTML. The reason for this is to prevent password form fillers from automatically supplying values into these fields.
    // They have been known to fully replace values of fields with stored usernames and passwords when the custom field names are things like "username" or "password".
    // Since we don't control the name of the fields, appending -search freaks password fillers out a bit and tells them to back off. Unfortunatley standard approaches such as autofill="off" are largely ignored.

    return {
        restrict: 'AE',
        templateUrl: "app/templates/fields.html",
        scope: {
            fieldlist: '=?',
            selections: '=?',
            error: '='
        },
        link: function (scope, elem, attrs, ctrl) {

            // Shared scope:
            // fieldlist: The list of field configurations
            // selections: The user selections

            // A place to hold any images
            scope.data = { images: {} };
            scope.data.imagePreviews = [];

            // Loop through the selections and set any null values to the default value (if provided)
            scope.$watch('fieldlist', function (newVal, oldValue) {

                if (newVal !== oldValue) {
                    for (var property in scope.fieldlist) {
                        if (scope.fieldlist.hasOwnProperty(property)) {
                            if (scope.selections[scope.fieldlist[property].name] == null) {
                                scope.selections[scope.fieldlist[property].name] = scope.fieldlist[property].default_value;
                            }
                        }

                        // If an image, get the image
                        if (scope.fieldlist[property].type == "image") {
                            // Put a placeholder to pull an image preview
                            if (scope.selections[scope.fieldlist[property].name] != null) {
                                scope.data.imagePreviews.push({ property: scope.fieldlist[property].name, url: ApiService.buildUrl("/images/" + scope.selections[scope.fieldlist[property].name]) });
                            }
                        }
                    }

                    // Load the images
                    if (utils.hasPermission("images", "read")) {
                        _.each(scope.data.imagePreviews, function (imagePreview) {
                            ApiService.getItem(imagePreview.url).then(function (image) {
                                (scope.data.images[imagePreview.property] = []).push(image);
                            }, function (error) {
                                if (scope.error) {
                                    scope.error = error;
                                    window.scrollTo(0, 0);
                                }
                            });
                        });
                    }
                }


            }, true);

            // Watch image loads and set property values accordingly
            scope.$watch("data.images", function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    for (var property in newValue) {
                        if (newValue.hasOwnProperty(property)) {
                            if (newValue[property] != null) {
                                scope.selections[property] = newValue[property][0].image_id;
                            } else {
                                scope.selections[property] = null;
                            }
                        }
                    }
                }
            }, true);

            scope.pushToProperty = function (property, value) {

                property = stripSearch(property);

                // If it doesn't exist, add it. If it exists, remove it.
                if (scope.isInProperty(property, value) == false) {
                    if (scope.selections[property] == null) {
                        scope.selections[property] = [];
                        scope.selections[property].push(value);
                    } else {
                        scope.selections[property].push(value);
                    }
                } else {
                    scope.selections[property] = _.without(scope.selections[property], value);
                }
            }

            scope.isInProperty = function (property, value) {

                property = stripSearch(property);

                if (scope.selections == null) {
                    return false;
                }

                if (scope.selections[property] != null) {
                    if (_.indexOf(scope.selections[property], value) >= 0) {
                        return true;
                    }
                }

                return false;

            }

            scope.isNewSection = function (field, index) {

                // The fields come from the api grouped in sections which makes it easy to determine when sections have changed.

                // The first item is always "new"
                if (index == 0) {
                    return true;
                }

                // Otherwise, select the item immediately before this item and see if it's different
                var previous = scope.fieldlist[index - 1];
                if (previous != null) {
                    if (previous.section != field.section) {
                        return true;
                    }
                }

                return false;

            }

            // Read note at the top of this directive about the purpose of strip search.
            var stripSearch = function (property) {
                // Remove -search from the property name
                if (property != null) {
                    if (utils.right(property, 7) == "-search") {
                        property = utils.left(property, property.length - 7);
                    }
                }
            }

        }
    }

}]);


app.directive('appPackageSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            appPackage: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.appPackageSelect = {};
                scope.appPackageSelect.params = {};
                scope.appPackageSelect.params.show = "app_package_id,name,filename,version,bytes,description,date_created,date_modified";
                scope.appPackageSelect.params.limit = 5;
                scope.appPackageSelect.params.sort_by = "name";
                scope.appPackageSelect.params.desc = false;

                var loadFiles = function (url) {
                    ApiService.getList(url, scope.appPackageSelect.params).then(function (appPackageList) {
                        scope.appPackageList = appPackageList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                var uploadSending = false;
                var uploadSendingListener = scope.$on('uploadSending', function (event, sending) {
                    uploadSending = sending;
                });

                var uploadResponseListener = scope.$on('uploadComplete', function (event, uploadResponse) {
                    appPackageSelectModal.close(uploadResponse);
                });

                // Allow easy cleanup of listeners when modal is closed / dismissed.
                var cancelListeners = function () {
                    uploadResponseListener();
                    uploadSendingListener();
                }

                // Load the initial list of appPackage
                loadFiles(ApiService.buildUrl("/app_packages"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new appPackage" option.
                if (utils.hasPermission("app_packages", "create")) {
                    scope.appPackageSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.appPackageSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var appPackageSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/app_package_select.html",
                    scope: scope,
                    backdrop: "static"
                });


                // Handle when the modal is closed or dismissed
                appPackageSelectModal.result.then(function (appPackage) {
                    cancelListeners();
                    scope.appPackage = appPackage;
                    scope.modalError = null;
                }, function () {
                    cancelListeners();
                    scope.modalError = null;
                });

                scope.appPackageSelect.ok = function (result) {
                    appPackageSelectModal.close(result);
                };

                scope.appPackageSelect.cancel = function () {
                    if (uploadSending) {
                        var confirm = { id: "upload_cancel" };
                        confirm.onConfirm = function () {
                            // Let the upload directive know the user cancelled the upload so it can stop sending data.
                            scope.$broadcast("uploadCanceled");
                            appPackageSelectModal.dismiss();
                        }
                        ConfirmService.showConfirm(scope, confirm);
                    } else {
                        appPackageSelectModal.dismiss();
                    }
                };

                scope.appPackageSelect.search = function () {
                    scope.appPackageSelect.params.q = scope.appPackageSelect.q;
                    loadFiles(ApiService.buildUrl("/app_packages"));
                };

                scope.appPackageSelect.sort = function (sort_by, desc) {
                    scope.appPackageSelect.params.sort_by = sort_by;
                    scope.appPackageSelect.params.desc = desc;
                    loadFiles(ApiService.buildUrl("/app_packages"));
                }

                scope.appPackageSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadFiles(scope.appPackageList.next_page_url);
                    } else {
                        loadFiles(scope.appPackageList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('transactionDebug', ['ApiService', '$uibModal', function (ApiService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            url: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            // Hide by default
            elem.hide();

            // Watch to see if you should show or hide the button
            scope.$watch('url', function () {
                if (scope.url) {
                    elem.show();
                }
            }, true);

            elem.click(function () {

                scope.transactionDebug = {};
                scope.transactionDebug.params = {};
                scope.transactionDebug.params.show = "date_created,action,response,response_content_type";
                scope.transactionDebug.params.limit = 5;
                scope.transactionDebug.params.sort_by = "date_created";
                scope.transactionDebug.params.desc = true;

                var loadDebug = function (url) {
                    ApiService.getList(url, scope.transactionDebug.params).then(function (debugList) {

                        // Prettify the content
                        _.each(debugList.data, function (item) {
                            if (item.response_content_type == "xml" || item.response_content_type == "html") {
                                item.response = vkbeautify.xml(item.response);
                            }
                            if (item.response_content_type == "json") {
                                item.response = vkbeautify.json(item.response);
                            }
                        });

                        scope.debugList = debugList;

                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the list of debug records
                loadDebug(scope.url);

                var transactionDebugModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/debug_transaction.html",
                    scope: scope
                });

                scope.transactionDebug.cancel = function () {
                    transactionDebugModal.dismiss();
                };

                scope.transactionDebug.movePage = function (direction) {
                    if (direction == "+") {
                        loadDebug(scope.debugList.next_page_url);
                    } else {
                        loadDebug(scope.debugList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('isProductIdAvailable', ['$http', '$q', 'ApiService', function ($http, $q, ApiService) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            // Find the input element, error block and label elements
            var inputEl = elem[0];
            var inputNgEl = angular.element(inputEl);
            var inputGroupNgEl = angular.element(inputEl.parentNode);
            var feedbackNgEl = angular.element(utils.getSiblingElements(inputEl, "SPAN")[0]);
            var errorElNg = angular.element(inputEl.parentNode.parentNode);

            // Get the name of the text box
            var inputName = inputNgEl.attr("name");

            // Apply and remove has-error and hidden on blur
            inputNgEl.bind("blur", function () {

                // Set the value
                var value = utils.emptyToNull(inputEl.value);

                // Clear previous errors
                inputGroupNgEl.removeClass("has-success");
                errorElNg.removeClass("has-error");
                feedbackNgEl.addClass("hidden");
                ctrl.$setValidity("unavailable", true);
                ctrl.$setValidity("invalid_characters", true);

                if (value) {
                    // Check for special characters http://stackoverflow.com/questions/8359566/regex-to-match-symbols
                    if (/[$/:-?{-~!"^`\[\] ]/.test(value)) {
                        scope.$apply(function () {
                            errorElNg.addClass("has-error");
                            ctrl.$setValidity("invalid_characters", false);
                        });
                    } else {
                        errorElNg.removeClass("has-error");
                        feedbackNgEl.removeClass("hidden");
                        inputGroupNgEl.addClass("has-success");
                        // Check if available
                        ApiService.getItem(ApiService.buildUrl("/products/" + value), { show: "product_id" }, false).then(function (data) {
                            // Success means 200 which means the product_id is in use
                            errorElNg.addClass("has-error");
                            feedbackNgEl.addClass("hidden");
                            ctrl.$setValidity("unavailable", false);
                        },
                        function (error) {
                            // An error (404) means available.
                            if (value) {
                                errorElNg.removeClass("has-error");
                                feedbackNgEl.removeClass("hidden");
                                inputGroupNgEl.addClass("has-success");
                            }
                        });
                    }
                }
            });
        }
    }
}]);


app.directive('showErrors', function () {
    return {
        restrict: 'A',
        require: '^form',
        link: function (scope, elem, attrs, ctrl) {

            // Find the input element, error block and label elements
            var inputEl = elem[0].querySelector("[name]");
            var errorEl = angular.element(elem[0].querySelector(".help-block"));
            var labelEl = angular.element(elem[0].getElementsByTagName("label"));

            // Convert to native angular elements
            var inputNgEl = angular.element(inputEl);
            var errorNgEl = angular.element(errorEl);
            var labelNgEl = angular.element(labelEl);

            // Get the name of the text box
            var inputName = inputNgEl.attr("name");

            if (labelEl != null) {
                if (inputNgEl[0].attributes.required) {
                    labelNgEl.addClass("required");
                }
            }

            // Set a placeholder of "Optional" if the input is not required and no other placeholder is present
            if (!inputNgEl[0].attributes.required && !inputNgEl[0].attributes.conditional && !inputNgEl[0].attributes.placeholder) {
                inputEl.setAttribute('placeholder', "Optional");
            }

            // Define the action upon which we re-validate
            var action = "blur";

            if (inputEl) {
                if (inputEl.type == "checkbox" || inputEl.type == "select" || inputEl.type == "radio") {
                    action = "change";
                }
            }

            // Apply and remove has-error and hidden on blur
            inputNgEl.bind(action, function () {

                // Define how aggressive error messaging is on blur: mild, moderate, aggressive

                if (attrs.showErrors == "moderate" || utils.isNullOrEmpty(attrs.showErrors)) {
                    elem.toggleClass("has-error", ctrl[inputName].$invalid);
                }

                if (attrs.showErrors == "aggressive") {
                    elem.toggleClass("has-error", ctrl[inputName].$invalid);
                    errorNgEl.toggleClass("hidden", !ctrl[inputName].$invalid);
                }

                // We only show on form submit, so on blur we only hide
                if (ctrl[inputName].$invalid == false) {
                    errorNgEl.toggleClass("hidden", true);
                }

            })

            // Listen for the form submit and show any errors (plus error text)
            scope.$on("show-errors-check-validity", function (event, options) {

                // This helps prevent scope confusion in the case of a page that has multiple forms (such as a modal). Give each form a unique name and you won't trigger errors on sibling, parent or children forms.
                if (options.formName != ctrl.$name && options.isolateValidation == true) {
                    return;
                }

                if (ctrl[inputName]) {
                    elem.toggleClass("has-error", ctrl[inputName].$invalid);
                    errorNgEl.toggleClass("hidden", !ctrl[inputName].$invalid);
                }
            });

        }
    }
});


app.directive('validateOnSubmit', function () {
    return {
        restrict: 'A',
        require: '^form',
        link: function (scope, elem, attrs, ctrl) {

            elem.bind("click", function () {

                // Set the attribute isolate-validation on the form to restrict triggering validation on elements that share the same form name as the form that triggered the submit.
                // Useful when you have a form within a modal and you don't want to trigger validation on the page that spawned the form.
                var options = {};
                if (attrs.isolateValidation) {
                    options.isolateValidation = true;
                    options.formName = ctrl.$name;
                }

                // Emit and broadcast so the message goes up and down.
                scope.$emit('show-errors-check-validity', options);
                scope.$broadcast('show-errors-check-validity', options);
            });

        }
    }
});


app.directive('prices', ['gettextCatalog', function (gettextCatalog) {
    return {
        restrict: 'A',
        require: '^form',
        templateUrl: "app/templates/prices.html",
        scope: {
            prices: '=?',
            currencies: '=?',
        },
        link: function (scope, elem, attrs, ctrl) {

            scope.form = ctrl;
            scope.label = attrs.label || gettextCatalog.getString("Price");

            scope.showAddPrice = function () {
                scope.prices.push({ price: "", currency: "" });
            }

            scope.removePrice = function (prices, index) {
                scope.prices.splice(index, 1);
            }

        }
    };
}]);


app.directive('ranges', function () {
    return {
        restrict: 'A',
        require: '^form',
        templateUrl: "app/templates/ranges.html",
        scope: {
            ranges: '=?',
        },
        link: function (scope, elem, attrs, ctrl) {

            scope.form = ctrl;

            scope.showAddRange = function () {
                if (!scope.ranges) {
                    scope.ranges = [];
                }
                scope.ranges.push({ minimum: "", maximum: "", price: "" });
            }

            scope.removeRange = function (ranges, index) {
                scope.ranges.splice(index, 1);
            }

        }
    };
});


app.directive('metaToHtml', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs, ctrl) {

            attrs.$observe("metaToHtml", function (newValue) {

                if (utils.isNullOrEmpty(newValue) == false) {
                    var html = utils.jsonToHtmlTable(newValue, true, attrs.panelTitle);
                    elem.html(html);
                }

            });

        }
    };
});


app.directive('address', ['GeographiesService', function (GeographiesService) {
    return {
        restrict: 'AE',
        templateUrl: "app/templates/address_display.html",
        scope: {
            address: '=?',
            edit: '=?'
        },
        link: function (scope, elem, attrs) {

            var geo = GeographiesService.getGeographies();
            scope.countries = geo.countries;

        }
    };
}]);


app.directive('customerEdit', ['ApiService', function (ApiService) {
    return {
        restrict: 'AE',
        templateUrl: "app/templates/customer.html",
        scope: {
            customer: '=?customerEdit',
            cart: '=?',
            invoice: '=?',
            onSave: '=?',
            error: '=?',
        },
        link: function (scope, elem, attrs) {

            // Shared scope
            // customer: The customer object you wish to modify
            // cart: Optional. If the customer is associated with a cart, upon saving any changes to the customer the cart will be refreshed with the latest shipping / sales tax changes.
            // onSave: Optional. A function to call (with the saved customer as a parameter) when a save is completed.
            // invoice: Optional. If the customer is associated with an invoice, upon saving any changes to the customer the invoice will be refreshed with the latest shipping / sales tax changes.
            // error: The error object in the event of an error while saving

            // Attributes
            // commitOnSave: true / false. Indicates if the changes should be commited to the database when the save button is clicked. Default is true.

            var customerCopy = {};
            scope.edit = false;

            scope.$watch("edit", function (newVal) {
                // If edit is true, make a copy of the customer so you can roll back to it if they cancel the changes later.
                if (newVal) {
                    customerCopy = angular.copy(scope.customer);
                    scope.edit = true;
                } else {
                    customerCopy = {};
                    scope.edit = false;
                }
            });

            scope.cancel = function () {

                // Clear any previous errors
                scope.error = null;

                // Roll back to customerCopy
                scope.customer = customerCopy;
                scope.edit = false;

            }

            scope.save = function (form) {

                // Clear any previous errors
                scope.error = null;

                if (form.$invalid) {
                    return;
                }

                if (attrs.commitOnSave === undefined || attrs.commitOnSave == "true") {

                    // If the object has a URL, then this is an existing customer. Otherwise, it's a new customer.
                    var url = scope.customer.url || ApiService.buildUrl("/customers");
                    var obj = scope.customer;

                    // If an existing (saved) cart or invoice is provided, we'll apply the changes directly to the supplied cart or invoice customer object to make sure the cart or invoice reflect any shipping / tax changes as a result of the customer changes.
                    if (scope.cart && scope.cart.url) {
                        url = scope.cart.url;
                        obj = { customer: scope.customer };
                    }

                    if (scope.invoice && scope.invoice.url) {
                        url = scope.invoice.url;
                        obj = { customer: scope.customer };
                    }

                    ApiService.set(obj, url, { formatted: true, expand: "options" }).then(function (result) {

                        if (scope.cart && scope.cart.url) {
                            scope.cart = result;
                        } else if (scope.invoice && scope.invoice.url) {
                            scope.invoice = result;
                        } else {
                            scope.customer = result;
                        }

                        scope.edit = false;

                        if (scope.onSave) {
                            onSave(result);
                        }

                    }, function (error) {
                        scope.error = error;
                    });

                    // If onSave is supplied, fire
                    if (scope.onSave) {
                        scope.onSave(customer);
                    }

                    return;

                }

                // Just close the edit.
                scope.edit = false;

            }

        }
    };
}]);


app.directive('customerSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', '$rootScope', function (ApiService, ConfirmService, GrowlsService, $uibModal, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            customer: '=?',
            onSelect: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.customerSelect = {};
                scope.customerSelect.params = {};
                scope.customerSelect.params.hide = "payments,refunds,orders,subscriptions,invoices";
                scope.customerSelect.params.limit = 10;
                scope.customerSelect.params.date_type = "date_created";
                scope.customerSelect.params.desc = true;

                scope.newCustomer = { tax_exempt: false, billing_address: {}, shipping_address: {} };

                var loadCustomers = function (url) {
                    ApiService.getList(url, scope.customerSelect.params).then(function (customerList) {
                        scope.customerList = customerList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the initial list of customers
                loadCustomers(ApiService.buildUrl("/customers"));

                // Determine which tab is active. If no permissions to create, the modal will also hide the "new customer" option.
                if (utils.hasPermission("customers", "create")) {
                    scope.customerSelectTabs = [
                      { active: true },
                      { active: false }
                    ];
                } else {
                    scope.customerSelectTabs = [
                      { active: false },
                      { active: true }
                    ];
                }

                var customerSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/customer_select.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                customerSelectModal.result.then(function (customer) {

                    scope.customer = customer;
                    // Clear out any error messasges
                    scope.modalError = null;

                    // Call the onSelect function, if supplied
                    if (scope.onSelect) {
                        scope.onSelect(customer);
                    }

                }, function () {
                    scope.modalError = null;
                });

                scope.customerSelect.ok = function (result) {
                    customerSelectModal.close(result);
                };

                scope.customerSelect.cancel = function () {
                    customerSelectModal.dismiss();
                };

                scope.customerSelect.search = function () {
                    scope.customerSelect.params.q = scope.customerSelect.q;
                    loadCustomers(ApiService.buildUrl("/customers"));
                };

                scope.customerSelect.sort = function (date_type, desc) {
                    scope.customerSelect.params.date_type = date_type;
                    scope.customerSelect.params.desc = desc;
                    loadCustomers(ApiService.buildUrl("/customers"));
                }

                scope.customerSelect.setParam = function (param, value) {
                    scope.customerSelect.params[param] = value;
                    loadCustomers(ApiService.buildUrl("/customers"));
                }

                scope.customerSelect.create = function (form) {

                    if (form.$invalid) {
                        return;
                    }

                    ApiService.set(scope.newCustomer, ApiService.buildUrl("/customers"))
                        .then(
                        function (customer) {
                            customerSelectModal.close(customer);
                        },
                        function (error) {
                            scope.modalError = error;
                        });
                }

                scope.customerSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadCustomers(scope.customerList.next_page_url);
                    } else {
                        loadCustomers(scope.customerList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('invoiceItemSelect', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', '$rootScope', '$location', function (ApiService, ConfirmService, GrowlsService, $uibModal, $rootScope, $location) {
    return {
        restrict: 'A',
        scope: {
            invoice: '=?invoiceItemSelect',
            parameters: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.itemSelect = {};
                scope.itemSelect.params = {};
                scope.itemSelect.params.show = "name,product_id,price,currency,status,active,deleted,date_created,date_modified,type";
                scope.itemSelect.params.limit = 10;
                scope.itemSelect.params.sort_by = "name";
                scope.itemSelect.params.formatted = true;
                scope.itemSelect.params.currency = scope.invoice.currency;
                scope.itemSelect.params.desc = false;
                scope.currencies = JSON.parse(localStorage.getItem("payment_currencies"));

                scope.newItem = { reference_currency: scope.invoice.currency };

                if (scope.invoice) {
                    if (scope.invoice.items == null) {
                        scope.invoice.items = [];
                    }
                }

                var loadItems = function (url) {
                    ApiService.getList(url, scope.itemSelect.params).then(function (productList) {
                        scope.productList = productList;
                    }, function (error) {
                        scope.modalError = error;
                    });
                }

                // Load the initial list of products
                loadItems(ApiService.buildUrl("/products"));

                // Determine which tab is active.
                scope.itemSelectTabs = [
                    { active: true },
                    { active: false }
                ]

                var itemSelectModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/invoice_item_select.html",
                    scope: scope
                });

                // Handle when the modal is closed or dismissed
                itemSelectModal.result.then(function (item) {
                    scope.item = item;
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

                var add = false;

                var setInvoice = function () {

                    var url = scope.invoice.url || ApiService.buildUrl("/invoices");
                    if (scope.invoice.url == null) {
                        add = true;
                    }

                    return ApiService.set(scope.invoice, url, scope.parameters);
                }

                scope.itemSelect.ok = function (product) {

                    // If we already have the product in the list, just return
                    var existingItem = _.findWhere(scope.invoice.items, { product_id: product.product_id });
                    if (existingItem != null) {
                        itemSelectModal.close(existingItem);
                        return;
                    }

                    // Convert the product into an item
                    var item = {
                        product_id: product.product_id,
                        quantity: 1
                    }

                    scope.invoice.items.push(item);

                    setInvoice().then(function (invoice) {
                        scope.invoice = invoice;
                        itemSelectModal.close(item);

                        // If an add, redirect to the invoice edit page on exit
                        if (add) {
                            $location.path("/invoices/" + invoice.invoice_id)
                        }

                    }, function (error) {
                        // Remove the item we pushed
                        scope.invoice.items = _.filter(scope.invoice.items, function (item) { return item.product_id != product.product_id });
                        scope.modalError = error;
                    });

                };

                scope.itemSelect.cancel = function () {
                    itemSelectModal.dismiss();
                };

                scope.itemSelect.search = function () {
                    scope.itemSelect.params.q = scope.itemSelect.q;
                    loadItems(ApiService.buildUrl("/products"));
                };

                scope.itemSelect.sort = function (date_type, desc) {
                    scope.itemSelect.params.date_type = date_type;
                    scope.itemSelect.params.desc = desc;
                    loadItems(ApiService.buildUrl("/products"));
                }

                scope.itemSelect.setParam = function (param, value) {
                    scope.itemSelect.params[param] = value;
                    loadItems(ApiService.buildUrl("/products"));
                }

                scope.itemSelect.create = function (form) {

                    if (form.$invalid) {
                        return;
                    }

                    // If we already have the product in the list, error
                    var existingItem = _.findWhere(scope.invoice.items, { item_id: scope.newItem.item_id });
                    if (existingItem != null) {
                        scope.modalError = { message: "An item with the same ID already exists. You must choose a unique item ID." };
                        return;
                    }

                    scope.invoice.items.push(scope.newItem);

                    setInvoice().then(function (invoice) {
                        scope.invoice = invoice;
                        itemSelectModal.close(scope.newItem);

                        // If an add, redirect to the invoice edit page on exit
                        if (add) {
                            $location.path("/invoices/" + invoice.invoice_id)
                        }

                    }, function (error) {
                        // Remove the item we pushed
                        scope.invoice.items = _.filter(scope.invoice.items, function (item) { return item.item_id != scope.newItem.item_id });
                        scope.modalError = error;
                    });


                }

                scope.itemSelect.movePage = function (direction) {
                    if (direction == "+") {
                        loadItems(scope.productList.next_page_url);
                    } else {
                        loadItems(scope.productList.previous_page_url);
                    }
                }

            });
        }
    };
}]);


app.directive('download', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            download: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.downloadDetails = {};
                scope.downloadDetails.params = {};
                scope.data = {};

                // Datepicker options
                scope.data.expires = new Date(scope.download.expires);
                scope.datepicker = {};
                scope.datepicker.status = {};
                scope.datepicker.options = {
                    startingDay: 1,
                    showWeeks: false,
                    initDate: new Date(),
                    yearRange: 10
                };

                scope.datepicker.status.expires = {
                    opened: false
                };

                scope.datepicker.open = function ($event, which) {
                    scope.datepicker.status[which].opened = true;
                };

                var downloadDetailsModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/download.html",
                    scope: scope
                });

                scope.downloadDetails.close = function () {
                    downloadDetailsModal.close();
                }

                scope.downloadDetails.ok = function (form) {

                    // Clear any previous errors
                    scope.modalError = null;

                    if (form.$invalid) {
                        return;
                    }

                    scope.download.expires = scope.data.expires.toISOString();

                    // Save changes
                    ApiService.set(scope.download, ApiService.buildUrl("/downloads/" + scope.download.download_id), { expand: "file" }).then(function (download) {
                        GrowlsService.addGrowl({ id: "edit_success_no_link" });
                        scope.download = download;
                        downloadDetailsModal.close();
                    },
                    function (error) {
                        scope.modalError = error;
                    });

                };

                scope.downloadDetails.reset = function () {

                    // Clear any previous errors
                    scope.modalError = null;

                    // Reset
                    ApiService.set(null, ApiService.buildUrl("/downloads/" + scope.download.download_id + "/reset"), { expand: "file" }).then(function (download) {
                        GrowlsService.addGrowl({ id: "download_reset" });
                        scope.download = download;
                        downloadDetailsModal.close();
                    },
                    function (error) {
                        scope.modalError = error;
                    });

                };

                scope.downloadDetails.kill = function () {

                    // Clear any previous errors
                    scope.modalError = null;

                    // Reset
                    ApiService.set(null, ApiService.buildUrl("/downloads/" + scope.download.download_id + "/kill"), { expand: "file" }).then(function (download) {
                        GrowlsService.addGrowl({ id: "download_kill" });
                        scope.download = download;
                        downloadDetailsModal.close();
                    },
                    function (error) {
                        scope.modalError = error;
                    });

                };

                // Handle when the modal is closed or dismissed
                downloadDetailsModal.result.then(function (result) {
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

            });
        }
    };
}]);


app.directive('createDownload', ['ApiService', 'ConfirmService', 'GrowlsService', '$uibModal', function (ApiService, ConfirmService, GrowlsService, $uibModal) {
    return {
        restrict: 'A',
        scope: {
            file: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                // Create a download for the file
                ApiService.set({}, scope.file.url + "/downloads", { expand: "file", formatted: true }).then(function (download) {

                    scope.download = download;
                    scope.downloadDetails = {};
                    scope.downloadDetails.params = {};
                    scope.data = {};

                    // Datepicker options
                    scope.data.expires = new Date(scope.download.expires);
                    scope.datepicker = {};
                    scope.datepicker.status = {};
                    scope.datepicker.options = {
                        startingDay: 1,
                        showWeeks: false,
                        initDate: new Date(),
                        yearRange: 10
                    };

                    scope.datepicker.status.expires = {
                        opened: false
                    };

                    scope.datepicker.open = function ($event, which) {
                        scope.datepicker.status[which].opened = true;
                    };

                    var downloadDetailsModal = $uibModal.open({
                        size: "lg",
                        templateUrl: "app/modals/download.html",
                        scope: scope
                    });

                    scope.downloadDetails.close = function () {
                        downloadDetailsModal.close();
                    }

                    scope.downloadDetails.ok = function (form) {

                        // Clear any previous errors
                        scope.modalError = null;

                        if (form.$invalid) {
                            return;
                        }

                        scope.download.expires = scope.data.expires.toISOString();

                        // Save changes
                        ApiService.set(download, ApiService.buildUrl("/downloads/" + scope.download.download_id), { expand: "file" }).then(function (updatedDownload) {
                            GrowlsService.addGrowl({ id: "edit_success_no_link" });
                            scope.download = updatedDownload;
                            downloadDetailsModal.close();
                        },
                        function (error) {
                            scope.modalError = error;
                        });

                    };

                    scope.downloadDetails.reset = function () {

                        // Clear any previous errors
                        scope.modalError = null;

                        // Reset
                        ApiService.set(null, ApiService.buildUrl("/downloads/" + scope.download.download_id + "/reset"), { expand: "file" }).then(function (updatedDownload) {
                            GrowlsService.addGrowl({ id: "download_reset" });
                            scope.download = updatedDownload;
                            downloadDetailsModal.close();
                        },
                        function (error) {
                            scope.modalError = error;
                        });

                    };

                    scope.downloadDetails.kill = function () {

                        // Clear any previous errors
                        scope.modalError = null;

                        // Reset
                        ApiService.set(null, ApiService.buildUrl("/downloads/" + scope.download.download_id + "/kill"), { expand: "file" }).then(function (updatedDownload) {
                            GrowlsService.addGrowl({ id: "download_kill" });
                            scope.download = updatedDownload;
                            downloadDetailsModal.close();
                        },
                        function (error) {
                            scope.modalError = error;
                        });

                    };

                    // Handle when the modal is closed or dismissed
                    downloadDetailsModal.result.then(function (result) {
                        // Clear out any error messasges
                        scope.modalError = null;
                    }, function () {
                        scope.modalError = null;
                    });

                }, function (error) {
                    scope.error = error;
                    window.scrollTo(0, 0);
                });

            });
        }
    };
}]);


app.directive('license', ['$uibModal', function ($uibModal) {
    return {
        restrict: 'A',
        scope: {
            license: '=?',
            error: '=?'
        },
        link: function (scope, elem, attrs, ctrl) {

            elem.click(function () {

                scope.licenseDetails = {};
                scope.licenseDetails.params = {};
                scope.data = {};
                scope.options = { html: true };

                scope.renderedLicenseText = scope.license.label + ":\n" + scope.license.text;
                if (scope.license.instructions) {
                    scope.renderedLicenseText += "\n\n" + scope.license.instructions;
                }

                scope.renderedLicenseHtml = scope.license.label + "<br>" + scope.license.html;
                if (scope.license.instructions) {
                    scope.renderedLicenseHtml += "<br><br>" + scope.license.instructions;
                }

                var licenseDetailsModal = $uibModal.open({
                    size: "lg",
                    templateUrl: "app/modals/license.html",
                    scope: scope
                });

                scope.licenseDetails.close = function () {
                    licenseDetailsModal.close();
                }

                // Handle when the modal is closed or dismissed
                licenseDetailsModal.result.then(function (result) {
                    // Clear out any error messasges
                    scope.modalError = null;
                }, function () {
                    scope.modalError = null;
                });

            });
        }
    };
}]);


app.directive('creditCardImage', [function () {

    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {

            scope.$watch(attrs.creditCardImage, function (creditCardImage) {

                var path = "images/";
                if (attrs.path) {
                    path = attrs.path;
                }

                if (creditCardImage) {
                    var filename = creditCardImage.replace(" ", "").toLowerCase() + ".png";
                    var image = '<img src="' + path + filename + '" />';
                    var elemNg = angular.element(elem);
                    elemNg.empty();
                    elemNg.html(image);
                }

            });
        }
    }
}]);

