import cv2
import numpy as np

def calcVideoFlow(frames):
  """
  Calculates the flow of a video

  Input:
    - frames : grayscale image array of shape (num_frames, H, W)

  Output:
    - flows : flow array of shape (num_frames, H, W, 2)
  """
  num_frames = frames.shape[0]
  flows = []
  for i in range(1, num_frames):
    flow = cv2.calcOpticalFlowFarneback(
        frames[i - 1], frames[i], None, 0.5, 3, 15, 3, 5, 1.2, 0)
    flows.append(flow)

  flows = np.array(flows)  # shape = (num_frames, H, W, 2)
  return flows


def convertFlowToRGB(flows):
  """
  converts the flow to RGB
  """
  num_frames, H, W, C = flows.shape
  hsv = np.zeros((num_frames, H, W, 3), dtype=np.uint8)
  flows_rgb = np.empty_like(hsv)
  hsv[:, :, :, 1] = 255  # setting the saturation to 255
  # hsv[:, :, :, 0] = 255

  for i in range(num_frames):
    # Set the hue and value according to the angle and magnitude
    magnitude, angle = cv2.cartToPolar(flows[i, :, :, 0], flows[i, :, :, 1])
    hsv[i, :, :, 0] = (angle * 180)/(2 * np.pi)
    hsv[i, :, :, 2] = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    flows_rgb[i] = cv2.cvtColor(hsv[i], cv2.COLOR_HSV2BGR)

  return flows_rgb


def calcDispFromFlow(flows):
  """
  Get the displacement values from flow

  Input:
    - flows : array of shape (num_frames, H, W, 2) containing flow in x and y directions

  Output:
    - disp: array of shape (num_frames, H, W, 2) containing displacement in x and y directions
  """
  num_frames, H, W, _ = flows.shape
  disp = np.zeros((num_frames, H, W, 2), dtype=flows.dtype)
  disp[0] = flows[0]

  # adding flow values along x and y directions
  for i in range(1, num_frames):
    disp[i] += disp[i - 1] + flows[i]
  # disp[1:, :, :, 0] = np.cumsum(flows[:, :, :, 0], axis=-1)
  # disp[1:, :, :, 1] = np.cumsum(flows[:, :, :, 1], axis=-1)

  return disp


def calcPixelSpectrum(disp, pixel, axis=0):
    """
    Calculates the frequency spectrum of a pixel of a displacement values along an axis
    axis 0 = displacement in x direction
    axis 1 = displacement in y direction
    """
    num_frames, H, W, C = disp.shape
    i, j = pixel
    pixel_disp = disp[:, i, j, axis]  # shape: (num_frames, )
    pixel_disp = pixel_disp - np.mean(pixel_disp)

    fft_result = np.fft.fft(pixel_disp)
    frequencies = np.fft.fftfreq(num_frames)
    magnitude = np.abs(fft_result)

    return frequencies, magnitude


def calcPowerSpectrum(disp, axis=0):
    num_frames, H, W, C = disp.shape
    magnitude_sums = np.zeros(num_frames)

    fft_frequencies = np.fft.fftfreq(num_frames)
    values = disp[:, :, :, axis].reshape(
        num_frames, -1)  # shape (num_frames, H*W)
    values = values - np.mean(values, axis=1, keepdims=True)
    fft_result = np.fft.fft(values, axis=0)

    mean_magnitudes = np.mean(np.abs(fft_result), axis=1)
    return fft_frequencies, mean_magnitudes
