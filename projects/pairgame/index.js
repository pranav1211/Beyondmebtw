var download = document.querySelector('#download')
var link = document.querySelector('#thelink')
var begintext = document.querySelector('#begintext')
var pairgame = document.querySelector("#pairgame")
var veerag = document.querySelector("#veerag")
var pranav = document.querySelector("#pranav")
var about = document.querySelector("#about")
var imagesgame = document.querySelector("#imagesgame")



download.addEventListener('click', () => {
    link.click()

})

document.addEventListener("DOMContentLoaded",()=>{
    begintext.style.animation = 'fadein 3s ease'
    download.style.animation = 'frombottom 3s ease'
    pairgame.style.animation  = 'fromtop 3s ease'
    pranav.style.animation = 'fromleft 3s ease'
    veerag.style.animation = 'fromright 3s ease'
    about.style.animation = 'fadein 5s ease'
    imagesgame.style.animation = 'fadein 5s ease'
    
})