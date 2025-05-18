// DOM Elements
const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const sentenceElement = document.getElementById('sentence');
const predictionsContainer = document.getElementById('predictions-container');
const statusElement = document.getElementById('status');
const clearBtn = document.getElementById('clear-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
const toggleLandmarksBtn = document.getElementById('toggle-landmarks-btn');

// Initialize Socket.io connection
const socket = io();

// Variables
let camera = null;
let holistic = null;
let isRunning = false;
let keypoints = [];
let lastSentKeypoints = 0;
let sentence = [];
let predictions = [];
let isSocketConnected = false;
let currentFacingMode = 'user'; // Default to front camera
let isFullscreen = false;
let showLandmarks = true; // Default to showing landmarks
const threshold = 0.5;
const sequenceLength = 40; // Number of frames to collect before prediction
const predictionsElement = document.querySelector('.predictions');
const togglePredictionsBtn = document.getElementById('toggle-predictions-btn');

togglePredictionsBtn.addEventListener('click', () => {
    if (predictionsElement.style.visibility === 'hidden') {
        predictionsElement.style.visibility = 'visible'; // Show the predictions container
        togglePredictionsBtn.innerHTML = '<svg class="prediction-svg" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M18.0733 16.1698L19.4642 20.345C19.6041 20.7644 19.5929 21.2195 19.4326 21.6316C19.2724 22.0436 18.9732 22.3867 18.5868 22.6015C17.1015 23.4281 15.236 23.8333 13 23.8333C10.764 23.8333 8.8985 23.4281 7.41325 22.6015C7.02681 22.3867 6.72759 22.0436 6.56735 21.6316C6.40712 21.2195 6.39594 20.7644 6.53575 20.345L7.92783 16.1698C9.38542 17.2798 11.1679 17.879 13 17.875C14.9067 17.875 16.6638 17.2401 18.0733 16.1698ZM13 2.16663C14.4484 2.16663 15.7972 2.58696 16.9325 3.31388C16.8437 3.65296 16.7072 3.90321 16.5349 4.07654C16.2608 4.34954 15.795 4.53154 15.0995 4.58571L14.859 4.59979L14.4484 4.61063C12.0987 4.78288 12.1572 8.39579 14.625 8.39579C15.5892 8.39579 16.2034 8.59188 16.5349 8.92338C16.8079 9.19746 16.9899 9.66329 17.0441 10.3588L17.0582 10.5993L17.069 11.0099C17.173 12.4334 18.5402 12.9729 19.6018 12.6284C18.8874 14.1258 17.6851 15.3357 16.1922 16.0597C14.6994 16.7836 13.0048 16.9784 11.3866 16.6122C9.76846 16.2459 8.3229 15.3404 7.28728 14.0442C6.25166 12.748 5.68753 11.1382 5.6875 9.47913C5.6875 7.53973 6.45792 5.67977 7.82928 4.30841C9.20064 2.93705 11.0606 2.16663 13 2.16663ZM19.7708 2.16663C19.7708 3.41246 20.0633 4.28996 20.6158 4.84246C21.1261 5.35163 21.9137 5.64088 23.01 5.68204L23.2917 5.68746C24.3295 5.68746 24.3728 7.18029 23.4217 7.30379L23.2917 7.31246C22.0458 7.31246 21.1683 7.60496 20.6158 8.15746C20.1067 8.66879 19.8174 9.45529 19.7762 10.5516L19.7708 10.8333C19.7708 11.9166 18.1458 11.9166 18.1458 10.8333C18.1458 9.58746 17.8533 8.70996 17.3008 8.15746C16.7895 7.64829 16.003 7.35904 14.9067 7.31788L14.625 7.31246C13.5872 7.31246 13.5438 5.81963 14.495 5.69613L14.625 5.68746C15.8708 5.68746 16.7483 5.39496 17.3008 4.84246C17.8533 4.28996 18.1458 3.41246 18.1458 2.16663C18.1458 1.08329 19.7708 1.08329 19.7708 2.16663Z" fill="#0038A8"/></svg>'; // Update button text
    } else {
        predictionsElement.style.visibility = 'hidden'; // Hide the predictions container
        togglePredictionsBtn.innerHTML = '<svg class="prediction-svg" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M13.0001 2.16666C14.2491 2.16666 15.4267 2.48083 16.4548 3.03333C16.3725 3.51541 16.2121 3.85666 15.9933 4.07658C15.8575 4.20848 15.6965 4.31165 15.5199 4.37991C14.8438 4.06238 14.1119 3.8811 13.3658 3.84645C12.6197 3.8118 11.8741 3.92444 11.1715 4.17794C10.4689 4.43145 9.82317 4.82085 9.27109 5.32392C8.71901 5.82698 8.27143 6.43387 7.95389 7.10991C7.63636 7.78596 7.45509 8.51793 7.42043 9.26403C7.38578 10.0101 7.49842 10.7557 7.75192 11.4583C8.00543 12.1609 8.39483 12.8066 8.8979 13.3587C9.40097 13.9108 10.0079 14.3584 10.6839 14.6759C11.43 14.9655 12.1182 15.1269 12.7487 15.1602L13.0001 15.1667C13.6992 15.1667 14.4709 15.0034 15.3151 14.677C16.3026 14.2336 17.1446 13.52 17.744 12.6187C18.4373 12.857 19.2704 12.7118 19.7958 12.1842C19.3487 13.305 18.6316 14.2978 17.7082 15.0746L19.4643 20.345C19.6041 20.7644 19.5929 21.2195 19.4327 21.6316C19.2725 22.0437 18.9733 22.3868 18.5868 22.6016C17.1016 23.4282 15.2361 23.8333 13.0001 23.8333C10.7641 23.8333 8.89856 23.4282 7.41331 22.6016C7.02687 22.3868 6.72765 22.0437 6.56741 21.6316C6.40718 21.2195 6.396 20.7644 6.53581 20.345L8.29189 15.0746C7.14422 14.109 6.32124 12.8138 5.93451 11.3646C5.54779 9.91548 5.61603 8.38246 6.12998 6.97341C6.64393 5.56435 7.57874 4.34742 8.80767 3.48758C10.0366 2.62774 11.5002 2.1666 13.0001 2.16666ZM16.3118 16.0236L15.9218 16.185L15.9023 16.1937C15.0957 16.5428 14.2323 16.7424 13.3543 16.783H13.3359L13.2568 16.7873L13.0001 16.7917L12.7877 16.7873L12.6469 16.7819C11.7686 16.7418 10.9049 16.5425 10.0978 16.1937L10.0783 16.185C9.94737 16.1335 9.81735 16.0797 9.68831 16.0236L8.07739 20.8596C8.05752 20.9193 8.05908 20.9841 8.08182 21.0429C8.10456 21.1016 8.14705 21.1505 8.20198 21.1813C9.42614 21.8606 11.0219 22.2083 13.0001 22.2083C14.9782 22.2083 16.5751 21.8617 17.7981 21.1813C17.8531 21.1505 17.8956 21.1016 17.9183 21.0429C17.941 20.9841 17.9426 20.9193 17.9227 20.8596L16.3118 16.0236ZM12.6642 16.7841L12.7877 16.7873L12.8235 16.7895L13.0001 16.7917C12.8874 16.7917 12.7754 16.7891 12.6642 16.7841ZM19.4914 2.03666L19.5001 2.16666C19.5001 3.41249 19.7926 4.28999 20.3451 4.84249C20.8553 5.35166 21.6429 5.64091 22.7392 5.68208L23.0209 5.68749C24.0587 5.68749 24.1021 7.18033 23.1509 7.30383L23.0209 7.31249C21.7751 7.31249 20.8976 7.605 20.3451 8.1575C19.8359 8.66883 19.5466 9.45533 19.5055 10.5517L19.5001 10.8333C19.5001 11.9167 17.8751 11.9167 17.8751 10.8333C17.8751 9.5875 17.5826 8.71 17.0301 8.1575C16.5187 7.64833 15.7322 7.35908 14.6359 7.31791L14.3542 7.31249C13.3164 7.31249 13.2731 5.81966 14.2242 5.69616L14.3542 5.68749C15.6001 5.68749 16.4776 5.39499 17.0301 4.84249C17.5826 4.28999 17.8751 3.41249 17.8751 2.16666C17.8751 1.12883 19.3679 1.08549 19.4914 2.03666ZM18.6876 5.36574L18.5316 5.58566C18.2603 5.94465 17.929 6.25399 17.5522 6.49999C18.0052 6.79528 18.3918 7.18154 18.6876 7.63424C18.983 7.18165 19.3692 6.7954 19.8218 6.49999C19.4455 6.25389 19.1145 5.94456 18.8436 5.58566L18.6876 5.36574Z" fill="#0038A8"/> </svg>';
    }
});

let isDragging = false;
let offsetX = 0, offsetY = 0;

// Function to handle the start of dragging (mouse or touch)
function startDrag(e) {
    isDragging = true;

    // Determine whether it's a touch event or a mouse event
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    offsetX = clientX - predictionsElement.offsetLeft;
    offsetY = clientY - predictionsElement.offsetTop;

    predictionsElement.style.cursor = 'grabbing';
}

// Function to handle dragging (mouse or touch)
function drag(e) {
    if (!isDragging) return;

    // Prevent default behavior to avoid scrolling on touch devices
    e.preventDefault();

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    predictionsElement.style.left = `${clientX - offsetX}px`;
    predictionsElement.style.top = `${clientY - offsetY}px`;
    predictionsElement.style.position = 'absolute';
}

// Function to handle the end of dragging (mouse or touch)
function endDrag() {
    isDragging = false;
    predictionsElement.style.cursor = 'grab';
}

// Add event listeners for both mouse and touch events
predictionsElement.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', endDrag);

predictionsElement.addEventListener('touchstart', startDrag);
document.addEventListener('touchmove', drag);
document.addEventListener('touchend', endDrag);

// Initialize canvas when page loads
function initializeCanvas() {
    // Make canvas responsive to screen width
    resizeCanvasToDeviceWidth();
    
    // Listen for resize events
    window.addEventListener('resize', resizeCanvasToDeviceWidth);
}

// Update this function to use full viewport height
function resizeCanvasToDeviceWidth() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const videoContainer = document.querySelector('.video-container');
    
    if (videoContainer) {
        // Set container to full viewport dimensions
        videoContainer.style.width = '100%';
        videoContainer.style.height = '100vh';
        
        // Set canvas dimensions to match viewport
        canvasElement.width = screenWidth;
        canvasElement.height = screenHeight;
    }
}


// Generate colors for visualization
function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = Math.floor(360 * i / numColors);
        colors.push(`hsl(${hue}, 80%, 50%)`);
    }
    return colors;
}

// Toggle fullscreen mode
function toggleFullscreen() {
    const body = document.body;
    
    if (!isFullscreen) {
        // Enter fullscreen
        body.classList.add('fullscreen');
        if (body.requestFullscreen) {
            body.requestFullscreen();
        } else if (body.webkitRequestFullscreen) { /* Safari */
            body.webkitRequestFullscreen();
        } else if (body.msRequestFullscreen) { /* IE11 */
            body.msRequestFullscreen();
        }
        isFullscreen = true;
        fullscreenBtn.textContent = 'Exit Fullscreen';
        
        // Adjust canvas size for fullscreen
        resizeCanvasToFullscreen();
    } else {
        // Exit fullscreen
        body.classList.remove('fullscreen');
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        isFullscreen = false;
        fullscreenBtn.textContent = 'Fullscreen';
        
        // Reset canvas size
        const container = document.querySelector('.video-container');
        if (container) {
            canvasElement.width = container.clientWidth;
            canvasElement.height = container.clientHeight;
        }
    }
}

// Toggle landmarks visibility
function toggleLandmarksVisibility() {
    showLandmarks = !showLandmarks;
    
    if (showLandmarks) {
        toggleLandmarksBtn.innerHTML = '<img src=".\\static\\icons\\eye-on.svg" alt="Hide Landmarks" />';
        toggleLandmarksBtn.classList.remove('landmarks-hidden');
    } else {
        toggleLandmarksBtn.innerHTML = '<img src=".\\static\\icons\\eye-off.svg" alt="Show Landmarks" />';
        toggleLandmarksBtn.classList.add('landmarks-hidden');
    }
    
    // Update status text
    statusElement.textContent = `Status: Landmarks ${showLandmarks ? 'visible' : 'hidden'} - Running - Collected ${keypoints.length}/${sequenceLength} frames`;
}

// Update fullscreen function
function resizeCanvasToFullscreen() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    canvasElement.width = screenWidth;
    canvasElement.height = screenHeight;
    
    // Ensure container takes full dimensions
    const container = document.querySelector('.video-container');
    if (container) {
        container.style.width = '100%';
        container.style.height = '100vh';
    }
    
    // If holistic is active, make sure we redraw
    if (holistic && isRunning) {
        holistic.send({image: videoElement});
    }
}

// Handle window resize
function onWindowResize() {
    if (isFullscreen) {
        resizeCanvasToFullscreen();
    } else {
        const container = document.querySelector('.video-container');
        if (container) {
            canvasElement.width = container.clientWidth;
            canvasElement.height = container.clientHeight;
        }
    }
}

// Initialize MediaPipe Holistic with callback
function initializeHolistic(onInitialized) {
    statusElement.textContent = 'Status: Initializing MediaPipe...';
    
    try {
        // Create holistic with proper path
        holistic = new Holistic({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
            }
        });
    
        // Configure holistic for better performance on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        holistic.setOptions({
            modelComplexity: isMobile ? 0 : 1, // Lower complexity for mobile
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
    
        holistic.onResults(onResults);
    
        // Better error handling during initialization
        setTimeout(() => {
            // Call the callback even if initialize() is problematic
            if (typeof onInitialized === 'function') {
                console.log("MediaPipe Holistic initialized (timeout fallback)");
                statusElement.textContent = 'Status: MediaPipe initialized';
                onInitialized();
            }
        }, 3000); // 3 second fallback
        
        // Try normal initialization
        console.log("Starting MediaPipe initialization");
        holistic.initialize()
            .then(() => {
                console.log("MediaPipe Holistic successfully initialized");
                statusElement.textContent = 'Status: MediaPipe Holistic initialized';
                
                // Call the callback when initialization is complete
                if (typeof onInitialized === 'function') {
                    onInitialized();
                }
            })
            .catch(error => {
                console.error("Error initializing MediaPipe:", error);
                statusElement.textContent = `Status: MediaPipe initialization warning - will try to continue`;
                
                // Still try to proceed if there's an error
                if (typeof onInitialized === 'function') {
                    setTimeout(() => onInitialized(), 1000);
                }
            });
    } catch (error) {
        console.error("Error creating MediaPipe instance:", error);
        statusElement.textContent = `Status: MediaPipe error - ${error.message}`;
        
        // Try to continue anyway after a delay
        if (typeof onInitialized === 'function') {
            setTimeout(() => onInitialized(), 2000);
        }
    }
}

// Extract keypoints from MediaPipe results
function extractKeypoints(results) {
    // Initialize arrays for each part
    const pose = results.poseLandmarks ? Array.from(results.poseLandmarks).map(lm => [lm.x, lm.y, lm.z, lm.visibility]) : Array(33).fill([0, 0, 0, 0]);
    const face = Array(468).fill([0, 0, 0]); // Face is optional in this app
    const leftHand = results.leftHandLandmarks ? Array.from(results.leftHandLandmarks).map(lm => [lm.x, lm.y, lm.z]) : Array(21).fill([0, 0, 0]);
    const rightHand = results.rightHandLandmarks ? Array.from(results.rightHandLandmarks).map(lm => [lm.x, lm.y, lm.z]) : Array(21).fill([0, 0, 0]);
    
    // Flatten arrays
    const flattenedPose = pose.flat();
    const flattenedLeftHand = leftHand.flat();
    const flattenedRightHand = rightHand.flat();
    
    // Combine all keypoints into a single flattened array
    return [...flattenedPose, ...flattenedLeftHand, ...flattenedRightHand];
}

// Update this function to fill the entire screen
function adjustCanvasToScreenWidth() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Get actual video dimensions if available
    let videoWidth = videoElement.videoWidth;
    let videoHeight = videoElement.videoHeight;
    
    if (videoWidth && videoHeight) {
        // Always use full viewport dimensions
        canvasElement.width = screenWidth;
        canvasElement.height = screenHeight;
        
        // Update container to full viewport
        const container = document.querySelector('.video-container');
        if (container) {
            container.style.width = '100%';
            container.style.height = '100vh';
        }
    } else {
        // If no video dimensions yet, use viewport dimensions
        canvasElement.width = screenWidth;
        canvasElement.height = screenHeight;
        
        const container = document.querySelector('.video-container');
        if (container) {
            container.style.width = '100%';
            container.style.height = '100vh';
        }
    }
}

// Modified drawImage function to respect aspect ratio
function onResults(results) {
    if (!isRunning) return;
    
    // Ensure video container and canvas match screen width
    adjustCanvasToScreenWidth();
    
    // Clear the canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Calculate proper dimensions to maintain aspect ratio
    const imgWidth = results.image.width;
    const imgHeight = results.image.height;
    const canvasWidth = canvasElement.width;
    const canvasHeight = canvasElement.height;
    
    // Calculate dimensions while maintaining aspect ratio
    let drawWidth, drawHeight, offsetX, offsetY;
    
    const imgAspect = imgWidth / imgHeight;
    const canvasAspect = canvasWidth / canvasHeight;
    
    if (imgAspect > canvasAspect) {
        // Image is wider than canvas (relative to their heights)
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgAspect;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
    } else {
        // Image is taller than canvas (relative to their widths)
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgAspect;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
    }
    
    // Draw the camera feed on the canvas while maintaining aspect ratio
    canvasCtx.drawImage(
        results.image, 
        offsetX, offsetY, 
        drawWidth, drawHeight
    );
    
    // Only draw landmarks if showLandmarks is true
    if (showLandmarks) {
        drawLandmarks(canvasCtx, results);
    }
    
    // Extract keypoints and add to sequence
    const keypointsData = extractKeypoints(results);
    keypoints.push(keypointsData);
    
    // Keep only the last 120 frames
    if (keypoints.length > sequenceLength) {
        keypoints.shift();
    }
    
    // When we have 120 frames and enough time has passed since last prediction
    if (keypoints.length === sequenceLength && 
        (Date.now() - lastSentKeypoints > 500)) { // Limit predictions to every 500ms
        
        // Send keypoints to backend for prediction
        predictSign();
        lastSentKeypoints = Date.now();
    }
    
    // Update status if still in running state
    if (isRunning) {
        statusElement.textContent = `Status: Running - Collected ${keypoints.length}/${sequenceLength} frames ${showLandmarks ? '' : '(landmarks hidden)'}`;
    }
    
    canvasCtx.restore();
}

// Update fullscreen function
function resizeCanvasToFullscreen() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    canvasElement.width = screenWidth;
    canvasElement.height = screenHeight;
    
    // Ensure container takes full dimensions
    const container = document.querySelector('.video-container');
    if (container) {
        container.style.width = '100%';
        container.style.height = '100vh';
    }
    
    // If holistic is active, make sure we redraw
    if (holistic && isRunning) {
        holistic.send({image: videoElement});
    }
}

// Draw landmarks on canvas
function drawLandmarks(ctx, results) {
    try {
        // Make sure dependencies are available
        if (!window.drawConnectors || !window.drawLandmarks) {
            console.warn("MediaPipe drawing utilities not available");
            return;
        }
        
        // Draw pose connections
        if (results.poseLandmarks) {
            window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS,
                          {color: '#00FF00', lineWidth: 2});
            window.drawLandmarks(ctx, results.poseLandmarks,
                         {color: '#FF0000', lineWidth: 1});
        }
        
        // Draw left hand connections
        if (results.leftHandLandmarks) {
            window.drawConnectors(ctx, results.leftHandLandmarks, window.HAND_CONNECTIONS,
                          {color: '#CC0000', lineWidth: 2});
            window.drawLandmarks(ctx, results.leftHandLandmarks,
                         {color: '#00FF00', lineWidth: 1});
        }
        
        // Draw right hand connections
        if (results.rightHandLandmarks) {
            window.drawConnectors(ctx, results.rightHandLandmarks, window.HAND_CONNECTIONS,
                          {color: '#00CC00', lineWidth: 2});
            window.drawLandmarks(ctx, results.rightHandLandmarks,
                         {color: '#FF0000', lineWidth: 1});
        }
    } catch (error) {
        console.error("Error drawing landmarks:", error);
    }
}

// Send keypoints to backend for prediction using WebSockets
function predictSign() {
    try {
        if (!isSocketConnected) {
            statusElement.textContent = 'Status: Socket not connected, retrying...';
            // Fall back to HTTP if socket is not connected
            predictSignHttp();
            return;
        }
        
        statusElement.textContent = 'Status: Sending data via WebSocket...';
        
        // Send keypoints via WebSocket
        socket.emit('predict_sign', { keypoints: keypoints });
        
    } catch (error) {
        console.error('Error sending via WebSocket:', error);
        statusElement.textContent = `Status: WebSocket error - ${error.message}`;
        
        // Fall back to HTTP
        predictSignHttp();
    }
}

// Fallback HTTP method for predictions
async function predictSignHttp() {
    try {
        statusElement.textContent = 'Status: Falling back to HTTP...';
        
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keypoints: keypoints })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        statusElement.textContent = 'Status: Prediction received via HTTP';
        
        // Process prediction result
        processPrediction(data);
    } catch (error) {
        console.error('Error predicting sign via HTTP:', error);
        statusElement.textContent = `Status: HTTP Error - ${error.message}`;
    }
}

// Process prediction from backend
function processPrediction(data) {
    if (data.error) {
        statusElement.textContent = `Status: Error - ${data.error}`;
        return;
    }
    
    // Update predictions array
    predictions.push(data.prediction);
    
    // Add to sentence if consistent predictions and confidence is high
    if (predictions.length >= 2) {
        const lastTenPredictions = predictions.slice(-10);
        const mostCommon = findMostCommon(lastTenPredictions);
        
        if (data.confidence > threshold && mostCommon === data.prediction) {
            // Only add if it's different from the last word
            if (sentence.length === 0 || sentence[sentence.length - 1] !== data.prediction) {
                sentence.push(data.prediction);
                updateSentence();
            }
        }
        
        // Keep the predictions array at a reasonable size
        if (predictions.length > 30) {
            predictions = predictions.slice(-30);
        }
    }
    
    // Visualize top predictions
    displayPredictions(data.top_predictions);
}

// Find the most common element in an array
function findMostCommon(arr) {
    const counts = {};
    let maxCount = 0;
    let maxItem = null;
    
    for (const item of arr) {
        counts[item] = (counts[item] || 0) + 1;
        if (counts[item] > maxCount) {
            maxCount = counts[item];
            maxItem = item;
        }
    }
    
    return maxItem;
}

// Update the sentence display
function updateSentence() {
    sentenceElement.textContent = sentence.join(' ');
}

// Display predictions as bars
function displayPredictions(topPredictions) {
    predictionsContainer.innerHTML = '';
    
    for (const pred of topPredictions) {
        const predDiv = document.createElement('div');
        predDiv.className = 'prediction-bar';
        
        const barDiv = document.createElement('div');
        barDiv.className = 'bar';
        barDiv.style.width = `${pred.probability * 200}px`;
        barDiv.textContent = pred.action;
        
        const probText = document.createElement('span');
        probText.textContent = pred.probability.toFixed(2);
        
        predDiv.appendChild(barDiv);
        predDiv.appendChild(probText);
        predictionsContainer.appendChild(predDiv);
    }
}

// Add this function to check if device has multiple cameras
async function hasMultipleCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        return videoDevices.length > 1;
    } catch (error) {
        console.error('Error checking for multiple cameras:', error);
        return false;
    }
}

// Toggle camera function with improved error handling and fallbacks
async function toggleCamera() {
    try {
        // Disable button during camera switch
        toggleCameraBtn.disabled = true;
        statusElement.textContent = `Status: Switching camera...`;
        
        // Toggle the facing mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Stop current camera completely
        await stopCamera();
        
        // Try to start the new camera
        await startCamera();
        
        // Re-enable the button when done
        toggleCameraBtn.disabled = false;
        
    } catch (err) {
        console.error("Error switching camera:", err);
        statusElement.textContent = `Status: Camera error - ${err.message}`;
        
        // If switching failed, try without 'exact' constraint
        try {
            console.log("Trying alternative camera access method...");
            await startCameraWithFallback();
            toggleCameraBtn.disabled = false;
        } catch (fallbackErr) {
            console.error("Fallback camera access failed:", fallbackErr);
            // If all attempts fail, revert to the previous camera
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            await startCamera();
            toggleCameraBtn.disabled = false;
        }
    }
}


// Improved startCamera function with better constraint handling
async function startCamera() {
    try {
        // Check if holistic is initialized
        if (!holistic) {
            console.error("MediaPipe Holistic not initialized");
            statusElement.textContent = "Status: Error - MediaPipe not initialized";
            return;
        }
        
        statusElement.textContent = `Status: Starting ${currentFacingMode === 'user' ? 'front' : 'back'} camera...`;
        
        // Get device screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Try with exact constraint first (more reliable on most devices)
        const constraints = {
            video: {
                facingMode: currentFacingMode === 'environment' ? 
                    { exact: "environment" } : "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        console.log("Using camera constraints:", JSON.stringify(constraints));
        
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`${currentFacingMode} camera access granted`);
        
        // Log camera track details for debugging
        const videoTrack = stream.getVideoTracks()[0];
        console.log("Camera track:", videoTrack.label);
        console.log("Track settings:", videoTrack.getSettings());
        
        // Set canvas dimensions
        canvasElement.width = screenWidth;
        canvasElement.height = screenHeight;
        
        // Set container to full viewport
        const container = document.querySelector('.video-container');
        if (container) {
            container.style.width = '100%';
            container.style.height = '100vh';
        }
        
        // Stop this stream since Camera will create its own
        stream.getTracks().forEach(track => track.stop());
        
        // Create and start MediaPipe camera instance
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (holistic && isRunning) {
                    try {
                        await holistic.send({image: videoElement});
                    } catch (e) {
                        console.error("Error sending frame to MediaPipe:", e);
                    }
                }
            },
            facingMode: currentFacingMode,
            width: 1280,
            height: 720
        });
        
        console.log(`Starting ${currentFacingMode} camera...`);
        await camera.start();
        console.log("Camera started successfully");
        
        isRunning = true;
        statusElement.textContent = `Status: ${currentFacingMode === 'user' ? 'Front' : 'Back'} camera running`;
        
    } catch (error) {
        console.error(`Error starting ${currentFacingMode} camera:`, error);
        throw error; // Let the caller handle the error for fallback
    }
}

// Fallback method for camera access without 'exact' constraint
async function startCameraWithFallback() {
    try {
        // Alternative constraints without 'exact'
        const fallbackConstraints = {
            video: {
                facingMode: currentFacingMode,  // Simple string without exact
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        console.log("Using fallback constraints:", JSON.stringify(fallbackConstraints));
        
        // Try direct getUserMedia first
        const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        const videoTrack = stream.getVideoTracks()[0];
        console.log("Fallback camera accessed:", videoTrack.label);
        
        // Stop this stream since Camera will create its own
        stream.getTracks().forEach(track => track.stop());
        
        // Create and start MediaPipe camera with simple facingMode
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (holistic && isRunning) {
                    try {
                        await holistic.send({image: videoElement});
                    } catch (e) {
                        console.error("Error sending frame to MediaPipe:", e);
                    }
                }
            },
            facingMode: currentFacingMode,
            width: 1280,
            height: 720
        });
        
        console.log("Starting fallback camera...");
        await camera.start();
        
        isRunning = true;
        statusElement.textContent = `Status: Camera running (fallback method)`;
        
    } catch (error) {
        console.error("Fallback camera access failed:", error);
        throw error;
    }
}

// Improved stopCamera function with better cleanup
async function stopCamera() {
    if (!camera) return Promise.resolve();
    
    isRunning = false;
    statusElement.textContent = 'Status: Stopping camera...';
    
    try {
        const oldCamera = camera;
        camera = null;
        
        await oldCamera.stop();
        console.log("Camera stopped successfully");
        
        // Additional cleanup for any remaining tracks
        const tracks = videoElement.srcObject?.getTracks() || [];
        tracks.forEach(track => {
            track.stop();
            console.log("Stopped additional track:", track.kind);
        });
        
        videoElement.srcObject = null;
        statusElement.textContent = 'Status: Camera stopped';
        
        // Short delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error stopping camera:', error);
        statusElement.textContent = `Status: Error stopping camera - ${error.message}`;
        return Promise.reject(error);
    }
}


// Handle fullscreen change events
function handleFullscreenChange() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        // Exited fullscreen via browser controls
        document.body.classList.remove('fullscreen');
        isFullscreen = false;
        fullscreenBtn.textContent = 'Fullscreen';
        const container = document.querySelector('.video-container');
        if (container) {
            canvasElement.width = container.clientWidth;
            canvasElement.height = container.clientHeight;
        }
    }
}

// Better device detection for camera availability
async function detectAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log("Available video devices:", videoDevices.length);
        videoDevices.forEach((device, i) => {
            console.log(`Camera ${i+1}: ${device.label || 'unnamed device'}`);
        });
        
        // On some mobile devices, even with multiple cameras,
        // they might not be properly labeled until permission is granted
        if (videoDevices.length <= 1 || !videoDevices[0].label) {
            console.log("Limited camera info, trying to get permission first...");
            
            try {
                // Request basic video permission to get better device info
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                
                // Try enumerating again after permission
                const devicesAfterPermission = await navigator.mediaDevices.enumerateDevices();
                const videoDevicesAfterPermission = devicesAfterPermission.filter(device => device.kind === 'videoinput');
                
                console.log("Video devices after permission:", videoDevicesAfterPermission.length);
                videoDevicesAfterPermission.forEach((device, i) => {
                    console.log(`Camera ${i+1}: ${device.label || 'unnamed device'}`);
                });
                
                return videoDevicesAfterPermission.length > 1;
            } catch (err) {
                console.error("Error getting camera permission for detection:", err);
                // If we can't get permission, assume there might be multiple cameras
                return true;
            }
        }
        
        return videoDevices.length > 1;
    } catch (error) {
        console.error('Error detecting cameras:', error);
        // If detection fails, assume there might be multiple cameras
        return true;
    }
}

// Clear the sentence
function clearSentence() {
    sentence = [];
    updateSentence();
}

// Socket.io event handlers
socket.on('connect', () => {
    console.log('Connected to server via WebSocket');
    isSocketConnected = true;
    statusElement.textContent = 'Status: WebSocket connected';
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isSocketConnected = false;
    statusElement.textContent = 'Status: WebSocket disconnected';
});

socket.on('connected', (data) => {
    console.log('Server confirmation:', data);
});

socket.on('prediction_result', (data) => {
    statusElement.textContent = 'Status: Prediction received via WebSocket';
    processPrediction(data);
});

socket.on('prediction_error', (data) => {
    console.error('Prediction error:', data.error);
    statusElement.textContent = `Status: Prediction error - ${data.error}`;
});

// Event listeners
clearBtn.addEventListener('click', clearSentence);
fullscreenBtn.addEventListener('click', toggleFullscreen);
toggleCameraBtn.addEventListener('click', toggleCamera);
toggleLandmarksBtn.addEventListener('click', toggleLandmarksVisibility);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas first
    initializeCanvas();
    
    // Show loading message
    statusElement.textContent = 'Status: Loading camera, please wait...';
    // Check for available cameras
    detectAvailableCameras().then(hasMultiple => {
        console.log("Multiple cameras detected:", hasMultiple);
        
        if (!hasMultiple) {
            toggleCameraBtn.disabled = true;
            toggleCameraBtn.title = "No additional cameras available";
        }
    });
    // Check if on mobile to set default landmarks visibility
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // If on mobile, hide landmarks by default for better performance
        showLandmarks = false;
        toggleLandmarksBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_757_731)"> <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.6819 3.96914 7.65661 6.06 6.06M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="#0038A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g> <defs> <clipPath id="clip0_757_731"> <rect width="24" height="24" fill="white"/> </clipPath> </defs> </svg>';
        toggleLandmarksBtn.classList.add('landmarks-hidden');
    }
    
    // Initialize holistic and start camera
    initializeHolistic(() => {
        console.log('MediaPipe Holistic initialized, starting camera...');
        startCamera().catch(err => {
            console.error("Initial camera start failed:", err);
            // Try fallback if initial start fails
            startCameraWithFallback().catch(fallbackErr => {
                console.error("All camera start methods failed:", fallbackErr);
                statusElement.textContent = "Status: Could not start camera";
            });
        });
    });
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (isFullscreen) {
                canvasElement.width = window.innerWidth;
                canvasElement.height = window.innerHeight;
            } else {
                const container = document.querySelector('.video-container');
                if (container) {
                    canvasElement.width = container.clientWidth;
                    canvasElement.height = container.clientHeight;
                }
            }
        }, 200);
    });
});