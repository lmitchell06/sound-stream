// Runs on load of this file
$(function () {
    // Mute Binding
    $("#mute-button").click(mutePlayer);

    // Slider Binding
    $("#volume-slider").on('mousemove change', function(){
	   setVolume();
    });
});

function mutePlayer() {
    if (window.muted == undefined){ 
        window.muted = false;
    }
    if (window.muted){
        window.muted = false;
        player.unMute();
        $('#mute-button').attr('src','/icons/White/volume.svg');

    }
    else {
        player.mute();
        window.muted = true;
        $('#mute-button').attr('src','/icons/White/mute.svg');
    }
}

function setVolume() {
    let newVolume = $("#volume-slider").val();
    console.log('Volume changed to: ' + newVolume);
    player.setVolume(newVolume);
}