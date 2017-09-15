app.filter('bytesToMB', function () {
    return function (item) {
        return (item / 1000000).toFixed(2) + " MB";
    };
});

app.filter('humanBool', function () {
    return function (bool) {
        if (bool != null) {
            if (bool == true) {
                return "yes";
            }
            return "no";
        }
    };
});

app.filter('money', function () {
    return function (amount, currency) {

        // This will error in browsers that don't support it. You need to shim before use.
        // Shim: https://github.com/andyearnshaw/Intl.js
        // http://stackoverflow.com/a/16233919/2002383

        var locale = localStorage.getItem("locale");
        if (locale == null) {
            locale = "en-us";
        }

        var formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        });

        return formatter.format(amount);
    };
});

app.filter('truncate', function () {
    return function (text, length) {

        var end = "...";

        if (text == null) {
            return;
        }

        if (text.length <= length || text.length - end.length <= length) {
            return text;
        }
        else {
            return String(text).substring(0, length - end.length).trim() + end;
        }

    };
});

app.filter('countryCodeToName', ['GeographiesService', function (GeographiesService) {
    return function (code) {

        if (code == null) {
            return null;
        }

        var geo = GeographiesService.getGeographies();
        var country = _.findWhere(geo.countries, { code: code });
        return country.name;
    }
}]);

app.filter('truncateUrl', function () {
    return function (url, length) {

        var middle = "...";

        if (url == null) {
            return;
        }

        if (url.length <= length || url.length - middle.length <= length) {
            return url;
        }
        else {
            return String(url).substring(0, length) + middle + utils.right(url, 10);
        }

    };
});

app.filter('replace', function () {
    return function (str, find, rep) {
        if (str != null) {
            return str.split(find).join(rep);
        }
    }
});

app.filter('stringToColor', function () {

    return function (str) {

        if (str != null) {
            // str to hash
            for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));

            // int/hash to hex
            for (var i = 0, color = "#"; i < 3; color += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

            return color;
        } else {
            return "red";
        }

    }

});

app.filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
        return $filter('number')(input * 100, decimals) + '%';
    };
}]);

app.filter('removeUnderscore', function () {
    return function (str) {
        if (str != null) {
            return str.split("_").join(" ");
        }
    }
});