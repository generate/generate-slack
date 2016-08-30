(function($) {
  "use strict"; // Start of use strict

  // jQuery for page scrolling feature - requires jQuery Easing plugin
  $('.page-scroll a').bind('click', function(event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top - 50)
    }, 1250, 'easeInOutExpo');
    event.preventDefault();
  });

  // Highlight the top nav as scrolling occurs
  $('body').scrollspy({
    target: '.navbar-fixed-top',
    offset: 51
  });

  // Closes the Responsive Menu on Menu Item Click
  $('.navbar-collapse ul li a').click(function(){
    $('.navbar-toggle:visible').click();
  });

  // Offset for Main Navigation
  $('#mainNav').affix({
    offset: {
      top: 100
    }
  });

  $('#submit').on('click', function(e) {
    e.preventDefault();
    $.post({
      dataType: 'json',
      url: site.services.invite,
      data: {email: $('#email').val()}
    })
    .done(function(result) {
      if (result && result.ok === false) {
        showError(result);
        return;
      }
      showSuccess(result);
    }).fail(function(err) {
      showError(err);
    });
  });

  function showError(result) {
    $('#success').hide();
    $('#success').html('');

    var msg = '';
    switch (result.error) {
      case 'already_in_team':
        msg = 'You\'ve already joined this team. <a href="https://' + site.team + '.slack.com">Login here.</a>';
        break;
      case 'already_invited':
        msg = 'You\ve already been invited to this team. Check your email for the invitation.';
        break;
      default:
        msg = result.error;
    }

    $('#error').html(msg);
    $('#error').show();
  }

  function showSuccess(result) {
    $('#error').hide();
    $('#error').html('');
    $('#invite').hide();

    $('#success').html('The invitation has been sent! Please check your email to login.');
    $('#success').show();
  }

})(jQuery); // End of use strict
