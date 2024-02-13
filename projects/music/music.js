const audioElements = document.querySelectorAll('.audio-element');
let currentlyPlaying = null;

let mcplay = document.querySelector('.mcplay')
let mcpause = document.querySelector('.mcpause')
let shuffleon = document.querySelector('.shuffleon');
let shuffleoff = document.querySelector('.shuffle');
var nextsong = document.querySelector(".nextsong");
var prevsong = document.querySelector(".prevsong");

var nextsongid;
var prevsongid;

var songnumber;
var getsong;
var nextsongnumber;
var prevsongnumber;
var currentsongnumber;



var songid;
var fromback;
var songidname;

var replaybut = document.querySelector('.replaybutt') //replay off
var replayplaylist = document.querySelector('.replayplaylistt') // repeat on
var replayonesong = document.querySelector('.replayonesong') // repeat on
var mindiv = document.querySelector('#minuter'); // minute div
var secdiv = document.querySelector('#seconder');   // second div

shuffleon.addEventListener('click', () => {
    shuffleon.style.visibility = 'hidden'
    shuffleoff.style.visibility = 'visible';
});
shuffleoff.addEventListener('click', () => {
    shuffleon.style.visibility = 'visible'
    shuffleoff.style.visibility = 'hidden';
});

var noofsongs;

let minuter = 0; // goes in the minute div
let secondr = 1; //goes in the second div

// getting the number of songs for control purposses
fetch('musicdata.json')
    .then(response => response.json())
    .then(data => {
        noofsongs = data['number of songs'];
        console.log(noofsongs);
    })
    .catch(error => console.error('Error reading JSON:', error));

audioElements.forEach(audio => {

    var intervalid1; // for the second
    let loopit = 'norepeat'; // to check if track should be looped

    audio.addEventListener('play', () => {

        //gets the id for the current audio playing
        songnumber = audio.getAttribute('id');
        nextsongnumber = songnumber.charAt(1); // taking the number of the song
        nextsongnumber = parseInt(nextsongnumber);
        nextsongnumber++;
        nextsongid = "#t" + nextsongnumber; // setting the id for the next song

        prevsongnumber = nextsongnumber - 2
        prevsongid = "#t" + prevsongnumber;

        currentsongnumber = nextsongnumber - 1
        songid = "#t" + currentsongnumber

        songidname = audio.getAttribute('song-id')
        barschecker = songidname + "bars"

        // audio visualizer

        var newbar = "." + songidname + "bars" //gets the main container

        document.querySelector(newbar).style.visibility = 'visible'
        for (i = 1; i <= 4; i++) {
            var bar = "." + songidname + "bar" + i    // gets the individual spans
            document.querySelector(bar).style.animation = 'bounce 4s ease infinite'
            if (i == 2) {
                document.querySelector(bar).style.animationDelay = '-2s'
                document.querySelector(bar).style.marginLeft = '1.5vh'
            }
            else if (i == 3) {
                document.querySelector(bar).style.animationDelay = '-1s'
                document.querySelector(bar).style.marginLeft = '3vh'
            }
            else if (i == 4) {
                document.querySelector(bar).style.animationDelay = '-4s'
                document.querySelector(bar).style.marginLeft = '4.5vh'
            }
        }

        // music control PAUSE button
        mcpause.addEventListener('click', () => {
            currentlyPlaying.pause();
            mcplay.style.visibility = 'visible';
            mcpause.style.visibility = 'hidden';
        });

        // music control PLAY button
        mcplay.addEventListener('click', () => {
            currentlyPlaying.play();
            mcplay.style.visibility = 'hidden';
            mcpause.style.visibility = 'visible';
        });

        // to check if audio is playing or ended

        if (currentlyPlaying !== null && currentlyPlaying !== audio) {
            currentlyPlaying.pause();
            minuter = 0;
            secondr = 1;
            mindiv.innerHTML = "0:";
            audio.currentTime = 0;
        }
        // for displaying the attributes in the music control panel
        currentlyPlaying = audio;
        const fileName = audio.getAttribute('data-file-name');
        document.getElementById("titletrack").innerHTML = `${fileName}`;
        const artfileName = audio.getAttribute('data-file-artist');
        document.getElementById("trackartist").innerHTML = `${artfileName}`;


        // counter
        function forsecond() {

            if (secondr == 60) {
                secondr = 0;
                minuter++;
                mindiv.innerHTML = minuter + ":";
            }
            if (secondr < 10) {
                secdiv.innerHTML = "0" + secondr;
                secondr++;
            }
            else {
                secdiv.innerHTML = secondr;
                secondr++;
            }


        }
        intervalid1 = setInterval(forsecond, 1000);

    });

    //pause

    audio.addEventListener('pause', () => {
        clearInterval(intervalid1);
    });

    // next song button

    nextsong.addEventListener('click', () => {
        if (noofsongs < nextsongnumber) { // if the number of songs from json file is less than number that is used to get song id it means the end of playlist has been reached
            if (loopit == 'whole') {
                nextsongid = "#t1"
                getsong = document.querySelector(nextsongid);
                getsong.play();
                nextsongnumber = 2;
            }
            else {
                audio.currentTime = 3000;
                mindiv.innerHTML = "0:";
                secdiv.innerHTML = "00"
                minuter = 0;
                secondr = 1;
            }
        }

        clearInterval(intervalid1);
        getsong = document.querySelector(nextsongid);
        getsong.play();

        mcplay.style.visibility = 'hidden';
        mcpause.style.visibility = 'visible';

        minuter = 0;
        secondr = 1;
    });

    //previous song button

    prevsong.addEventListener('click', () => {
        if (secondr <= 4) { // this is to go back to the previous song, 3 second leeway
            if (songid == "#t1") {
                if (loopit == 'whole') {
                    fromback = noofsongs
                    prevsongid = "#t" + fromback
                    getsong = document.querySelector(prevsongid)
                    getsong.play()
                    fromback--;
                }
                else {
                    audio.pause()
                    audio.currentTime = 0;
                    mcplay.style.visibility = 'visible';
                    mcpause.style.visibility = 'hidden';
                }
            }
            else if (loopit == "onesong") {
                audio.currentTime = 0;
            }
            else {
                getsong = document.querySelector(prevsongid);
                getsong.play();
            }
        }
        else if (secondr > 4) { // this is to go to the starting of the song after 3 second leeway 
            audio.currentTime = 0;
        }

        if (loopit == "onesong") {
            audio.currentTime = 0;
        }
        setTimeout(() => {
            secondr = 0;
        }, 100);
    })

    //replay checker

    replaybut.addEventListener('click', () => { // off
        replaybut.style.visibility = 'hidden'
        replayplaylist.style.visibility = 'visible';
        replayonesong.style.visibility = 'hidden'
        loopit = 'whole';
    });
    replayplaylist.addEventListener('click', () => { //on for playlist
        replaybut.style.visibility = 'hidden'
        replayplaylist.style.visibility = 'hidden';
        replayonesong.style.visibility = 'visible'
        loopit = 'onesong';
    });
    replayonesong.addEventListener('click', () => { // on for only one song
        replaybut.style.visibility = 'visible'
        replayplaylist.style.visibility = 'hidden';
        replayonesong.style.visibility = 'hidden'
        loopit = 'norepeat';
    });

    //looping based on replay checker and also operations of playing next song when song ends

    audio.addEventListener('ended', () => {

        minuter = 0;
        secondr = 1;

        if (loopit == 'onesong') {
            currentlyPlaying.play();
            minuter = 0;
            mindiv.innerHTML = "0:";


        }

        else if (loopit == "whole") {
            if (noofsongs < nextsongnumber) {
                nextsongid = "#t1"
                getsong = document.querySelector(nextsongid);
                getsong.play();
                nextsongnumber = 2;
            }
            else if (noofsongs >= nextsongnumber) {
                nextsongnumber = 2;
                nextsongnumber = parseInt(nextsongnumber);
                nextsongid = "#t" + nextsongnumber;
                getsong = document.querySelector(nextsongid);
                getsong.play();
                nextsongnumber++;
            }
            for (i = 1; i <= 4; i++) {
                var bar = "." + songidname + "bar" + i
                document.querySelector(bar).style.animation = '0s'
                var newbar = "." + songidname + "bars"
                document.querySelector(newbar).style.visibility = 'hidden';
            }
        }
        else if (loopit == 'norepeat') {
            if (nextsongnumber == (noofsongs + 1)) {
                mcplay.style.visibility = 'visible';
                mcpause.style.visibility = 'hidden';
            }
            else {
                mcplay.style.visibility = 'hidden';
                mcpause.style.visibility = 'visible';
                getsong = document.querySelector(nextsongid);
                getsong.play();
            }

            for (i = 1; i <= 4; i++) {
                var bar = "." + songidname + "bar" + i
                document.querySelector(bar).style.animation = '0s'
                var newbar = "." + songidname + "bars"
                document.querySelector(newbar).style.visibility = 'hidden';
            }
        }
    });
});




/////////////////////////////////////////////////////////////////
var p1 = document.getElementById("t1")
document.querySelector('.showerbeckyg').addEventListener("click", () => {
    p1.play();
    p1.currentTime = 0;
    mcplay.style.visibility = 'hidden';
    mcpause.style.visibility = 'visible';
    mindiv.innerHTML = "0:";
    secdiv.innerHTML = "00"
    minuter = 0;
    secondr = 1;
});
//////////////////////////////////////////////////////
var p2 = document.getElementById("t2")
document.querySelector('.confessions-part-2-usher').addEventListener('click', () => {
    p2.play();
    p2.currentTime = 0;
    mcplay.style.visibility = 'hidden';
    mcpause.style.visibility = 'visible';
    mindiv.innerHTML = "0:";
    secdiv.innerHTML = "00"
    minuter = 0;
    secondr = 1;
});
//////////////////////////////////////////////////////
var p3 = document.getElementById("t3")
document.querySelector('.seasons-of-love-rent').addEventListener('click', () => {
    p3.play();
    p3.currentTime = 0;
    mcplay.style.visibility = 'hidden';
    mcpause.style.visibility = 'visible';
    mindiv.innerHTML = "0:";
    secdiv.innerHTML = "00"
    minuter = 0;
    secondr = 1;

});
////////////////////////////////////////////////////////
var p4 = document.getElementById('t4')
document.querySelector('.set-fire-to-the-rain-adele-royal-albert').addEventListener('click', () => {
    p4.play();
    p4.currentTime = 0;
    mcplay.style.visibility = 'hidden';
    mcpause.style.visibility = 'visible';
    mindiv.innerHTML = "0:";
    secdiv.innerHTML = "00"
    minuter = 0;
    secondr = 1;

});
////////////////////////////////////////////
var p5 = document.getElementById("t5")
document.querySelector(".Come-and-Get-Your-Love-Redbone").addEventListener("click", () => {
    p5.play();
    p5.currentTime = 0;
    mcplay.style.visibility = "hidden";
    mcpause.style.visibility = "visible";
    mindiv.innerHTML = "0:";
    secdiv.innerHTML = "00";
    minuter = 0;
    secondr = 1;
});
////////////////////////////////////////////
var p6 = document.getElementById("t6")
document.querySelector(".Million-Years-Ago-Adele").addEventListener("click", () => {
    p6.play();
    p6.currentTime = 0;
    mcplay.style.visibility = "hidden";
    mcpause.style.visibility = "visible";
    mindiv.innerHTML = "0:";
    secdiv.innerHTML = "00";
    minuter = 0;
    secondr = 1;
});
