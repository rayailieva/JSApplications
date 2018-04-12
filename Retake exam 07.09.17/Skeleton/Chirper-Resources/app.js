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

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    // Bind the navigation menu links
    $("#homeBtn").click(showHomeView);
    $("#discoverBtn").click(viewDiscover);
    $("#meBtn").click(showMeView);
    $('#toLogIn').click(showLoginView);
    $('#toRegister').click(showRegisterView);

    function showLoginView() {
        showView('viewLogin');
        $('#viewRegister').hide();
    }

    function showRegisterView() {
        showView('viewRegister');
        $('#viewLogin').hide();
    }

    // Bind the form submit buttons
    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);
    $('#logoutBtn').click(logoutUser);

    function showHideMenuLinks() {
       // $("#linkHome").show();
        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
            $("#viewLogin").hide();
            $("#viewRegister").show();
            $("#viewFeed").hide();
            $("#viewDiscover").hide();
            $("#viewMe").hide();
            $("#viewProfile").hide();
            $("#menu").hide();
        } else {
            // We have logged in user
            $("#viewLogin").hide();
            $("#viewRegister").hide();
            $("#viewFeed").show();
            $("#viewDiscover").hide();
            $("#viewMe").hide();
            $("#viewProfile").hide();
            $("#menu").show();
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

    function registerUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            repeatPass: $('#formRegister input[name=repeatPass]').val(),
            subscriptions: []

        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            $('form input[type=text], form input[type=password]').val('');
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showInfo('User registration successful.');
        }
    }


    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#titleBarUser').text('Welcome, ' + username + ' !');
        $('#titleName').text('Welcome, ' + username + ' !');


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
        showHomeView();
        showInfo('Logout successful.');
    }

    function showHomeView() {
        showView('viewFeed');
        $('#viewDiscover').hide();
        $('#viewMe').hide();
        $('#formSubmitChirp').submit(postChirp);
    }

    function showMeView() {
        showView('viewMe');
        $('#viewFeed').hide();
        $('#viewDiscover').hide();
    }

    function showDiscoverView() {
        showView('viewDiscover');
        $('#viewFeed').hide();
        $('#viewMe').hide();
    }

    function getKinveyUserAuthHeaders() {
        return {
            "Authorization": "Kinvey " + sessionStorage.getItem('authToken')
        };
    }

    function calcTime(dateIsoFormat) {
        let diff = new Date - (new Date(dateIsoFormat));
        diff = Math.floor(diff / 60000);
        if (diff < 1) return 'less than a minute';
        if (diff < 60) return diff + ' minute' + pluralize(diff);
        diff = Math.floor(diff / 60);
        if (diff < 24) return diff + ' hour' + pluralize(diff);
        diff = Math.floor(diff / 24);
        if (diff < 30) return diff + ' day' + pluralize(diff);
        diff = Math.floor(diff / 30);
        if (diff < 12) return diff + ' month' + pluralize(diff);
        diff = Math.floor(diff / 12);
        return diff + ' year' + pluralize(diff);
        function pluralize(value) {
            if (value !== 1) return 's';
            else return '';
        }
    }


    function viewDiscover() {
        showDiscoverView();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: getKinveyUserAuthHeaders(),
            success: showDiscoverSuccess,
            error: handleAjaxError
        });

       function showDiscoverSuccess(users) {

           $('#userlist').empty();

           for(let user of users){
               $('#userlist').append($('<div class="userbox">'))
                   .append($('<div>')
                       .append($('<a href="#" class="chirp-author">').text(user.username).click(() => deleteMessage(message._id)))
                       .append(($('<div class="user-details">'))));
           }
       }


    }

    function postChirp(event) {
        event.preventDefault();

        let postData= {
            text: $('#formSubmitChirp textarea[name=text]').val(),
            author: localStorage.getItem('username')

        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/chirps",
            headers: getKinveyUserAuthHeaders(),
            data: postData,
            success: postChirpSuccess,
            error: handleAjaxError
        });
        
        function postChirpSuccess(response) {
            showInfo('Chirp published.');
            showMeView();
            showLoadedChirps();
        }
        
        function showLoadedChirps() {

            let username = localStorage.getItem('username');
            $.ajax({
                method: "GET",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `chirps?query={"author":"${username}"}&sort={"_kmd.ect": 1}`,
                headers: getKinveyUserAuthHeaders(),
                success: loadChirpsSuccess,
                error: handleAjaxError
            });

            function loadChirpsSuccess(chirps) {
                $('#loadedchirps').empty();

                for(let chirp of chirps){
                    $('#loadedchirps')
                        .append($('<div>').text(chirp));
                }
            }
        }
    }

}