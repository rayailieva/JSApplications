function startApp() {

    //Kinvey info
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rknF5OQif";
    const kinveyAppSecret = "ff25de2bc9064996a563afac5712fdba";
    const kinveyAppAuthHeaders = {
        "Authorization": "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    // Clear user auth information at startup
    sessionStorage.clear();

    showHideMenuLinks();

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

    function showHideMenuLinks() {
        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
            $('#menu').hide();
            $('#profile').hide();
            $('#viewWelcome').show();
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

    // Bind the navigation menu links
    $("#catalogBtn").click(showCatalogScreen);
    $("#submitBtn").click(showSubmitLinkView);
    $("#myPostsBtn").click(showMyPostsView);

    function showCatalogView() {
        showView('viewCatalog');
        $('#viewSubmit').hide();
        $('#viewMyPosts').hide();
        $('#viewEdit').hide();
        $('#viewComments').hide();

    }
    function showSubmitLinkView() {
        showView('viewSubmit');
        $('#viewCatalog').hide();
        $('#viewMyPosts').hide();
        $('#viewEdit').hide();
        $('#viewComments').hide();
    }
    function showMyPostsView() {
        showView('viewMyPosts');
        $('#viewCatalog').hide();
        $('#viewSubmit').hide();
        $('#viewEdit').hide();
        $('#viewComments').hide();
    }

    // Bind the form submit buttons
    $("#loginForm").submit(loginUser);
    $("#registerForm").submit(registerUser);
    $('#logoutBtn').click(logoutUser);
    $('#submitForm').submit(submitPost);

    function registerUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#registerForm input[name=username]').val(),
            password: $('#registerForm input[name=password]').val(),
            repeatPass: $('#registerForm input[name=repeatPass]').val()
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
            showCatalogScreen();
            showInfo('User registration successful.');
        }
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#username').text(username);

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
            $('form input[type=text], form input[type=password]').val('');
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showCatalogScreen();
            showInfo('Login successful.');
        }
    }

    function logoutUser() {
        sessionStorage.clear();
        showHideMenuLinks();
        showInfo('Logout successful.');
    }

    //Helper function
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

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
    }

    function showCatalogScreen() {
        showCatalogView();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey +`/posts?query={}&sort={"_kmd.ect": -1}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadCatalogSuccess,
            error: handleAjaxError
        });
        
        function loadCatalogSuccess(posts) {

            $('.posts').empty();
            let counter = 0;

            for(let post of posts){

                counter++;

                $('.posts').append(($('<article class="post">')
                    .append($('<div class="col rank">').append($('<span>').text(counter))))

                    .append($('<div class="col thumbnail">').append($(`<a href="${post.url}">`)
                     .append($(`<img src="${post.imageUrl}">`))))

                    .append($('<div class="post-content">').append($('<div class="title">')
                        .append($('<a>').text(post.title))))

                    .append($('<div class="details">')
                        .append($('<div class="info">').text(`submitted ${calcTime(post._kmd.ect)} day ago by ${post.author}`)))

                    .append($('<div class="controls">')
                    .append($('<ul>').append($('<li class="action"><a class="commentsLink" href="#">comments</a></li>').click(function () {
                        loadComments(post)}))
                        .append($('<li class="action"><a class="editLink" href="#">edit</a></li>').click(function () {
                            loadPostForEdit(post)}))
                        .append($('<li class="action"><a class="deleteLink" href="#">delete</a></li>').click(function () {
                            deletePost(post)
                        })))));
            }
        }
    }

    function submitPost(event) {
        event.preventDefault();

        let postData = {
            author: sessionStorage.getItem('username'),
            url: $('#submitForm input[name=url]').val(),
            title: $('#submitForm input[name=title]').val(),
            imageUrl: $('#submitForm input[name=image]').val(),
            description : $('#submitForm textarea[name=comment]').val(),
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/posts",
            headers: getKinveyUserAuthHeaders(),
            data: postData,
            success: createPostSuccess,
            error: handleAjaxError
        });

        function createPostSuccess() {
            showCatalogScreen();
            showInfo('Post created.');
            console.log('works!');
        }
    }

    function loadPostForEdit(post) {
        showView('viewEdit');
        $('#viewCatalog').hide();
        $('#viewEdit').show();

        $('#editPostForm').submit(editPost);


        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/posts/" + post._id,
            headers: getKinveyUserAuthHeaders(),
            success: loadPostForEditSuccess,
            error: handleAjaxError
        });

        function loadPostForEditSuccess(post) {
            $('#editPostForm input[name=url]').val(post.url);
            $('#editPostForm input[name=title]').val(post.title);
            $('#editPostForm input[name=image]').val(post.imageUrl);
            $('#editPostForm textarea[name=description]').val(post.description);

           // showView('viewEdit');
        }

        function editPost(event) {
            event.preventDefault();

            let postData = {
                author: sessionStorage.getItem('username'),
                url: $('#editPostForm input[name=url]').val(),
                title: $('#editPostForm input[name=title]').val(),
                imageUrl: $('#editPostForm input[name=image]').val(),
                description : $('#editPostForm textarea[name=comment]').val(),
            };

            $.ajax({
                method: "PUT",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/posts/" + post._id,
                headers: getKinveyUserAuthHeaders(),
                data: postData,
                success: editPostSuccess,
                error: handleAjaxError
            });

            function editPostSuccess(response) {
                showCatalogScreen();
                $('#viewEdit').hide();
                showInfo(`Post ${post.title} updated`);
            }
        }
    }

    function deletePost(post) {

        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/posts/" + post._id,
            headers: getKinveyUserAuthHeaders(),
            success: deletePostSuccess,
            error: handleAjaxError
        });

        function deletePostSuccess(response) {
            showCatalogScreen();
            showInfo('Post deleted.');
            console.log('here!');
        }
    }

   


}