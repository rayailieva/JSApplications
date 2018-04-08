function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_ryV7Y9wiG";
    const kinveyAppSecret = "e17d18bba2d94740b74d79cc16a01503";
    const kinveyAppAuthHeaders = {
        "Authorization": "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    // Clear user auth information at startup
    sessionStorage.clear();

    showHideMenuLinks();

    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function () {
        $(this).fadeOut();
    });

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

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    // Bind the navigation menu links
    $("#toLogIn").click(showLoginView);
    $("#toRegister").click(showRegisterView);
    $("#homeBtn").click(showFeed);
    $("#discoverBtn").click(showDiscoverView);
    $("#meBtn").click(showMeView);
    $("#logoutBtn").click(logoutUser);

    // Bind the form submit buttons
    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);

    function showLoginView() {
        showView('viewLogin');
        $('#viewRegister').hide();

        //$('#formLogin').trigger('reset');
    }
    function showRegisterView() {
        showView('viewRegister');
        $('#viewLogin').hide();
    }

    function showDiscoverView() {
      showView('viewDiscover');
    }

    function showMeView() {
        showView('viewMe');
    }

    function showFeed() {
        showView('viewFeed');
    }

    function showHideMenuLinks() {

        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
            $('#menu').hide();
            $('#viewLogin').hide();
            $('#viewFeed').hide();
            $('#viewDiscover').hide();
            $('#viewMe').hide();
            $('#viewProfile').hide();


        } else {
            // We have logged in user
            $('#menu').show();
            $('#viewLogin').hide();
            $('#viewRegister').hide();
            $('#viewFeed').show();
            $('#viewDiscover').show();
            $('#viewMe').show();
            $('#viewProfile').show();
        }
    }

    function registerUser(event) {
        event.preventDefault();

        const kinveyRegisterUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val(),
            repeatPassword: $('#formRegister input[name=repeatPass]').val()
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
            $('form input[type=text], form input[type=password]').val('');
        }
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#titleBarUser').text(`${username}`);

    }
    function loginUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val()
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
            $('form input[type=text], form input[type=password]').val('');
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showInfo('Login successful.');

        }
    }

    function logoutUser() {
        sessionStorage.clear();
        showHideMenuLinks();
        showInfo('Logout successful.');
        $('#viewLogin').show();
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
    }



}