from flask import Flask, request
from flask_cors import CORS
from src import *
import json

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/getOutput")
def getOutput():
    return {"members": ["Member1", "Member2", "Member3"]}

@app.post("/upload")
def uploadFile():
    data = request.get_json()
    print(data)
    video_file_name = data["video_file_name"]
    print(video_file_name)
    initial_frame, frames = getFramesFromVideo(video_file_name)
    flows = calcVideoFlow(frames)
    displacements = calcDispFromFlow(flows)
    
    frames_file_path = "./temp/frame.npy"
    displacements_file_name = "./temp/displacements.npy"
    print(displacements_file_name) 
    np.save(frames_file_path, initial_frame)
    np.save(displacements_file_name, displacements)
    
    return {"status": "okay"}


# @app.post("/uploadNew")
# def uploadFileNew():
#     data = request.get_json()
#     print(data)
#     video_file_name = data["video_file_name"]
#     print(video_file_name)
#     initial_frame, frames = getFramesFromVideo(video_file_name)
#     flows = calcVideoFlow(frames)
#     displacements = calcDispFromFlow(flows)

#     frames_file_path = "./temp/frame.npy"
#     displacements_file_name = "./temp/displacements.npy"
#     print(displacements_file_name)
#     np.save(frames_file_path, initial_frame)
#     np.save(displacements_file_name, displacements)

#     return {"status": "okay"}

@app.post("/pixelSpectrum")
def getPixelSpectrum():
    data_path = "./temp/config.json"
    # assert os.path.exists(data_path), "Config file doesnt exist"
    
    # data = json.loads(data_path)
    data = request.get_json()
    pixel = data["pixel"]
    displacements = getDisplacements()
    
    frequenciesX, magnitudesX = calcPixelSpectrum(displacements, pixel, axis=0)
    frequenciesY, magnitudesY = calcPixelSpectrum(displacements, pixel, axis=1)
    frequenciesX_file_path = "./temp/frequenciesX.npy"
    frequenciesY_file_path = "./temp/frequenciesY.npy"
    magnitudesX_file_path = "./temp/magnitudesX.npy"
    magnitudesY_file_path = "./temp/magnitudesY.npy"
    np.save(frequenciesX_file_path, frequenciesX)
    np.save(frequenciesY_file_path, frequenciesY)
    np.save(magnitudesX_file_path, magnitudesX)
    np.save(magnitudesY_file_path, magnitudesY)

    frequenciesX = list(frequenciesX)
    frequenciesY = list(frequenciesY)
    magnitudesX = list(magnitudesX)
    magnitudesY = list(magnitudesY)
    
    print(frequenciesX, frequenciesY, magnitudesX, magnitudesY)
    
    return {
            "frequenciesX": frequenciesX,
            "frequenciesY": frequenciesY,
            "magnitudesX": magnitudesX,
            "magnitudesY": magnitudesY
            }
    
@app.get("/powerSpectrum")
def getPowerSpectrum():
    displacements = getDisplacements()
    fft_frequenciesX, mean_magnitudesX = calcPowerSpectrum(displacements, axis=0)
    fft_frequenciesY, mean_magnitudesY = calcPowerSpectrum(displacements, axis=1)
    
    fft_frequenciesX = list(fft_frequenciesX)
    fft_frequenciesY = list(fft_frequenciesY)
    mean_magnitudesX = list(mean_magnitudesX)
    mean_magnitudesY = list(mean_magnitudesY)
    
    return {
        "fft_frequenciesX": fft_frequenciesX,
        "fft_frequenciesY": fft_frequenciesY,
        "mean_magnitudesX": mean_magnitudesX,
        "mean_magnitudesY": mean_magnitudesY
    }
        
@app.post("/processArrow")
def process():
    data = request.get_json()
    pixel = data["pixel"]
    frequencyXIndex = data["frequencyXIndex"]
    frequencyYIndex = data["frequencyYIndex"]
    force = data["force"]
    hyperparameters = data["hyperparameters"]
    
    displacements = getDisplacements()
    frame = np.load("./temp/frame.npy")
    frequencyX_path = "./temp/frequenciesX.npy"
    frequencyY_path = "./temp/frequenciesY.npy"

    if (os.path.exists(frequencyX_path) and os.path.exists(frequencyY_path)):
        frequencyX = np.load(frequencyX_path)
        frequencyY = np.load(frequencyY_path)
    else: # need to make the files
        frequencyX, magnitudesX = calcPixelSpectrum(displacements, pixel, axis=0)
        frequencyY, magnitudesY = calcPixelSpectrum(displacements, pixel, axis=1)
        frequenciesX_file_path = "./temp/frequenciesX.npy"
        frequenciesY_file_path = "./temp/frequenciesY.npy"
        magnitudesX_file_path = "./temp/magnitudesX.npy"
        magnitudesY_file_path = "./temp/magnitudesY.npy"
        np.save(frequenciesX_file_path, frequencyX)
        np.save(frequenciesY_file_path, frequencyY)
        np.save(magnitudesX_file_path, magnitudesX)
        np.save(magnitudesY_file_path, magnitudesY)
        
    config_file_name = "./temp/config.json"
    config = {
        "pixel": pixel,
        "frequencyXIndex": frequencyXIndex,
        "frequencyYIndex": frequencyYIndex,
        "force": force,
        "hyperparameters": hyperparameters
    }
    
    with open(config_file_name, "w") as f:
        json.dump(config, f)
    
    
    # print(config)
    
    modeX = calcFreqShape(displacements, axis=0, freq_index=frequencyXIndex)
    modeX = modeX.reshape(-1)

    modeY = calcFreqShape(displacements, axis=1, freq_index=frequencyYIndex)
    modeY = modeY.reshape(-1)
    # print(modeX.shape)
    # print(modeY.shape)
    
    # print(frame.shape)
    
    print("COMPLETED MODAL SHAPES")
    chosenFrequencyX = frequencyX[frequencyXIndex]
    chosenFrequencyY = frequencyY[frequencyYIndex]
    freq = (abs(chosenFrequencyX), abs(chosenFrequencyY))
    x, y = calcDisplacment(hyperparameters, freq, pixel, force, modeX, modeY)
    print("COMPLETED DISPLACEMENT")
    # print("xy", x.shape, y.shape)
    
    frames_shape = frame.shape
    final_displacement = calcFinalDisplacements(
        frames_shape, pixel, hyperparameters, x, y, chosenFrequencyX, chosenFrequencyY, modeX, modeY)
    print(final_displacement.shape)
    print("COMPLETED FINAL DISPLACEMENT")
    
    
    output_frames = renderOutputVideo(frame, final_displacement)
    output_video_path = os.path.abspath(os.path.join("./temp/", "output_video.avi"))
    saveFramesToVideo(output_frames, output_video_path)
    print(output_frames.shape)
    print("COMPLETED OUTPUT FRAMES")
    
    # print(output_video_path)
    output_frames = output_frames.tolist()
    # return str(output_video_path)
    
    
    return {"frames": output_frames}
        
@app.post("/setConfig")
def setConfig():     
    data = request.get_json()
    hyperparameters = data["hyperparameters"]
    
    
    
def getConfig():
    config_file_name = "./temp/config.json"
    assert os.path.exists(config_file_name), "config file does not exist"
    config = {}
    with open(config_file_name, "r") as f:
        config = json.load(f)
    print(config)
    return config    
    
def getDisplacements():
    displacements_file_name = "./temp/displacements.npy"
    assert os.path.exists(displacements_file_name), "Displacements file does not exist"
    displacements = np.load(displacements_file_name)
    return displacements    

if __name__ == "__main__":
    app.run(debug=True)