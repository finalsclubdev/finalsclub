
/*

This is the core logic for the main page.
It implements most page transitions by showing and hiding DIV elements
in the page with javascript+jquery

*/


/* Convert a JSON string to an object, or null if unparseable */
function j2o(json) { try { return JSON.parse(json); } catch(e) { return null; } }

/* Convert an object to a JSON string (just easier to type than "JSON.stringify" */
function o2j(obj) { return JSON.stringify(obj); }

var user = {};

var router = {
  routes: {},
  add: function(name, useAjax, cb) {
    if (typeof useAjax === 'function') {
      cb = useAjax;
      useAjax = true;
    }
    this.routes[name] = {
      fn: cb,
      useAjax: useAjax
    }
  },
  run: function(name, path) {
    checkUser(function() {
      if (router.routes[name].useAjax) {
        $.get(path, {cache: false}, function(data) {
          if (data.status === 'not_found' || (typeof data === 'string')) {
            return router.run('404');
          }
          router.routes[name].fn(data, render);
        });
      } else {
        router.routes[name].fn(render);
      }
    });
  }
}

function render(pageId, response) {
  if (user.name) {
    ProtoDiv.inject("PROTO_login_info", user)
    $("#login_status").show();
    $('#login_link').text('Logout').attr('href', '/logout');
    $('#register_link').hide();
    $('#profile_link').show();
  } else {
    ProtoDiv.reset("PROTO_login_info");
    $("#login_status").hide();
    $('#login_link').text('Login').attr('href', '/login');
    $('#register_link').show();
    $('#profile_link').hide();
  }
  if (response) {
    if (response instanceof Array) {
      $.each(response, function() {
        console.log(this.id, this.data)
        ProtoDiv.reset("PROTO_" + this.id)
        ProtoDiv.replicate("PROTO_" + this.id, this.data)
      })
    } else {
      ProtoDiv.reset("PROTO_" + response.id)
      ProtoDiv.replicate("PROTO_" + response.id, response.data)
    }
  }
  $("#pg_" + pageId).fadeIn(100);
}

function message(type, msg) {
  ProtoDiv.reset("PROTO_message");
  ProtoDiv.replicate("PROTO_message", {type: type, msg: msg})
  $("#messages").fadeIn(100);
}

function checkUser(cb) {
  $.get('/checkuser', function(data) {
    if (data.user) {
      user = data.user;
    } else {
      user = {};
    }

    if (cb) {
      cb();
    }
  })
}

router.add('404', false, function() {
  $("#pg_notfound").fadeIn(100);
  window.scroll(0, 0)
});

router.add('home', false, function(cb) {
  $('#learnsomething').unbind();
	cb("home");
  $('#learnsomething').click(function(e) {
    $.get('/learn/random', function(data) {
      if (data.status === 'ok') {
        goPage(data.data);
      }
    })
  });
  if ($('#vimeo-screencast').length === 0) {
    $('#screencast').html('<iframe id="vimeo-screencast" src="http://player.vimeo.com/video/30647271?title=0&amp;byline=0&amp;portrait=0" width="350" height="250" frameborder="0" webkitallowfullscreen="webkitAllowFullScreen" allowfullscreen="allowFullScreen"></iframe>');
  }
});



// go to the page that lists the schools
router.add('schools', function(data, cb) {

  var response = {
    id: 'school',
    data: data.schools
  }

  cb("schools", response);
});



// go to the page that lists the courses for a specific school
router.add('school', function(data, cb) {
  $('#new_course').hide().unbind();
  $('#form_course').hide().unbind();
  var response = {
    id: 'course',
    data: data.school.courses
  }

  $("#school_name").html(data.school.name);

  if (data.school.authorized) {
    $('#new_course').show();
    $('#new_course').click(function(e) {
      e.preventDefault();

      var form = $('#form_course');

      form.toggle();

      form.submit(function(e) {
        e.preventDefault();

        $.post(window.location.pathname, form.serialize(), function(data) {
          if (data.status === 'error') {
            message('error', data.message);
          } else if (data.status === 'ok') {
            form.hide();
            goPage(window.location.pathname);
            message('info', data.message);
          }
        });
      })
    });
  }
  cb("courses", response)
});




// go to the page that lists the lectures for a specific course
router.add('course', function(data, cb) {
  $('#new_lecture').hide().unbind();
  $('#form_lecture').hide().unbind();;

  var response = [];

  if (data.course) {
    response.push({
      id: 'lectures_head',
      data: data.course
    })
  }

  if (data.instructor) {
    response.push({
      id: 'lectures_instructor',
      data: data.instructor
    })
  }

  if (data.lectures) {
    response.push({
      id: 'lecture',
      data: data.lectures
    })
  }

  if (data.course.authorized) {
    $('#new_lecture').show();
    $('#new_lecture').click(function(e) {
      e.preventDefault();

      var form = $('#form_lecture');

      form.toggle();

      form.submit(function(e) {
        e.preventDefault();

        $.post(window.location.pathname, form.serialize(), function(data) {
          if (data.status === 'error') {
            message('error', data.message);
          } else if (data.status === 'ok') {
            form.hide();
            goPage(window.location.pathname);
            message('info', data.message);
          }
        });
      })
    });
  }

  cb('lectures', response);
});



// go to the page that lists the note taking sessions for a specific lecture
router.add('lecture', function(data, cb) {
  $('#new_note').hide().unbind();
  $('#form_note').hide().unbind();;

  var response = [];

  if (data.notes) {
    response.push({
      id: 'note',
      data: data.notes
    })
  }
  
  if (data.lecture.authorized) {
    $('#new_note').show();
    $('#new_note').click(function(e) {
      e.preventDefault();

      var form = $('#form_note');

      form.toggle();

      form.submit(function(e) {
        e.preventDefault();

        $.post(window.location.pathname, form.serialize(), function(data) {
          if (data.status === 'error') {
            message('error', data.message);
          } else if (data.status === 'ok') {
            form.hide();
            goPage(window.location.pathname);
            message('info', data.message);
          }
        });
      })
    });
  }
  cb("notes", response);
});


// go to the page that lists the archived subject names
router.add('archive', function(data, cb) {

  var response = {
    id: 'archive_subject',
    data: data.subjects
  }

  cb("archive_subjects", response)
});



router.add('archivesubject', function(data, cb) {

  var response = {
    id: 'archive_course',
    data: data.courses
  }

  cb("archive_courses", response)
});



router.add('archivecourse', function(data, cb) {

  var response = {
    id: 'archive_note',
    data: data.notes
  }

  cb("archive_notes", response)
});



router.add('archivenote', function(data, cb) {

  var response = {
    id: 'archive_note_display',
    data: data.note
  }

  cb("archive_note_display", response)
});



// go to the account registration page
router.add('register', false, function(cb) {
  $('#form_register').submit(function(e) {
    e.preventDefault();

    console.log('register')
    var form = $(this);

    $.post(window.location.pathname, form.serialize(), function(data) {
      if (data.status === 'error') {
        message('error', data.message);
        return false;
      } else if (data.status === 'ok') {
        goPage('/')
        message('info', data.message);
      }
    })
  })
	cb("register");
});

router.add('activate', function(data, cb) {
  goPage('/')
  message('info', data.message);
});

router.add('profile', false, function(cb) {
  var form = $('#form_profile');
  $('input[type=password]','#form_profile').val('');
  $('#affiliation').attr('value', user.affil);
  $('#showName').attr('checked', user.showName)
  form.find('.email').text(user.email);
  form.find('input[name=name]').val(user.name);
  form.submit(function(e) {
    console.log('test')
    e.preventDefault();

    $.post(window.location.pathname, form.serialize(), function(data) {
      if (data.status === 'error') {
        message('error', data.message);
        return false;
      } else if (data.status === 'ok') {
        goPage('/profile');
        message('info', data.message);
      }
    })
  })
	cb("profile");
});

router.add('login', false, function(cb) {
  $('input','#form_login').val('');
  $('#form_login').submit(function(e) {
    e.preventDefault();

    var form = $(this);

    $.post(window.location.pathname, form.serialize(), function(data) {
      if (data.status === 'error') {
        message('error', data.message);
        return false;
      } else if (data.status === 'ok') {
        goPage('/')
        message('info', 'Successfully logged in');
      }
    })
  })
	cb("login");
});

router.add('logout', function(data, cb) {
  goPage('/')
  message('info', 'Successfully logged out');
});

router.add('resetpass', false, function(cb) {
  $('input','#form_resetpass').val('');
  $('#form_resetpass').submit(function(e) {
    e.preventDefault();

    var form = $(this);

    $.post(window.location.pathname, form.serialize(), function(data) {
      if (data.status === 'error') {
        message('error', data.message);
        return false;
      } else if (data.status === 'ok') {
        goPage('/')
        message('info', data.message);
      }
    })
  })
	cb("resetpass");
});

router.add('resetpw', false, function(cb) {
  $('input','#form_resetpw').val('');
  $('#form_resetpw').submit(function(e) {
    e.preventDefault();

    var form = $(this);

    $.post(window.location.pathname, form.serialize(), function(data) {
      if (data.status === 'error') {
        message('error', data.message);
        return false;
      } else if (data.status === 'ok') {
        goPage('/')
        message('info', data.message);
      }
    })
  })
	cb("resetpw");
});

// go to the press articles page
router.add('press', false, function(cb) {
	cb("press");
});


// go to the "code of conduct" page
router.add('conduct', false, function(cb) {
	cb("conduct");
});



/* Do and show the appropriate thing, based on the pages current URL */
function showPage(y) {

	$(".page").hide(); //(100);		// hide all pseudo pages

	var path = document.location.pathname
  var routes = router.routes;

  var slugs = path.split('/');

  slugs.shift();

  mainSlug = slugs[0].toLowerCase() || 'home';

  if (mainSlug === 'archive') {
    if (slugs[1]) {
      mainSlug = mainSlug + slugs[1];
    }
  }

  if (routes[mainSlug]) {
    router.run(mainSlug, path)
  } else {
    router.run('404')
  }

}




/* Simulates a page load.
	'path' is something like "/schools", etc.
	A page fetch doesn't really happen.
	Based on what path looks like, an appropriate DIV is shown, and action taken
*/
var topQueue = [0]
function goPage(path) {
	var y = 0 + window.pageYOffset
	topQueue.push(y)
	history.pushState({}, path, path);
	showPage(0);
}


/* Simulates a "back" browser navigation.  */
function goBack(event) {
	var y = topQueue.pop()
	showPage( y );
}


	window.onpopstate = goBack

$(document).ready(function() {

	// This code executes after the page has been fully loaded

  $('body').on('click', 'a[href^=/]', function(e) {
    var path = e.target.pathname || '/';
    var checkNote = path.match(/\/([a-zA-Z]+)/);
    if (checkNote && checkNote[1] == 'note') {
      return true;
    } else if (!history.pushState) {
      return true;
    } else {
      goPage(path)
      return false;
    }
  })

	// xxx older FF browsers don't fire a page load/reload - deal with it somehow.
	// showPage( 0 );		// needed for some older browsers, redundant for chrome

})




