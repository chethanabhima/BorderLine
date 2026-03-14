const faceapi = require('face-api.js');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Patch nodejs environment for face-api
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

const loadModels = async () => {
  if (modelsLoaded) return;
  try {
    const MODEL_URL = path.join(__dirname, '../../frontend/public/models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
    modelsLoaded = true;
    console.log("Backend face-api models loaded successfully");
  } catch (error) {
    console.error("Error loading backend face-api models", error);
  }
};

/**
 * Compare two local image files and return a distance score.
 */
const compareFacesBackend = async (image1Path, image2Path) => {
  await loadModels();

  try {
    const img1 = await canvas.loadImage(image1Path);
    const img2 = await canvas.loadImage(image2Path);

    const detection1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
    const detection2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

    if (!detection1) throw new Error("Could not detect face in the first image (live photo).");
    if (!detection2) throw new Error("Could not detect face in the second image (document or profile photo).");

    const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
    
    return {
      match: distance < 0.6,
      distance: distance,
      success: true
    };
  } catch (error) {
    console.error("Backend Face comparison error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { compareFacesBackend };
