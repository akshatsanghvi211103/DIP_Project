from flask import Flask, request
from flask_cors import CORS
from src import *

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/getOutput")
def getOutput(point, force):
    return {"members": ["Member1", "Member2", "Member3"]}

@app.post("/upload")
def uploadFile():
    data = request.get_json()
    print(data)
    video_file_name = data["video_file_name"]
    print(video_file_name)
    frames = getFramesFromVideo(video_file_name)
    flows = calcVideoFlow(frames)
    displacements = calcDispFromFlow(flows)
    
    temp_folder = "./temp"
    displacements_file_name = "displacements.npy"
    displacements_file_name_tmp = os.path.join(temp_folder, displacements_file_name)
    print(displacements_file_name_tmp) 
    np.save(displacements_file_name_tmp, displacements)
    
    return {"status": "okay"}

@app.post("/pixelSpectrum")
def getPixelSpectrum():
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
    
    return {
            "frequenciesX": frequenciesX,
            "frequenciesY": frequenciesY,
            "magnitudesX": magnitudesX,
            "magnitudesY": magnitudesY
            }
    

    
    
    
def getDisplacements():
    displacements_file_name = "./temp/displacements.npy"
    assert os.path.exists(displacements_file_name), "Displacements file does not exist"
    displacements = np.load(displacements_file_name)
    return displacements    

if __name__ == "__main__":
    app.run(debug=True)