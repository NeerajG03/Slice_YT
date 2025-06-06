document.addEventListener('DOMContentLoaded', () => {
  const videoTitleElement = document.getElementById('videoTitle');
  const qualitySelectElement = document.getElementById('qualitySelect');
  const downloadButton = document.getElementById('downloadButton');
  const startTimeElement = document.getElementById('startTime');
  const endTimeElement = document.getElementById('endTime');
  const statusElement = document.getElementById('status');

  function isValidTimeFormat(timeStr) {
    if (!timeStr) return true; // Empty is valid (no slicing)
    return /^(?:[0-5]?\d:[0-5]\d)|(?:[0-9]+)$/.test(timeStr);
  }

  // Request video info from content script when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && activeTab.url.includes("youtube.com/watch")) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: getVideoInfo, // This function is defined in content.js
      }, (injectionResults) => {
        if (chrome.runtime.lastError || !injectionResults || !injectionResults[0] || !injectionResults[0].result) {
          statusElement.textContent = 'Error: Could not retrieve video details from the page.';
          console.error(chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No result from script execution.');
          videoTitleElement.textContent = 'Error';
          qualitySelectElement.innerHTML = '<option>N/A</option>';
          downloadButton.disabled = true;
          return;
        }
        const videoInfo = injectionResults[0].result;
        if (videoInfo) {
          videoTitleElement.textContent = videoInfo.title;
          qualitySelectElement.innerHTML = ''; // Clear loading...
          if (videoInfo.formats && videoInfo.formats.length > 0) {
            videoInfo.formats.forEach(format => {
              const option = document.createElement('option');
              option.value = format.itag;
              option.textContent = `${format.qualityLabel} (${format.container || 'N/A'})`;
              qualitySelectElement.appendChild(option);
            });
            downloadButton.disabled = false;
          } else {
            const option = document.createElement('option');
            option.textContent = 'No formats found';
            qualitySelectElement.appendChild(option);
            downloadButton.disabled = true;
          }
        } else {
          videoTitleElement.textContent = 'Could not retrieve video details.';
          qualitySelectElement.innerHTML = '<option>N/A</option>';
          downloadButton.disabled = true;
        }
      });
    } else {
      videoTitleElement.textContent = 'Not a YouTube video page.';
      qualitySelectElement.innerHTML = '<option>N/A</option>';
      downloadButton.disabled = true;
    }
  });

  downloadButton.addEventListener('click', () => {
    const quality = qualitySelectElement.value;
    const startTime = startTimeElement.value.trim();
    const endTime = endTimeElement.value.trim();

    if (!quality || quality === 'N/A') {
      statusElement.textContent = 'Please select a quality.';
      return;
    }

    if (!isValidTimeFormat(startTime)) {
      statusElement.textContent = 'Invalid Start Time format. Use ss or mm:ss.';
      return;
    }
    if (!isValidTimeFormat(endTime)) {
      statusElement.textContent = 'Invalid End Time format. Use ss or mm:ss.';
      return;
    }

    statusElement.textContent = 'Preparing download...';
    downloadButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.runtime.sendMessage({
        type: 'downloadVideo',
        payload: {
          quality: quality,
          startTime: startTime,
          endTime: endTime,
          videoUrl: tabs[0].url
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          statusElement.textContent = `Error: ${chrome.runtime.lastError.message}`;
          downloadButton.disabled = false;
          return;
        }
        if (response) {
            if (response.status === 'success') {
                statusElement.textContent = response.message || 'Download started!';
            } else if (response.status === 'error') {
                statusElement.textContent = `Error: ${response.message}`;
            } else {
                statusElement.textContent = 'Download status unknown.';
            }
        } else {
            // This case might occur if content script had an unhandled error before sendResponse
            statusElement.textContent = 'No response from content script. Check console.';
        }

        // Re-enable button
        // It's better to re-enable it unless a download is truly in a state that prevents new ones.
        // For this extension, multiple downloads might be fine or might be problematic depending on implementation details not covered.
        // A simple timeout is okay for now.
        setTimeout(() => {
            downloadButton.disabled = false;
            // Optionally clear status after a while if it's not an error
            if (response && response.status === 'success') {
                statusElement.textContent = '';
            }
        }, 5000);
      });
    });
  });
});

// This function needs to be present in popup.js if you are calling it directly from popup.js
// However, the design is that this function is executed IN THE CONTEXT of the content script
// So, this definition in popup.js is not what's actually run by executeScript.
// The one in content.js is. This can be a point of confusion.
// For clarity, it's better not to duplicate it here or to make it clear it's a template.
// function getVideoInfo() { /* ... placeholder ... */ }
