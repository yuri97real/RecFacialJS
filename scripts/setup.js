class RecFacial {
    constructor(videoSelector = "#video") {
        this.descriptor = null;
        this.faceMatcher = null;

        this.video = document.querySelector(videoSelector);

        this.video.addEventListener("play", (e) =>
            this.handlePlay(e, this?.handleDetect)
        );

        this.setFaceMatcher();
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

    handlePlay(e, handleDetect = () => {}) {
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

            handleDetect();
            this.descriptor = singleResult.descriptor;

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

            this._detectUser(canvas, singleResult);
        }, 100);
    }

    saveDescriptor(username) {
        if (!username) throw new Error("username is required");

        if (typeof username != "string")
            throw new Error("username must be string type");

        const oldValues = this._parseStringDescriptor(
            localStorage.queryDescriptors || "{}"
        );

        if (!oldValues[username]) {
            oldValues[username] = [];
        }

        oldValues[username].push(this.descriptor);

        const queryDescriptors = this._stringifyDescriptor(oldValues);

        localStorage.setItem("queryDescriptors", queryDescriptors);

        this.setFaceMatcher();
    }

    setFaceMatcher() {
        const { queryDescriptors: stringQueryDescriptors } = localStorage;

        if (!stringQueryDescriptors) return;

        const queryDescriptors = this._parseStringDescriptor(
            stringQueryDescriptors
        );

        const labels = Object.keys(queryDescriptors);
        const descriptors = Object.values(queryDescriptors);

        const labeledDescriptors = descriptors.map((descriptor, index) => {
            const label = labels[index];
            return new faceapi.LabeledFaceDescriptors(label, descriptor);
        });

        this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
    }

    _detectUser(canvas, singleResult) {
        if (!this.faceMatcher) return;

        const bestMatch = this.faceMatcher.findBestMatch(
            singleResult.descriptor
        );

        const drawBox = new faceapi.draw.DrawTextField(
            bestMatch?.label,
            { x: 200, y: 200 },
            {
                anchorPosition: "TOP_LEFT",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
            }
        );

        drawBox.draw(canvas);
    }

    _stringifyDescriptor(descriptor) {
        return JSON.stringify(descriptor, (key, value) => {
            if (
                value instanceof Int8Array ||
                value instanceof Uint8Array ||
                value instanceof Uint8ClampedArray ||
                value instanceof Int16Array ||
                value instanceof Uint16Array ||
                value instanceof Int32Array ||
                value instanceof Uint32Array ||
                value instanceof Float32Array ||
                value instanceof Float64Array
            ) {
                const replacement = {
                    constructor: value.constructor.name,
                    data: Array.apply(
                        [],
                        value instanceof ArrayBuffer
                            ? new Uint8Array(value)
                            : value
                    ),
                    flag: "FLAG_TYPED_ARRAY",
                };

                return replacement;
            }
            return value;
        });
    }

    _parseStringDescriptor(descriptor) {
        const context = typeof window === "undefined" ? global : window;

        return JSON.parse(descriptor, function (key, value) {
            try {
                if (value.constructor === "ArrayBuffer") {
                    return new Uint8Array(value.data).buffer;
                }

                if ("flag" in value && value.flag === "FLAG_TYPED_ARRAY") {
                    return new context[value.constructor](value.data);
                }
            } catch (e) {}

            return value;
        });
    }
}
