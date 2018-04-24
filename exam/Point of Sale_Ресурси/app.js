function startApp() {

    //Kinvey info
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_SkK_rAxnG";
    const kinveyAppSecret = "18af3c3715c144b08bdf396e998b1c87";
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

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
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

    function showHideMenuLinks() {
        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
            $('#welcome-section').show();
            $('#profile').hide();
            $('#create-receipt-view').hide();
            $('#all-receipt-view').hide();
            $('#receipt-details-view').hide();

        } else {
            // We have logged in user
            $('#welcome-section').hide();
            // $('.welcome-forms').hide();
            $('#profile').show();
            $('#create-receipt-view').show();
            $('#all-receipt-view').hide();
            $('#receipt-details-view').hide();
        }
    }

    // Bind the form submit buttons
    $("#login-form").submit(loginUser);
    $("#register-form").submit(registerUser);
    $('.logout').click(logoutUser);
    $('#create-entry-form').submit(createEntry);

    // Bind the navigation menu links
    $("#overview").click(showOverviewScreen);
    $("#editor").click(displayCurrentReceipt);

    function showOverviewScreen() {
        showView('all-receipt-view');
        $('#create-receipt-view').hide();
    }

    function showCreateScreen() {
        $('#create-receipt-view').show();
        $('#all-receipt-view').hide();
        $('#receipt-details-view').hide();
    }


    function registerUser(event) {
        event.preventDefault();

        let usernameVal = $('#username-register').val();
        let passwordVal = $('#password-register').val();
        let repeatPasswordVal = $('#password-register-check').val();

        if (usernameVal.length < 5) {
            showError('Username must be at least 5 characters long!');
            return;
        }
        if (passwordVal.length === 0 || repeatPasswordVal.length === 0) {
            showError('Password must be at least 1 character long!')
        }
        if (passwordVal !== repeatPasswordVal) {
            showError('Password must match!');
            return;
        }
        let userData = {
            username: usernameVal,
            password: passwordVal,
            passwordRegisterCheck: repeatPasswordVal
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
            showCreateScreen();
            showInfo('User registration successful.');
        }
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#cashierName').text(username);
    }

    function loginUser(event) {
        event.preventDefault();

        let usernameVal = $('#username-login').val();
        let passwordVal = $('#password-login').val();

        if (usernameVal.length < 5) {
            showError('Username must be at least 5 characters long!');
            return;
        }
        if (passwordVal.length < 1) {
            showError('Password must be at least 1 character long!');
            return;
        }

        let userData = {
            username: usernameVal,
            password: passwordVal
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
            showCreateScreen();
            showInfo('Login successful.');
        }
    }

    function logoutUser() {
        sessionStorage.clear();
        showHideMenuLinks();
        showInfo('Logout successful.');
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
    }

    function displayCurrentReceipt() {

        showCreateScreen();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/receipts?query={"_acl.creator":"${sessionStorage.getItem('_id')}","active":true}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadActiveSuccess,
            error: handleAjaxError
        });

        function loadActiveSuccess() {

            $.ajax({
                method: "GET",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `entries?query={"receiptId":"5ad364ad2161191ef379b8ca"}`,
                headers: getKinveyUserAuthHeaders(),
                success: loadEntriesSuccess,
                error: handleAjaxError
            });

            function loadEntriesSuccess(entries) {


                for(let entry of entries){

                    let deleteLink = $('<a href="#">&#10006;</a>')
                        .click(function () { deleteEntry(entry)});

                    let subTotal = Number(entry.qty * entry.price);
                    let total = Number($('#totalPrice').val());

                    $('#active-entries').append($('<div class="row">')
                        .append($('<div class="col wide">').text(entry.type))
                        .append($(' <div class="col wide">').text(entry.qty))
                        .append($('<div class="col wide">').text(entry.price))
                        .append($('<div class="col wide">').text(subTotal))
                        .append(deleteLink));

                    total+=subTotal;

                    $('#totalPrice').append(total);
                }
            }
        }
    }


    function createEntry(event) {
        event.preventDefault();

        let entryData = {

            type: $('#create-entry-form input[name=type]').val(),
            qty: Number($('#create-entry-form input[name=qty]').val()),
            price: Number($('#create-entry-form input[name=price]').val()),
            receiptId: '5ad364ad2161191ef379b8ca'
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/entries",
            headers: getKinveyUserAuthHeaders(),
            data: entryData,
            success: addEntrySuccess,
            error: handleAjaxError
        });

        function addEntrySuccess(entry) {
            showInfo('Entry added');
            $('form input[type=text]').val('');
            $('#totalPrice').empty();

            let deleteLink = $('<a href="#">&#10006;</a>')
            .click(function () { deleteEntry(entry)});

            let subTotal = Number(entry.qty * entry.price);
            let total = Number($('#totalPrice').val());

            $('#active-entries').append($('<div class="row">')
                .append($('<div class="col wide">').text(entry.type))
                .append($(' <div class="col wide">').text(entry.qty))
                .append($('<div class="col wide">').text(entry.price))
                .append($('<div class="col wide">').text(subTotal))
                .append(deleteLink));

            total+=subTotal;

            $('#totalPrice').append(total);
            showCreateScreen();
        }
    }

    function deleteEntry(entry) {
        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/entries/" + entry._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteEntrySuccess,
            error: handleAjaxError
        });

        function deleteEntrySuccess() {
            showInfo('Entry removed');
            showCreateScreen();
        }
    }
}

