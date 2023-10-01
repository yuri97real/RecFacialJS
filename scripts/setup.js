class RecFacial {
    constructor(videoSelector = "#video") {
        this.descriptor = null;
        this.video = document.querySelector(videoSelector);

        this.video.addEventListener("play", this.handlePlay);

        this.start();
    }

    async start() {
        const routeModels = "/weights";

        await faceapi.nets.tinyFaceDetector.loadFromUri(routeModels);
        await faceapi.nets.faceLandmark68Net.loadFromUri(routeModels);
        await faceapi.nets.faceRecognitionNet.loadFromUri(routeModels);
        await faceapi.nets.faceExpressionNet.loadFromUri(routeModels);

        navigator.getUserMedia(
            { video: true, audio: false },
            (stream) => (this.video.srcObject = stream),
            (err) => console.log(err)
        );
    }

    handlePlay(e) {
        const video = e.target;
        const options = new faceapi.TinyFaceDetectorOptions();

        setInterval(async () => {
            const singleResult = await faceapi
                .detectSingleFace(video, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            const canvas = document.querySelector(".media-container canvas");

            canvas
                .getContext("2d")
                .clearRect(0, 0, canvas.width, canvas.height);

            if (!singleResult) return;

            this.descriptor = singleResult.descriptor;

            if (!singleResult) return;

            const displaySize = {
                width: video.clientWidth,
                height: video.clientHeight,
            };

            faceapi.matchDimensions(canvas, displaySize);

            const resizedResults = faceapi.resizeResults(
                singleResult,
                displaySize
            );

            faceapi.draw.drawDetections(canvas, resizedResults);
            faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
        }, 100);
    }
}

new RecFacial();
