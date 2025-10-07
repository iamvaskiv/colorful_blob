// AI Avatar with Real-time Controls
const canvas = document.getElementById("orbitCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
function resizeCanvas() {
    const container = document.querySelector(".canvas-container");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let centerX, centerY;

function updateCenter() {
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}
updateCenter();

// Configuration variables (controlled by UI)
let config = {
    shapeCount: 6,
    circleRadius: 40,
    orbitRadius: 41,
    wiggleAmplitude: 6.5,
    wiggleSpeed: 1, // 0-10 scale (converted internally)
    rotationSpeed: 1, // 0-10 scale (converted internally)
    blurAmount: 42,
    orbitOffset: 0,
    shapeType: 0, // 0 = circle, 1 = square
    squareWidth: 40,
    squareHeight: 40,
};

// Scaling functions for speed controls
function scaleWiggleSpeed(value) {
    // Convert 0-10 to 0-0.01
    return value * 0.001;
}

function scaleRotationSpeed(value) {
    // Convert 0-10 to 0-0.05
    return value * 0.005;
}

// Color palette (managed by UI)
let colors = ["#B300FF", "#FF230A", "#F97901", "#FB045A", "#6000F0"]; // Purple, Red, Orange, Pink, Deep Purple

// Orbit Circle Class
class OrbitCircle {
    constructor(orbitRadius, speed, radius, startAngle = 0) {
        this.baseOrbitRadius = orbitRadius;
        this.orbitRandomOffset = (Math.random() - 0.5) * 60; // Store the random offset
        this.speed = speed;
        this.radius = radius;
        this.angle = startAngle;
        this.wiggleOffsetX = Math.random() * Math.PI * 2;
        this.wiggleOffsetY = Math.random() * Math.PI * 2;
        this.wiggleSpeedVariationX = Math.random() * 0.01;
        this.wiggleSpeedVariationY = Math.random() * 0.01;
        this.wiggleAmplitudeVariationX = Math.random() * 2;
        this.wiggleAmplitudeVariationY = Math.random() * 2;
        // Color will be assigned in createCircles() for balanced distribution
    }

    update() {
        this.angle += this.speed;

        // Update properties from config (keeping random variations stable)
        this.radius = config.circleRadius;
        this.speed = scaleRotationSpeed(config.rotationSpeed);
    }

    draw() {
        this.update();
        updateCenter();

        // Calculate wiggle in both X and Y directions using config + proportional variations
        const scaledWiggleSpeed = scaleWiggleSpeed(config.wiggleSpeed);
        const wiggleSpeedX =
            scaledWiggleSpeed * (1 + this.wiggleSpeedVariationX / 0.02);
        const wiggleSpeedY =
            scaledWiggleSpeed * (1 + this.wiggleSpeedVariationY / 0.02);
        const wiggleAmplitudeX =
            config.wiggleAmplitude * (1 + this.wiggleAmplitudeVariationX / 4);
        const wiggleAmplitudeY =
            config.wiggleAmplitude * (1 + this.wiggleAmplitudeVariationY / 4);

        const wiggleX =
            Math.sin(Date.now() * wiggleSpeedX + this.wiggleOffsetX) *
            wiggleAmplitudeX;
        const wiggleY =
            Math.sin(Date.now() * wiggleSpeedY + this.wiggleOffsetY) *
            wiggleAmplitudeY;

        // Calculate base orbital position using current config orbit radius and offset multiplier
        const offsetMultiplier = config.orbitOffset / 10; // Scale 0-10 to 0-1
        const currentOrbitRadius =
            config.orbitRadius + this.orbitRandomOffset * offsetMultiplier;
        const baseX = Math.cos(this.angle) * currentOrbitRadius;
        const baseY = Math.sin(this.angle) * currentOrbitRadius;

        // Apply wiggle in any direction
        const x = centerX + baseX + wiggleX;
        const y = centerY + baseY + wiggleY;

        // Apply blur effect if enabled
        if (config.blurAmount > 0) {
            ctx.filter = `blur(${config.blurAmount}px)`;
        } else {
            ctx.filter = "none";
        }

        // Draw colored shape
        ctx.beginPath();
        ctx.fillStyle = this.color;

        if (config.shapeType === 0) {
            // Draw circle
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        } else {
            // Draw rotated square facing center
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.angle); // Rotate to face center with flat side
            ctx.rect(
                -config.squareWidth / 2,
                -config.squareHeight / 2,
                config.squareWidth,
                config.squareHeight,
            );
            ctx.restore();
        }

        ctx.fill();

        // Reset filter
        ctx.filter = "none";
    }
}

// Create orbital circles array
let orbitCircles = [];

function createCircles() {
    orbitCircles = [];

    // Create shuffled color array for balanced distribution
    const shuffledColors = [];
    for (let i = 0; i < config.shapeCount; i++) {
        shuffledColors.push(colors[i % colors.length]);
    }

    // Shuffle the colors array to randomize while maintaining balance
    for (let i = shuffledColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledColors[i], shuffledColors[j]] = [
            shuffledColors[j],
            shuffledColors[i],
        ];
    }

    for (let i = 0; i < config.shapeCount; i++) {
        const startAngle = (i / config.shapeCount) * Math.PI * 2;
        const circle = new OrbitCircle(
            config.orbitRadius,
            scaleRotationSpeed(config.rotationSpeed),
            config.circleRadius,
            startAngle,
        );
        circle.color = shuffledColors[i]; // Assign balanced color
        orbitCircles.push(circle);
    }
}

// Initial circle creation
createCircles();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw orbital circles
    orbitCircles.forEach((circle) => {
        circle.draw();
    });
}

// UI Control System
function setupControls() {
    const controls = {
        shapeCount: { min: 1, max: 32, step: 1 },
        circleRadius: { min: 2, max: 100, step: 1 },
        orbitRadius: { min: 0, max: 300, step: 1 },
        wiggleAmplitude: { min: 0, max: 20, step: 0.5 },
        wiggleSpeed: { min: 0, max: 10, step: 0.1 },
        rotationSpeed: { min: 0, max: 10, step: 0.1 },
        blurAmount: { min: 0, max: 56, step: 0.5 },
        orbitOffset: { min: 0, max: 10, step: 0.5 },
        shapeType: { min: 0, max: 1, step: 1 },
        squareWidth: { min: 2, max: 100, step: 1 },
        squareHeight: { min: 2, max: 100, step: 1 },
    };

    Object.keys(controls).forEach((key) => {
        const slider = document.getElementById(key);
        const input = document.getElementById(key + "Input");
        const valueDisplay = document.getElementById(key + "Value");

        function updateValue(value) {
            const numValue = parseFloat(value);
            config[key] = numValue;

            // Update all UI elements
            slider.value = numValue;
            input.value = numValue;

            if (key === "shapeType") {
                valueDisplay.textContent = numValue === 0 ? "Circle" : "Square";
                // Show/hide appropriate controls
                const squareControls =
                    document.getElementById("squareControls");
                const squareHeightSection = document.getElementById(
                    "squareHeightSection",
                );
                const sizeControl = document.getElementById("sizeControl");

                if (numValue === 1) {
                    // Show square controls, hide circle size
                    squareControls.style.display = "block";
                    squareHeightSection.style.display = "block";
                    if (sizeControl) sizeControl.style.display = "none";
                } else {
                    // Show circle size, hide square controls
                    squareControls.style.display = "none";
                    squareHeightSection.style.display = "none";
                    if (sizeControl) sizeControl.style.display = "block";
                }
            } else {
                valueDisplay.textContent = numValue;
            }

            // Recreate circles if count changed
            if (key === "shapeCount") {
                createCircles();
            }
        }

        // Slider event
        slider.addEventListener("input", (e) => {
            updateValue(e.target.value);
        });

        // Input field event
        input.addEventListener("input", (e) => {
            let value = parseFloat(e.target.value);
            const ctrl = controls[key];

            // Clamp value to range
            if (value < ctrl.min) value = ctrl.min;
            if (value > ctrl.max) value = ctrl.max;

            updateValue(value);
        });

        // Initialize display
        updateValue(config[key]);
    });
}

// Reset to defaults function
function resetToDefaults() {
    config = {
        shapeCount: 6,
        circleRadius: 40,
        orbitRadius: 41,
        wiggleAmplitude: 6.5,
        wiggleSpeed: 1,
        rotationSpeed: 1,
        blurAmount: 42,
        orbitOffset: 0,
        shapeType: 0,
        squareWidth: 40,
        squareHeight: 40,
    };

    // Update all controls
    Object.keys(config).forEach((key) => {
        const slider = document.getElementById(key);
        const input = document.getElementById(key + "Input");
        const valueDisplay = document.getElementById(key + "Value");

        slider.value = config[key];
        input.value = config[key];
        valueDisplay.textContent = config[key];
    });

    createCircles();
}

// Color Management System
function updateColorDisplay() {
    const colorList = document.getElementById("colorList");
    const colorCountValue = document.getElementById("colorCountValue");

    colorList.innerHTML = "";
    colors.forEach((color, index) => {
        const colorItem = document.createElement("div");
        colorItem.className = "color-item";
        colorItem.innerHTML = `
            <div class="color-swatch" style="background-color: ${color}"></div>
            <span class="color-hex" onclick="editColor(${index})" id="color-${index}">${color}</span>
            <button class="remove-color-btn" onclick="removeColor(${index})">×</button>
        `;
        colorList.appendChild(colorItem);
    });

    colorCountValue.textContent = colors.length;
}

function addColor() {
    const colorPicker = document.getElementById("colorPicker");
    const newColor = colorPicker.value.toUpperCase();

    if (!colors.includes(newColor)) {
        colors.push(newColor);
        updateColorDisplay();
        createCircles(); // Recreate circles with new color palette
    }
}

function removeColor(index) {
    if (colors.length > 1) {
        // Keep at least one color
        colors.splice(index, 1);
        updateColorDisplay();
        createCircles(); // Recreate circles with updated palette
    }
}

function editColor(index) {
    // Get the clicked color tag element
    const colorTag = document.getElementById(`color-${index}`);
    const rect = colorTag.getBoundingClientRect();

    // Create invisible color picker
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.value = colors[index];
    colorPicker.style.position = "fixed";
    colorPicker.style.left = rect.left + "px";
    colorPicker.style.top = rect.bottom + 5 + "px";
    colorPicker.style.opacity = "0";
    colorPicker.style.pointerEvents = "none";
    colorPicker.style.zIndex = "9999";

    document.body.appendChild(colorPicker);

    // Open color picker
    colorPicker.click();

    // Handle color selection
    colorPicker.addEventListener("change", () => {
        colors[index] = colorPicker.value.toUpperCase();
        updateColorDisplay();
        createCircles(); // Recreate circles with updated color
        document.body.removeChild(colorPicker);
    });

    // Clean up if picker is closed without selection
    colorPicker.addEventListener("blur", () => {
        setTimeout(() => {
            if (document.body.contains(colorPicker)) {
                document.body.removeChild(colorPicker);
            }
        }, 100);
    });
}

// Preferences Save/Load System
function copyPreferences() {
    const preferences = {
        config: {
            ...config,
            // Convert scaled speeds back to actual values for export
            wiggleSpeed: scaleWiggleSpeed(config.wiggleSpeed),
            rotationSpeed: scaleRotationSpeed(config.rotationSpeed),
        },
        colors: [...colors],
        timestamp: new Date().toISOString(),
        version: "1.0",
    };

    const json = JSON.stringify(preferences, null, 2);

    // Get the button element
    const button = event
        ? event.target
        : document.querySelector('button[onclick="copyPreferences()"]');

    function showSuccess() {
        if (button) {
            const originalText = button.textContent;
            button.textContent = "Copied!";
            button.style.background = "rgba(0, 255, 0, 0.2)";

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = "";
            }, 2000);
        }
    }

    function fallbackCopy(jsonText) {
        // Create temporary textarea for copying
        const textarea = document.createElement("textarea");
        textarea.value = jsonText;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand("copy");
            document.body.removeChild(textarea);
            showSuccess();
        } catch (err) {
            document.body.removeChild(textarea);
            alert(
                "Could not copy to clipboard. Please copy the JSON from the console.",
            );
            console.log(jsonText);
        }
    }

    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard
            .writeText(json)
            .then(() => {
                showSuccess();
            })
            .catch((err) => {
                // Fallback for clipboard issues
                console.error("Could not copy to clipboard:", err);
                fallbackCopy(json);
            });
    } else {
        fallbackCopy(json);
    }
}

function importPreferences() {
    const textarea = document.getElementById("importPreferences");
    let jsonText = textarea.value.trim();

    if (!jsonText) {
        alert("Please paste preferences JSON first");
        return;
    }

    // Clean JSON - remove any prefix text before the actual JSON
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
        alert("No valid JSON found in the input");
        return;
    }

    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);

    try {
        // Parse JSON
        const preferences = JSON.parse(jsonText);
        console.log("Parsed preferences:", preferences);

        // Validate structure
        if (!preferences.config || !Array.isArray(preferences.colors)) {
            throw new Error("Missing config or colors array");
        }

        // Convert imported speeds from actual values back to UI scale
        if (preferences.config.wiggleSpeed !== undefined) {
            preferences.config.wiggleSpeed =
                preferences.config.wiggleSpeed / 0.001; // Convert back to 0-10 scale
        }
        if (preferences.config.rotationSpeed !== undefined) {
            preferences.config.rotationSpeed =
                preferences.config.rotationSpeed / 0.005; // Convert back to 0-10 scale
        }

        // Validate config keys
        const requiredConfigKeys = [
            "shapeCount",
            "circleRadius",
            "orbitRadius",
            "wiggleAmplitude",
            "wiggleSpeed",
            "rotationSpeed",
            "blurAmount",
            "orbitOffset",
        ];
        const missingKeys = requiredConfigKeys.filter(
            (key) => !(key in preferences.config),
        );
        if (missingKeys.length > 0) {
            console.warn("Missing config keys:", missingKeys);
        }

        // Validate colors
        if (preferences.colors.length === 0) {
            throw new Error("Colors array cannot be empty");
        }

        // Apply config with validation
        Object.keys(config).forEach((key) => {
            if (
                preferences.config.hasOwnProperty(key) &&
                typeof preferences.config[key] === "number"
            ) {
                config[key] = preferences.config[key];
            }
        });

        // Apply colors with validation
        if (
            preferences.colors.every(
                (color) =>
                    typeof color === "string" &&
                    /^#[0-9A-Fa-f]{6}$/.test(color),
            )
        ) {
            colors = [...preferences.colors];
        } else {
            throw new Error(
                "Invalid color format. Colors must be hex codes like #FF0000",
            );
        }

        // Update all UI controls
        Object.keys(config).forEach((key) => {
            const slider = document.getElementById(key);
            const input = document.getElementById(key + "Input");
            const valueDisplay = document.getElementById(key + "Value");

            if (slider && input && valueDisplay) {
                slider.value = config[key];
                input.value = config[key];
                valueDisplay.textContent = config[key];
            }
        });

        // Update color display and recreate circles
        updateColorDisplay();
        createCircles();

        // Clear textarea and show success
        textarea.value = "";

        // Visual feedback
        const button = event
            ? event.target
            : document.querySelector('button[onclick="importPreferences()"]');
        if (button) {
            const originalText = button.textContent;
            button.textContent = "Applied!";
            button.style.background = "rgba(0, 255, 0, 0.2)";

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = "";
            }, 2000);
        }

        console.log("Preferences applied successfully");
    } catch (error) {
        console.error("Import error:", error);
        console.error("JSON content:", jsonText);
        alert(
            `Import failed: ${error.message}\n\nCheck the console for details.`,
        );
    }
}

// Initialize controls when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    setupControls();
    updateColorDisplay();
});

// Start the animation
animate();
