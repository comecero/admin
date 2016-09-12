app.service("GrowlsService", ['$rootScope', function ($rootScope) {

    // Return public API.
    return ({
        addGrowl: addGrowl,
    });

    function addGrowl(growl) {

        // Create an ID
        var ref = utils.getRandom()

        // Define the type
        var type = "success";
        if (growl.type != null) {
            type = growl.type;
        }

        var duration = 5;

        switch (type) {
            case "success":
                duration = 5;
                break;
            case "info":
                duration = 5;
                break;
            case "warning":
                duration = 10;
                break;
            case "danger":
                duration = -1; // Until user dismisses it
                break;
        }

        // Override if a duration has been provided
        if (utils.isValidNumber(growl.duration)) {
            duration = growl.duration;
        }

        // We don't want to hold timeout events in memory forever, so set a reasonable maximum. If you want to go beyond this, set to -1 and it will stay until the user dismisses it.
        if (duration > 120) {
            duration = 120;
        }

        // Append the derived properties
        growl.ref = ref;
        growl.duration = duration;
        growl.type = type;

        $rootScope.$broadcast('event:growl', growl);

    }
}
]);


app.service("SettingsService", ['$rootScope', "$q", "ApiService", function ($rootScope, $q, ApiService) {

    // Return public API.
    return ({
        setUserSettings: setUserSettings,
        setAccountMeta: setAccountMeta
    });

    function setAccountMeta() {

        // Get details about the account
        $rootScope.account = {};
        $rootScope.account.account_id = localStorage.getItem("account_id");

        return ApiService.getItem(ApiService.buildUrl("/accounts/" + $rootScope.account.account_id + "/meta")).then(function (account) {
            $rootScope.account.alias = account.alias;
            localStorage.setItem("alias", account.alias);
            $rootScope.account.live = account.live;
            localStorage.setItem("live", account.live);
            $rootScope.account.reporting_currency_primary = account.reporting_currency_primary;
            localStorage.setItem("reporting_currency_primary", account.reporting_currency_primary);
            $rootScope.account.reporting_currency_secondary = account.reporting_currency_secondary;
            localStorage.setItem("reporting_currency_secondary", account.reporting_currency_secondary);
            $rootScope.account.payment_currencies = account.payment_currencies;
            localStorage.setItem("payment_currencies", JSON.stringify(account.payment_currencies));
            $rootScope.account.default_payment_currency = account.default_payment_currency;
            localStorage.setItem("default_payment_currency", account.default_payment_currency);

            // Set the contract select URL
            $rootScope.plan_select_url = "https://" + account.alias + ".auth.comecero.com/plan/select";
            if (window.location.hostname.indexOf("admin-staging.") > -1) {
                $rootScope.plan_select_url = $rootScope.plan_select_url.replace(".auth.comecero.com", ".auth-staging.comecero.com");
            }

        });
    }

    function setUserSettings() {

        $rootScope.user = {};
        $rootScope.user.user_id = localStorage.getItem("user_id");
        $rootScope.user.name = localStorage.getItem("name");

        $rootScope.settings = {};
        $rootScope.settings.test = utils.stringToBool(localStorage.getItem("test"));

        $rootScope.logout = function () {
            var alias = localStorage.getItem("alias");

            // Delete all tokens in local storage
            var defer = $q.defer();
            var promises = [];

            if (localStorage.getItem("token")) {
                promises.push(ApiService.remove(ApiService.buildUrl("/auths/me"), null, true, localStorage.getItem("token")));
            }

            if (localStorage.getItem("token_live")) {
                promises.push(ApiService.remove(ApiService.buildUrl("/auths/me"), null, true, localStorage.getItem("token_live")));
            }

            if (localStorage.getItem("token_limited_test")) {
                promises.push(ApiService.remove(ApiService.buildUrl("/auths/me"), null, true, localStorage.getItem("token_limited_test")));
            }

            if (promises.length > 0) {
                $q.all(promises).then(function () {
                    complete();
                }, function (error) {
                    // You received a response that one of the tokens is no longer valid when you attempted to delete it. It previously expired. Doesn't matter.
                    complete();
                });
            } else {
                complete();
            }

            var complete = function () {
                localStorage.clear();
                window.location.href = "https://" + alias + ".auth.comecero.com/?logout=1";
            }

        }

        setAccountMeta();

    }

}]);


app.service("ConfirmService", ['$uibModal', function ($uibModal) {

    // Return public API.
    return ({
        showConfirm: showConfirm,
    });

    function showConfirm($scope, confirm) {

        $scope.confirm = confirm;

        openConfirm = $uibModal.open({
            templateUrl: 'app/modals/confirm.html',
            scope: $scope
        });

        confirm.ok = function () {
            openConfirm.close();
            confirm.onConfirm();
        };

        confirm.cancel = function () {
            openConfirm.close();
        };

    }

}
]);


app.service("GeographiesService", [function () {

    // Return public API.
    return ({
        getGeographies: getGeographies,
        isEuCountry: isEuCountry
    });

    function getGeographies(insertblanks) {
        var geo = {};

        geo.countries = [{ name: 'Afghanistan', code: 'AF' }, { name: 'Albania', code: 'AL' }, { name: 'Algeria', code: 'DZ' }, { name: 'American Samoa', code: 'AS' }, { name: 'Andorra', code: 'AD' }, { name: 'Angola', code: 'AO' }, { name: 'Anguilla', code: 'AI' }, { name: 'Antarctica', code: 'AQ' }, { name: 'Antigua and Barbuda', code: 'AG' }, { name: 'Argentina', code: 'AR' }, { name: 'Armenia', code: 'AM' }, { name: 'Aruba', code: 'AW' }, { name: 'Australia', code: 'AU' }, { name: 'Austria', code: 'AT' }, { name: 'Azerbaijan', code: 'AZ' }, { name: 'Bahamas', code: 'BS' }, { name: 'Bahrain', code: 'BH' }, { name: 'Bangladesh', code: 'BD' }, { name: 'Barbados', code: 'BB' }, { name: 'Belarus', code: 'BY' }, { name: 'Belgium', code: 'BE' }, { name: 'Belize', code: 'BZ' }, { name: 'Benin', code: 'BJ' }, { name: 'Bermuda', code: 'BM' }, { name: 'Bhutan', code: 'BT' }, { name: 'Bolivia, Plurinational State of', code: 'BO' }, { name: 'Bonaire, Sint Eustatius and Saba', code: 'BQ' }, { name: 'Bosnia and Herzegovina', code: 'BA' }, { name: 'Botswana', code: 'BW' }, { name: 'Bouvet Island', code: 'BV' }, { name: 'Brazil', code: 'BR' }, { name: 'British Indian Ocean Territory', code: 'IO' }, { name: 'Brunei Darussalam', code: 'BN' }, { name: 'Bulgaria', code: 'BG' }, { name: 'Burkina Faso', code: 'BF' }, { name: 'Burundi', code: 'BI' }, { name: 'Cambodia', code: 'KH' }, { name: 'Cameroon', code: 'CM' }, { name: 'Canada', code: 'CA' }, { name: 'Cape Verde', code: 'CV' }, { name: 'Cayman Islands', code: 'KY' }, { name: 'Central African Republic', code: 'CF' }, { name: 'Chad', code: 'TD' }, { name: 'Chile', code: 'CL' }, { name: 'China', code: 'CN' }, { name: 'Christmas Island', code: 'CX' }, { name: 'Cocos (Keeling) Islands', code: 'CC' }, { name: 'Colombia', code: 'CO' }, { name: 'Comoros', code: 'KM' }, { name: 'Congo', code: 'CG' }, { name: 'Congo, the Democratic Republic of the', code: 'CD' }, { name: 'Cook Islands', code: 'CK' }, { name: 'Costa Rica', code: 'CR' }, { name: 'Cote d Ivoire', code: 'CI' }, { name: 'Croatia', code: 'HR' }, { name: 'Cuba', code: 'CU' }, { name: 'Curacao', code: 'CW' }, { name: 'Cyprus', code: 'CY' }, { name: 'Czech Republic', code: 'CZ' }, { name: 'Denmark', code: 'DK' }, { name: 'Djibouti', code: 'DJ' }, { name: 'Dominica', code: 'DM' }, { name: 'Dominican Republic', code: 'DO' }, { name: 'Ecuador', code: 'EC' }, { name: 'Egypt', code: 'EG' }, { name: 'El Salvador', code: 'SV' }, { name: 'Equatorial Guinea', code: 'GQ' }, { name: 'Eritrea', code: 'ER' }, { name: 'Estonia', code: 'EE' }, { name: 'Ethiopia', code: 'ET' }, { name: 'Falkland Islands', code: 'AX' }, { name: 'Falkland Islands (Malvinas)', code: 'FK' }, { name: 'Faroe Islands', code: 'FO' }, { name: 'Fiji', code: 'FJ' }, { name: 'Finland', code: 'FI' }, { name: 'France', code: 'FR' }, { name: 'French Guiana', code: 'GF' }, { name: 'French Polynesia', code: 'PF' }, { name: 'French Southern Territories', code: 'TF' }, { name: 'Gabon', code: 'GA' }, { name: 'Gambia', code: 'GM' }, { name: 'Georgia', code: 'GE' }, { name: 'Germany', code: 'DE' }, { name: 'Ghana', code: 'GH' }, { name: 'Gibraltar', code: 'GI' }, { name: 'Greece', code: 'GR' }, { name: 'Greenland', code: 'GL' }, { name: 'Grenada', code: 'GD' }, { name: 'Guadeloupe', code: 'GP' }, { name: 'Guam', code: 'GU' }, { name: 'Guatemala', code: 'GT' }, { name: 'Guernsey', code: 'GG' }, { name: 'Guinea', code: 'GN' }, { name: 'Guine Bissau', code: 'GW' }, { name: 'Guyana', code: 'GY' }, { name: 'Haiti', code: 'HT' }, { name: 'Heard Island and McDonald Islands', code: 'HM' }, { name: 'Holy See (Vatican City State)', code: 'VA' }, { name: 'Honduras', code: 'HN' }, { name: 'Hong Kong', code: 'HK' }, { name: 'Hungary', code: 'HU' }, { name: 'Iceland', code: 'IS' }, { name: 'India', code: 'IN' }, { name: 'Indonesia', code: 'ID' }, { name: 'Iran', code: 'IR' }, { name: 'Iraq', code: 'IQ' }, { name: 'Ireland', code: 'IE' }, { name: 'Isle of Man', code: 'IM' }, { name: 'Israel', code: 'IL' }, { name: 'Italy', code: 'IT' }, { name: 'Jamaica', code: 'JM' }, { name: 'Japan', code: 'JP' }, { name: 'Jersey', code: 'JE' }, { name: 'Jordan', code: 'JO' }, { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' }, { name: 'Kiribati', code: 'KI' }, { name: 'Korea', code: 'KR' }, { name: 'Kuwait', code: 'KW' }, { name: 'Kyrgyzstan', code: 'KG' }, { name: 'Lao Peoples Democratic Republic', code: 'LA' }, { name: 'Latvia', code: 'LV' }, { name: 'Lebanon', code: 'LB' }, { name: 'Lesotho', code: 'LS' }, { name: 'Liberia', code: 'LR' }, { name: 'Libya', code: 'LY' }, { name: 'Liechtenstein', code: 'LI' }, { name: 'Lithuania', code: 'LT' }, { name: 'Luxembourg', code: 'LU' }, { name: 'Macao', code: 'MO' }, { name: 'Macedonia', code: 'MK' }, { name: 'Madagascar', code: 'MG' }, { name: 'Malawi', code: 'MW' }, { name: 'Malaysia', code: 'MY' }, { name: 'Maldives', code: 'MV' }, { name: 'Mali', code: 'ML' }, { name: 'Malta', code: 'MT' }, { name: 'Marshall Islands', code: 'MH' }, { name: 'Martinique', code: 'MQ' }, { name: 'Mauritania', code: 'MR' }, { name: 'Mauritius', code: 'MU' }, { name: 'Mayotte', code: 'YT' }, { name: 'Mexico', code: 'MX' }, { name: 'Micronesia', code: 'FM' }, { name: 'Moldova', code: 'MD' }, { name: 'Monaco', code: 'MC' }, { name: 'Mongolia', code: 'MN' }, { name: 'Montenegro', code: 'ME' }, { name: 'Montserrat', code: 'MS' }, { name: 'Morocco', code: 'MA' }, { name: 'Mozambique', code: 'MZ' }, { name: 'Myanmar', code: 'MM' }, { name: 'Namibia', code: 'NA' }, { name: 'Nauru', code: 'NR' }, { name: 'Nepal', code: 'NP' }, { name: 'Netherlands', code: 'NL' }, { name: 'New Caledonia', code: 'NC' }, { name: 'New Zealand', code: 'NZ' }, { name: 'Nicaragua', code: 'NI' }, { name: 'Niger', code: 'NE' }, { name: 'Nigeria', code: 'NG' }, { name: 'Niue', code: 'NU' }, { name: 'Norfolk Island', code: 'NF' }, { name: 'Northern Mariana Islands', code: 'MP' }, { name: 'Norway', code: 'NO' }, { name: 'Oman', code: 'OM' }, { name: 'Pakistan', code: 'PK' }, { name: 'Palau', code: 'PW' }, { name: 'Panama', code: 'PA' }, { name: 'Papua New Guinea', code: 'PG' }, { name: 'Paraguay', code: 'PY' }, { name: 'Peru', code: 'PE' }, { name: 'Philippines', code: 'PH' }, { name: 'Pitcairn', code: 'PN' }, { name: 'Poland', code: 'PL' }, { name: 'Portugal', code: 'PT' }, { name: 'Puerto Rico', code: 'PR' }, { name: 'Qatar', code: 'QA' }, { name: 'Reunion', code: 'RE' }, { name: 'Romania', code: 'RO' }, { name: 'Russian Federation', code: 'RU' }, { name: 'Rwanda', code: 'RW' }, { name: 'Saint Barthélemy', code: 'BL' }, { name: 'Saint Helena', code: 'SH' }, { name: 'Saint Kitts and Nevis', code: 'KN' }, { name: 'Saint Lucia', code: 'LC' }, { name: 'Saint Martin French', code: 'MF' }, { name: 'Saint Pierre and Miquelon', code: 'PM' }, { name: 'Saint Vincent and the Grenadines', code: 'VC' }, { name: 'Samoa', code: 'WS' }, { name: 'San Marino', code: 'SM' }, { name: 'Sao Tome and Principe', code: 'ST' }, { name: 'Saudi Arabia', code: 'SA' }, { name: 'Senegal', code: 'SN' }, { name: 'Serbia', code: 'RS' }, { name: 'Seychelles', code: 'SC' }, { name: 'Sierra Leone', code: 'SL' }, { name: 'Singapore', code: 'SG' }, { name: 'Sint Maarten Dutch', code: 'SX' }, { name: 'Slovakia', code: 'SK' }, { name: 'Slovenia', code: 'SI' }, { name: 'Solomon Islands', code: 'SB' }, { name: 'Somalia', code: 'SO' }, { name: 'South Africa', code: 'ZA' }, { name: 'South Georgia and the South Sandwich Islands', code: 'GS' }, { name: 'South Sudan', code: 'SS' }, { name: 'Spain', code: 'ES' }, { name: 'Sri Lanka', code: 'LK' }, { name: 'Sudan', code: 'SD' }, { name: 'Suriname', code: 'SR' }, { name: 'Svalbard and Jan Mayen', code: 'SJ' }, { name: 'Swaziland', code: 'SZ' }, { name: 'Sweden', code: 'SE' }, { name: 'Switzerland', code: 'CH' }, { name: 'Syrian Arab Republic', code: 'SY' }, { name: 'Taiwan', code: 'TW' }, { name: 'Tajikistan', code: 'TJ' }, { name: 'Tanzania', code: 'TZ' }, { name: 'Thailand', code: 'TH' }, { name: 'Timor Leste', code: 'TL' }, { name: 'Togo', code: 'TG' }, { name: 'Tokelau', code: 'TK' }, { name: 'Tonga', code: 'TO' }, { name: 'Trinidad and Tobago', code: 'TT' }, { name: 'Tunisia', code: 'TN' }, { name: 'Turkey', code: 'TR' }, { name: 'Turkmenistan', code: 'TM' }, { name: 'Turks and Caicos Islands', code: 'TC' }, { name: 'Tuvalu', code: 'TV' }, { name: 'Uganda', code: 'UG' }, { name: 'Ukraine', code: 'UA' }, { name: 'United Arab Emirates', code: 'AE' }, { name: 'United Kingdom', code: 'GB' }, { name: 'United States', code: 'US' }, { name: 'United States Minor Outlying Islands', code: 'UM' }, { name: 'Uruguay', code: 'UY' }, { name: 'Uzbekistan', code: 'UZ' }, { name: 'Vanuatu', code: 'VU' }, { name: 'Venezuela', code: 'VE' }, { name: 'Viet Nam', code: 'VN' }, { name: 'Virgin Islands British', code: 'VG' }, { name: 'Virgin Islands U.S.', code: 'VI' }, { name: 'Wallis and Futuna', code: 'WF' }, { name: 'Western Sahara', code: 'EH' }, { name: 'Yemen', code: 'YE' }, { name: 'Zambia', code: 'ZM' }, { name: 'Zimbabwe', code: 'ZW' }];
        geo.us_states = [{ name: "Alabama", code: "AL" }, { name: "Alaska", code: "AK" }, { name: "American Samoa", code: "AS" }, { name: "Arizona", code: "AZ" }, { name: "Arkansas", code: "AR" }, { name: "California", code: "CA" }, { name: "Colorado", code: "CO" }, { name: "Connecticut", code: "CT" }, { name: "Delaware", code: "DE" }, { name: "District Of Columbia", code: "DC" }, { name: "Federated States Of Micronesia", code: "FM" }, { name: "Florida", code: "FL" }, { name: "Georgia", code: "GA" }, { name: "Guam", code: "GU" }, { name: "Hawaii", code: "HI" }, { name: "Idaho", code: "ID" }, { name: "Illinois", code: "IL" }, { name: "Indiana", code: "IN" }, { name: "Iowa", code: "IA" }, { name: "Kansas", code: "KS" }, { name: "Kentucky", code: "KY" }, { name: "Louisiana", code: "LA" }, { name: "Maine", code: "ME" }, { name: "Marshall Islands", code: "MH" }, { name: "Maryland", code: "MD" }, { name: "Massachusetts", code: "MA" }, { name: "Michigan", code: "MI" }, { name: "Minnesota", code: "MN" }, { name: "Mississippi", code: "MS" }, { name: "Missouri", code: "MO" }, { name: "Montana", code: "MT" }, { name: "Nebraska", code: "NE" }, { name: "Nevada", code: "NV" }, { name: "New Hampshire", code: "NH" }, { name: "New Jersey", code: "NJ" }, { name: "New Mexico", code: "NM" }, { name: "New York", code: "NY" }, { name: "North Carolina", code: "NC" }, { name: "North Dakota", code: "ND" }, { name: "Northern Mariana Islands", code: "MP" }, { name: "Ohio", code: "OH" }, { name: "Oklahoma", code: "OK" }, { name: "Oregon", code: "OR" }, { name: "Palau", code: "PW" }, { name: "Pennsylvania", code: "PA" }, { name: "Puerto Rico", code: "PR" }, { name: "Rhode Island", code: "RI" }, { name: "South Carolina", code: "SC" }, { name: "South Dakota", code: "SD" }, { name: "Tennessee", code: "TN" }, { name: "Texas", code: "TX" }, { name: "Utah", code: "UT" }, { name: "Vermont", code: "VT" }, { name: "Virgin Islands", code: "VI" }, { name: "Virginia", code: "VA" }, { name: "Washington", code: "WA" }, { name: "West Virginia", code: "WV" }, { name: "Wisconsin", code: "WI" }, { name: "Wyoming", code: "WY" }, { name: "U.S. Armed Forces Americas", code: "AA" }, { name: "U.S. Armed Forces Europe", code: "AE" }, { name: "U.S. Armed Forces Pacific", code: "AP" }];
        geo.ca_provinces = [{ code: "AB", name: "Alberta" }, { code: "BC", name: "British Columbia" }, { code: "LB", name: "Labrador" }, { code: "MB", name: "Manitoba" }, { code: "NB", name: "New Brunswick" }, { code: "NF", name: "Newfoundland" }, { code: "NS", name: "Nova Scotia" }, { code: "NU", name: "Nunavut" }, { code: "NW", name: "Northwest Territories" }, { code: "ON", name: "Ontario" }, { code: "PE", name: "Prince Edward Island" }, { code: "QC", name: "Quebec" }, { code: "SK", name: "Saskatchewen" }, { code: "YU", name: "Yukon" }];
        geo.au_states = [{ code: "NT", name: "Northern Territory" }, { code: "QLD", name: "Queensland" }, { code: "SA", name: "South Australia" }, { code: "TAS", name: "Tasmania" }, { code: "VIC", name: "Victoria" }, { code: "WA", name: "Western Australia" }];
        geo.eu_countries = [{ 'name': 'Austria', 'code': 'AT' }, { 'name': 'Belgium', 'code': 'BE' }, { 'name': 'Bulgaria', 'code': 'BG' }, { 'name': 'Croatia', 'code': 'HR' }, { 'name': 'Cyprus', 'code': 'CY' }, { 'name': 'Czech Republic', 'code': 'CZ' }, { 'name': 'Denmark', 'code': 'DK' }, { 'name': 'Estonia', 'code': 'EE' }, { 'name': 'Finland', 'code': 'FI' }, { 'name': 'France', 'code': 'FR' }, { 'name': 'Germany', 'code': 'DE' }, { 'name': 'Greece', 'code': 'GR' }, { 'name': 'Hungary', 'code': 'HU' }, { 'name': 'Ireland', 'code': 'IE' }, { 'name': 'Italy', 'code': 'IT' }, { 'name': 'Latvia', 'code': 'LV' }, { 'name': 'Lithuania', 'code': 'LT' }, { 'name': 'Luxembourg', 'code': 'LU' }, { 'name': 'Malta', 'code': 'MT' }, { 'name': 'Netherlands', 'code': 'NL' }, { 'name': 'Poland', 'code': 'PL' }, { 'name': 'Portugal', 'code': 'PT' }, { 'name': 'Romania', 'code': 'RO' }, { 'name': 'Slovakia', 'code': 'SK' }, { 'name': 'Slovenia', 'code': 'SI' }, { 'name': 'Spain', 'code': 'ES' }, { 'name': 'Sweden', 'code': 'SE' }, { 'name': 'United Kingdom', 'code': 'GB' }];

        if (insertblanks != false) {
            geo.countries.unshift({ name: '', code: '' });
            geo.us_states.unshift({ name: '', code: '' });
            geo.ca_provinces.unshift({ name: '', code: '' })
            geo.au_states.unshift({ name: '', code: '' });
        }

        return geo;
    }

    function isEuCountry(country) {
        if (_.find(getGeographies(false).eu_countries, { code: country }) != null) {
            return true;
        }
        return false;
    }

}
]);


app.service("CouriersService", [function () {

    // Return public API.
    return ({
        getCouriers: getCouriers,
    });

    function getCouriers() {
        var couriers = [{ value: null, name: "Optional" }, { value: "UPS", name: "UPS" }, { value: "FedEx", name: "FedEx" }, { value: "USPS", name: "United States Postal Service" }, { value: "DHLUSA", name: "DHL USA" }, { value: "DHLEcommerce", name: "DHL eCommerce" }, { value: "OnTrac", name: "OnTrac" }, { value: "ICCWorldwide", name: "ICC Worldwide" }, { value: "LaserShip", name: "LaserShip" }, { value: "CanadaPost", name: "Canada Post" }, { value: "AustraliaPost", name: "Australia Post" }, { value: "RoyalMail", name: "Royal Mail" }, { value: "", name: "Other" }];
        return couriers;
    }

}
]);


app.service("CurrenciesService", [function () {

    // Return public API.
    return ({
        getCurrencies: getCurrencies,
    });

    function getCurrencies() {

        var currencies = [{ "code": "AED", "name": "UAE Dirham" }, { "code": "AFN", "name": "Afghani" }, { "code": "ALL", "name": "Lek" }, { "code": "AMD", "name": "Armenian Dram" }, { "code": "ANG", "name": "Netherlands Antillean Guilder" }, { "code": "AOA", "name": "Kwanza" }, { "code": "ARS", "name": "Argentine Peso" }, { "code": "AUD", "name": "Australian Dollar" }, { "code": "AWG", "name": "Aruban Florin" }, { "code": "AZN", "name": "Azerbaijanian Manat" }, { "code": "BAM", "name": "Convertible Mark" }, { "code": "BBD", "name": "Barbados Dollar" }, { "code": "BDT", "name": "Taka" }, { "code": "BGN", "name": "Bulgarian Lev" }, { "code": "BHD", "name": "Bahraini Dinar" }, { "code": "BIF", "name": "Burundi Franc" }, { "code": "BMD", "name": "Bermudian Dollar" }, { "code": "BND", "name": "Brunei Dollar" }, { "code": "BOB", "name": "Boliviano" }, { "code": "BRL", "name": "Brazilian Real" }, { "code": "BSD", "name": "Bahamian Dollar" }, { "code": "BWP", "name": "Pula" }, { "code": "BYR", "name": "Belarussian Ruble" }, { "code": "BZD", "name": "Belize Dollar" }, { "code": "CAD", "name": "Canadian Dollar" }, { "code": "CDF", "name": "Congolese Franc" }, { "code": "CHF", "name": "Swiss Franc" }, { "code": "CLP", "name": "Chilean Peso" }, { "code": "CNY", "name": "Yuan Renminbi" }, { "code": "COP", "name": "Colombian Peso" }, { "code": "CRC", "name": "Costa Rican Colon" }, { "code": "CVE", "name": "Cape Verde Escudo" }, { "code": "CZK", "name": "Czech Koruna" }, { "code": "DJF", "name": "Djibouti Franc" }, { "code": "DKK", "name": "Danish Krone" }, { "code": "DOP", "name": "Dominican Peso" }, { "code": "DZD", "name": "Algerian Dinar" }, { "code": "EGP", "name": "Egyptian Pound" }, { "code": "ERN", "name": "Nakfa" }, { "code": "ETB", "name": "Ethiopian Birr" }, { "code": "EUR", "name": "Euro" }, { "code": "FJD", "name": "Fiji Dollar" }, { "code": "FKP", "name": "Falkland Islands Pound" }, { "code": "GBP", "name": "Pound Sterling" }, { "code": "GEL", "name": "Lari" }, { "code": "GHS", "name": "Ghana Cedi" }, { "code": "GIP", "name": "Gibraltar Pound" }, { "code": "GMD", "name": "Dalasi" }, { "code": "GNF", "name": "Guinea Franc" }, { "code": "GTQ", "name": "Quetzal" }, { "code": "GYD", "name": "Guyana Dollar" }, { "code": "HKD", "name": "Hong Kong Dollar" }, { "code": "HNL", "name": "Lempira" }, { "code": "HRK", "name": "Croatian Kuna" }, { "code": "HTG", "name": "Gourde" }, { "code": "HUF", "name": "Forint" }, { "code": "IDR", "name": "Rupiah" }, { "code": "ILS", "name": "New Israeli Sheqel" }, { "code": "INR", "name": "Indian Rupee" }, { "code": "IQD", "name": "Iraqi Dinar" }, { "code": "ISK", "name": "Iceland Krona" }, { "code": "JMD", "name": "Jamaican Dollar" }, { "code": "JOD", "name": "Jordanian Dinar" }, { "code": "JPY", "name": "Yen" }, { "code": "KES", "name": "Kenyan Shilling" }, { "code": "KGS", "name": "Som" }, { "code": "KHR", "name": "Riel" }, { "code": "KMF", "name": "Comoro Franc" }, { "code": "KRW", "name": "Won" }, { "code": "KWD", "name": "Kuwaiti Dinar" }, { "code": "KYD", "name": "Cayman Islands Dollar" }, { "code": "KZT", "name": "Tenge" }, { "code": "LAK", "name": "Kip" }, { "code": "LBP", "name": "Lebanese Pound" }, { "code": "LKR", "name": "Sri Lanka Rupee" }, { "code": "LRD", "name": "Liberian Dollar" }, { "code": "LTL", "name": "Lithuanian Litas" }, { "code": "LVL", "name": "Latvian lats" }, { "code": "MAD", "name": "Moroccan Dirham" }, { "code": "MDL", "name": "Moldovan Leu" }, { "code": "MGA", "name": "Malagasy Ariary" }, { "code": "MKD", "name": "Denar" }, { "code": "MMK", "name": "Kyat" }, { "code": "MNT", "name": "Tugrik" }, { "code": "MOP", "name": "Pataca" }, { "code": "MRO", "name": "Ouguiya" }, { "code": "MUR", "name": "Mauritius Rupee" }, { "code": "MVR", "name": "Rufiyaa" }, { "code": "MWK", "name": "Kwacha" }, { "code": "MXN", "name": "Mexican Peso" }, { "code": "MYR", "name": "Malaysian Ringgit" }, { "code": "MZN", "name": "Mozambique Metical" }, { "code": "NGN", "name": "Naira" }, { "code": "NIO", "name": "Cordoba Oro" }, { "code": "NOK", "name": "Norwegian Krone" }, { "code": "NPR", "name": "Nepalese Rupee" }, { "code": "NZD", "name": "New Zealand Dollar" }, { "code": "OMR", "name": "Rial Omani" }, { "code": "PEN", "name": "Nuevo Sol" }, { "code": "PGK", "name": "Kina" }, { "code": "PHP", "name": "Philippine Peso" }, { "code": "PKR", "name": "Pakistan Rupee" }, { "code": "PLN", "name": "Zloty" }, { "code": "PYG", "name": "Guarani" }, { "code": "QAR", "name": "Qatari Rial" }, { "code": "RON", "name": "New Romanian Leu" }, { "code": "RSD", "name": "Serbian Dinar" }, { "code": "RUB", "name": "Russian Ruble" }, { "code": "RWF", "name": "Rwanda Franc" }, { "code": "SAR", "name": "Saudi Riyal" }, { "code": "SBD", "name": "Solomon Islands Dollar" }, { "code": "SCR", "name": "Seychelles Rupee" }, { "code": "SEK", "name": "Swedish Krona" }, { "code": "SGD", "name": "Singapore Dollar" }, { "code": "SHP", "name": "Saint Helena Pound" }, { "code": "SLL", "name": "Leone" }, { "code": "SOS", "name": "Somali Shilling" }, { "code": "SRD", "name": "Surinam Dollar" }, { "code": "STD", "name": "Dobra" }, { "code": "SZL", "name": "Lilangeni" }, { "code": "THB", "name": "Baht" }, { "code": "TJS", "name": "Somoni" }, { "code": "TMT", "name": "Turkmenistan New Manat" }, { "code": "TND", "name": "Tunisian Dinar" }, { "code": "TOP", "name": "Pa?anga" }, { "code": "TRY", "name": "Turkish Lira" }, { "code": "TTD", "name": "Trinidad and Tobago Dollar" }, { "code": "TWD", "name": "New Taiwan Dollar" }, { "code": "TZS", "name": "Tanzanian Shilling" }, { "code": "UAH", "name": "Hryvnia" }, { "code": "UGX", "name": "Uganda Shilling" }, { "code": "USD", "name": "US Dollar" }, { "code": "UYU", "name": "Peso Uruguayo" }, { "code": "UZS", "name": "Uzbekistan Sum" }, { "code": "VEF", "name": "Bolivar" }, { "code": "VND", "name": "Dong" }, { "code": "VUV", "name": "Vatu" }, { "code": "WST", "name": "Tala" }, { "code": "XAF", "name": "CFA Franc BEAC" }, { "code": "XCD", "name": "East Caribbean Dollar" }, { "code": "XOF", "name": "CFA Franc BCEAO" }, { "code": "XPF", "name": "CFP Franc" }, { "code": "YER", "name": "Yemeni Rial" }, { "code": "ZAR", "name": "Rand" }, { "code": "ZMW", "name": "Zambian kwacha" }, { "code": "ZWL", "name": "Zimbabwe Dollar" }];

        return currencies;
    }

}
]);


app.service("TimezonesService", [function () {

    // Return public API.
    return ({
        getTimezones: getTimezones,
    });

    function getTimezones() {

        var timezones = ["Asia/China", "America/Alaska", "America/Atlantic_Time", "America/Arizona", "America/Central_Time", "America/Eastern_Time", "America/Hawaii", "America/Mountain_Time", "America/Newfoundland", "America/Pacific_Time", "Europe/Central", "Europe/Eastern", "Europe/GMT", "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Asmera", "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville", "Africa/Bujumbura", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar", "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown", "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Kampala", "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome", "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo", "Africa/Sao_Tome", "Africa/Timbuktu", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage", "America/Anchorage", "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/ComodRivadavia", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan", "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba", "America/Asuncion", "America/Atikokan", "America/Atka", "America/Bahia", "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Buenos_Aires", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Catamarca", "America/Cayenne", "America/Cayman", "America/Chicago", "America/Chicago", "America/Chihuahua", "America/Coral_Harbour", "America/Cordoba", "America/Costa_Rica", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Denver", "America/Detroit", "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Ensenada", "America/Fort_Wayne", "America/Fortaleza", "America/Glace_Bay", "America/Godthab", "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Indianapolis", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Jujuy", "America/Juneau", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/Knox_IN", "America/La_Paz", "America/Lima", "America/Los_Angeles", "America/Los_Angeles", "America/Louisville", "America/Maceio", "America/Managua", "America/Manaus", "America/Marigot", "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Mendoza", "America/Menominee", "America/Merida", "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montreal", "America/Montserrat", "America/Nassau", "America/New_York", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Ojinaga", "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Phoenix", "America/Port_of_Spain", "America/Port-au-Prince", "America/Porto_Acre", "America/Porto_Velho", "America/Puerto_Rico", "America/Puerto_Rico", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute", "America/Rio_Branco", "America/Rosario", "America/Santa_Isabel", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/Shiprock", "America/St_Barthelemy", "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver", "America/Virgin", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey", "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Macquarie", "Antarctica/Mawson", "Antarctica/McMurdo", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/South_Pole", "Antarctica/Syowa", "Antarctica/Vostok", "Arctic/Longyearbyen", "Asia/Aden", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Ashkhabad", "Asia/Baghdad", "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Calcutta", "Asia/Choibalsan", "Asia/Chongqing", "Asia/Chungking", "Asia/Colombo", "Asia/Dacca", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Gaza", "Asia/Harbin", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Istanbul", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kashgar", "Asia/Kathmandu", "Asia/Katmandu", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macao", "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qyzylorda", "Asia/Rangoon", "Asia/Riyadh", "Asia/Saigon", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Tel_Aviv", "Asia/Thimbu", "Asia/Thimphu", "Asia/Tokyo", "Asia/Ujung_Pandang", "Asia/Ulaanbaatar", "Asia/Ulan_Bator", "Asia/Urumqi", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary", "Atlantic/Cape_Verde", "Atlantic/Faeroe", "Atlantic/Faroe", "Atlantic/Jan_Mayen", "Atlantic/Madeira", "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/St_Helena", "Atlantic/Stanley", "Australia/ACT", "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Canberra", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/LHI", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/North", "Australia/NSW", "Australia/Perth", "Australia/Queensland", "Australia/South", "Australia/Sydney", "Australia/Tasmania", "Australia/Victoria", "Australia/West", "Australia/Yancowinna", "Europe/Amsterdam", "Europe/Andorra", "Europe/Athens", "Europe/Belfast", "Europe/Belgrade", "Europe/Berlin", "Europe/Bratislava", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar", "Europe/Guernsey", "Europe/Helsinki", "Europe/Isle_of_Man", "Europe/Istanbul", "Europe/Jersey", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Lisbon", "Europe/Ljubljana", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Mariehamn", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Nicosia", "Europe/Oslo", "Europe/Paris", "Europe/Podgorica", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/San_Marino", "Europe/Sarajevo", "Europe/Simferopol", "Europe/Skopje", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Tiraspol", "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vatican", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw", "Europe/Zagreb", "Europe/Zaporozhye", "Europe/Zurich", "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion", "Pacific/Apia", "Pacific/Auckland", "Pacific/Chatham", "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji", "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam", "Pacific/Honolulu", "Pacific/Honolulu", "Pacific/Johnston", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro", "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau", "Pacific/Pitcairn", "Pacific/Ponape", "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Saipan", "Pacific/Samoa", "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Truk", "Pacific/Wake", "Pacific/Wallis", "Pacific/Yap", "UTC"];

        return timezones;
    }

}]);


app.service("HelperService", [function () {

    // Return public API.
    return ({
        isAdmin: isAdmin,
    });

    function isAdmin() {

        var token = localStorage.getItem("token");
        if (token) {
            if (token.substring(0, 5) == "admin") {
                return true;
            }
        }
        return false;
    }

}]);
