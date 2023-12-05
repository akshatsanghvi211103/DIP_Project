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

import { LineChart, CartesianGrid, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer} from "recharts";
import Slider from '@mui/material/Slider';




function Main() {

    
    return (
        <>

            <Header />
            <div className="pageWrapperBackground"></div>
            <div id="pageWrapper" className="flex col">
                <p>Welcome to the Interactive 2D Video Dynamics Web Tool! Here, you can visualize the output of a short, static clip that has some small amount of motion.</p>
                <UsingVideo />
                <img className="noise"></img>
                {/* <img className="noise noise2"></img> */}
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
    const [outputVideoFile, setOutputVideoFile] = useState('')
    const [outputFrames, setOutputFrames] = useState([])
    const [outputIndex, setOutputIndex] = useState(0);
    
    const outputImageRef = useRef(null);
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const outputRef = useRef(null);
    
    const [size, setSize] = useState({ width: 0, height: 0})
    const [targetOpacity, setTargetOpacity] = useState(0)
    const [file, setFile] = useState(bobble)
    const [display, setDisplay] = useState("none");
    const [pointerEvents, setPointerEvents] = useState("none")

    const [point1, setPoint1] = useState({ x: 342, y: 179})
    const [point2, setPoint2] = useState({ x: 140, y: 366 })
    const [force1, setForce1] = useState([-0.5, -0.5])
    const forceRef = useRef(null);

    
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
        setPoint1({ x: x, y: y })
        setMouseState(1)

        // console.log(response1)
        getPixelSpectrum([x, y]);
    }

    const mouseUp = (e) => {
        let point = getPosition(e)
        const x = point[0]
        const y = point[1]
        // console.log(x, y)
        setPoint2({ x: x, y: y })
        let force = [x - point1.x, point1.y - y]
        let normalization_amount = (Math.abs(force[0]) + Math.abs(force[1]))
        // console.log("normalization_amount", normalization_amount)
        force[0] /= normalization_amount
        force[1] /= normalization_amount
        setForce1(force)

        

        setMouseState(0)
    }

    useEffect(() => {
        // console.log("Point1,2: ", point1, point2, force1)
        forceRef.current = force1
    }, [force1])

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

        processArrow();
    }

    useEffect(() => {
        const canvas = canvasRef.current
        
        // getImage();
        // window.setTimeout(getImage, 2000)
        // window.setTimeout(() => { drawLine(canvas, point2.x, point2.y) }, 2100)
        // window.setTimeout(processArrow, 2200)
        
    }, [])


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

    let wait = (delayInMS) => {
        return new Promise((resolve) => setTimeout(resolve, delayInMS))
    }

    // displays a frame onto the canvas from the frameData = {id, url}
    let displayFrame = async (dataURL) => {
        const canvas = outputRef.current;
        const context = canvas.getContext('2d')

        const img = new Image()
        img.onload = () => {
            context.drawImage(img, 0, 0)
        }

        img.height = size["height"]
        img.width = size["width"]
        img.src = dataURL

        // window.setTimeout(displayFrame, 1000 / 30);
    }

    let displayFrames = async (dataURLs) => {
        let delay = 1000 / 30;
        for (let i = 0; i < dataURLs.length; i += 1) {
            if (i) await wait(delay)
            let frameData = dataURLs[i]
            if (frameData === undefined) {
            } else {
                await displayFrame(frameData)
            }
        }

    }


    const processArrow = async (
            freqXIndex = 34, freqYIndex = 34,
    ) => {

        // console.log("Points", point1, point2)
        let pixel = [point1.x, point1.y]
        let force = forceRef.current
        // console.log("force3", force)

        let hyperparameters = JSON.parse(localStorage.getItem("hyp"))

        const data = {

            "pixel": pixel,
            "frequencyXIndex": freqXIndex,
            "frequencyYIndex": freqYIndex,
            "force": force,
            "height": size["height"],
            "width": size["width"],
            hyperparameters
            
        }

        console.log(JSON.stringify(data))


        const response = await fetch("/processArrow", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        })
            .then((response) => {
                if (!response.ok) throw new Error(response.status)
                else return response.json()
            })
            .then((data) => {
                let file1 = data["frames"];
                console.log(file1)
                // setOutputFrames(file1); // list of data URLs
                displayFrames(file1);

            })
            .catch((error) => {
                console.log("Error: " + error);

            })
    }

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
            .then((response) => {
                if (!response.ok) throw new Error(response.status)
                else return response.json()
            })
            .then((data) => {
                console.log(data)
                data = JSON.stringify(data);
                localStorage.setItem("PS", data)
                window.dispatchEvent(new Event('storage'))

            })
            .catch((error) => {
                console.log("Error: " + error);

            })
    }

    const getPowerSpectrum = async () => {
        const response = await fetch("/powerSpectrum", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
        })
            .then((response) => {
                if (!response.ok) throw new Error(response.status)
                else return response.json()
            })
            .then((data) => {
                console.log(data)
                data = convertToSingleElementDictionaries(data);
                data = JSON.stringify(data);
                localStorage.setItem("PoS", data)
                window.dispatchEvent(new Event('storage'))
                // setPoS(PoS1);

            })
            .catch((error) => {
                console.log("Error: " + error);

            })
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

        getPowerSpectrum();

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
                {/* <div className="video_buttons flex row video_buttons1">
                    <input type="file" onChange={onFileChange} />
                </div> */}
                Input
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
                Rendered Output
                <div className="container containerShadow flex" style={{ ...size }}>
                    {/* {<img
                        ref={outputImageRef}
                        src={outputFrames[outputIndex]}
                        style={{
                            position: "absolute",
                            // borderRadius: "5px",
                            opacity: targetOpacity,
                            ...size,
                            pointerEvents: pointerEvents
                        }}
                    />} */}
                    <div>
                        <canvas
                            ref={outputRef}
                            {...size}
                            onMouseDown={mouseDown}
                            onMouseUp={mouseUp}
                            onMouseMove={mouseMove}
                            // style={{ borderRadius: "5px" }}
                        />
                    </div>
                    {/* {outputVideoFile && <video
                        controls
                        style={{
                            ...size
                        }}
                    >
                        <source src={outputVideoFile} type="video/avi" />
                    </video>} */}
                </div>
            </div>
        </>
    )
}

function convertToSingleElementDictionaries(dictionaryOfLists) {
    // Get the keys of the original dictionary
    const keys = Object.keys(dictionaryOfLists);

    // Check if there are no keys or if any of the lists is empty
    if (keys.length === 0 || keys.some(key => dictionaryOfLists[key].length === 0)) {
        return [];
    }

    // Find the maximum length among the lists
    const maxLength = Math.max(...keys.map(key => dictionaryOfLists[key].length));

    // Create a list of dictionaries
    const listOfDictionaries = [];
    for (let i = 0; i < maxLength; i++) {
        const newDict = {};
        keys.forEach(key => {
        // Use the element if it exists, otherwise use null or some default value
        newDict[key] = i < dictionaryOfLists[key].length ? dictionaryOfLists[key][i] : null;
        });
        listOfDictionaries.push(newDict);
    }

    return listOfDictionaries;
}

function PixelSpectrum() {
    const [psX, setPSX] = useState([]);
    const [psY, setPSY] = useState([]);



    useEffect(() => {
        const handleStorage = () => {

            let ps1 = localStorage.getItem("PS");
            let psX1 = JSON.parse(ps1)
            let psY1 = JSON.parse(ps1)
            // console.log("psx1", psX1)
            let psX2 = convertToSingleElementDictionaries(psX1);
            let psY2 = convertToSingleElementDictionaries(psY1);

            setPSX(psX2)
            setPSY(psY2)
                
        }

        window.addEventListener('storage', handleStorage())
        return () => window.removeEventListener('storage', handleStorage())
    }, [])

    return (
        <ResponsiveContainer width="90%" height="70%">
            <h2>Pixel Spectrum (X)</h2>
            <LineChart width={200} height={400} data={psX}
                margin={{ top: 5, right: 5, left: 30, bottom: 5 }}>
                <XAxis type="number" dataKey="frequenciesX"
                    label={{value: "X Frequency", position: "insideBottom", offset: -1}} />
                <YAxis label={{value: "X Magnitude", position: "insideLeft", angle: -90, offset: 10}} />
                <Tooltip />
                <Legend verticalAlign="top" height={36}  />
                <CartesianGrid stroke="black" strokeDasharray="5 5"/>

                <Line type="monotone" dataKey="magnitudesX" stroke="#8884d8" name="Magnitude (X)" />
            </LineChart>
            <h2>Pixel Spectrum (Y)</h2>
            <LineChart width={200} height={400} data={psY}
                margin={{ top: 5, right: 5, left: 30, bottom: 5 }}>
                <XAxis type="number" dataKey="frequenciesY" 
                    label={{value: "Y Frequency", position: "insideBottom", offset: -1}} />
                <YAxis label={{value: "Y Magnitude", position: "insideLeft", angle: -90, offset: 10}} />

                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <CartesianGrid stroke="black" strokeDasharray="5 5"/>

                <Line type="monotone" dataKey="magnitudesY" stroke="#EB6666" name="Magnitude (Y)" />
            </LineChart>
        </ResponsiveContainer>

    );
}

function PowerSpectrum() {
    const [PoS, setPoS] = useState([])

    useEffect(() => {
        const handleStorage = () => {

            let pos1 = localStorage.getItem("PoS");
            let pos2 = JSON.parse(pos1)
            // console.log("powre spectrum", pos2)
            setPoS(pos2)
                
        }
        
        window.addEventListener('storage', handleStorage())
        return () => window.removeEventListener('storage', handleStorage())
    }, [])

    return (
        <>
            <ResponsiveContainer width="90%" height="70%">
                <h2>Power Spectrum (X)</h2>
                <LineChart width={400} height={400} data={PoS}
                    margin={{ top: 5, right: 5, left: 30, bottom: 5 }}>
                    <XAxis type="number" dataKey="fft_frequenciesX" 
                        label={{value: "X FFT Frequency", position: "insideBottom", offset: -1}} />
                    <YAxis label={{value: "X FFT Magnitude", position: "insideLeft", angle: -90, offset: 10}} />

                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <CartesianGrid stroke="black" strokeDasharray="5 5"/>

                    <Line type="monotone" dataKey="mean_magnitudesX" stroke="#8884d8" name="FFT Magnitude (X)" />
                </LineChart>
                <h2>Power Spectrum (Y)</h2>
                <LineChart width={200} height={400} data={PoS}
                    margin={{ top: 5, right: 5, left: 30, bottom: 5 }}>
                    <XAxis type="number" dataKey="fft_frequenciesY" 
                        label={{value: "Y FFT Frequency", position: "insideBottom", offset: -1}} />
                    <YAxis label={{value: "Y FFT Magnitude", position: "insideLeft", angle: -90, offset: 10}} />

                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <CartesianGrid stroke="black" strokeDasharray="5 5"/>

                    <Line type="monotone" dataKey="mean_magnitudesY" stroke="#EB6666" name="FFT Magnitude (Y)" />
                </LineChart>
            </ResponsiveContainer>
        </>
    );
}

function Graphs() {    


    return (
        <div id="graphs" className="flex col">
            <div className="graph">
                <PowerSpectrum />
            </div>
            <div className="graph">
                <PixelSpectrum />
            </div>
        </div>
    );
}

function Settings() {

    // "hyperparameters": {
    //     "amplification" : 3,
    //     "time" : 160,
    //     "mass" : 1,
    //     "damp" : 0.095,
    //     "width": 415,
    //     "sample" : 1
    // }
    
    const [amp, setAmp] = useState(3);
    const [mass, setMass] = useState(1);
    const [damp, setDamp] = useState(0.095);
    const [sample, setSample] = useState(1);
    const [freqX, setfreqX] = useState(0.21);
    const [freqY, setfreqY] = useState(0.21);


    const setting_options = [
        [{ name: "Amplification", min: 0, max: 10, default: 3 },
            {name: "Mass", min: 0, max: 5, default: 1}],
        [{ name: "Damp", min: 0, max: 1, default: 0.095 },
            { name: "Sample", min: 0, max: 3, default: 1 }],
        [{ name: "Frequency (X)", min: -0.5, max: 0.5, default: 0.21 },
            { name: "Frequency(Y)", min: -0.5, max: 0.5, default: 0.21 }],
        
    ]

    const step_size = 10;

    useEffect(() => {
        let hyperparameters = JSON.stringify({
                "amplification" : amp,
                    "time" : 160,
                        "mass" : mass,
                            "damp" : damp,
                                    "sample" : sample
            })
        

        localStorage.setItem("hyperparameters", hyperparameters)
    }, [])

    useEffect(() => {
        let hyperparameters = JSON.stringify({
                "amplification" : amp,
                    "time" : 160,
                        "mass" : mass,
                            "damp" : damp,
                                    "sample" : sample
            })
        
        console.log(hyperparameters)
        localStorage.setItem("hyperparameters", hyperparameters)
    }, [amp, mass, damp, sample, freqX, freqY])

    const handleChange = (event, newValue, hyp) => {
        // console.log(event, newValue, hyp)
        // console.log(amp, mass, damp, sample)
        if (hyp === "Amplification") {
            setAmp(newValue)
        } else if (hyp === "Mass") {
            setMass(newValue)
        } else if (hyp === "Damp") {
            setDamp(newValue)
        } else if (hyp === "Sample") {
            setSample(newValue)
        } else if (hyp === "Frequency (X)") {
            setfreqX(newValue)
        } else if (hyp === "Frequency (Y)") {
            setfreqY(newValue)
        } else {
            console.log("I did something wrong ig")
        }
        // console.log(amp, mass, damp, sample)
    }
    
    return (
        <div className="settings container containerShadow flex col">
            <div className="settings_title flex">
                Settings
            </div>

            <div className="settings_wrapper flex row">
                {
                    setting_options.map((item1, index1) => {
                        return (<div className="settings_column_wrapper flex col" key={index1}>
                            {item1.map((item2, index2) => {
                                return (<div className="setting_item" key={index1 * 2 + index2}>
                                    <div className="setting_item_title">
                                        {item2.name}
                                    </div>
                                    <div className="setting_item_content">
                                        <Slider
                                            min={item2.min}
                                            max={item2.max}
                                            defaultValue={item2.default}
                                            step={(item2.max - item2.min) / step_size}

                                            marks={
                                                [{ value: item2.min, label: String(item2.min) }, { value: item2.default, label: String(item2.default) }, { value: item2.max, label: String(item2.max) }]}
                                            // aria-labelledby="discrete-slider"
                                            valueLabelDisplay="on"
                                            color="secondary"
                                            onChange={(e, v) => { handleChange(e, v, item2.name)}}

                                            size="small"
                                        />
                                    </div>
                                </div>)
                            })}
                        </div>)
                    })
                }
                {/* <div className="settings_column_wrapper flex col">
                    <div className="setting_item">
                        
                    </div>
                    <div className="setting_item">

                    </div>
                </div> */}
            </div>

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