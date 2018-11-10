// Runs on load of every page
$(function () {
	let currentPage = $("#page-tag").attr("page-name");
	loadRelevantJs(currentPage);
});

function loadRelevantJs(currentPage) {
	let fileName = currentPage + ".js";
	$.getScript("js/views/" + fileName);
}

function login() {
	let form = $("#login-form");
	let loader = $("#login-loader");

	form.hide();
	loader.show();

	$.post('/login', {
		username: $('.login-email').val(),
		password: $('.login-password').val()
	}, function(data, status) {
		if (data.message != 'success') {
			form.show();
			loader.hide();
			alert(data.message);
		} else {
			location.reload();
		}
	});
}

function register() {
	let form = $("#register-form");
	let loader = $("#register-loader");

	form.hide();
	loader.show();

	$.post('/register', {
		username: $('.register-email').val(),
		password: $('.register-password').val()
	}, function(data, status) {
		if (data.message != 'success') {
			form.show();
			loader.hide();
			alert('Registration done did a fail.');
		} else {
			location.reload();
		}
	});
}

function signout() {
	$.post('/sign-out', null, function (data, status) {
		if (data) {
			location.reload();
		}
	});
}