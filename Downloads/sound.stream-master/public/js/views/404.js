// Runs on load of this file
$(function () {
    // Loads the JS for various components
    loadShareModalJs("js/views/channel/");
});

function loadShareModalJs(baseRoute) {
    $.getScript(baseRoute + "shareModal.js");
    return;
}