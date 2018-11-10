var inRequest = false;
// Runs on load of this file
$(function () {
    // Modal Button Bindings
    $("#open-suggest-track-modal").click(openSuggestTrackModal);
    console.log(loggedIn());
});

function loggedIn() {
    return $("#user-tag").attr("lock") != undefined;
}

function openSuggestTrackModal() {
    if (loggedIn()) {
        let suggestTrackModal = $("#suggest-track-modal");
        // Open the modal
        suggestTrackModal.modal();

        // Bind elements
        $("#suggest-track-submit").click(createTrackSubmit);
        bindTrackSubmitButtonDisable();
    }
    else {
        swal({
            title: 'Login to Suggest Tracks',
            text: 'To suggest tracks you must either login or sign up',
            type: 'warning',
            confirmButtonColor: "#765285"
        });
    }
}

function bindTrackSubmitButtonDisable() {
    // Get fields
    let submitButton = $("#suggest-track-submit");
    let trackUrlText = $("#create-track-text-input");
    let warningText = $("#suggest-track-warning-text");
    let minLength = 1;

    // Set binding to on change event for textfield
    trackUrlText.on("input propertychange", (e) => {
        let textLength = trackUrlText.val().length;
        // Enable the button if it fulfills minimum length
        if (!validateYouTubeUrl(trackUrlText.val())) {
            warningText.show();
            submitButton.attr('disabled', 'disabled');
        }
        else {
            warningText.hide();
            submitButton.removeAttr('disabled');
        }
    });
}

function createTrackSubmit() {
    // Get fields
    let trackUrl = $("#create-track-text-input").val();
	let channelSlug = $("#player").data('slug');
    let loader = $("#suggest-track-loader");
    let form = $("#suggest-track-form");

    form.hide();
    loader.show();

    // Create a new channel
    createNewTrack(trackUrl, channelSlug)
}

function createNewTrack(trackUrl, channelSlug) {
    if (inRequest) {
        return;
    } else {
        inRequest = true;
    }
    $.post('/create-track', {
        track_url: trackUrl,
		channel_slug: channelSlug
    }, function(data, status) {
        // Callback function
        console.log(data.message);
		location.reload();
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