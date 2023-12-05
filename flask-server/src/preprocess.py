import os
import cv2
import numpy as np
import base64
import re

PATHNAME = os.getcwd()
# Given file name, return frames
def getFramesFromVideo(video_file_name, width, height):
    DATA_FOLDER = os.path.join(PATHNAME, "data")
    video_path = os.path.join(DATA_FOLDER, video_file_name)
    
    assert os.path.exists(video_path), f"File Does not Exist {video_path}"

    # reading the video file
    video_capture = cv2.VideoCapture(video_path)
    video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

    num_frames = video_capture.get(cv2.CAP_PROP_FRAME_COUNT)
    fps = video_capture.get(cv2.CAP_PROP_FPS)

    frames = []
    check = True
    count = 0
    initial_frame = None

    while check:
        check, arr = video_capture.read()
        if arr is not None:
            # print(arr.shape)
            # print(arr)
            
            if count == 0:
                initial_frame = np.copy(arr)
                initial_frame = cv2.resize(initial_frame, (width, height))
            arr = cv2.resize(arr, dsize=(width, height))
            # print(arr.shape)
            arr = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
            # print(arr)
            frames.append(arr)
            count += 1

    # for i in range(len(frames)):
    #     # frames[i] = cv2.resize(frames[i], dsize=(width, height))
    #     print(frames[i].shape)
    frames = np.array(frames)
    
    num_frames = frames.shape[0]
    
    return initial_frame, frames


def getFramesFromVideo2(video_file_name):
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


def base64_to_image(base64_string):
    """
    Converts a base64 image string to a numpy image array
    """
    # Extract the base64 encoded binary data from the input string
    base64_data = re.search(r'base64,(.*)', base64_string).group(1)
    # Decode the base64 data to bytes
    image_bytes = base64.b64decode(base64_data)
    # convert the bytes to numpy array
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    # Decode the numpy array as an image using OpenCV
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    return image


def numpy_array_to_dataurl(img_arr):
    dataurl = base64.b64encode(img_arr)
    dataurl = f"data:image/jpeg;base64,{dataurl}"
    return dataurl


def image_to_base64(image):
    """
    converts a numpy image array to a base64 string
    """

    # Encode the processed image as a JPEG-encoded base64 string
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    result, frame_encoded = cv2.imencode(".jpg", image, encode_param)
    processed_img_data = base64.b64encode(frame_encoded).decode()

    # Prepend the base64-encoded string with the data url prefix
    b64_src = "data:image/jpg;base64,"
    processed_img_data = b64_src + processed_img_data
    return processed_img_data


    
