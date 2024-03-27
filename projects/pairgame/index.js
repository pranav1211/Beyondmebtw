var download = document.querySelector('#download')
var link = document.querySelector('#thelink')
var begintext = document.querySelector('#begintext')
var pairgame = document.querySelector("#pairgame")
var veerag = document.querySelector("#veerag")
var pranav = document.querySelector("#pranav")
var about = document.querySelector("#about")
var imagesgame = document.querySelector("#imagesgame")
var level1 = document.querySelector("#level1")
var level2 = document.querySelector("#level2")
var journey = document.querySelector("#journey")
var journeylink = document.querySelector("#journeylink")

var redones = document.querySelectorAll(".redones")
var blackones = document.querySelectorAll(".blackones")

var imagediv = document.querySelector("#imagediv")


download.addEventListener('click', () => {
    link.click()

})

document.addEventListener("DOMContentLoaded",()=>{    
    //from bottom
    download.style.animation = 'frombottom 3s ease'
    journey.style.animation = 'frombottom 5s ease'
    journeylink.style.animation = 'frombottom 5s ease'
    about.style.animation = 'frombottom 5s ease'

    //from top
    pairgame.style.animation  = 'fromtop 3s ease'
    //from left
    pranav.style.animation = 'fromleft 3s ease'
    //from right
    veerag.style.animation = 'fromright 3s ease'
    //fade in
    begintext.style.animation = 'fadein 3s ease'    
    imagesgame.style.animation = 'fadein 5s ease'
    level1.style.animation = 'fadein 5s ease'
    level2.style.animation = 'fadein 5s ease'
    


    //piece by piece
    blackones.forEach((blackones)=>{
        blackones.style.animation = 'fromleft 5s ease'
    })
    redones.forEach((redones)=>{
        redones.style.animation = 'fromright 5s ease'
    })
   
})


if (screen.width < 896){
    about.style.fontSize = '21px';     
}

if (screen.width < 855){
    imagediv.style.flexDirection = 'column'
    level2.style.marginLeft = '0px';    
    level1.style.width = '100%';
    level2.style.width = '100%';
    begintext.style.fontSize = '100%';
}

