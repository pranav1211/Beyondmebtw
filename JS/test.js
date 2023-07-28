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

window.addEventListener('load',()=>{
    window.location.reload
    alert('hel')
})

setInterval(move,6500);

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
const li4 = document.querySelector('.twitter');

const bt = document.querySelector('.dropbtn');

const bacg = document.querySelector('.downdr');

const i1hei = document.querySelector('#one')

const nm = document.querySelector('#beyond')

function hid() {
    li1.style.visibility = 'hidden';
    li2.style.visibility = 'hidden';
    li3.style.visibility = 'hidden';
    li4.style.visibility = 'hidden';
    i1hei.style.marginTop = '0vh';
    bod.style.overflow = 'visible';
}
function clc() {
    li1.style.visibility = 'visible';
    li2.style.visibility = 'visible';
    li3.style.visibility = 'visible';
    li4.style.visibility = 'visible';
    i1hei.style.marginTop = '102vh';
    bod.style.overflow = 'hidden';
    

}

let count = 1;



bt.addEventListener('click', () => {

    if (count % 2 === 0) {
        hid();
        count = 3;
    }
    else {
        clc();
        count = 2;
    }

});


if (screen.width > 675) {
    li1.style.visibility = 'visible';
    li2.style.visibility = 'visible';
    li3.style.visibility = 'visible';
    li4.style.visibility = 'visible';
    bod.style.overflow = 'visible';
    i1hei.style.marginTop = '0vh';

    
    
}
if (screen.width < 675) {
    hid();
    
}

