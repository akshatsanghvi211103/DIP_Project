import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import MousePos from "./MousePos"

import "./App.css"
import noise from "./assets/nnnoise.svg"
import bobble from "./assets/bobble.mp4"
import bobbleBIG from "./assets/bobbleBIG.mp4"


function Main() {

    
    return (
        <>

            <Header />
            <div className="pageWrapperBackground"></div>
            <div id="pageWrapper" className="flex col">
                <UsingVideo />
                <img className="noise"></img>
                <img className="noise noise2"></img>
                <Blobs />
                <Settings />

                <Graphs />

            </div>
            {/* <MousePos /> */}
            {/* <div className="screen"></div>
            <div className="screen"></div> */}
        </>
    )
}

function Graphs() {
    const [fX, setfX] = useState([]);
    const [fY, setfY] = useState([]);
    const [mX, setmX] = useState([]);
    const [mY, setmY] = useState([]);

    useEffect(() => {
        const handleStorage = () => {
            let frequenciesX = localStorage.getItem("fX")
            let frequenciesY = localStorage.getItem("fY")
            let magnitudesX = localStorage.getItem("mX")
            let magnitudesY = localStorage.getItem("mY")

            setfX(frequenciesX);
            setfY(frequenciesY);
            setmX(magnitudesX);
            setmY(magnitudesY);
        }

        window.addEventListener('storage', handleStorage())
        return () => window.removeEventListener('storage', handleStorage())
    }, [])

    return (
        <>
            
        </>
    );
}

function Header() {

    return (
        <div id="header" className="flex">
            Interactive 2D Video Dynamics
        </div>
    )
}

function Blobs() {
    return (
        <div className="blobs flex">

            <div className="blob circle1"></div>
            <div className="blob circle2"></div>
            <div className="blob circle3"></div>
            <div className="blob circle4"></div>
        </div>
    )
}

function UsingVideo() {    
    const [active, setActive] = useState(0)

    return (
        <div id="videosWrapper" className="flex row">
            <Video />



            {
            /* <div id="tabs">
                <div className={`tab flex ${(active == 0) ? "activeTab" : ""}`}
                    onClick={() => setActive(0)}
                    >
                    {(active == 0) ? "Settings" : "Settings"}
                </div>
                <div className={`tab flex ${(active == 1) ? "activeTab" : ""}`}
                    onClick={() => setActive(1)}
                    >
                    {(active == 1) ? "Fourier" : "FFT"}
                </div>
                <div className={`tab flex ${(active == 2) ? "activeTab" : ""}`}
                    onClick={() => setActive(2)}                
                    >
                    {(active == 2) ? "Power" : "PS"}
                </div>
            </div> */
            }

        </div>
    )
}

function Video() {

    const videoIncrement = 1

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    
    const [size, setSize] = useState({ width: 0, height: 0})
    const [targetOpacity, setTargetOpacity] = useState(0)
    const [file, setFile] = useState(bobble)
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

    const mouseDown = async (e) => {
        let point = getPosition(e)
        const x = point[0]
        const y = point[1]
        // console.log(x, y)
        setPoint1({x, y})
        setMouseState(1)

        let response1 = await getPixelSpectrum([x, y])
        let frequenciesX = response1["frequenciesX"];
        let frequenciesY = response1["frequenciesY"];
        let magnitudesX = response1["magnitudesX"];
        let magnitudesY = response1["magnitudesY"];

        localStorage.setItem("fX", frequenciesX)
        localStorage.setItem("fY", frequenciesY)
        localStorage.setItem("mX", frequenciesX)
        localStorage.setItem("mY", frequenciesY)

        console.log(response1)

    }

    const mouseUp = (e) => {
        let point = getPosition(e)
        const x = point[0]
        const y = point[1]
        // console.log(x, y)
        setPoint2({ x, y })


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
        const dx = x2 - x1
        const dy = y2 - y1
        let arrowAngle = Math.atan2(dy, dx)

        // let magnitude = Math.sqrt((dx * dx) + (dy * dy))
        // console.log(magnitude)
        // todo: arrowheadline length depends on magnitude
        // todo: magnitude must be greater than some amount
        // let arrowHeadLineLength = magnitude / 5
        // canvasContext.lineWidth = magnitude / 50;
        let arrowHeadLineLength = 10;


        let arrowHeadAngle1 = arrowAngle + pi * 135 / 180
        let arrowHeadAngle2 = arrowAngle + pi * 225 / 180
        
        let arrowHead1x = x2 + arrowHeadLineLength * Math.cos(arrowHeadAngle1)
        let arrowHead1y = y2 + arrowHeadLineLength * Math.sin(arrowHeadAngle1)
        
        let arrowHead2x = x2 + arrowHeadLineLength * Math.cos(arrowHeadAngle2)
        let arrowHead2y = y2 + arrowHeadLineLength * Math.sin(arrowHeadAngle2)

        // console.log("lineWidth: " + canvasContext.lineWidth)
        canvasContext.beginPath()
        canvasContext.moveTo(x1, y1);
        canvasContext.lineTo(x2, y2);
        // canvasContext.lineWidth = canvasContext.lineWidth + 3.0;
        canvasContext.lineTo(arrowHead1x, arrowHead1y);
        canvasContext.moveTo(x2, y2);
        canvasContext.lineTo(arrowHead2x, arrowHead2y);
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

    const uploadVideo = async () => {
        // let video_file_name = "bobble_small.mp4"
        const data = {
            video_file_name: "bobble_small.mp4"
        }

        console.log(JSON.stringify(data))


        const response = await fetch("/upload", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        })

        if (response.ok) {
            console.log("Got Response")
            return 1;
        } else {
            console.log("Did Not get Response")
            return 0;
        }
    }

    // const processArrow = async (
    //         pixel = [85, 155], freqXIndex = 34, freqYIndex = 34,
    //         force = [0.5, 0.5], amp = 3, time = 160, mass = 1,
    //         damp = 0.095, width = 415, sample = 1
    //     ) => {

    //     const data = {

    //         "pixel": pixel,
    //         "frequencyXIndex": freqXIndex,
    //         "frequencyYIndex": freqYIndex,
    //         "force": force,
    //         "hyperparameters": {
    //                 "amplification" : amp, 
    //                 "time" : time, 
    //                 "mass" : mass, 
    //                 "damp" : damp, 
    //                 "width": width, 
    //                 "sample": sample
    //             }
            
    //     }

    //     console.log(JSON.stringify(data))


    //     const response = await fetch("/processArrow", {
    //         method: "POST",
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Access-Control-Allow-Origin': '*'
    //         },
    //         body: JSON.stringify(data)
    //     })

    //     if (response.ok) {
    //         console.log("Got Response")
    //         return 1;
    //     } else {
    //         console.log("Did Not get Response")
    //         return 0;
    //     }
    // }

    const getPixelSpectrum = async (pixel) => {
        // let video_file_name = "bobble_small.mp4"
        const data = {
            "pixel": pixel,            
        }

        console.log(JSON.stringify(data))


        const response = await fetch("/pixelSpectrum", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        })

        if (response.ok) {
            console.log("Got Pixel Spectrum Response")
            return response
        } else {
            console.log("Did Not get Response")
            return null;
        }
    }

    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        video.onloadedmetadata = () => {
            // const width = video.videoWidth
            // const height = video.videoHeight
            const windowWidth = window.innerWidth / 2 - 100;
            const aspectRatio = video.videoHeight / (1.0 * video.videoWidth)
            let width = windowWidth - 50
            let height = aspectRatio * width

            const maxHeight = window.innerHeight - 100;
            if (height > maxHeight) {
                height = maxHeight - 50; 
                width = height / aspectRatio;
            }

            width = Math.round(width)
            height = Math.round(height)
            // console.log("width, height: ")
            // console.log(width)
            // console.log(height)
            // console.log('\n')
            setSize({width, height})
        }

        let response = uploadVideo();
        if (response) {
            console.log("Done");
        } else {
            console.log("Fail");
        }



    }, [])

    const onFileChange = (e) => {
        // setFile(e.target.files[0])
        // console.log(e.target.files[0])
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setFile(url);

    }

    

    return (
        <>
            <div id="leftSideWrapper" className="sideWrapper flex col">
                <div className="video_buttons flex row video_buttons1">
                    <input type="file" onChange={onFileChange} />
                </div>
                <div className="container containerShadow" style={{...size}}>
                    <video
                        ref={videoRef}
                        controls
                        src={file}
                        style={{
                            position: "absolute",
                            // borderRadius: "5px",
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
                            // style={{ borderRadius: "5px" }}
                        />
                    </div>
                </div>
                <div className="video_buttons flex row video_buttons2">
                    {button}
                </div>
            </div>
            <div className="verticalDivider"></div>

            <div id="rightSideWrapper" className="sideWrapper flex col">
                <div className="container containerShadow flex" style={{...size}}>

                </div>
            </div>
        </>
    )
}

function Settings() {
    
    return (
        <div className="container flex settings">

            TODO: Settings Box
        </div>
    )
}

function FFT() {
    return (
        <>

            TODO: FFT Box
        </>
    )
}

function PS() {
    return (
        <>

            TODO: PS Box
        </>
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