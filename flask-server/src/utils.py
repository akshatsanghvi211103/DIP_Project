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


def calcFreqShape(disp, axis=0, freq_index=0):
    """
    Calculating amplitude of a particular frequency of
    displacement in a set direction for all the pixels

    axis 0 = displacement in x direction
    axis 1 = displacement in y direction
    """
    num_frames, H, W, C = disp.shape

    fft_frequencies = np.fft.fftfreq(num_frames)
    values = disp[:, :, :, axis].reshape(
        num_frames, -1)  # shape (num_frames, H*W)
    values = values - np.mean(values, axis=1, keepdims=True)
    fft_result = np.fft.fft(values, axis=0)  # shape: (num_frames, H*W)

    magnitude, angle = np.abs(fft_result), np.angle(fft_result)
    magnitude = np.squeeze(magnitude[freq_index]).reshape(H, W)
    return fft_result[freq_index]


def calcModeShape(disp, axis=0, freq_index=0):
    num_frames, H, W, C = disp.shape
    mode_shape = np.zeros((H, W, 3), dtype=np.uint8)

    mode_shape[:, :, 0] = 255
    mode_shape[:, :, 1] = 255

    fft_frequencies = np.fft.fftfreq(num_frames)
    values = disp[:, :, :, axis].reshape(
        num_frames, -1)  # shape (num_frames, H*W)
    values = values - np.mean(values, axis=1, keepdims=True)
    fft_result = np.fft.fft(values, axis=0)  # shape: (num_frames, H*W)

    magnitude, angle = np.abs(fft_result), np.angle(fft_result)
    magnitude = magnitude.reshape(num_frames, H, W)
    angle = angle.reshape(num_frames, H, W)

    mode_shape[:, :, 0] = angle[freq_index]
    mode_shape[:, :, 2] = magnitude[freq_index]

    mode_shape[:, :, 2] = cv2.normalize(
        mode_shape[:, :, 2], None, 0, 255, cv2.NORM_MINMAX)
    mode_shape = cv2.cvtColor(mode_shape, cv2.COLOR_HSV2BGR)

    return mode_shape


def calcDisplacment(hyp, width, freq, pixel, force, best_modeX, best_modeY):
    '''
    hyp is the dictionary having the hyperparameters
    freq is the user defined frequency of the mode shape
    pixel is the point of application of force
    force is the 2D vector correponding to the force applied by the user
    '''
    alpha = hyp['amplification'] # Amplification factor
    # The force in the modal coordinates
    f_x = alpha * force[0] * np.abs(best_modeX[pixel[0] * width + pixel[1]])
    f_y = alpha * force[1] * np.abs(best_modeY[pixel[0] * width + pixel[1]])

    t = hyp["time"] # The total time of the simulation
    x = np.zeros((t + 1, 2)) # The array corresponding to the output displacement in the x dirn
    y = np.zeros((t + 1, 2)) # The array corresponding to the output displacement in the y dirn
    dt = 1 # we had assumed time stamp is 1 in the x+vt
    d = hyp["damp"] # damping factor
    m = hyp["mass"]
        
    freqX, freqY = freq

    for i in range(t):
        # m1 = np.array([[1, h], [-w**2 * h, 1 - 2*d*w*h]])
        # m2 = np.array([0, h/m])
        # Numerically unstable code

        # if(i != 0):
        #   f = 0
        # y[i + 1] = (m1 @ y[i].T)
        # y[i + 1] = y[i + 1].T
                
        # if(i):
        # Numerically Stable Formula
        x[i + 1, 0] = (f_x / (freqX * m)) * (np.e ** (- d * freqX * i * dt)) * np.sin(freqX * i * dt) # The actual displacement
        y[i + 1, 0] = (f_y / (freqY * m)) * (np.e ** (- d * freqY * i * dt)) * np.sin(freqY * i * dt) # The actual displacement
        x[i + 1, 1] = (x[i + 1, 0] - x[i, 0]) / dt
        y[i + 1, 1] = (y[i + 1, 0] - y[i, 0]) / dt

    return x, y


def calcFinalDisplacements(frames_shape, pixel, hyp, x, y, freqX, freqY, modeX, modeY):
    H, W, _ = frames_shape
    final_displacement = np.zeros((hyp['time'], H * W, 2))

    for i in range(hyp['time']):
        q = np.complex128(x[i, 0] + (x[i, 1] / freqX) * 1j )
        final_displacement[i, :, 0] = (q * modeX).real
        
        q = np.complex128(y[i, 0] + (y[i, 1] / freqY) * 1j )
        final_displacement[i, :, 1] = (q * modeY).real


    # Plotting the final displacements of the pixel whose best mode was chosen
    p2 = pixel

    final_displacement[:, :, 0] = final_displacement[:, :, 0] / 3000
    final_displacement[:, :, 1] = final_displacement[:, :, 1] / 30
    # displacements_norm = final_displacement[:, p2[0] * W + p2[1]]

    return final_displacement


def renderOutputVideo(initial_frame, final_displacement, T=None):
    H, W, C = initial_frame.shape
    
    Time, directions = final_displacement.shape[0], final_displacement.shape[-1]
    if (T != None): Time = T;
    final_displacement = final_displacement.reshape(Time, H, W, directions)

    # initialize the current frame with the initial frame
    cur_frame = np.copy(initial_frame)
    output_frames = []
    output_frames.append(cur_frame)

    grid = np.indices((H, W))  # shape = (2, H, W)

    # Loop through each time-step/frame
    for frame_idx in range(Time):
        #   calculating final destination of each pixel from the displacement values
        frame_flow_data = final_displacement[frame_idx]  # shape = (H, W, 2)
        final_destinationX = (
            grid[1] + frame_flow_data[:, :, 0]).astype(np.int64)  # shape = (H, W)
        final_destinationY = (
            grid[0] + frame_flow_data[:, :, 1]).astype(np.int64)  # shape = (H, W)

        # indices of all valid new x positions
        indicesX = (0 <= final_destinationX) & (final_destinationX < W)
        # indices of all valid new Y positions
        indicesY = (0 <= final_destinationY) & (final_destinationY < H)
        # final valid indices
        valid_indices = indicesX & indicesY

        # apply optical flow for all the valid indices in X direction
        y, x = grid[0][valid_indices], grid[1][valid_indices]
        new_x, new_y = final_destinationX[valid_indices], final_destinationY[valid_indices]
        cur_frame[new_y, new_x] = initial_frame[y, x]

        # mark all the other pixels for inpainting
        inpainting_mask = np.zeros((H, W), dtype=np.uint8)
        inpainting_mask[grid[0][~valid_indices], grid[1][~valid_indices]] = 255 # set to white
        # performing inpainting on the current frame to fill gaps
        inpainting_radius = 2
        cur_frame = cv2.inpaint(cur_frame, inpainting_mask, inpainting_radius, cv2.INPAINT_TELEA)

        output_frames.append(cur_frame)

    output_frames = np.array(output_frames)

    return output_frames


def saveFramesToVideo(frames, savepath, fps=30):
    num_frames, H, W, C = frames.shape
    video = cv2.VideoWriter(savepath, 0, fps, (W, H))

    for frame in frames:
        video.write(frame)
    cv2.destroyAllWindows()
    print(f"Saving video to {savepath}")
    video.release()
