function like(trackId) {
	$.post(location.href + '/like', {id: trackId}, function(data, status) {
		if (data.message === 'liked') {
			console.log('liked');
            $('.' + trackId + ' .like-img').attr("src", "/icons/Purple/like.svg");
		} else if (data.message === 'unliked') {
			console.log('unliked');
            $('.' + trackId + ' .like-img').attr("src", "/icons/White/like.svg");
		} else {
            swal({
			  	title: 'Login to Vote',
			  	text: 'To vote on tracks you must either login or sign up',
			  	type: 'warning',
			  	confirmButtonColor: "#765285"
			});
		}
        
        $('.' + trackId + ' .track-likes').text(data.likes);
	});	
}