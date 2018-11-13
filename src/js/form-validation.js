/**
 * !Form mask
 * */
var formMaskInit = function(){
	$.each($('.has-phone-mask'), function () {
		$(this).inputmask({
			"mask": "+375 99 999-99-99"
			// , clearMaskOnLostFocus: false
		});
	})
};

/**
 * !Form validation
 * */
var formValidInit = function (){
	// !Код для тестирования успешной отправки формы
	// После успешной отправки формы нужно добавить на тег form класс "form-success"
	// $.validator.setDefaults({
	// 	submitHandler: function(form) {
	// 		$(form).addClass('form-success')
	// 	}
	// });

	$.validator.methods.email = function( value, element ) {
		return this.optional( element ) || /[a-z]+@[a-z]+\.[a-z]+/.test( value );
	};

	var $validationForm = $('.validation-form-js');

	if($validationForm.length) {
		$.each($validationForm, function (i, el) {
			$(el).validate({
				errorClass: 'error',
				validClass: 'success',
				errorElement: false,
				// rules: {
				// 	phoneNumber: {
				// 		required: true,
				// 		minlength: 9,
				// 		number: true
				// 	}
				// },
				errorPlacement: function(error,element) {
					return true;
				},
				highlight: function(element, errorClass, successClass) {
					$(element)
						.removeClass(successClass)
						.addClass(errorClass);
					$(element)
						.closest('form').find('label[for="' + $(element).attr('id') + '"]')
						.removeClass(successClass)
						.addClass(errorClass);
					$(element)
						.closest('.input-holder')
						.removeClass(successClass)
						.addClass(errorClass);
				},
				unhighlight: function(element, errorClass, successClass) {
					$(element)
						.removeClass(errorClass)
						.addClass(successClass);
					$(element)
						.closest('form').find('label[for="' + $(element).attr('id') + '"]')
						.removeClass(errorClass)
						.addClass(successClass);
					$(element)
						.closest('.input-holder')
						.removeClass(errorClass)
						.addClass(successClass);
				}
			});
		});
	}
};

$(document).ready(function () {
	formMaskInit();
	formValidInit();
});