
const li1 = document.querySelector('.homehead');
const li2 = document.querySelector('.abouthead');
const li3 = document.querySelector('.bloghead');
const li4 = document.querySelector('.twitter');

const bt = document.querySelector('.dropbtn');

const bacg = document.querySelector('.downdr');

const i1hei = document.querySelector('#intro1')

function hid() {
    li1.style.visibility = 'hidden';
    li2.style.visibility = 'hidden';
    li3.style.visibility = 'hidden';
    li4.style.visibility = 'hidden';
    i1hei.style.marginTop = '14vh';
}
function clc() {
    li1.style.visibility = 'visible';
    li2.style.visibility = 'visible';
    li3.style.visibility = 'visible';
    li4.style.visibility = 'visible';
    i1hei.style.marginTop = '29vh';

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

if (screen.width > 630) {
    clc();
    window.onload = function () {
        if (!window.location.hash) {
            window.location = window.location + '#';
            window.location.reload();
        }
    }
    i1hei.style.marginTop = '';
}
if (screen.width < 630) {
    hid();
}