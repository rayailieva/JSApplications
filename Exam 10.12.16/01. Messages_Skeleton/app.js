function startApp() {

    //Kinvey info
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_ry8DE1-jz";
    const kinveyAppSecret = "b9f55569e59f4ef7a29c108c7bc725e5";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    // Clear user auth information at startup
    sessionStorage.clear();

    showHideMenuLinks();
    showView('viewAppHome');

    // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    $('#loadingBox').hide();
    $('#infoBox').hide();
    $('#errorBox').hide();


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


    // Bind the navigation menu links
    $("#linkMenuAppHome").click(showHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);
    $("#linkMenuUserHome").click(showUserHomeView);

    $("#linkMenuMyMessages").click(showMyMessages);
    $("#linkUserHomeMyMessages").click(showMyMessages);


    $("#linkMenuArchiveSent").click(showArchiveView);
    $("#linkUserHomeArchiveSent").click(showArchiveView);

    $("#linkMenuSendMessage").click(showSendMessageView);
    $("#linkUserHomeSendMessage").click(showSendMessageView);

    $("#linkMenuLogout").click(logoutUser);

    // Bind the form submit buttons
    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);
    $('#formSendMessage').submit(sendMessage);

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


    function showHomeView() {
        showView('viewAppHome');
    }
    function showLoginView() {
        showView('viewLogin');
    }
    function showRegisterView() {
        showView('viewRegister');
    }
    function showUserHomeView() {
        showView('viewUserHome');
    }
    function showMyMessagesView() {
        showView('viewMyMessages');
    }
    function showArchiveView() {
        showView('viewArchiveSent');
    }
    function showSendMessageView() {
        showView('viewSendMessage');
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

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
    }

    function showMyMessages() {

        showMyMessagesView();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey +`/messages?query={"recipient_username":"${sessionStorage.getItem('username')}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMessagesSuccess,
            error: handleAjaxError
        });

        function loadMessagesSuccess(messages) {

            $('#myMessages table tbody').empty();

            for(let message of messages){
                $('#myMessages table tbody')
                    .append($('<tr>')
                        .append($('<td>').text(formatSender(message.sender_name, message.sender_username)))
                        .append($('<td>').text(message.text))
                        .append($('<td>').text(formatDate(message._kmd.lmt)))
                    );
            }
        }
    }

    function sendMessage(event) {
        event.preventDefault();

        let messageData = {
            sender_username: sessionStorage.getItem('username'),
            sender_name: sessionStorage.getItem('name'),
            recipient_username: $('#formSendMessage select').val(),
            text: $('#msgText').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/messages",
            headers: getKinveyUserAuthHeaders(),
            data: messageData,
            success: sendMessageSuccess,
            error: handleAjaxError
        });

        function sendMessageSuccess() {
            $('form input[type=text], form input[type=password]').val('');
            showOutbox();
            showInfo('Message sent.');
        }
        
    }

    function deleteMessage(id) {
        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/messages/" + id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteMessageSuccess,
            error: handleAjaxError
        });

        function deleteMessageSuccess() {
            showOutbox();
            showInfo('Message deleted.');
        }
    }

    function showOutbox() {

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/messages?query={"sender_username":"${sessionStorage.getItem('username')}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: showOutboxSuccess,
            error: handleAjaxError
        });

        function showOutboxSuccess(messages) {
            $('#sentMessages table tbody').empty();

            for(let message of messages){
                let deleteLink = $('<button>').text('Delete').click(() => deleteMessage(message._id));
                $('#sentMessages table tbody')
                    .append($('<tr>')
                        .append($('<td>').text(message.recipient_username))
                        .append($('<td>').text(message.text))
                        .append($('<td>').text(formatDate(message._kmd.lmt)))
                        .append($('<td>').append(deleteLink))
                    )
            }

            showArchiveView();
        }
    }
}