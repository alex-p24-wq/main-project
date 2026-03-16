// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const resultImage = document.getElementById('resultImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const previewContainer = document.getElementById('previewContainer');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const topPrediction = document.getElementById('topPrediction');
const otherPredictions = document.getElementById('otherPredictions');
const topDescription = document.getElementById('topDescription');
const recommendedActions = document.getElementById('recommendedActions');

// Disease descriptions and recommendations
const diseaseInfo = {
    'healthy_cardamom': {
        name: 'Healthy Cardamom',
        description: 'Your cardamom plant appears to be healthy with no visible signs of disease. Continue with good agricultural practices to maintain plant health.',
        recommendations: [
            'Continue regular watering and fertilization',
            'Monitor for any changes in leaf color or texture',
            'Maintain proper spacing between plants for air circulation',
            'Inspect plants regularly for early signs of pests or disease'
        ]
    },
    'leaf_spot_disease': {
        name: 'Leaf Spot Disease',
        description: 'Small, brown to black spots on leaves, often with a yellow halo. Caused by fungal or bacterial pathogens.',
        recommendations: [
            'Remove and destroy infected leaves',
            'Apply copper-based fungicides as directed',
            'Avoid overhead watering to reduce leaf wetness',
            'Improve air circulation around plants'
        ]
    },
    'rhizome_rot': {
        name: 'Rhizome Rot',
        description: 'Yellowing of leaves, stunted growth, and rotting of rhizomes. Caused by waterlogging and fungal pathogens.',
        recommendations: [
            'Improve soil drainage',
            'Remove and destroy severely infected plants',
            'Apply Trichoderma-based biocontrol agents',
            'Avoid waterlogging in the field'
        ]
    },
    'chocolate_blight': {
        name: 'Chocolate Blight',
        description: 'Brown to black lesions on leaves and stems, leading to defoliation. Caused by the fungus Phytophthora spp.',
        recommendations: [
            'Apply recommended fungicides at first sign of disease',
            'Remove and burn severely infected plants',
            'Avoid overcrowding of plants',
            'Maintain proper field sanitation'
        ]
    },
    'capsule_rot': {
        name: 'Capsule Rot',
        description: 'Soft rotting of capsules, often with fungal growth. Caused by various fungal pathogens.',
        recommendations: [
            'Harvest capsules at proper maturity',
            'Avoid mechanical damage during harvesting',
            'Dry capsules properly after harvest',
            'Store capsules in well-ventilated areas'
        ]
    },
    'root_wilt': {
        name: 'Root Wilt',
        description: 'Yellowing and wilting of leaves, stunted growth. Caused by fungal pathogens or nematodes.',
        recommendations: [
            'Apply recommended nematicides if nematodes are detected',
            'Use disease-free planting material',
            'Practice crop rotation with non-host crops',
            'Solarize soil before planting'
        ]
    },
    'phylloplane_disease': {
        name: 'Phylloplane Disease',
        description: 'Superficial fungal growth on leaf surfaces, often appearing as powdery or sooty mold.',
        recommendations: [
            'Improve air circulation around plants',
            'Apply recommended fungicides if necessary',
            'Control insect vectors',
            'Maintain proper plant spacing'
        ]
    }
};

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', handleFiles);
analyzeBtn.addEventListener('click', analyzeImage);
newAnalysisBtn.addEventListener('click', resetForm);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('border-blue-500', 'bg-blue-50');
}

function unhighlight() {
    dropArea.classList.remove('border-blue-500', 'bg-blue-50');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
}

function handleFiles(e) {
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                resultImage.src = e.target.result;
                previewContainer.classList.remove('hidden');
                analyzeBtn.classList.remove('hidden');
                window.scrollTo({
                    top: analyzeBtn.offsetTop - 20,
                    behavior: 'smooth'
                });
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file (JPG, JPEG, PNG)');
        }
    }
}

async function analyzeImage() {
    const file = fileInput.files[0];
    if (!file) return;

    // Show loading state
    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to analyze image');
        }

        const result = await response.json();
        displayResults(result);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while analyzing the image. Please try again.');
        resetForm();
    }
}

function displayResults(result) {
    if (!result.success || !result.predictions || result.predictions.length === 0) {
        alert('No predictions available. Please try with another image.');
        resetForm();
        return;
    }

    // Hide loading, show results
    loadingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Sort predictions by confidence
    const sortedPredictions = [...result.predictions].sort((a, b) => b.confidence - a.confidence);
    const topPred = sortedPredictions[0];
    
    // Display top prediction
    const topDisease = diseaseInfo[topPred.disease] || {
        name: formatDiseaseName(topPred.disease),
        description: 'No additional information available for this condition.',
        recommendations: [
            'Consult with an agricultural expert for specific recommendations',
            'Monitor the plant for any changes in symptoms',
            'Practice good agricultural practices to maintain plant health'
        ]
    };

    // Update top prediction
    const confidence = Math.round(topPred.confidence);
    document.querySelector('#topPrediction h4').textContent = topDisease.name;
    document.querySelector('#topPrediction .progress-bar').style.width = `${confidence}%`;
    document.querySelector('#topPrediction .confidence-value').textContent = confidence;
    
    // Update description
    topDescription.innerHTML = `
        <p class="mb-3">${topDisease.description}</p>
        <p class="font-semibold">Confidence: ${confidence}%</p>
    `;

    // Update recommended actions
    recommendedActions.innerHTML = topDisease.recommendations
        .map(rec => `<div class="flex items-start">
            <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
            <span>${rec}</span>
        </div>`)
        .join('');

    // Display other predictions
    otherPredictions.innerHTML = sortedPredictions
        .slice(1) // Skip the top prediction
        .map(pred => {
            const disease = diseaseInfo[pred.disease] || { name: formatDiseaseName(pred.disease) };
            const confidence = Math.round(pred.confidence);
            return `
                <div class="disease-card bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold text-gray-800 mb-2">${disease.name}</h4>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div class="bg-yellow-500 h-2.5 rounded-full" style="width: ${confidence}%"></div>
                    </div>
                    <p class="text-right text-sm text-gray-600">${confidence}% confidence</p>
                </div>
            `;
        })
        .join('');

    // Scroll to results
    window.scrollTo({
        top: resultsSection.offsetTop - 20,
        behavior: 'smooth'
    });
}

function formatDiseaseName(disease) {
    // Convert snake_case to Title Case
    return disease
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function resetForm() {
    // Reset file input
    fileInput.value = '';
    
    // Reset preview
    imagePreview.src = '#';
    previewContainer.classList.add('hidden');
    analyzeBtn.classList.add('hidden');
    
    // Show upload section, hide others
    uploadSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize
resetForm();
