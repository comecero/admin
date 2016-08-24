$("document").ready(function () {

    // Get the token
    var token = localStorage.getItem("token");

    // Define the host
    var host = "api.comecero.com";
    if (window.location.hostname.indexOf("admin-staging.") > -1) {
        host = "api-staging.comecero.com";
    }

    // Get the query parameters
    var params = utils.getPageQueryParameters();

    // Define the URL
    var url = "https://" + host + "/api/v1/notifications/" + params["notification_id"] + "?show=body";

    // Make a request to get the notification body
    if (params["notification_id"]) {
        $.ajax
          ({
              type: "GET",
              url: url,
              beforeSend: function (xhr) {
                  xhr.setRequestHeader('Authorization', "Bearer " + token);
              },
              success: function (data) {

                  document.open();
                  document.write(data.body);
                  document.close();

              }
          });
    }

});