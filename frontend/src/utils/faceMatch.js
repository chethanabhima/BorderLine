import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  try {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log("Face-API models loaded successfully");
  } catch (error) {
    console.error("Error loading face-api models", error);
  }
};

/**
 * Compare two images (File, HTMLImageElement, or URLs) and return a distance score.
 * A distance < 0.6 is generally considered a match.
 */
export const compareFaces = async (image1Source, image2Source) => {
  await loadModels();

  try {
    const img1 = await faceapi.bufferToImage(image1Source);
    const img2 = await faceapi.bufferToImage(image2Source);

    const detection1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
    const detection2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

    if (!detection1) throw new Error("Could not detect face in the first image.");
    if (!detection2) throw new Error("Could not detect face in the second image.");

    const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
    
    return {
      match: distance < 0.6,
      distance: distance,
      success: true
    };
  } catch (error) {
    console.error("Face comparison error:", error);
    return { success: false, error: error.message };
  }
};
