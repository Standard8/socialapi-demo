
function onLoad() {
/* FIXME!
  var worker = navigator.mozSocial.getWorker();
  if (worker) {
    document.body.style.border = "3px solid green";
  } else {
    document.body.style.border = "3px solid red";
  }
*/
  // force logout on reload for now, since we dont have real session
  // management for a real user
  document.cookie="userdata=";

navigator.id.watch({
  loggedInUser: null,
  onlogin: function(assertion) {
    // A user has logged in! Here you need to:
    // 1. Send the assertion to your backend for verification and to create a session.
    // 2. Update your UI.
    $.ajax({ /* <-- This example uses jQuery, but you can use whatever you'd like */
      type: 'POST',
      url: '/login', // This is a URL on your website.
      data: {assertion: assertion},
      success: function(res, status, xhr) { signedIn(xhr.responseText); },
      error: function(xhr, status, err) { alert("login failure" + res); }
    });
  },
  onlogout: function() {
    // A user has logged out! Here you need to:
    // Tear down the user's session by redirecting the user or making a call to your backend.
    // Also, make sure loggedInUser will get set to null on the next page load.
    // (That's a literal JavaScript null. Not false, 0, or undefined. null.)
    $.ajax({
      type: 'POST',
      url: '/logout', // This is a URL on your website.
      success: function(res, status, xhr) { },
      error: function(xhr, status, err) { alert("logout failure" + res); }
    });
  }
});
}

function signin() {
  navigator.id.request();
}

function signedIn(aEmail) {
  var end = location.href.indexOf("sidebar.htm");
  var baselocation = location.href.substr(0, end);
  var userdata = {
    portrait: baselocation + "/user.png",
    userName: aEmail,
    dispayName: aEmail,
    profileURL: baselocation + "/user.html"
  }
  document.cookie="userdata="+JSON.stringify(userdata);

  userIsConnected(userdata); // FIXME: remove once we have a working SocialAPI worker.
}

function signout() {
  navigator.id.logout();

  // send an empty user object to signal a signout to firefox
  document.cookie="userdata=";

  userIsDisconnected(); // FIXME: remove once we have a working SocialAPI worker.
}

function openDataPanel(event) {
  // currently cant do this
  var url = "data:text/html,%3Chtml%3E%3Cbody%3E%3Cp%3EInline%20data%3C%2Fp%3E%3C%2Fbody%3E%3C%2Fhtml%3E";
  navigator.mozSocial.openPanel(url, event.clientY, function(win) {
	dump("window is opened "+win+"\n");
  });
}

function userIsConnected(userdata)
{
  $("#userid").text(userdata.userName);
  $("#usericon").attr("src", userdata.portrait);
  $("#useridbox").show();
  $("#usericonbox").show();
  $("#signin").hide();
  $("#content").show();
}

function userIsDisconnected()
{
  $("#signin").show();
  $("#content").hide();
  $("#userid").text("");
  $("#usericon").attr("src", "");
  $("#useridbox").hide();
  $("#usericonbox").hide();
}

messageHandlers = {
  "worker.connected": function(data) {
    // our port has connected with the worker, do some initialization
    // worker.connected is our own custom message
    var worker = navigator.mozSocial.getWorker();
    worker.port.postMessage({topic: "broadcast.listen", data: true});
  },
  "social.user-profile": function(data) {
    if (data.userName)
      userIsConnected(data);
    else
      userIsDisconnected();
  },
};

navigator.mozSocial.getWorker().port.onmessage = function onmessage(e) {
    //dump("SIDEBAR Got message: " + e.data.topic + " " + e.data.data +"\n");
    var topic = e.data.topic;
    var data = e.data.data;
    if (messageHandlers[topic])
        messageHandlers[topic](data);
};

function workerReload() {
  var worker = navigator.mozSocial.getWorker();
  worker.port.postMessage({topic: "worker.reload", data: true});
}

var chatWin;

function openPanel(event) {
  navigator.mozSocial.openPanel("./flyout.html", event.clientY, function(win) {
	dump("window is opened "+win+"\n");
  });
}

function openChat(event) {
  navigator.mozSocial.openChatWindow("./chatWindow.html?id="+(chatters++), function(win) {
	dump("chat window is opened "+win+"\n");
    chatWin = win;
  });
}

function changeLoc() {
  window.location = "http://www.mozilla.org";
}

window.addEventListener("scroll", function(e) {
  dump("scrolling sidebar...\n");
}, false);
window.addEventListener("socialFrameShow", function(e) {
  dump("status window has been shown, visibility is "+document.visibilityState+" or "+navigator.mozSocial.isVisible+"\n");
}, false);
window.addEventListener("socialFrameHide", function(e) {
  dump("status window has been hidden, visibility is "+document.visibilityState+" or "+navigator.mozSocial.isVisible+"\n");
}, false);

var chatters = 0;
function notify(type) {
  var port = navigator.mozSocial.getWorker().port;
  // XXX shouldn't need a full url here.
  var end = location.href.indexOf("sidebar.htm");
  var baselocation = location.href.substr(0, end);
  switch(type) {
    case "link":
      data = {
        id: "foo",
        type: null,
        icon: baselocation+"/icon.png",
        body: "This is a cool link",
        action: "link",
        actionArgs: {
          toURL: baselocation
        }
      }
      port.postMessage({topic:"social.notification-create", data: data});
      break;
    case "chat-request":
      port.postMessage({topic:"social.request-chat", data: baselocation+"/chatWindow.html?id="+(chatters++)});
      break;
  }
}

