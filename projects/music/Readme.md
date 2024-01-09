Hello there, This site is a music player site, this site is made with the intention of listening to my favourite music without the ads and unwanted sugesstions and also for me to learn about various topics like databases, node js, dynamic webpages and dynamic data manipulation.

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
    24/12/23
        V0.5
            -> fixed an issue where if you pause the song using the music control pause and the played a song from the list using its button
            and then a second song using its button the second was not playing. it was a control varible issue
            -> fixed an issue where the loop button for individual song was not working, had to add an else to another if condition to
            prevent promise from happenning
             ->added another loop button for individual song, it can be accessed by clicking through the loop buttons.
            -> fixed an issue where the next button was not recognizing the loop button, had to add the code in the next button listener for that
    26/12/23
        V 0.6
            -> fixed an issue of a song not playing after another song played
    3/1/2024
        V 0.7
            -> removed the ability to pause from the playlist part, that just plays now, made it so anywhere you click on the container it plays
            -> made the text in the music controller a responsive font so that the whole does not keep shifting if a song has more words
            ->also the play and pause thing works just as it should, its simple.
    10/1/2024
        V 0.8
            -> the previous song button is now functional, there is a 3 second leeway to go back to the previous song in the list.
             If the button is pressed after 3 second leeway it restarts the song.
            ->removed the shuffle button
            ->The previous song button also works with regards to the loopiing features.
            ->also to give credit where credit is due, Chat-GPT 3.5 helped me with a playback issue as it was conflicting with the second variable\
                it suggested to use a delay and it works just as a i wanted it to.



The Wordchanger file :-\
    As the name might give a hint, it is a code i wrote that helps automate the process of creating the html and javascript code for the site.\
        -> The first version i inputted names of class,div,title,audio file to help generate the code.\
        -> The second version i wrote code that was able to grab the first letter of each word that helped in creating the id for the elements.\
        -> The third and latest version is where i input the name of the file, the audio number and how many words is the title of the song.\
        -> I plan to keep upgrading features to make the process seamless, I plan to make it so that with only 1 input it can help generate the code.

******************************************

Dev notes / ideas: 

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

24/12/23

-> loop button works, no issues so far.\

27/12/23

-> having major issues with the play and pause functions of the system when i play one thing and pause one thing, currently using\
    control variables which is too complicated and clearly not working. for a fix working on an animation that shows what is playing \
    and that will be clickable therefore bringing back the pause button in another form. it's simpler that way and also reduces the number \
    of operations needed to be performed regarding global variables functions.
-> hopefully the new idea works, animation works just need to configure it to the player.
-> have to figure out the logic in relation to the music control play button.

3/1/24

-> removed the pause and the whole control variable thing, life is easier without it\
-> working on an animation for the song that is playing so that the user knows what is playing

10/1/24

-> gonna work on the shuffle button once i have the database up and running.\
-> have to trim down the javascript code its too long and lot of same things. essentially a slight optimization.\
-> working on the JSON database, had some success as to what needs to be done.\
-> i want to add the song cover to the thing. also if it could be a little smaller.\
-> almost done with the final code for the html and js but gonna start updating the word changer to the latest version.


