// Runs on load of this file
$(function () {
    let channelNameText = $("#home-search-channels-name-text-input");
    bindSearchDisplay(1);
});

function bindSearchDisplay(minLength) {
    // Get fields
    let channelNameText = $("#home-search-channels-name-text-input");
    let listElement = $("#home-results-list");
    let resultsWarning = $("#no-results-warning");

    // Set binding to on change event for textfield
    channelNameText.on("input propertychange", (e) => {
        let textLength = channelNameText.val().length;
        resultsWarning.hide();
        // Enable the button if it fulfills minimum length
        if (textLength < minLength) {
            listElement.hide();
        }
        else {
            searchChannels(channelNameText.val());
            listElement.show();
        }
    });
}

function searchChannels(query) {
    let resultsWarning = $("#no-results-warning");

    $.post('/search-channels', {
        query: query
    }, function(data, status) {
        // Callback function

        let channels = data.channels;
        let listElement = $("#home-results-list");
        let displaying = 0;
        let maxResults = 5;

        let oldResults = listElement.find($(".result-item"));

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

        if (displaying <= 0) {
            resultsWarning.show();
        }
    });
}