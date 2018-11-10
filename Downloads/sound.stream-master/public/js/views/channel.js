// Runs on load of this file
$(function () {
    let baseRoute = "js/views/channel/";

    // Loads the JS for various components
    loadPlayerJs(baseRoute);
    loadVolumeControlsJs(baseRoute);
    loadShareModalJs(baseRoute);
    loadSuggestTrackModalJs(baseRoute);
    loadSearchChannelsModalJs(baseRoute);
    loadLikesJs(baseRoute);
});

function loadSearchChannelsModalJs(baseRoute) {
    $.getScript(baseRoute + "searchChannelsModal.js");
    return;
}

function loadSuggestTrackModalJs(baseRoute) {
    $.getScript(baseRoute + "suggestTrackModal.js");
    return;
}

function loadShareModalJs(baseRoute) {
    $.getScript(baseRoute + "shareModal.js");
    return;
}

function loadVolumeControlsJs(baseRoute) {
    $.getScript(baseRoute + "volumeControls.js");
    return;
}

function loadPlayerJs(baseRoute) {
    $.getScript(baseRoute + "player.js");
    return;
}

function loadLikesJs(baseRoute) {
    $.getScript(baseRoute + "likes.js");
    return;
}