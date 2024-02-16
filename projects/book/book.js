document.addEventListener('DOMContentLoaded', () => {
    let butt = document.querySelector('#butt')
    let video = document.querySelector('#vid')
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    let photobutton = document.querySelector('#photo')
    let getcode = document.querySelector('#etext')



    let mediaDevices = navigator.mediaDevices;

    vid.muted = true

    butt.addEventListener('click', () => {

        butt.innerHTML = "Loading . . ."
        function hide() {
            butt.style.visibility = 'hidden'
            photobutton.style.visibility = 'visible'
            photobutton.style.marginBottom = '80px'
        }
        setTimeout(hide, 1500)

        mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }, audio: false,
        }).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadedmetadata", () => {
                video.play()
            })
        }).catch(alert)
    })

    photobutton.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        let img = document.createElement('img')
        img.id = ('qrimage')
        img.src = canvas.toDataURL()
        document.body.appendChild(img)
    })

    getcode.addEventListener('click', () => {
        imageurl = document.querySelector('#qrimage')
        urls = imageurl.getAttribute('src')
        const imageURL = urls

        const imgg = new Image()
        imgg.crossOrigin = 'anonymus'
        imgg.onload = function () {
            Quagga.decodeSingle({
                src: imgg.src,
                numOfWorkers: 0,
                inputStream: {
                    size: 800
                },
                decoder: {
                    readers: ["ean_reader"] // Specify barcode reader type
                },
                locate: true
            }, function (result) {
                if (result && result.codeResult) {
                    alert("Barcode detected and decoded: " + result.codeResult.code);
                } else {
                    alert("No barcode detected");
                }
            });
        };
        imgg.src = imageURL;

    })

})
