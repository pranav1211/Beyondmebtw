function twit() {
    window.open("https://twitter.com/Pranavisda1");
}

//////////////////////////////////////////////////////////////////////////////////

var contactbutt = document.querySelector('#contactthing');

var linkedinlink = document.querySelector('.linkedin')
var mediumlink = document.querySelector('.medium')
var emaillink = document.querySelector('.email') //icon
var twitterlink = document.querySelector('.twitterr')
var githublink = document.querySelector('.githubli')
var emailidlink = document.querySelector('#maillink') //email id

var triangleup = document.querySelector('.triangle-up')

linkedinlink.addEventListener('click', () => {
    window.open("https://www.linkedin.com/in/pranav-veeraghanta-315760119/");
});
mediumlink.addEventListener('click', () => {
    window.open("https://medium.com/@beyondmebtw");
});
twitterlink.addEventListener('click', () => {
    window.open("https://x.com/Pranavisda1");
});
githublink.addEventListener('click', () => {
    window.open("https://github.com/pranav1211");
});


/////////////////////// email icon click

var linkshow = 1;
emaillink.addEventListener('click', () => {
    if (linkshow == 1) {

        emailidlink.style.visibility = 'visible'
        emailidlink.style.opacity = 1;
        triangleup.style.visibility = 'visible'
        triangleup.style.opacity = 1;
        linkshow = 0;
    }
    else if (linkshow == 0) {
        emailidlink.style.visibility = 'hidden'
        emailidlink.style.opacity = 0;
        triangleup.style.visibility = 'hidden'
        triangleup.style.opacity = 0;
        linkshow = 1;
    }
});

//////////////////////// email id click
var emailidd = "Beyondmebtw@gmail.com"

emailidlink.addEventListener('click', () => {
    navigator.clipboard.writeText(emailidd);
    clipboard.style.visibility = 'hidden';
    copiedtoc.style.visibility = 'visible';
});


var mouseovermail = 0;

emaillink.addEventListener('click', () => {
    if (mouseovermail == 1) {
        emailidlink.style.visibility = 'hidden';
        emailidlink.style.opacity = 0;
        triangleup.style.visibility = 'hidden'
        triangleup.style.opacity = 0;
    }
});

////////////////////////////////////// email id click
var clipboard = document.querySelector(".clipboard");
var copiedtoc = document.querySelector(".copiedtoc");
var triangleleft = document.querySelector('.triangle-left');

function clipboardcopyover() {
    triangleleft.style.visibility = 'visible';
    clipboard.style.visibility = 'visible';
}

function clipboardcopyout() {
    triangleleft.style.visibility = 'hidden';
    clipboard.style.visibility = 'hidden';
    copiedtoc.style.visibility = 'hidden'
}

//////////////////////////// about the icons
var contactbutton = document.querySelector('#contactbutton');
var infoaboutbutts = document.querySelector('#infoaboutbutts');

function aboutbuttson() {
    infoaboutbutts.style.visibility = 'visible';
}
function aboutbuttsoff() {
    infoaboutbutts.style.visibility = 'hidden';
}

if (screen.width < 972) {
    contactbutton.style.visibility = 'hidden';

}