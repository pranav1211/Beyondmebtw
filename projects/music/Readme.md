Hello there, This site is a music player site, this site is made with the intention of listening to my favourite music without the ads and unwanted sugesstions and also for me to learn about various topics like databases, node js, dynamic webpages and dynamic data.

You can check this site out at : www.beyondmebtw.com/projects/music

Changelog :-

    27/10/23 : 
        V 0.1
            -> made a change to the word changer to add a class and data-file-name value to the audio
            -> made the audio of the previous set to zero when another track starts playing
            -> added 3 songs.
    18/12/23 :
        V 0.2
            -> removed 16 songs
            -> the music timer works now properly.
            -> the pause button and the play button reset to original position after the song ends
    19/12/23:
        V 0.3
            -> music timer still works properly
            -> added next, previous and shuffle buttons that do not work for the moment, will enable 
                in the future.
            ->removed the pause button, you can still pause by pressing the play button it just does not
                show. the pause button can be seen in the music controls section.
                made it to work even when song is changed in the middle and also made it so 
                when you go back to play another song that was played before it plays and does not 
                require a double click
            ->changed the javascript code where it now only has one queryselector for each song that 
                is the play button
            ->changed the html wherin i removed the pause span tag.
            -> added a background gradient to the whole page
            -> added a 3d effect to the song list and the music controls
    20/12/23:
        V0.4
            ->added next song, previous song, shuffle button (in development)
            ->made it so when a song ends it plays the next one as seen on screen
            ->created a json file to access 'number of songs' data for control purposess
            ->fixed an issue where you could not pause the song from the play button
            -> fixed an issue of the music control center play button playing another song after being paused
            ->


The Wordchanger file :-\
    As the name might give a hint, it is a code i wrote that helps automate the process of creating the html and javascript code for the site.\
        -> The first version i inputted names of class,div,title,audio file to help generate the code.\
        -> The second version i wrote code that was able to grab the first letter of each word that helped in creating the id for the elements.\
        -> The third and latest version is where i input the name of the file, the audio number and how many words is the title of the song.\
        -> I plan to keep upgrading features to make the process seamless, I plan to make it so that with only 1 input it can help generate the code.

******************************************

Dev notes / ideas: (ignore if you want)

5/12/23 
->removed the interval for the minute part, made it a part of the second timer.\
->an issue is there where the minute changes when the minute changes 1 second before it's supposed to.\
->removed 16 songs from the main list because it became too much to handle with the amount of changes i am making.\
->there are 4 songs with which i am testing right now and once i reach a stable version where i can easily change all the stuff without going through each one of them.\
->i dont want it to be perfect i just need it to be efficient.\
->have to change the word changer document to make it compatible with new format.

18/12/23

->made the fix of the minute part starting on 59 seconds, realised that it was a scope issue.\
->added some empty buttons, will need a way to iterate in the future for next and shuffle.\
->maybe JSON or a JS object can use the song-id part.

20/12/23 

->have to work on the loop button to make it loop for either the whole playlist or just and individual song. \
->have to enter song data into json file. look into SQLlite.\
->have to work on the shuffle button
->have to work on the next and previous song previous song button, for previous song button set time to 1 second and also do the clear interval and change content in div for it.


