const audioElements = document.querySelectorAll('.audio-element');
let currentlyPlaying = null;

let mcplay = document.querySelector('.mcplay')
let mcpause = document.querySelector('.mcpause')
let shuffleon = document.querySelector('.shuffleon');
let shuffleoff = document.querySelector('.shuffleoff');
var nextsong = document.querySelector(".nextsong");

var songid;
var songnumber;
var getsong;
var newsongnumber;
var songduration;

var totalchecker = '1';

shuffleon.addEventListener('click', () => {
    shuffleon.style.visibility = 'hidden'
    shuffleoff.style.visibility = 'visible';
});
shuffleoff.addEventListener('click', () => {
    shuffleon.style.visibility = 'visible'
    shuffleoff.style.visibility = 'hidden';
});

var noofsongs;

// getting the number of songs for control purposses
fetch('musicdata.json')
    .then(response => response.json())
    .then(data => {
        noofsongs = data['number of songs'];
        console.log(noofsongs);
    })
    .catch(error => console.error('Error reading JSON:', error));

audioElements.forEach(audio => {

    var minuter = 0; // goes in the minute div
    var secondr = 1; //goes in the second div
    var mindiv = document.querySelector('#minuter');
    var secdiv = document.querySelector('#seconder');
    var intervalid1; // for the second
    var replaybut = document.querySelector('.replaybutt') //replay off
    var replayplaylist = document.querySelector('.replayplaylistt') // repeat on

    let loopit; // to check if track should be looped

    audio.addEventListener('play', () => {


        //gets the id for the current audio playing
        songnumber = audio.getAttribute('id');
        newsongnumber = songnumber.charAt(1); // taking the number of the song
        newsongnumber = parseInt(newsongnumber);
        newsongnumber++;

        songid = "#t" + newsongnumber; // setting the id for the next song


        // music control pause button
        mcpause.addEventListener('click', () => {
            currentlyPlaying.pause();
            mcplay.style.visibility = 'visible';
            mcpause.style.visibility = 'hidden';
            totalchecker = '0';
        });

        // music control play button
        mcplay.addEventListener('click', () => {
            currentlyPlaying.play();
            mcplay.style.visibility = 'hidden';
            mcpause.style.visibility = 'visible';
            totalchecker = '1';
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
        totalchecker = '1';
    });

    // next song button
    nextsong.addEventListener('click', () => {
        if (noofsongs < newsongnumber) { // if the number of songs from json file is less than number that is used to get song id it means the end of playlist has been reached
            audio.currentTime = 3000;
            mindiv.innerHTML = "0:";
            secdiv.innerHTML = "00"
            minuter = 0;
            secondr = 1;
        }

        clearInterval(intervalid1);
        getsong = document.querySelector(songid);
        getsong.play();
        mcplay.style.visibility = 'hidden';
        mcpause.style.visibility = 'visible';

        minuter = 0;
        secondr = 1;
    });

    //replay

    replaybut.addEventListener('click', () => {
        replaybut.style.visibility = 'hidden'
        replayplaylist.style.visibility = 'visible';
        loopit = true;
    });
    replayplaylist.addEventListener('click', () => {
        replaybut.style.visibility = 'visible'
        replayplaylist.style.visibility = 'hidden';
        loopit = false;
    });

    //on end to loop or not

    audio.addEventListener('ended', () => {
        console.log(loopit)
        minuter = 0;
        secondr = 1;

        if (loopit == true) {
            audio.play();
            minuter = 0;
            mindiv.innerHTML = "0:";
        }
        if (noofsongs < newsongnumber) {
            mcplay.style.visibility = 'visible';
            mcpause.style.visibility = 'hidden';
        }
        else {
            getsong = document.querySelector(songid);
            getsong.play();
        }
    });
});




/////////////////////////////////////////////////////////////////
var p1 = document.getElementById("t1")
var checker1 = '1';
document.querySelector('.showerpl').addEventListener("click", () => {
    if (checker1 == '1' || totalchecker == '1') {
        p1.play();
        checker1 = '0';
        mcplay.style.visibility = 'hidden';
        mcpause.style.visibility = 'visible';
    }
    else if (checker1 == '0') {
        p1.pause();
        mcplay.style.visibility = 'visible';
        mcpause.style.visibility = 'hidden';
        checker1 = '1';
        totalchecker = '1';
    }
});
//////////////////////////////////////////////////////
var p2 = document.getElementById("t2")
var checker2 = '1';
document.querySelector('.cptupl').addEventListener('click', () => {
    if (checker2 == '1' || totalchecker == '1') {
        p2.play();

        checker2 = '0';
        mcplay.style.visibility = 'hidden';
        mcpause.style.visibility = 'visible';
    }
    else if (checker2 == '0') {
        p2.pause();
        mcplay.style.visibility = 'visible';
        mcpause.style.visibility = 'hidden';
        checker2 = '1';
        totalchecker = '1';
    }
});
//////////////////////////////////////////////////////
var p3 = document.getElementById("t3")
var checker3 = '1';
document.querySelector('.solrpl').addEventListener('click', () => {
    if (checker3 == '1' || totalchecker == '1') {
        p3.play();

        checker3 = '0';
        mcplay.style.visibility = 'hidden';
        mcpause.style.visibility = 'visible';
    }
    else if (checker3 == '0') {
        p3.pause();
        mcplay.style.visibility = 'visible';
        mcpause.style.visibility = 'hidden';
        checker3 = '1';
        totalchecker = '1';
    }
});
////////////////////////////////////////////////////////
var p4 = document.getElementById('t4')
var checker4 = '1';
document.querySelector('.sfttrarlpl').addEventListener('click', () => {
    if (checker4 == '1' || totalchecker == '1') {
        p4.play();

        checker4 = '0';
        mcplay.style.visibility = 'hidden';
        mcpause.style.visibility = 'visible';
    }
    else if (checker4 == '0') {
        p4.pause();
        mcplay.style.visibility = 'visible';
        mcpause.style.visibility = 'hidden';
        checker4 = '1';
        totalchecker = '1';
    }
});

