Hello there, THis site is a music player site, this site was made with the intention of listening to my favourite music without the ads and unwanted sugesstions. \
You can try out this site by downloading the files and running the Music.html file, ensure you have an internet connection to be able to load the fonts and icons. \
I'm open to sugesstions and criticism as it will only make it better.

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
            -> added next, previous and shuffle buttons that do not work for the moment, will enable \
                in the future.
            ->removed the pause button, you can still pause by pressing the play button it just does \
                show. the pause button can be seen in the music controls section.\
                made it to work even when song is changed in the middle and also made it so \
                when you go back to play another song that was played before it plays and does not \
                require a double click
            ->changed the javascript code where it now only has one queryselector for each song that \
                is the play button
            ->changed the html wherin i removed the pause span tag.
            -> added a background gradient to the whole page
            -> added a 3d effect to the song list and the music controls


The Wordchanger file :-\
    As the name might give a hint, it is a code i wrote that helps automate the process of creating the html and javascript code for the site.\
        -> The first version i inputted names of class,div,title,audio file to help generate the code.\
        -> The second version i wrote code that was able to grab the first letter of each word that helped in creating the id for the elements.\
        -> The third and latest version is where i input the name of the file, the audio number and how many words is the title of the song.\
        -> I plan to keep upgrading features to make the process seamless, I plan to make it so that with only 1 input it can help generate the code.

Dev notes / ideas:\

5/12/23 \
removed the interval for the minute part, made it a part of the second timer.\
an issue is there where the minute changes when the minute changes 1 second before it's supposed to.\
removed 16 songs from the main list because it became too much to handle with the amount of changes i am making.\
there are 4 songs with which i am testing right now and once i reach a stable version where i can easily change all the stuff without going through each one of them.\
i dont want it to be perfect i just need it to be efficient.\
chane the word changer document to make it compatible with new format.

18/12/23\

made the fix of the minute part starting on 59 seconds, realised that it was a scope issue.
added some empty buttons, will need a way to iterate in the future for next and shuffle.
maybe JSON or a JS object can use the song-id part.
