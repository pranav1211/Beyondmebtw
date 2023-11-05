const slide = document.querySelector('.slides');
const images = document.querySelectorAll('.slides img');

//buttons
const prev = document.querySelector('#prevbtn');
const next = document.querySelector('#nextbtn');


//counter
let counter = 1;
const size = images[0].clientWidth;

slide.style.transform = 'translateX(' + (-size * counter) + 'px)'

//blur

images[counter + 1].style.opacity = 0.7;
images[counter - 1].style.opacity = 0.7;



//button listner


function move() {
    {
        if (counter >= images.length - 1) return;
        slide.style.transition = "transform 1.9s ease-in-out";
        counter++;
        slide.style.transform = 'translateX(' + (-size * counter) + 'px)'
        images[counter].style.opacity = 1;
        images[counter + 1].style.opacity = 0.7;
        images[counter - 1].style.opacity = 0.7;

    }
}

window.onload = function() {
    if (!window.location.hash) {
        window.location = window.location + '#loaded';
        window.location.reload();
    }
}

setInterval(move,5500);

///////// last and first

slide.addEventListener('transitionend', () => {
    if (images[counter].id === 'lastclone') {
        slide.style.transition = "none";
        counter = images.length - 2;
        slide.style.transform = 'translateX(' + (-size * counter) + 'px)'
        images[counter].style.opacity = 1;
        images[counter + 1].style.opacity = 0.7;
        images[counter - 1].style.opacity = 0.7;
    }

    else if (images[counter].id === 'firstclone') {
        slide.style.transition = "none";
        counter = images.length - counter;
        slide.style.transform = 'translateX(' + (-size * counter) + 'px)'
        images[counter].style.opacity = 1;
        images[counter + 1].style.opacity = 0.7;
        images[counter - 1].style.opacity = 0.7;
    }
});
///////////////////////////////////////////////////////////////////

const bod = document.querySelector('.bod');
const li1 = document.querySelector('.homehead');
const li2 = document.querySelector('.abouthead');
const li3 = document.querySelector('.bloghead');


const bt = document.getElementsByClassName('.dropbtn');

const bacg = document.querySelector('.downdr');

const i1hei = document.querySelector('#one')

const nm = document.querySelector('#beyond')


var count = 3;




function but() {
    if (count % 2 == 1) {
        clc();
        count = 2;
    }

    else {
        hid();
        count = 3;
    }
}

function hid() {
    li1.style.visibility = 'hidden';
    li2.style.visibility = 'hidden';
    li3.style.visibility = 'hidden';
    
    i1hei.style.marginTop = '0vh';
    bod.style.overflow = 'visible';
}
function clc() {
    li1.style.visibility = 'visible';
    li2.style.visibility = 'visible';
    li3.style.visibility = 'visible';    
    i1hei.style.marginTop = '102vh';
    bod.style.overflow = 'hidden';
}
if (screen.width > 675) {
    li1.style.visibility = 'visible';
    li2.style.visibility = 'visible';
    li3.style.visibility = 'visible';    
    bod.style.overflow = 'visible';
    i1hei.style.marginTop = '0vh';
}
if (screen.width < 675){ 
    hid();
     
}

///////////////////////////////// contact bar
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

var horli2 = document.querySelector('#horli2')
if (screen.width < 1387) {
    horli2.style.visibility = 'visible';
}

if (screen.width < 1387) {
    contactbutton.style.visibility = 'hidden';
}

