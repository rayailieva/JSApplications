function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rknF5OQif";
    const kinveyAppSecret = "ff25de2bc9064996a563afac5712fdba";
    const kinveyAppAuthHeaders = {
        "Authorization": "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    // Clear user auth information at startup
    sessionStorage.clear();

    showHideMenuLinks();
    showView('viewWelcome');

    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    // Bind the navigation menu links
    $('#linkCatalog').click(showCatalogview);


    // Bind the form submit buttons
    $("#loginForm").submit(loginUser);
    $("#registerForm").submit(registerUser);
    $('#linkMenuLogout').click(logoutUser);


    function showCatalogview() {
        showView('viewCatalog');
    }



    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHideMenuLinks() {
        $("#linkHome").show();
        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
          $('#menu').hide();
          $('#profile').hide();
          $('#viewCatalog').hide();
          $('#viewSubmit').hide();
          $('#viewMyPosts').hide();
          $('#viewEdit').hide();
          $('#viewComments').hide();


        } else {
            // We have logged in user
            $('#menu').show();
            $('#profile').show();
            $('#viewWelcome').hide();
            $('#viewCatalog').show();
            $('#viewSubmit').show();
            $('#viewMyPosts').show();
            $('#viewEdit').show();
            $('#viewComments').show();
        }
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function loginUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#loginForm input[name=username]').val(),
            password: $('#loginForm input[name=password]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });

        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();

            showInfo('Login successful.');
        }
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#username').text("Welcome, " + username + "!");
    }


    function registerUser(event) {
        event.preventDefault();
        const kinveyRegisterUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
        let userData = {
            username: $('#registerForm input[name=username]').val(),
            password: $('#registerForm input[name=passwd]').val(),
            repeatPassword: $('#registerForm input[name=repeatPass]').val(),

        };
        $.ajax({
            method: "POST",
            url: kinveyRegisterUrl,
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();

            showInfo('User registration successful.');
        }
    }

    function logoutUser() {
        sessionStorage.clear();
        showHideMenuLinks();
        showView('viewWelcome');
        showInfo('Logout successful.');
    }



}