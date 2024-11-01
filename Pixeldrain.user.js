// ==UserScript==
// @name         Pixeldrain Mods
// @namespace    http://tampermonkey.net/
// @version      0.11.0
// @description  Saves the current time of a video on Pixeldrain.com and does other stuff as well
// @author       fides
// @match        https://pixeldrain.com/u/*
// @match        https://pixeldrain.com/l/*
// @match        https://www.patreon.com/posts/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

// TODO:
// Remove 5 Second Save Interval When Using Real Time Saves
(function () {
  let stateCheck = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(stateCheck);
      'use strict';

      console.log("Pixeldrain Mods script started.");

      // Variables
      let guiContainer = null;
      let autoSaveInterval = parseInt(localStorage.getItem('autoSaveInterval')) || 5000; // Save interval
      let volumeLevel = parseFloat(localStorage.getItem('volumeLevel')) || 1.0; // Video volume
      let defVolState = localStorage.getItem('defVolState') || "disabled"; // Should the volume be adjusted automatically
      let realTimeUpState = localStorage.getItem('realTimeUpState') || "disabled"; //
      let savingState = localStorage.getItem('savingState') || "enabled"; //

      const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      let videoElement = document.querySelector('video');
      let autoSaveTimer = setInterval(saveVideoTime, autoSaveInterval);

      // Check if a video is present on the page
      if (videoElement && savingState === "enabled") {
        console.log("Video element found on page. Video time tracking enabled.");
        // Load the saved video time
        loadVideoTime();

        // Set the volume level
        videoElement.volume = volumeLevel;
        if (!isMobile) {
          // Add spacebar focus toggle feature
          addSpacebarFocusToggle();
        }
      }
      else {
        console.error("ERROR: Couldn't load video time.\nREASON: No video element found on page or savingState option is disabled.");
      }

      // Function to add spacebar focus toggle feature
      function addSpacebarFocusToggle() {
        const videoElements = document.querySelectorAll('video');

        for (const video of videoElements) {
          video.addEventListener('focus', () => {
            document.addEventListener('keydown', handleSpacebar, true);
          });

          video.addEventListener('blur', () => {
            document.removeEventListener('keydown', handleSpacebar, true);
          });
        }
      }

      function handleSpacebar(event) {
        if (event.keyCode === 32 && document.activeElement.tagName === 'VIDEO') {
          event.preventDefault();
        }
      }

      // Function to save the current time of the video
      function saveVideoTime() {
        checkRealTimeUpState();
        // This makes the 'Video Time Tracking' setting work without refreshing the page.
        let savingState = localStorage.getItem('savingState');
        if (videoElement && savingState === "enabled") {
          // Get the current video time
          var currentTime = Math.floor(videoElement.currentTime);
          // Get the unique key based on the URL
          var key = getKeyFromURL();
          // Save the current time in local storage with the unique key
          localStorage.setItem(key, currentTime);
          console.log("Video time saved:", currentTime, "seconds");
        } else {
          console.error("ERROR: Couldn't save video time.\nREASON: Saving state is disabled.");
        }
      }

      // Function to toggle real-time updates
      function checkRealTimeUpState() {
        let realTimeUpState = localStorage.getItem('realTimeUpState'); // Check realTimeUpState item
        if (realTimeUpState === "enabled") {
          // Add event listeners
          videoElement.addEventListener('play', saveVideoTime);
          videoElement.addEventListener('pause', saveVideoTime);
          videoElement.addEventListener('timeupdate', saveVideoTime);
        } else {
          // Remove event listeners if already added
          videoElement.removeEventListener('play', saveVideoTime);
          videoElement.removeEventListener('pause', saveVideoTime);
          videoElement.removeEventListener('timeupdate', saveVideoTime);
        }
      }

      // Function to load the saved video time
      function loadVideoTime() {
        // Get the unique key based on the URL
        var key = getKeyFromURL();
        // Retrieve the saved video time from local storage using the unique key
        var savedTime = localStorage.getItem(key);
        // Check if a saved time exists
        if (savedTime) {
          // Set the video time to the saved time
          document.querySelector('video').currentTime = parseInt(savedTime);
          console.log("Loaded saved video time:", savedTime, "seconds");
        }
      }

      // Function to get the unique key from the URL
      function getKeyFromURL() {
        // Get the pathname of the URL (excluding the hostname and protocol)
        var pathname = window.location.pathname;
        // Use the pathname as the key
        return pathname.replace(/\//g, ''); // Remove slashes
      }

      // Function to create the UI
      function createUI() {
        console.log("UI opened.");

        if (guiContainer) {
          document.body.removeChild(guiContainer);
          guiContainer = null;
          console.log("UI closed.");
          return;
        }

        const root = createElement("div", {
          id: "root",
          styles: {
            zIndex: "9999", position: "fixed", top: "20px", right: "20px",
            background: "rgba(60, 60, 60, 0.2)", backdropFilter: "blur(10px) saturate(180%)",
            borderRadius: "1rem", padding: "1em", width: "300px", height: "400px",
            cursor: "move"
          },
          events: { mousedown: startDrag }
        });

        const container = createElement("div", {
          styles: {
            position: "fixed", top: "50px", right: "0px", background: "rgb(40, 40, 40)",
            borderRadius: "0 0 1rem 1rem", padding: "1em", width: "300px", height: "350px",
            cursor: "default", overflow: "auto"
          }
        });

        const closeButton = createElement("a", {
          innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                                </svg>`,
          styles: {
            position: "fixed", top: "8px", right: "8px", background: "transparent",
            border: "none", width: "32px", height: "32px", color: "#999", fontWeight: "bold",
            transition: "color 0.15s ease", cursor: "pointer"
          },
          events: {
            click: () => {
              document.body.removeChild(root);
              guiContainer = null;
            },
            mouseenter: () => closeButton.style.color = "#fff",
            mouseleave: () => closeButton.style.color = "#999"
          }
        });

        const settings = [
          { text: "Persistent Volume", key: 'defVolState', stateKey: 'volumeLevel', callback: setVolume },
          { text: "Real-Time saves", key: 'realTimeUpState', callback: checkRealTimeUpState },
          { text: "Video Time Tracking", key: 'savingState' }
        ];

        settings.forEach(({ text, key, stateKey, callback }) => {
          const settingDiv = createSetting(text, key, stateKey, callback);
          container.appendChild(settingDiv);
        });

        root.appendChild(closeButton);
        root.appendChild(container);
        document.body.appendChild(root);
        guiContainer = root;

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
          const guiElement = document.getElementById('root');

          // Function to get the element's position relative to the viewport
          function getGuiCoordinates() {
            const boundingRect = guiElement.getBoundingClientRect();
            return {
              top: boundingRect.top + window.pageYOffset,
              left: boundingRect.left + window.pageXOffset
            };
          }

          // Call the function to get coordinates whenever you need them
          const coordinates = getGuiCoordinates();
          console.log(`GUI element is at: top - ${coordinates.top}, left - ${coordinates.left}`);
        }

        function createElement(tag, { id, innerHTML, textContent, styles, events } = {}) {
          const el = document.createElement(tag);
          if (id) el.id = id;
          if (innerHTML) el.innerHTML = innerHTML;
          if (textContent) el.textContent = textContent;
          if (styles) Object.assign(el.style, styles);
          if (events) Object.keys(events).forEach(e => el.addEventListener(e, events[e]));
          return el;
        }

        function createSetting(text, key, stateKey, callback) {
          const div = createElement("div", {
            textContent: text,
            styles: {
              position: "relative", textAlign: "center", lineHeight: "40px",
              marginTop: "10px", width: "calc(100% - 80px)", height: "40px",
              background: "#222", borderRadius: "10px 0px 0px 10px", userSelect: "none"
            }
          });

          const btn = createElement("a", {
            textContent: "Enabled",
            styles: {
              position: "absolute", right: "-80px", width: "80px", height: "40px",
              background: "#383838", borderRadius: "0px 10px 10px 0px", color: "#00FF00",
              textAlign: "center", lineHeight: "40px", cursor: "pointer", userSelect: "none"
            },
            events: {
              click: () => {
                toggleButtonState(btn, key);
                if (callback) callback(parseFloat(localStorage.getItem(stateKey)) || 1.0);
              }
            }
          });

          let state = localStorage.getItem(key);
          if (state === "disabled") {
            btn.textContent = "Disabled";
            btn.style.color = "#FF0000";
          }

          div.appendChild(btn);
          return div;
        }
      }


      // Function to toggle button state and save it to localStorage
      function toggleButtonState(button, key) {
        if (button.textContent === "Enabled") {
          button.textContent = "Disabled";
          button.style.color = "#FF0000"; // Red color for "disabled" text
          localStorage.setItem(key, "disabled");
          console.log("Setting", key, "to 'disabled'.");
        } else {
          button.textContent = "Enabled";
          button.style.color = "#00FF00"; // Green color for "enabled" text
          localStorage.setItem(key, "enabled");
          console.log("Setting", key, "to 'enabled'.");
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
        console.log("Volume set to:", volumeLevel);
      }

      if (videoElement) {
        videoElement.addEventListener('volumechange', handleVolumeChange);
      }
      else {
        console.warn("No video element found. Volume change handler not attached.");
      }

      function handleVolumeChange() {
        const newVolumeLevel = videoElement.volume;
        localStorage.setItem('volumeLevel', newVolumeLevel.toString());
        console.log("Volume changed:", newVolumeLevel);
      }

      // Register user menu command to open the UI
      GM_registerMenuCommand("Open/Close Settings", () => {
        createUI();
      });
      // Get a reference to your movable GUI element
    }
  }, 1);
})();
