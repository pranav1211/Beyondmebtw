

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
console.log(count);

if (screen.width > 675) {
    li1.style.visibility = 'visible';
    li2.style.visibility = 'visible';
    li3.style.visibility = 'visible';
    li4.style.visibility = 'visible';
    bod.style.overflow = 'visible';
    i1hei.style.marginTop = '0vh';

    window.onload = function () {
        if (!window.location.hash) {
            window.location = window.location + '#1';
            window.location.reload();
        }
    }
}
if (screen.width < 675) {
    hid();
    
}

