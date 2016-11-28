var utils = (function () {

    // These are general, home-grown javascript functions for common functions used throughout the application.

    function setCookie(name, value, minutes) {
        if (minutes) {
            var date = new Date();
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        }
        else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function getCookie(name) {
        if (document.cookie.length > 0) {
            c_start = document.cookie.indexOf(name + "=");
            if (c_start != -1) {
                c_start = c_start + name.length + 1;
                c_end = document.cookie.indexOf(";", c_start);
                if (c_end == -1) {
                    c_end = document.cookie.length;
                }
                return unescape(document.cookie.substring(c_start, c_end));
            }
        }
        return "";
    }

    function getPageHashParameters() {

        return getHashParameters(window.location.href);

    }

    function getHashParameters(url) {

        var hashParameters = {};

        if (url.indexOf("#") == -1) {
            return hashParameters;
        }

        var e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = url.substring(url.indexOf("#") + 1);

        while (e = r.exec(q))
            hashParameters[d(e[1])] = d(e[2]);

        return hashParameters;
    }

    function getPageQueryParameters() {

        return getQueryParameters(window.location.href);

    }

    function getQueryParameters(url) {

        if (url.indexOf("?") == -1) {
            return {};
        }

        q = url.substring(url.indexOf("?") + 1);

        // Strip off any hash parameters
        if (q.indexOf("#") > 0) {
            q = q.substring(0, q.indexOf("#"));
        }

        return parseQueryParameters(q);
    }

    function parseQueryParameters(query) {

        var queryParameters = {};

        if (isNullOrEmpty(query)) {
            return queryParameters;
        }

        var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); }
        var queryParameters = {};

        while (e = r.exec(query))
            queryParameters[d(e[1])] = d(e[2]);

        return queryParameters;

    }

    function appendParams(url, params) {

        if (params.length == 0) {
            return url;
        }

        url += "?";

        _.each(params, function (item, index) {
            url += index + "=" + item + "&";
        });

        // remove the trailing ampersand
        url = url.substring(0, (url.length - 1));

        // append the query string and return
        return url;

    }

    function left(str, n) {
        if (n <= 0)
            return "";
        else if (n > String(str).length)
            return str;
        else
            return String(str).substring(0, n);
    }

    function right(str, n) {
        if (n <= 0)
            return "";
        else if (n > String(str).length)
            return str;
        else {
            var iLen = String(str).length;
            return String(str).substring(iLen, iLen - n);
        }
    }

    function isValidNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    function isValidInteger(value) {

        if (isValidNumber(value) == false) {
            return false;
        }
        
        value = parseFloat(value);

        return value === (parseInt(value) | 0);
    }

    function getRandom() {
        return Math.floor((Math.random() * 10000000) + 1);
    }

    function getRandomString(chars, length) {

        var result = "";
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;

    }

    function cleanPrice(price) {
        // Strip everything except numbers and decimals

        if (typeof price === 'undefined' || price == null) {
            return "";
        }

        var cleanedPrice = price.toString().replace(/[^0-9\.\s]/g, '').trim();

        if (isNaN(cleanedPrice) == true || cleanedPrice.trim() == "") {
            // The value is not reasonably close enough for it to be a valid price. Just return the original input.
            return price;
        } else {
            // Truncate at two decimal places.
            return parseFloat(cleanedPrice).toFixed(2);
        }
    }

    function removeEmptyPrices(prices) {
        return _.filter(prices, function (price) { return price.price != "" || price.currency != ""; });
    }

    function hasPermission(resource, method) {

        if (method == null) {
            method = read;
        }

        var permissions = JSON.parse(localStorage.getItem("permissions"));

        var r = permissions[resource];

        if (r != null) {
            var m = r[method];

            if (m != null) {
                return Boolean(m);
            }
        }

        return false;

    }

    function inTestMode() {
        return stringToBool(localStorage.getItem("test"));
    }

    function getLocale(language) {

        // Array of supported locales
        var locales = [];
        locales.push("af-na", "af-za", "af", "ar-ae", "ar-bh", "ar-dj", "ar-dz", "ar-eg", "ar-eh", "ar-er", "ar-il", "ar-iq", "ar-jo", "ar-km", "ar-kw", "ar-lb", "ar-ly", "ar-ma", "ar-mr", "ar-om", "ar-ps", "ar-qa", "ar-sa", "ar-sd", "ar-so", "ar-ss", "ar-sy", "ar-td", "ar-tn", "ar-ye", "ar", "az-cyrl-az", "az-cyrl", "az-latn-az", "az-latn", "az", "bg-bg", "bg", "bo-cn", "bo-in", "bo", "cs-cz", "cs", "da-dk", "da-gl", "da", "dav-ke", "dav", "de-at", "de-be", "de-ch", "de-de", "de-li", "de-lu", "de", "el-cy", "el-gr", "el", "en-ag", "en-ai", "en-as", "en-au", "en-bb", "en-be", "en-bm", "en-bs", "en-bw", "en-bz", "en-ca", "en-cc", "en-ck", "en-cm", "en-cx", "en-dg", "en-dm", "en-dsrt-us", "en-dsrt", "en-er", "en-fj", "en-fk", "en-fm", "en-gb", "en-gd", "en-gg", "en-gh", "en-gi", "en-gm", "en-gu", "en-gy", "en-hk", "en-ie", "en-im", "en-in", "en-io", "en-iso", "en-je", "en-jm", "en-ke", "en-ki", "en-kn", "en-ky", "en-lc", "en-lr", "en-ls", "en-mg", "en-mh", "en-mo", "en-mp", "en-ms", "en-mt", "en-mu", "en-mw", "en-na", "en-nf", "en-ng", "en-nr", "en-nu", "en-nz", "en-pg", "en-ph", "en-pk", "en-pn", "en-pr", "en-pw", "en-rw", "en-sb", "en-sc", "en-sd", "en-sg", "en-sh", "en-sl", "en-ss", "en-sx", "en-sz", "en-tc", "en-tk", "en-to", "en-tt", "en-tv", "en-tz", "en-ug", "en-um", "en-us", "en-vc", "en-vg", "en-vi", "en-vu", "en-ws", "en-za", "en-zm", "en-zw", "en", "es-ar", "es-bo", "es-cl", "es-co", "es-cr", "es-cu", "es-do", "es-ea", "es-ec", "es-es", "es-gq", "es-gt", "es-hn", "es-ic", "es-mx", "es-ni", "es-pa", "es-pe", "es-ph", "es-pr", "es-py", "es-sv", "es-us", "es-uy", "es-ve", "es", "et-ee", "et", "eu-es", "eu", "fa-af", "fa-ir", "fa", "fi-fi", "fi", "fil-ph", "fil", "fr-be", "fr-bf", "fr-bi", "fr-bj", "fr-bl", "fr-ca", "fr-cd", "fr-cf", "fr-cg", "fr-ch", "fr-ci", "fr-cm", "fr-dj", "fr-dz", "fr-fr", "fr-ga", "fr-gf", "fr-gn", "fr-gp", "fr-gq", "fr-ht", "fr-km", "fr-lu", "fr-ma", "fr-mc", "fr-mf", "fr-mg", "fr-ml", "fr-mq", "fr-mr", "fr-mu", "fr-nc", "fr-ne", "fr-pf", "fr-pm", "fr-re", "fr-rw", "fr-sc", "fr-sn", "fr-sy", "fr-td", "fr-tg", "fr-tn", "fr-vu", "fr-wf", "fr-yt", "fr", "hi-in", "hi", "hr-ba", "hr-hr", "hr", "hu-hu", "hu", "hy-am", "hy", "is-is", "is", "it-ch", "it-it", "it-sm", "it", "ja-jp", "ja", "ka-ge", "ka", "kab-dz", "kab", "kam-ke", "kam", "kk-cyrl-kz", "kk-cyrl", "kk", "kkj-cm", "kkj", "kl-gl", "kl", "kln-ke", "kln", "km-kh", "km", "ko-kp", "ko-kr", "ko", "kok-in", "kok", "lo-la", "lo", "lt-lt", "lt", "mg-mg", "mg", "mgh-mz", "mgh", "mgo-cm", "mgo", "mk-mk", "mk", "mn-cyrl-mn", "mn-cyrl", "mn", "ms-bn", "ms-latn-bn", "ms-latn-my", "ms-latn-sg", "ms-latn", "ms-my", "ms", "mt-mt", "mt", "ne-in", "ne-np", "ne", "nl-aw", "nl-be", "nl-bq", "nl-cw", "nl-nl", "nl-sr", "nl-sx", "nl", "no-no", "no", "pl-pl", "pl", "pt-ao", "pt-br", "pt-cv", "pt-gw", "pt-mo", "pt-mz", "pt-pt", "pt-st", "pt-tl", "pt", "ro-md", "ro-ro", "ro", "rof-tz", "rof", "ru-by", "ru-kg", "ru-kz", "ru-md", "ru-ru", "ru-ua", "ru", "shi-latn-ma", "shi-latn", "shi-tfng-ma", "shi-tfng", "shi", "sk-sk", "sk", "sl-si", "sl", "sq-al", "sq-mk", "sq-xk", "sq", "sr-cyrl-ba", "sr-cyrl-me", "sr-cyrl-rs", "sr-cyrl-xk", "sr-cyrl", "sr-latn-ba", "sr-latn-me", "sr-latn-rs", "sr-latn-xk", "sr-latn", "sr", "sv-ax", "sv-fi", "sv-se", "sv", "th-th", "th", "tl", "to-to", "to", "tr-cy", "tr-tr", "tr", "uk-ua", "uk", "uz-arab-af", "uz-arab", "uz-cyrl-uz", "uz-cyrl", "uz-latn-uz", "uz-latn", "uz", "vi-vn", "vi", "zh-cn", "zh-hans-cn", "zh-hans-hk", "zh-hans-mo", "zh-hans-sg", "zh-hans", "zh-hant-hk", "zh-hant-mo", "zh-hant-tw", "zh-hant", "zh-hk", "zh-tw", "zh");

        // If their locale exists in the locale list, use it. Otherwise, use the locale from their selected language.
        if (locales.indexOf(localStorage.getItem("locale")) >= 0) {
            return localStorage.getItem("locale");
        } else {
            return language;
        }

    }

    function addDays(date, days) {
        return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    }

    function daysDiff(first, second) {
        return (second - first) / (1000 * 60 * 60 * 24);
    }

    function stringToArray(string) {

        var result = [];

        // Convert licenses from a string to array using newline as the delimiter
        if (string != null) {
            var lines = (string).split(/\n/);
            for (var i = 0; i < lines.length; i++) {
                if ((lines[i]).trim().length > 0) {
                    result.push((lines[i]).trim());
                }
            }
        }

        return result;
    }

    function arrayToString(array) {

        var result = "";
        _.each(array, function (element, index) {
            result += element + "\n"
        });

        return result;

    }

    function renameProperty(collection, property, rename) {

        _.each(collection, function (item) {
            item[rename] = item[property];
            var item2 = item;
            delete item[property];
        });

    }

    function ucaseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getColor(count) {

        // Returns a color in the position specified by count. If count is larger than the array then finds the nth position based on the supplied value.
        count = count + 1;
        var position = count;
        position = count / 20;
        position = (position % 1) * 20;

        if (position == 0) {
            position = 20;
        }

        // Return the color in the identified position
        var colors = ["#71c73e", "#77b7c5", "#d54848", "#6c42e5", "#e8e64e", "#dd56e6", "#ecad3f", "#618b9d", "#b68b68", "#36a766", "#3156be", "#00b3ff", "#646464", "#a946e8", "#9d9d9d", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4"];

        return colors[position - 1];

    }

    function getRelatedColor(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    }

    function hasProperty(obj, prop) {
        if (obj != null) {
            // http://stackoverflow.com/a/136411/2002383
            var proto = obj.__proto__ || obj.constructor.prototype;
            return (prop in obj) &&
                (!(prop in proto) || proto[prop] !== obj[prop]);
        }
        return false;
    }

    function calculateFxAmount(price, fx_rate) {
        // Round exactly two places
        return Math.round((price * fx_rate) * 100) / 100
    }

    function sumProperties(collection, prop) {
        var sum = 0;

        _.each(collection, function (item) {
            if (hasProperty(item, prop)) {
                sum += item[prop];
            }
        });

        return sum;
    }

    function roundCurrency(value) {

        if (isNaN(value)) {
            return null;
        }

        return Math.round(value * 100) / 100;
    }

    function areEqual() {
        var len = arguments.length;
        for (var i = 1; i < len; i++) {
            if (arguments[i] == null || arguments[i] != arguments[i - 1])
                return false;
        }
        return true;
    }

    function redirect(location, goto) {
        // This allows a redirect to a specified location or to the "on_complete" location if provided, which is typically the "getting started" location when guiding a user through the platform.
        if (location.search().on_complete) {
            location.path(location.search().on_complete);
        } else {
            location.path(goto);
        }
        // Clear hash and query string
        location.search("");
        location.hash("");
        window.scrollTo(0, 0);
    }

    function isNullOrEmpty(string) {

        if (string == null || string == undefined) {
            return true;
        }

        // The string could in fact be numeric, convert to string before you do the tests below.

        if (string.toString() == "") {
            return true;
        }

        if (string.toString().replace(/ /g, '') == null) {
            return true;
        }

        return false;

    }

    function emptyToNull(value) {

        // If a value is whitespace or zero length, change to null.
        if (isNullOrEmpty(value)) {
            return null;
        };

        return value;
    }

    function pushArray(pushInto, push) {
        for (i = 0; i < push.length; i++) {
            pushInto.push(push[i]);
        }
    }

    function replaceAll(value, find, replace) {

        if (replace === undefined) {
            return value.toString();
        }

        return value.replace(new RegExp('[' + find + ']', 'g'), replace);
    };

    function getChildrenElements(n, skipMe, type) {
        // Get children elements from an HTML element
        var r = [];
        for (; n; n = n.nextSibling)
            if (n.nodeType == 1 && n != skipMe)
                if (type) {
                    if (type.toUpperCase() == n.nodeName.toUpperCase()) {
                        r.push(n);
                    }
                } else {
                    r.push(n);
                }
        return r;
    };

    function getSiblingElements(n, type) {
        // Get sibling elements from an HTML element, excluding self.
        return getChildrenElements(n.parentNode.firstChild, n, type);
    }

    function jsonToCsvDownload(data, filename) {

        // If data is not an object then JSON.parse will parse the JSON string in an Object
        var arrData = typeof data != 'object' ? JSON.parse(data) : data;

        var csv = "";

        // Store column indexes you want to skip (i.e. meta data appended to arrays by Angular)
        var excludeColumns = ["formatted"];

        // Generate the header row.
        var row = "";

        // Extract the label from first index of on array
        for (var index in arrData[0]) {

            // Now convert each value to string and comma-seprated
            if (index.substring(0, 1) != "$" && (excludeColumns.indexOf(index) == -1)) {
                row += index + ',';
            } else {
                excludeColumns.push(index);
            }
        }

        row = row.slice(0, -1);

        // Append label row with line break
        csv += row + '\r\n';

        // First loop is to extract each row
        for (var i = 0; i < arrData.length; i++) {

            var row = "";

            // Second loop will extract each column and convert it to a comma-seprated string
            for (var index in arrData[i]) {
                if (excludeColumns.indexOf(index) == -1) {
                    row += '"' + arrData[i][index] + '",';
                }
            }

            row.slice(0, row.length - 1);

            // Add a line break after each row
            csv += row + '\r\n';
        }

        // Initialize file format you want csv or xls
        var uri = 'data:text/csv;charset=utf-8,' + escape(csv);

        // Generate a link
        var link = document.createElement("a");
        link.href = uri;

        // Set the visibility hidden
        link.style = "visibility:hidden";
        link.download = filename + ".csv";

        // Append the anchor tag, "click" it and then remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    }

    function jsonToHtmlTable(json, parent, headerTitle)
    {

        if (parent == null) {
            parent = true;
        }

        var html = "";
        var count = 0;

        if (parent) {
            html += '<table class="table panel table-bordered">';
        } else {
            html += '<table class="table table-bordered" style="margin-bottom: 0">';
        }

        if (headerTitle) {
            html += '<thead class="panel-heading"><tr><th colspan="2">' + headerTitle + '</th></tr></thead>';
        }

        if (isJson(json)) {
            var jobject = JSON.parse(json);

            for (var element in jobject) {

                if (jobject.hasOwnProperty(element)) {

                    if (Array.isArray(jobject[element])) {
                        html += '<tr>';
                        html += '<td colspan="2" style="background-color: #fafafa">' + element + '</td>';
                        html += '</tr>';

                        for (var item in jobject[element]) {
                            if (jobject.hasOwnProperty(element)) {
                                html += '<tr>';
                                html += '<td colspan="2">' + jsonToHtmlTable(JSON.stringify(jobject[element][item]), false) + '</td>';
                                html += '</tr>';
                            }
                        }
                        continue;
                    }

                    if (typeof jobject[element] === 'object' && jobject[element] !== null) {
                        html += '<tr>';
                        html += '<td colspan="2" style="background-color: #fafafa">' + element + '</td>';
                        html += '</tr>';

                        html += '<tr>';
                        html += '<td colspan="2">' + jsonToHtmlTable(JSON.stringify(jobject[element]), false) + '</td>';
                        html += '</tr>';
                        continue;
                    }

                    html += '<tr>';
                    html += '<td>' + element + '</td>';
                    html += '<td>' + jobject[element] + '</td>';
                    html += '</tr>';

                    count++;

                }

            }

            html += '</table>';

        }
        else {
            // Return the json in the event it didn't parse.
            html += '<tr>';
            html += '<td>' + json + '</td>';
            html += '</tr>';
            html += '</table>';
            return html;
        }

        return html;
    }

    function isJson(item) {
        item = typeof item !== "string"
            ? JSON.stringify(item)
            : item;

        try {
            item = JSON.parse(item);
        } catch (e) {
            return false;
        }

        if (typeof item === "object" && item !== null) {
            return true;
        }

        return false;
    }

    // This goes through all properties in an object and if any of the values are string "true" or "false" it converts them to bool true or false. Used when values come in via url "search" parameter.
    function stringsToBool(object) {
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                if (object[property] === "false") {
                    object[property] = false;
                }
                if (object[property] === "true") {
                    object[property] = true;
                }
            }
        }
    }

    function stringToBool(string) {
        return (string == "true");
    }

    function decimalToPercent(dec) {

        // Multiply by 100
        var result = dec * 100;

        // Determine the number of decimal places to use.
        var fixed = 0;
        if (parseInt(result) != result) {
            fixed = dec.toString().split(".")[1].length - 2;
        }

        // If fixed is < 0, return
        if (fixed < 0) {
            return result;
        }

        if (fixed > 20) {
            fixed = 20;
        }

        result = result.toFixed(fixed);

        return result;

    }

    function percentToDecimal(percent) {

        // Divide by 100
        var result = percent / 100;

        // If no decimal in the supplied percent, the precision is 2
        var fixed = 2;

        // If a decimal in the supplied percent, the precision is the number of digits after the decimal + 2.
        if (parseInt(percent) != percent) {
            fixed = percent.toString().split(".")[1].length + 2;
        }

        if (fixed > 20) {
            fixed = 20;
        }

        result = result.toFixed(fixed);

        return result;

    }

    return {
        setCookie: setCookie,
        getCookie: getCookie,
        getPageHashParameters: getPageHashParameters,
        getHashParameters: getHashParameters,
        getPageQueryParameters: getPageQueryParameters,
        getQueryParameters: getQueryParameters,
        appendParams: appendParams,
        left: left,
        right: right,
        isValidNumber: isValidNumber,
        isValidInteger: isValidInteger,
        getRandom: getRandom,
        getRandomString: getRandomString,
        cleanPrice: cleanPrice,
        hasPermission: hasPermission,
        getLocale: getLocale,
        removeEmptyPrices: removeEmptyPrices,
        addDays: addDays,
        daysDiff: daysDiff,
        stringToArray: stringToArray,
        arrayToString: arrayToString,
        renameProperty: renameProperty,
        ucaseFirstLetter: ucaseFirstLetter,
        getColor: getColor,
        getRelatedColor: getRelatedColor,
        stringsToBool: stringsToBool,
        stringToBool: stringToBool,
        hasProperty: hasProperty,
        calculateFxAmount: calculateFxAmount,
        areEqual: areEqual,
        sumProperties: sumProperties,
        roundCurrency: roundCurrency,
        redirect: redirect,
        isNullOrEmpty: isNullOrEmpty,
        pushArray: pushArray,
        inTestMode: inTestMode,
        emptyToNull: emptyToNull,
        parseQueryParameters: parseQueryParameters,
        replaceAll: replaceAll,
        getChildrenElements: getChildrenElements,
        getSiblingElements: getSiblingElements,
        jsonToCsvDownload: jsonToCsvDownload,
        jsonToHtmlTable: jsonToHtmlTable,
        decimalToPercent: decimalToPercent,
        percentToDecimal: percentToDecimal
    };

})();
