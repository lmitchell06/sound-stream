var inRequest = false;

// Runs on load of this file
$(function () {
    // Modal Button Bindings
    $("#open-search-channels-modal").click(openSearchChannelsModal);
});

function loggedIn() {
    return $("#user-tag").attr("lock") != undefined;
}

function openSearchChannelsModal() {
    let searchChannelsModal = $("#search-channels-modal");
    // Open the modal
    searchChannelsModal.modal();

    // Bind elements
    let channelNameText = $("#search-channels-name-text-input");
    bindSearchDisplay(3);
    $("#create-channel-button").click(displayCreateChannelForm());
}

function bindSearchDisplay(minLength) {
    // Get fields
    let channelNameText = $("#search-channels-name-text-input");
    let submitWarning = $("#search-min-length-warning-text");
    let submitWarningNumber = $("#search-min-length-number");
    let resultsInfoText = $("#results-info");
    let listElement = $("#results-list");
    let createChannelButton = $("#create-channel-button");

    // Set binding to on change event for textfield
    channelNameText.on("input propertychange", (e) => {
        let textLength = channelNameText.val().length;
        // Enable the button if it fulfills minimum length
        if (textLength < minLength) {
            submitWarning.show();
            submitWarningNumber.text(minLength - textLength);
            resultsInfoText.hide();
            listElement.hide();
            displayCreateChannelForm(false);
            console.log(channelNameText.val())
        }
        else {
            submitWarning.hide();
            searchChannels(channelNameText.val());
            resultsInfoText.show();
            listElement.show();
        }
    });
}

function displayCreateChannelForm(show) {
    let channelNameText = $("#search-channels-name-text-input");
    let firstTrackUrlInputGroup = $("#create-channel-track-text-input-group");
    let createChannelButton = $("#create-channel-submit-button");
    let submitWarning = $("#field-empty-warning-text");
    let errorWarning = $("#video-not-found-text");
    
    if (show) {
        firstTrackUrlInputGroup.show();
        bindChannelSubmitButtonDisable();
        createChannelButton.text("Create #" + channelNameText.val());
        createChannelButton.show();
        createChannelButton.click(createChannelSubmit);
        submitWarning.show();
    }
    else {
        firstTrackUrlInputGroup.hide();
        createChannelButton.hide();
        submitWarning.hide();
        errorWarning.hide();
    }
}

function createChannelSubmit() {
    if (loggedIn()) {
        // Get fields
        let channelName = $("#search-channels-name-text-input").val();
        let firstTrackUrl = $("#create-channel-track-text-input").val();
        createNewChannel(channelName, firstTrackUrl);
    }
    else {
        swal({
            title: 'Login to Create Channels',
            text: 'To create channels you must either login or sign up',
            type: 'warning',
            confirmButtonColor: "#765285"
        });
    }
}

function bindChannelSubmitButtonDisable() {
    // Get fields
    let submitButton = $("#create-channel-submit-button");
    let firstTrackUrlText = $("#create-channel-track-text-input");
    let submitWarning = $("#video-not-found-text");

    // Set binding to on change event for textfield
    firstTrackUrlText.on("input propertychange", (e) => {
        let textLength = firstTrackUrlText.val().length;
        // Enable the button if it fulfills minimum length
        if (validateYouTubeUrl(firstTrackUrlText.val())) {
            submitWarning.hide();
            submitButton.removeAttr('disabled');
        }
        else { 
            submitWarning.show();
            submitButton.attr('disabled', 'disabled');
        }
    });
}

function searchChannels(query) {
    $.post('/search-channels', {
        query: query
    }, function(data, status) {
        // Callback function
        console.log(data.message);
        console.log(data.channels);

        let channels = data.channels;
        let listElement = $("#results-list");
        let displaying = 0;
        let maxResults = 5;

        let oldResults = listElement.find($(".result-item"));

        console.log(oldResults);

        listElement.empty();

        for (let i = 0; i < maxResults; i++) {
            if (channels[i] != null) {
                listElement.append(
                    $('<li>').attr('class','result-item').append(
                        $('<a>').attr('href',channels[i].slug).append(
                            $('<span>').append("#" + channels[i].title)
                        )
                    )
                );
                displaying++;
            }
        }    


        // If no results are displayed
        if (channels.length == 0) {
            // Chuck it in a log so we can see
            console.log("No channels found");
            // Display a create channel form items
            displayCreateChannelForm(true);
        }
        else {
            displayCreateChannelForm(false);

        }
            
        
        $("#search-display-number").text(displaying);
        $("#search-query-number").text(channels.length);
        $("#search-term").text(query);
    });
}

function createNewChannel(channelName, firstTrackUrl) {
    let form = $("#input-channel-details-div");
    let loader = $("#suggest-channel-loader");
    let message = $("#progress-message");

    form.hide();
    loader.show();

    if (inRequest) {
        return;
    } else {
        inRequest = true;
    }
    // Post request to create new track
    console.log("Creating Track");
    $.post('/create-track', {
        track_url: firstTrackUrl
    }, function(data, status) {
        // Callback function
        message.text("Creating Channel...");

        console.log(data.message);

        newTrackId = data.id

        // Post request to create new channel
        console.log("Creating Channel");
        $.post('/create-channel', {
            channel_name: channelName,
            first_track_id: newTrackId
        }, function(data, status) {
            // Callback function
            
            message.text("Setting Up Channel...");

            console.log(data.message);

            // Closes modal
            $("#create-channel-modal").modal("hide");

            // Takes user to new channel
            let baseUrl = window.location.protocol + "//" + window.location.host + "/" + data.slug;
			
			setTimeout(function(){
                window.location.replace(baseUrl);
            }, 2500);
        });
    });

}

function validateYouTubeUrl(firstTrackUrl) {
    let url = firstTrackUrl;
    if (url != undefined || url != '') {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        let match = url.match(regExp);            
        return match && match[2].length == 11;
    }
}