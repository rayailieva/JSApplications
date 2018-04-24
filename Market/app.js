function startApp() {

    //KINVEY
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_HJO9s9XsG";
    const kinveyAppSecret = "03247a1b258348d7b4d094fec45ad02f";
    const kinveyAppAuthHeaders = {
        "Authorization": "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    // Clear user auth information at startup
    sessionStorage.clear();
    showHomeView();

    showHideMenuLinks();

    $('#loadingBox').hide();
    $('#infoBox').hide();
    $('#errorBox').hide();

    // Bind the navigation menu links
    $("#linkMenuAppHome").click(showHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);
    $("#linkMenuUserHome").click(showUserHomeView);
    $("#linkMenuShop").click(showShop);
    $("#linkUserHomeShop").click(showShop);
    $("#linkMenuCart").click(showUserCart);
    $("#linkUserHomeCart").click(showUserCart);
    $("#linkMenuLogout").click(logoutUser);

    function showHomeView() {
        showView('viewAppHome')
    }
    function showLoginView() {
        showView('viewLogin')
    }
    function showRegisterView() {
        showView('viewRegister')
    }
    function showUserHomeView() {
        showView('viewUserHome')
    }
    function showShopView() {
        showView('viewShop')
    }
    function showCartView() {
        showView('viewCart')
    }

    function showHideMenuLinks() {
        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
            $('.anonymous').show();
            $('.useronly').hide();
        } else {
            // We have logged in user
            $('.anonymous').hide();
            $('.useronly').show();
        }
    }

    // Bind the form submit buttons
    $('#formLogin').submit(loginUser);
    $('#formRegister').submit(registerUser);

    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

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
            name: $('#formRegister input[name=name]').val()
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
            showUserHomeView();
            showInfo('User registration successful.');
        }
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#spanMenuLoggedInUser').text("Welcome, " + username + "!");
        $('#viewUserHomeHeading').text("Welcome, " + username + "!");
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
            showUserHomeView();
            showInfo('Login successful.');
        }
    }

    function logoutUser() {
        sessionStorage.clear();
        showHideMenuLinks();
        showHomeView();
        showInfo('Logout successful.');
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
    }

    function showShop() {
        showShopView();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/products",
            headers: getKinveyUserAuthHeaders(),
            success: showShopSuccess,
            error: handleAjaxError
        });

        function showShopSuccess(products) {
            $('#shopProducts table tbody').empty();

            for(let product of products){
                let purchaseButton =  $('<button>').text('Purchase').click(() => purchaseItem(product));

                $('#shopProducts table tbody').append($('<tr>')
                    .append($('<td>').text(product.name))
                    .append($('<td>').text(product.description))
                    .append($('<td>').text(product.price.toFixed(2)))
                    .append($('<td>').append(purchaseButton)));
            }
        }
    }

    function showUserCart() {
        showCartView();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/" + sessionStorage.getItem('id'),
            headers: getKinveyUserAuthHeaders(),
            success: showUserCartSuccess,
            error: handleAjaxError
        });

        function showUserCartSuccess(products) {
            $('#cartProducts table tbody').empty();

            for(let product of products){

                let discardLink = $('<button>').text('Discard');

                $('#cartProducts table tbody').append($('<td>')
                    .append($('<td>').text(product.name))
                    .append($('<td>').text(product.description))
                    .append($('<td>').text('1'))
                    .append($('<td>').text('2'))
                    .append($('<td>').append(discardLink)));

            }
        }
    }

    function purchaseItem(product) {


    }


}