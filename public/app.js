const socket = io();
let lastUsername = "";
let lastPassword = "";

let avatarBase64 = "";

let profileImage;
let previousOffset = 0;
let postToBeCommented;

let usernameValue = getCookie("mySocialNetworkUsername") || "";
let passwordValue = getCookie("mySocialNetworkPassword") || "";
if(usernameValue.length && passwordValue.length && window.location.hash == "")
    login(usernameValue, passwordValue)

const routes = [
    { path: '/', component: landingPage, initialFunction: () => { clearFields(); }},
    { path: '/home', component: homePage, initialFunction: () => { requestNewPosts(); requestMyImage(); }},
    { path: '/myprofile', component: myProfilePage, initialFunction: () => { requestMyPosts(); requestMyImage(); }}
];

//Functions
//-----------------------------------------------------
function likeClicked(event) {
    let likeButton = event.target;
    let id = event.target.parentElement.parentElement.querySelector('input[name="ID"]').value;
    if(likeButton.classList.length > 1) {
        dislike(id);
        likeButton.classList.remove("liked");
        likeButton.parentElement.querySelector('h6').innerText = parseInt(likeButton.parentElement.querySelector('h6').innerText) - 1;
    }
    else {
        like(id);
        likeButton.classList.add("liked");
        likeButton.parentElement.querySelector('h6').innerText = parseInt(likeButton.parentElement.querySelector('h6').innerText) + 1;
    }
}
function binClicked(event) {
    let id = event.target.parentElement.parentElement.querySelector('input[name="ID"]').value;
    event.target.parentElement.parentElement.style.opacity = 0;
    setTimeout(function(){event.target.parentElement.parentElement.parentElement.removeChild(event.target.parentElement.parentElement)}, 500);
    socket.emit('delete post', {
        postID: id,
        username: usernameValue,
        password: passwordValue
    });
}
function postComment(event) {
    text = document.getElementById("commentMaker").value.trim();
    document.getElementById("commentMaker").value = "";
    if(text.length) {
        try {postToBeCommented.getElementsByTagName('h6')[2].innerHTML = parseInt(postToBeCommented.getElementsByTagName('h6')[2].innerHTML) + 1; }
        catch(e) {postToBeCommented.getElementsByTagName('h6')[1].innerHTML = parseInt(postToBeCommented.getElementsByTagName('h6')[1].innerHTML) + 1;}
        comment(postToBeCommented.querySelector('input[name="ID"]').value, text);
    }
}
function commentClicked(event) {
    socket.emit('comments request', { postID : event.target.parentElement.parentElement.querySelector('input[name="ID"]').value, username: usernameValue});
    if(!document.getElementById("commentsWrapper"))
        document.getElementsByClassName("page")[0].insertAdjacentHTML('beforeend', commentSection.render());
    postToBeCommented = event.target.parentElement.parentElement;
    if(document.getElementById("postMakerDiv"))
        document.getElementById("postMakerDiv").classList.add("postMakerAnimation");
    document.getElementById("commentsWrapper").hidden = false;
    setTimeout( function(){ document.getElementById("commentsWrapper").classList.add("commentsWrapperAnimation");}, 500);
    setTimeout(function(){ document.getElementById("commentMakerDiv").classList.add("commentMakerAnimation");}, 900);
}
function commentLikeClicked(event) {
    let ID = event.target.parentElement.parentElement.querySelector('input[name="ID"]').value;
    if(event.target.classList.length > 1) {
        socket.emit('comment dislike', {
            commentID: ID,
            username: usernameValue,
            password: passwordValue
        });
        event.target.classList.remove("liked");
        event.target.parentElement.querySelector('h6').innerText = parseInt(event.target.parentElement.querySelector('h6').innerText) - 1;
    }
    else {
        socket.emit('comment like', {
            commentID: ID,
            username: usernameValue,
            password: passwordValue
        });
        event.target.classList.add("liked");
        event.target.parentElement.querySelector('h6').innerText = parseInt(event.target.parentElement.querySelector('h6').innerText) + 1;
    }
}
function closeComments() {
    document.getElementById("commentMakerDiv").classList.remove("commentMakerAnimation");
    setTimeout(function(){ document.getElementById("commentsWrapper").classList.remove("commentsWrapperAnimation");}, 500);
    setTimeout(function(){ document.getElementById("commentsWrapper").hidden = true; if(document.getElementById("postMakerDiv")) document.getElementById("postMakerDiv").classList.remove("postMakerAnimation"); }, 900);
}
function feedScroll() {
    if(!document.getElementById("commentsWrapper").hidden) {
        let scroll = document.getElementById("feed").scrollTop - previousOffset;
        previousOffset = document.getElementById("feed").scrollTop;
        document.getElementById("commentsWrapper").style.top = (document.getElementById("commentsWrapper").offsetTop - scroll) + "px";
    }
}
function like(id) {
    socket.emit('like', {
        postID: id,
        username: usernameValue,
        password: passwordValue
    });
}
function dislike(id) {
    socket.emit('dislike', {
        postID: id,
        username: usernameValue,
        password: passwordValue
    });
}
function comment(id, text) {
    socket.emit('comment', {
        postID: id,
        content: text,
        username: usernameValue,
        password: passwordValue
    });
    document.getElementById("comments").appendChild(commentFrom(-1, profileImage, usernameValue, text, 0, 0));
}
function requestMyPosts() {
    socket.emit("my posts request", usernameValue);
}
function requestNewPosts() {
    socket.emit("new posts request", usernameValue);
}
function post() {
    let text = document.getElementById("postMaker").value.trim();
    if(text) {
        socket.emit('post', {
            username: usernameValue,
            password: passwordValue,
            content: text
        })
        document.getElementById("postMaker").value = "";
        document.getElementById("postMaker").style.height = "20px";
        document.getElementById("feed").prepend(nodeFrom(0, profileImage || "./images/avatar.png", usernameValue, text, 0, 0, 0));
        location.reload();
    }
}
function requestMyImage() {
    socket.emit('profile image request', usernameValue);
}
//-----------------------------------------------------










//Socket events
//-----------------------------------------------------
socket.on("registrated", () => {
    createCookies();
    window.location.hash = "/home";
});
socket.on("loged in", () => {
    createCookies();
    window.location.hash = "/home";
});
socket.on("profile image", data => {
    if(data && data.imageCode) {
        profileImage = data.imageCode;
        if(document.getElementById("profileButton"))
            document.getElementById("profileButton").style.backgroundImage = "url(" + profileImage; + ")";
        if(document.getElementById("myImage"))
            document.getElementById("myImage").src = profileImage;
    }
});
socket.on("posts", data => {
    document.getElementById("feed").innerHTML = ""
    if(data) {
        for(let i = 0; i < data.length; i++) {
            document.getElementById("feed").appendChild(nodeFrom(data[i].ID, data[i].imageCode, data[i].username, data[i].content, data[i].likes, data[i].comments, data[i].liked));
        }
    }
});
socket.on("my posts", data => {
    document.getElementById("myPosts").innerHTML = ""
    if(data) {
        for(let i = 0; i < data.length; i++) {
            document.getElementById("myPosts").appendChild(nodeFrom(data[i].ID, data[i].content, data[i].likes, data[i].comments, data[i].liked, "bin"));
        }
    }
});
socket.on('comments', data => {
    document.getElementById("comments").innerHTML = "";
    if(data)
        for(let i = 0; i < data.length; i++)
            document.getElementById("comments").appendChild(commentFrom(data[i].ID, data[i].imageCode, data[i].username, data[i].content, data[i].likes, data[i].liked));
});
socket.on("unknown error", () => {
    document.getElementById("error").innerHTML = "Something went wrong. Please try again.";
    document.getElementById("error").hidden = false;
});
socket.on("username taken", () => {
    document.getElementById("error").innerHTML = "This username is taken. Please try another.";
    document.getElementById("error").hidden = false;
});
socket.on("not loged in", () => {
    document.getElementById("error").innerHTML = "Looks like you entered wrong username or password";
    document.getElementById("error").hidden = false;
});
//-----------------------------------------------------


















//Form functions
//-----------------------------------------------------
function login(u, p) {
    socket.emit("login", {
        username: u,
        password: p
    });
}
function register(u, p, c, b64) {
    socket.emit("register", {
        username: u,
        password: p,
        country: c,
        imageCode: b64
    });
}
function logout() {
    window.location.hash = "/";
    document.cookie = `mySocialNetworkUsername=""; expires=Thu, 18 Dec 2013 12:00:00 UTC`;
    document.cookie = `mySocialNetworkPassword=""; expires=Thu, 18 Dec 2013 12:00:00 UTC`;
}
function formInput(event) { if(event.keyCode == 13) document.getElementById('mainButton').click(); else if(document.getElementById('error').hidden == false) clearErrorMessage(); }
function clearFields() {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("countrySelector").selectedIndex = 0;
    document.getElementById("avatarUploader").value = "";
}
//-----------------------------------------------------









function postMakerInput() {
    if(document.getElementById("postMaker").value.length == 1)
        document.getElementById("postMaker").style.height = "100px";
    else if(document.getElementById("postMaker").value.length == 0)
    document.getElementById("postMaker").style.height = "20px";
};
function avatarUploaded() {
    const data = document.getElementById("avatarUploader").files[0];
    const reader = new FileReader();

    reader.readAsDataURL(data);
    reader.addEventListener("load", function () {
        document.getElementById("avatarUploaderLabel").innerHTML = "";
        document.getElementById("avatarUploaderLabel").style.backgroundImage = "url(" + reader.result + ")";
        avatarBase64 = reader.result;
    });
};






function loginPressed()
{
    let usernameValue = document.getElementById('username').value.trim();
    let passwordValue = document.getElementById('password').value.trim();

    if(!usernameValue.length || !passwordValue.length) {
        unfilledFields();
        return;
    }

    lastUsername = usernameValue;
    lastPassword = passwordValue;

    login(usernameValue, passwordValue);
    
}
function registerPressed()
{
    let usernameValue = document.getElementById('username').value.trim();
    let passwordValue = document.getElementById('password').value.trim();
    let countryValue = document.getElementById('countrySelector').value || "United States of America";
    if(!usernameValue) {
        usernameNotLongEnough();
        return;
    }
    else if(usernameValue.length > 40) {
        usernameTooLong();
        return;
    }
    if(passwordValue.length < 6) {
        passwordNotLongEnough();
        return;
    }
    else if(passwordValue.length > 40) {
       passwordTooLong();
        return;
    }

    register(usernameValue, passwordValue, countryValue, avatarBase64);

    lastUsername = usernameValue;
    lastPassword = passwordValue;

}
function showRegister()
{
    clearErrorMessage();
    clearFields();
    document.getElementById("avatarUploaderLabel").hidden = false;
    document.getElementById("countrySelector").hidden = false;
    document.getElementById("countrySelector").selectedIndex = 0;
    document.getElementById("mainButton").innerHTML = "Register";
    document.getElementById("mainButton").setAttribute("onclick", "registerPressed()");

    document.getElementById("mid").innerHTML = "Have an account?";

    document.getElementById("textButton").blur();
    document.getElementById("textButton").innerHTML = "Login";
    document.getElementById("textButton").setAttribute("onclick", "showLogin()");
}
function showLogin()
{
    clearErrorMessage();
    clearFields();
    document.getElementById("avatarUploaderLabel").hidden = true;
    document.getElementById("countrySelector").hidden = true;
    document.getElementById("mainButton").innerHTML = "Login";
    document.getElementById("mainButton").setAttribute("onclick", "loginPressed()");

    document.getElementById("mid").innerHTML = "Don't have an account?";

    document.getElementById("textButton").blur();
    document.getElementById("textButton").innerHTML = "Register";
    document.getElementById("textButton").setAttribute("onclick", "showRegister()");
    document.getElementById("avatarUploaderLabel").innerHTML = "Select</br>image";
    document.getElementById("avatarUploaderLabel").style.backgroundImage = "none";
}






















//Not so important code
function createCookies() {
    if(lastUsername != "" && lastPassword != "") {
        setCookie("mySocialNetworkUsername", lastUsername, 365);
        setCookie("mySocialNetworkPassword", lastPassword, 365);
        usernameValue = getCookie("mySocialNetworkUsername");
        passwordValue = getCookie("mySocialNetworkPassword");
    }
}
function clearErrorMessage()
{
    document.getElementById("error").innerHTML = "";
    document.getElementById("error").hidden = true;
}
function usernameNotLongEnough()
{
    document.getElementById("error").innerHTML = "Username is not long enough!";
    document.getElementById("error").hidden = false;
}
function usernameTooLong()
{
    document.getElementById("error").innerHTML = "Username cannot be longer than 40 characters!";
    document.getElementById("error").hidden = false;
}
function passwordNotLongEnough()
{
    document.getElementById("error").innerHTML = "Password must be longer than 5 characters!";
    document.getElementById("error").hidden = false;
}
function passwordTooLong()
{
    document.getElementById("error").innerHTML = "Password cannot be longer than 40 characters!";
    document.getElementById("error").hidden = false;
}
function unfilledFields()
{
    document.getElementById("error").innerHTML = "All field must be filled in!";
    document.getElementById("error").hidden = false;
}

//Stealed code


//Cookies
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(name) {
    return getCookies()[name];
}
if (typeof String.prototype.trimLeft !== "function") {
    String.prototype.trimLeft = function() {
        return this.replace(/^\s+/, "");
    };
}
if (typeof String.prototype.trimRight !== "function") {
    String.prototype.trimRight = function() {
        return this.replace(/\s+$/, "");
    };
}
if (typeof Array.prototype.map !== "function") {
    Array.prototype.map = function(callback, thisArg) {
        for (var i=0, n=this.length, a=[]; i<n; i++) {
            if (i in this) a[i] = callback.call(thisArg, this[i]);
        }
        return a;
    };
}
function getCookies() {
    var c = document.cookie, v = 0, cookies = {};
    if (document.cookie.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
        c = RegExp.$1;
        v = 1;
    }
    if (v === 0) {
        c.split(/[,;]/).map(function(cookie) {
            var parts = cookie.split(/=/, 2),
                name = decodeURIComponent(parts[0].trimLeft()),
                value = parts.length > 1 ? decodeURIComponent(parts[1].trimRight()) : null;
            cookies[name] = value;
        });
    } else {
        c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function($0, $1) {
            var name = $0,
                value = $1.charAt(0) === '"'
                          ? $1.substr(1, -1).replace(/\\(.)/g, "$1")
                          : $1;
            cookies[name] = value;
        });
    }
    return cookies;
}
//Router
const parseLocation = () => location.hash.slice(1).toLowerCase() || '/';
const findComponentByPath = (path, routes) => routes.find(r => r.path.match(new RegExp(`^\\${path}$`, 'gm'))) || undefined;
const router = () => {
  const path = parseLocation();
  const { component = errorPage, initialFunction = () => {} } = findComponentByPath(path, routes) || {};
  document.getElementById('app').innerHTML = component.render();
  initialFunction();
};
window.addEventListener('hashchange', router);
window.addEventListener('load', router);




















function nodeFrom() {
    let ID = document.createElement("input"); ID.setAttribute("type", "hidden"); ID.setAttribute("name", "ID"); ID.setAttribute("value", arguments[0]);
    if(arguments.length == 5) {
        let wrapper = document.createElement("div");
        wrapper.classList.add("smallPost");
    
        let text = document.createElement("p");
        text.appendChild(document.createTextNode(arguments[1]));
    
        let commands = document.createElement("div");
        commands.classList.add("commands");
    
        let likes = document.createElement("button");
        likes.classList.add("likeButton")
        likes.setAttribute('onclick', 'likeClicked(event)');
            let likesCount = document.createElement("h6");
            likesCount.innerText = arguments[2];
    
        let comments = document.createElement("button");
        comments.classList.add("commentsButton");
        comments.setAttribute('onclick', 'commentClicked(event)');
            let commentsCount = document.createElement("h6");
            commentsCount.innerText = arguments[3];

        if(arguments[4] == 1)
            likes.classList.add("liked");

        
        commands.appendChild(likes);
        commands.appendChild(likesCount);
        commands.appendChild(comments);
        commands.appendChild(commentsCount);
    
        wrapper.appendChild(ID);
        wrapper.appendChild(text);
        wrapper.appendChild(document.createElement("hr"));
        wrapper.appendChild(commands);
    
        return wrapper;
    }
    else if(arguments.length == 6) {
        let wrapper = document.createElement("div");
        wrapper.classList.add("smallPost");
    
        let text = document.createElement("p");
        text.appendChild(document.createTextNode(arguments[1]));
    
        let commands = document.createElement("div");
        commands.classList.add("commands");
    
        let likes = document.createElement("button");
        likes.classList.add("likeButton")
        likes.setAttribute('onclick', 'likeClicked(event)');
            let likesCount = document.createElement("h6");
            likesCount.innerText = arguments[2];
    
        let comments = document.createElement("button");
        comments.classList.add("commentsButton");
        comments.setAttribute('onclick', 'commentClicked(event)');
            let commentsCount = document.createElement("h6");
            commentsCount.innerText = arguments[3];

        let bin = document.createElement("button");
        bin.classList.add("bin");
        bin.setAttribute('onclick', 'binClicked(event)');

        if(arguments[4] == 1)
            likes.classList.add("liked");

        
        commands.appendChild(likes);
        commands.appendChild(likesCount);
        commands.appendChild(comments);
        commands.appendChild(commentsCount);
        commands.appendChild(bin);
    
        wrapper.appendChild(ID);
        wrapper.appendChild(text);
        wrapper.appendChild(document.createElement("hr"));
        wrapper.appendChild(commands);
    
        return wrapper;
    } 
    else if(arguments.length == 7) {
        let wrapper = document.createElement("div");
        wrapper.classList.add("mediumPost");
        
        let image = document.createElement("img");
        image.src = arguments[1] || "./images/avatar.png";
    
        let username = document.createElement("h6");
        username.appendChild(document.createTextNode(arguments[2]));
    
        let text = document.createElement("p");
        text.appendChild(document.createTextNode(arguments[3]));
    
        let commands = document.createElement("div");
        commands.classList.add("commands");
    
        let likes = document.createElement("button");
        likes.classList.add("likeButton")
        likes.setAttribute('onclick', 'likeClicked(event)');
            let likesCount = document.createElement("h6");
            likesCount.innerText = arguments[4];
    
        let comments = document.createElement("button");
        comments.classList.add("commentsButton")
        comments.setAttribute('onclick', 'commentClicked(event)');
            let commentsCount = document.createElement("h6");
            commentsCount.innerText = arguments[5];
        
    
        if(arguments[6] == 1)
            likes.classList.add("liked");


        commands.appendChild(likes);
        commands.appendChild(likesCount);
        commands.appendChild(comments);
        commands.appendChild(commentsCount);
    
    
        wrapper.appendChild(ID);
        wrapper.appendChild(image);
        wrapper.appendChild(username);
        wrapper.appendChild(text);
        wrapper.appendChild(document.createElement("hr"));
        wrapper.appendChild(commands);
        
        return wrapper;
    }
    else {
        return null;
    }
    
}
function commentFrom() {
    let ID = document.createElement("input"); ID.setAttribute("type", "hidden"); ID.setAttribute("name", "ID"); ID.setAttribute("value", arguments[0]);

    let wrapper = document.createElement("div");
        wrapper.classList.add("mediumPost");
        
    let image = document.createElement("img");
        image.src = arguments[1] || "./images/avatar.png";
    
    let username = document.createElement("h6");
        username.appendChild(document.createTextNode(arguments[2]));
    
    let text = document.createElement("p");
        text.appendChild(document.createTextNode(arguments[3]));
    
    let commands = document.createElement("div");
        commands.classList.add("commands");
    


    let likes = document.createElement("button");
        likes.classList.add("likeButton")
        likes.setAttribute('onclick', 'commentLikeClicked(event)');
        let likesCount = document.createElement("h6");
            likesCount.innerText = arguments[4];
        
    
    if(arguments[5] == 1)
        likes.classList.add("liked");


    commands.appendChild(likes);
    commands.appendChild(likesCount);


    wrapper.appendChild(ID);
    wrapper.appendChild(image);
    wrapper.appendChild(username);
    wrapper.appendChild(text);
    wrapper.appendChild(document.createElement("hr"));
    wrapper.appendChild(commands);
    
    return wrapper;
}