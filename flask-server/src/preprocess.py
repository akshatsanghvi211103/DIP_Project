import os
import cv2
import numpy as np

PATHNAME = os.getcwd()
# Given file name, return frames
def getFramesFromVideo(video_file_name):
    DATA_FOLDER = os.path.join(PATHNAME, "data")
    video_path = os.path.join(DATA_FOLDER, video_file_name)
    
    assert os.path.exists(video_path), f"File Does not Exist {video_path}"

    # reading the video file
    video_capture = cv2.VideoCapture(video_path)
    num_frames = video_capture.get(cv2.CAP_PROP_FRAME_COUNT)
    fps = video_capture.get(cv2.CAP_PROP_FPS)

    frames = []
    check = True
    count = 0
    initial_frame = None

    while check:
        check, arr = video_capture.read()
        if arr is not None:
            if count == 0:
                initial_frame = np.copy(arr)
            arr = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
            frames.append(arr)
            count += 1

    frames = np.array(frames)
    num_frames = frames.shape[0]
    
    return initial_frame, frames

    
    
