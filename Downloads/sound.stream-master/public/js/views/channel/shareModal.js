// Runs on load of this file
$(function () {
    // Modal Button Bindings
    $("#open-share-channel-modal").click(openShareModal);
});

function openShareModal() {
    let shareModal = $("#share-modal");
    // Open a modal
    shareModal.modal();
    // Bind Copy Button
    $("#copy-button").click(copyToClipboard);

    var url;

    if ($("#page-tag").attr("page-name") == "404") {
        url = window.location.protocol + "//" + window.location.host + "/404";
    }
    else {
        url = window.location.href;
    }
    $("#channel-url-input").attr("value",url);

    console.log("URL: " + url + "ChannelNameVal" + $("#channel-url-input").value);
}

function copyToClipboard() {
    var clipboard = new Clipboard('#copy-button');
    swal({
        title: 'Link copied to clipboard!',
        type: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}