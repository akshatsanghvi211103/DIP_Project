import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import "./App.css"
import image from "./frame.jpg"
import bobble from "./bobble.mp4"


function Main() {

    
    return (
        <>
            <Header />
            <UsingVideo />
        </>
    )
}

function Header() {

    return (
        <div id="header">
            hihihi
        </div>
    )
}

function UsingVideo() {
    // Top Left = Video
    // Bottom Left = Hyperparameters (react-slider), Apply Settings Button
    // Right Side = FFT visualizations.
    // All frequencies of that point in X, Y
    
    return (
        <div id="pageWrapper">
            <div id="leftSideWrapper" className="sideWrapper">
                <Video />
                <Hyperparameters />
            </div>

            <div id="rightSideWrapper" className="sideWrapper">
                <FFT />
            </div>
        </div>
    )
}

function Video() {
    
    const videoUrl = 
        "./frame.png"

    const videoIncrement = 1

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    
    const [size, setSize] = useState({ width: 0, height: 0})
    const [targetOpacity, setTargetOpacity] = useState(0)
    const [display, setDisplay] = useState("none");
    const [pointerEvents, setPointerEvents] = useState("none")

    const [point1, setPoint1] = useState({ x: 0, y: 0})
    const [point2, setPoint2] = useState({ x: 0, y: 0 })
    
    const [mouseState, setMouseState] = useState(0)

    const getImage = useCallback(() => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return
        const canvasContext = canvas.getContext("2d")
        canvasContext.drawImage(video, 0, 0, size.width, size.height)
        setDisplay("image")
    }, [size]);
    
    const getNextImage = useCallback(() => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return
        const duration = video.duration
        let currentTime = video.currentTime
        currentTime += videoIncrement
        if (currentTime > duration) {
            currentTime = 0
            console.log("Reset to First Frame")
        }

        video.currentTime = currentTime

        const canvasContext = canvas.getContext("2d")
        canvasContext.clearRect(0, 0, size.width, size.height)
        canvasContext.drawImage(video, 0, 0, size.width, size.height)

    })
    
    const showVideo = useCallback(() => {
        setDisplay("video")
        setTargetOpacity(1)
        setPointerEvents("auto")
    }, []);

    const reset = useCallback(() => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return
        const canvasContext = canvas.getContext("2d")
        canvasContext.clearRect(0, 0, size.width, size.height)
        if (video) {
            video.pause()
            video.currentTime = 0
        }
        setDisplay("none")
        setTargetOpacity(0)
        setPointerEvents("none")
    }, [size.height, size.width])

    const getPosition = (e) => {
        const el = e.target
        const bounding = el.getBoundingClientRect()
        const x = Math.round(Math.abs(e.clientX - bounding.left))
        const y = Math.round(Math.abs(e.clientY - bounding.top))

        return [x, y]
    }

    const mouseDown = (e) => {
        let point = getPosition(e)
        const x = point[0]
        const y = point[1]
        // console.log(x, y)
        setPoint1({x, y})
        setMouseState(1)

    }

    const mouseUp = (e) => {
        let point = getPosition(e)
        const x = point[0]
        const y = point[1]
        // console.log(x, y)
        setPoint2({x, y})
        setMouseState(0)
    }

    const drawLine = (canvas, x, y) => {
        const canvasContext = canvas.getContext("2d")
        let x1 = point1["x"]
        let y1 = point1["y"]

        let x2 = x
        let y2 = y

        let pi = Math.PI
        let arrowHeadAngle = pi / 4 // 45 deg
        // todo: arrowheadline length depends on magnitude 
        // todo: magnitude must be greater than some amount
        let arrowHeadLineLength = 20
        const dx = x2 - x1
        const dy = y2 - y1

        let arrowAngle = Math.atan2(dy, dx)

        let arrowHeadAngle1 = arrowAngle + pi * 135 / 180
        let arrowHeadAngle2 = arrowAngle + pi * 225 / 180
        
        let arrowHead1x = x2 + arrowHeadLineLength * Math.cos(arrowHeadAngle1)
        let arrowHead1y = y2 + arrowHeadLineLength * Math.sin(arrowHeadAngle1)
        
        let arrowHead2x = x2 + arrowHeadLineLength * Math.cos(arrowHeadAngle2)
        let arrowHead2y = y2 + arrowHeadLineLength * Math.sin(arrowHeadAngle2)

        canvasContext.beginPath()
        canvasContext.moveTo(x1, y1);
        canvasContext.lineTo(x2, y2);
        canvasContext.lineTo(arrowHead1x, arrowHead1y);
        
        canvasContext.moveTo(x2, y2);
        canvasContext.lineTo(arrowHead2x, arrowHead2y);
        canvasContext.lineWidth = 100;
        canvasContext.stroke()

    }

    const mouseMove = (e) => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return
        let point = getPosition(e)
        const x = point[0]
        const y = point[1]

        if (mouseState) {
            const canvasContext = canvas.getContext("2d")
            canvasContext.clearRect(0, 0, size.width, size.height)
            canvasContext.drawImage(video, 0, 0, size.width, size.height)

            drawLine(canvas, x, y)
        }
    }

    const confirmArrow = (e) => {
        console.log("Arrow Confirmed")
    }


    const button = useMemo(() => {
        switch (display) {
            case "none":
                return (
                    <button type="button" onClick={getImage}>
                    get image
                    </button>


                );
            case "image":
                return (
                    <>
                        <button type="button" onClick={showVideo}>
                        show video
                        </button>

                        <button type="button" onClick={getNextImage}>
                        get next image
                        </button>

                        <button type="button" onClick={confirmArrow}>
                        confirm arrow
                        </button>
                    
                    </>
                );
            case "video":
                return (
                    <button type="button" onClick={reset}>
                    reset
                    </button>
                );
            default:
                return null;
        }
    }, [display, getImage, reset, showVideo]);

    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        video.onloadedmetadata = () => {
            const width = video.videoWidth
            const height = video.videoHeight
            // console.log("width, height: ")
            // console.log(width)
            // console.log(height)
            // console.log('\n')
            setSize({width, height})
        }
    }, [])


    return (
        <div>
            <video
                ref={videoRef}
                controls
                src={bobble}
                style={{
                    position: "absolute",
                    borderRadius: "5px",
                    opacity: targetOpacity,
                    ...size,
                    pointerEvents: pointerEvents
                }}
            />
            <div>
                <canvas
                    ref={canvasRef}
                    {...size}
                    onMouseDown={mouseDown}
                    onMouseUp={mouseUp}
                    onMouseMove={mouseMove}
                    style={{ borderRadius: "5px" }}
                />
            </div>
            {button}
        </div>
    )
}


function Hyperparameters() {
    
    return (
        <div className="container hyp">
            {/* <img></img> */}
            hi
        </div>
    )
}

function FFT() {
    return (
        <div className="container">
            {/* <img></img> */}
            yo
        </div>
    )
}


function UsingPowerSpectrum() {

}




// tabs
// 0. Details/Info
// 1. Frequency (FFT) of a point
// 2. Power Spectrum
// 3. Mode Shapes (possibly scrolling)


// tabs on left side
// 1. show one
// 2. original vs physics

export default Main