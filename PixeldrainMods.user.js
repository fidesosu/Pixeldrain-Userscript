// ==UserScript==
// @name         Pixeldrain Stuff
// @namespace    http://tampermonkey.net/
// @version      0.6.1
// @description  Saves the current time of a video on Pixeldrain.com and stuff
// @author       fides
// @match        https://pixeldrain.com/u/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    let guiContainer = null;

    // Load saved settings from localStorage
    let autoSaveInterval = parseInt(localStorage.getItem('autoSaveInterval')) || 1000; // Default 1 second
    let volumeLevel = parseFloat(localStorage.getItem('volumeLevel')) || 1.0; // Default volume level
    let defVolState = localStorage.getItem('defVolState') || "disabled"; // Default to "enabled"
    let realTimeUpState = localStorage.getItem('realTimeUpState') || "disabled"; // Default to "enabled"

    // Function to save the current time of the video
    function saveVideoTime() {
        if (document.querySelector('video') != null) {
            // Get the current video time
            var currentTime = document.querySelector('video').currentTime;
            // Get the unique key based on the URL
            var key = getKeyFromURL();
            // Save the current time in local storage with the unique key
            localStorage.setItem(key, currentTime);
        }
        else {
            console.log("No video element found on page");
        }
    }

    // Function to load the saved video time
    function loadVideoTime() {
        // Get the unique key based on the URL
        var key = getKeyFromURL();
        // Retrieve the saved video time from local storage using the unique key
        var savedTime = localStorage.getItem(key);
        // Check if a saved time exists
        if (savedTime !== null) {
            // Set the video time to the saved time
            document.querySelector('video').currentTime = parseFloat(savedTime);
        }
    }

    // Function to get the unique key from the URL
    function getKeyFromURL() {
        // Get the pathname of the URL (excluding the hostname and protocol)
        var pathname = window.location.pathname;
        // Use the pathname as the key
        return pathname.replace(/\//g, ''); // Remove slashes
    }

    // Function to update auto-save interval
    function updateAutoSaveInterval(interval) {
        autoSaveInterval = interval;
        clearInterval(autoSaveTimer);
        autoSaveTimer = setInterval(saveVideoTime, autoSaveInterval);
    }

    // Function to update volume level
    function updateVolumeLevel(volume) {
        volumeLevel = volume;
        document.querySelector('video').volume = volumeLevel;
    }

    // Auto-save the video time at specified intervals if real-time updates are disabled
    let autoSaveTimer = setInterval(saveVideoTime, autoSaveInterval);

    // Check if a video is present on the page
    var videoElement = document.querySelector('video');
    if (videoElement !== null) {
        // Load the saved video time
        loadVideoTime();

        // Set the volume level
        videoElement.volume = volumeLevel;

        // Add event listeners for real-time updates
        if (realTimeUpState = "enabled") {
            videoElement.addEventListener('play', saveVideoTime);
            videoElement.addEventListener('pause', saveVideoTime);
            videoElement.addEventListener('timeupdate', saveVideoTime);
        }
    }

    // Function to create the UI
    function createUI() {
        if (guiContainer) {
            // If GUI is already open, close it
            document.body.removeChild(guiContainer);
            guiContainer = null;
            return;
        }

        // GUI Root
        const root = document.createElement("div");
        root.style.zIndex = "9999";
        root.setAttribute("id", "root"); // Add id for easy reference
        root.style.position = "fixed";
        root.style.top = "20px";
        root.style.right = "20px";
        root.style.background = "rgba(60, 60, 60, 0.2)";
        root.style.backdropFilter = "blur(10px) saturate(180%)";
        root.style.borderRadius = "1rem";
        root.style.padding = "1em";
        root.style.width = "300px";
        root.style.height = "400px";
        root.style.cursor = "move"; // Change cursor to indicate draggable

        root.addEventListener("mousedown", startDrag); // Add mousedown event listener

        function startDrag(e) {
            if (e.target === root) {
                let offsetX = e.clientX - root.getBoundingClientRect().left;
                let offsetY = e.clientY - root.getBoundingClientRect().top;

                function moveElement(e) {
                    root.style.left = e.clientX - offsetX + "px";
                    root.style.top = e.clientY - offsetY + "px";
                }

                function stopDrag() {
                    document.removeEventListener("mousemove", moveElement);
                    document.removeEventListener("mouseup", stopDrag);
                }

                document.addEventListener("mousemove", moveElement);
                document.addEventListener("mouseup", stopDrag);
            }
        }

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "50px";
        container.style.right = "0px";
        container.style.background = "rgb(40, 40, 40)";
        container.style.borderRadius = "0 0 1rem 1rem";
        container.style.padding = "1em";
        container.style.width = "300px";
        container.style.height = "350px";
        container.style.cursor = "default";

        const closeButton = document.createElement("a");
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
</svg>`;
        closeButton.style.position = "fixed";
        closeButton.style.top = "8px";
        closeButton.style.right = "5px";
        closeButton.style.background = "transparent";
        closeButton.style.border = "none";
        closeButton.style.width = "32px";
        closeButton.style.height = "32px";
        closeButton.style.color = "#999";
        closeButton.style.fontWeight = "bold";
        closeButton.addEventListener("click", () => {
            document.body.removeChild(root);
            guiContainer = null;
        });

        closeButton.style.transition = "color 0.15s ease"; // Add transition for smooth effect

        // Add hover effect using inline CSS
        closeButton.style.cursor = "pointer";
        closeButton.addEventListener("mouseenter", () => {
            closeButton.style.color = "#fff"; // Change color on hover
        });
        closeButton.addEventListener("mouseleave", () => {
            closeButton.style.color = "#999"; // Change color back to default
        });

        root.appendChild(closeButton);
        root.appendChild(container);

        const defVol = document.createElement("div");
        defVol.textContent = "Persistent Volume"; // Initial text
        defVol.style.position = "relative"; // Set position to relative
        defVol.style.textAlign = "center";
        defVol.style.lineHeight = "40px"; // Center text vertically
        defVol.style.width = "calc(100% - 80px)";
        defVol.style.height = "40px";
        defVol.style.background = "#222";
        defVol.style.borderRadius = "10px 0px 0px 10px";
        defVol.style.userSelect = "none";

        const defVolBtn = document.createElement("a");
        defVolBtn.textContent = "Enabled"; // Initial text
        defVolBtn.style.position = "absolute"; // Set position to absolute
        defVolBtn.style.right = "-80px";
        defVolBtn.style.width = "80px";
        defVolBtn.style.height = "40px";
        defVolBtn.style.background = "#383838";
        defVolBtn.style.borderRadius = "0px 10px 10px 0px";
        defVolBtn.style.color = "#00FF00"; // Green color for "enabled" text
        defVolBtn.style.textAlign = "center";
        defVolBtn.style.lineHeight = "40px"; // Center text vertically
        defVolBtn.style.cursor = "pointer";
        defVolBtn.style.userSelect = "none";

        // Add click event listeners to buttons
        defVolBtn.addEventListener("click", () => {
            toggleButtonState(defVolBtn, 'defVolState');

            // Check if the setting is enabled
            if (defVolBtn.textContent === "Enabled") {
                // Get the volume level from localStorage
                const volumeLevel = parseFloat(localStorage.getItem('volumeLevel')) || 1.0; // Default volume level to 1.0 if not found

                // Set the volume to the specified value
                setVolume(volumeLevel);
            }
        });

        let defVolState = localStorage.getItem('defVolState');

        // Set initial button states
        if (defVolState === "disabled") {
            defVolBtn.textContent = "Disabled";
            defVolBtn.style.color = "#FF0000"; // Red color for "disabled" text
        }

        defVol.appendChild(defVolBtn);
        container.appendChild(defVol);

        const realTimeUp = document.createElement("div");
        realTimeUp.textContent = "Real-Time saves"; // Initial text
        realTimeUp.style.position = "relative"; // Set position to relative
        realTimeUp.style.textAlign = "center";
        realTimeUp.style.lineHeight = "40px"; // Center text vertically
        realTimeUp.style.marginTop = "10px";
        realTimeUp.style.width = "calc(100% - 80px)";
        realTimeUp.style.height = "40px";
        realTimeUp.style.background = "#222";
        realTimeUp.style.borderRadius = "10px 0px 0px 10px";
        realTimeUp.style.userSelect = "none";

        const realTimeUpBtn = document.createElement("a");
        realTimeUpBtn.textContent = "Enabled"; // Initial text
        realTimeUpBtn.style.position = "absolute";
        realTimeUpBtn.style.right = "-80px";
        realTimeUpBtn.style.width = "80px";
        realTimeUpBtn.style.height = "40px";
        realTimeUpBtn.style.background = "#383838";
        realTimeUpBtn.style.borderRadius = "0px 10px 10px 0px";
        realTimeUpBtn.style.color = "#00FF00"; // Green color for "enabled" text
        realTimeUpBtn.style.textAlign = "center";
        realTimeUpBtn.style.lineHeight = "40px"; // Center text vertically
        realTimeUpBtn.style.cursor = "pointer";
        realTimeUpBtn.style.userSelect = "none";

        realTimeUpBtn.addEventListener("click", () => {
            toggleButtonState(realTimeUpBtn, 'realTimeUpState');
        });

        let realTimeUpState = localStorage.getItem('realTimeUpState');

        if (realTimeUpState === "disabled") {
            realTimeUpBtn.textContent = "Disabled";
            realTimeUpBtn.style.color = "#FF0000"; // Red color for "disabled" text
        }

        realTimeUp.appendChild(realTimeUpBtn);
        container.appendChild(realTimeUp);
        document.body.appendChild(root);
        guiContainer = root;
    }

    // Function to toggle settings
    function toggleSetting(setting) {
        const button = document.getElementById(setting + "Button");
        if (button.textContent === "Disable") {
            button.textContent = "Enable";
            // Add logic to disable setting
        } else {
            button.textContent = "Disable";
            // Add logic to enable setting
        }
    }

    // Function to toggle button state and save it to localStorage
    function toggleButtonState(button, key) {
        if (button.textContent === "Enabled") {
            button.textContent = "Disabled";
            button.style.color = "#FF0000"; // Red color for "disabled" text
            localStorage.setItem(key, "disabled");
        } else {
            button.textContent = "Enabled";
            button.style.color = "#00FF00"; // Green color for "enabled" text
            localStorage.setItem(key, "enabled");
        }
    }

    // Function to set the volume
    function setVolume(volumeLevel) {
        // Select all audio and video elements on the page
        const mediaElements = document.querySelectorAll("audio, video");

        // Loop through each media element
        mediaElements.forEach(element => {
            // Set the volume level
            element.volume = volumeLevel;
        });
    }

    videoElement.addEventListener('volumechange', handleVolumeChange);

    function handleVolumeChange() {
        const newVolumeLevel = videoElement.volume;
        localStorage.setItem('volumeLevel', newVolumeLevel.toString());
    }

    // Register user menu command to open the UI
    GM_registerMenuCommand("Open/Close Settings", () => {
        createUI();
    });

})();
