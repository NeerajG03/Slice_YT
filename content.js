// This function is called by popup.js to get video info
// It's defined here so it's in the content script's scope when injected.
function getVideoInfo() {
  const titleElement = document.querySelector('h1.title yt-formatted-string, yt-formatted-string.ytd-video-primary-info-renderer');
  let videoTitle = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

  // Extracting formats is complex and usually requires intercepting network requests
  // or parsing embedded player data (e.g., ytInitialPlayerResponse).
  // This is a simplified placeholder. A real extension would need a more robust method.
  // For ytdl-core or similar libraries, you'd pass the video URL.
  const formats = [];
  if (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && window.ytplayer.config.args.player_response) {
    try {
      const playerResponse = JSON.parse(window.ytplayer.config.args.player_response);
      if (playerResponse.streamingData && playerResponse.streamingData.formats) {
        playerResponse.streamingData.formats.forEach(format => {
          formats.push({
            itag: format.itag,
            qualityLabel: format.qualityLabel || `${format.height}p`,
            container: format.mimeType.split(';')[0].split('/')[1],
            url: format.url // Direct URL, might be signed and short-lived
          });
        });
      }
      if (playerResponse.streamingData && playerResponse.streamingData.adaptiveFormats) {
         playerResponse.streamingData.adaptiveFormats.forEach(format => {
            if (format.mimeType.includes('video/mp4') && format.height) { // Only video, mp4
                 formats.push({
                    itag: format.itag,
                    qualityLabel: format.qualityLabel || `${format.height}p`,
                    container: format.mimeType.split(';')[0].split('/')[1],
                    url: format.url
                });
            }
        });
      }
    } catch (e) {
      console.error('Error parsing player response:', e);
    }
  }

  if (formats.length === 0) {
    // Fallback / simplified dummy formats if above fails
    formats.push({ itag: '18', qualityLabel: '360p', container: 'mp4', url: null });
    formats.push({ itag: '22', qualityLabel: '720p', container: 'mp4', url: null });
  }

  // Filter out formats that don't have a URL (if direct URLs are expected)
  // and ensure unique itags if duplicates were somehow added.
  const uniqueFormats = [];
  const seenItags = new Set();
  for (const fmt of formats) {
    if (fmt.url && !seenItags.has(fmt.itag)) {
        uniqueFormats.push(fmt);
        seenItags.add(fmt.itag);
    }
  }

  // If after filtering we have no formats, use the basic placeholders
  if (uniqueFormats.length === 0) {
      if (!seenItags.has('18')) uniqueFormats.push({ itag: '18', qualityLabel: '360p', container: 'mp4', url: null });
      if (!seenItags.has('22')) uniqueFormats.push({ itag: '22', qualityLabel: '720p', container: 'mp4', url: null });
  }


  return { title: videoTitle, formats: uniqueFormats.length > 0 ? uniqueFormats : formats };
}


// Listener for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'downloadVideo') {
    const { quality, startTime, endTime, videoUrl } = request.payload;
    console.log('Download request received:', request.payload);

    // Placeholder for actual download and slicing logic
    // This would involve:
    // 1. Getting the direct video URL for the chosen quality (if not already available).
    //    - This is the hardest part and might require a library like ytdl-core
    //      or a server-side component due to YouTube's changing signatures.
    //      Directly using format.url from ytInitialPlayerResponse might work for a short time.
    // 2. If slicing is needed, using a library like ffmpeg.js (which is WebAssembly based)
    //    or sending to a server-side component. FFmpeg.js can be heavy.
    // 3. Initiating the download via chrome.downloads.download().

    // For now, let's simulate a download attempt with a placeholder message.
    // A real implementation needs to fetch the actual video data.

    if (!videoUrl) {
        sendResponse({ status: 'error', message: 'Video URL not provided.' });
        return true;
    }

    // In a real scenario, you'd use a library like ytdl-core here,
    // or parse `ytInitialPlayerResponse` more thoroughly to get the correct stream URL.
    // The `format.url` from `getVideoInfo` might be usable if it's fresh.
    // For this example, we'll assume popup sends a quality that matches an itag.

    const videoData = getVideoInfo(); // Call to get current formats
    const selectedFormat = videoData.formats.find(f => f.itag.toString() === quality.toString());

    if (!selectedFormat || !selectedFormat.url) {
      // This is a common issue: format URLs from ytInitialPlayerResponse can be signed and expire.
      // A more robust solution often involves a small server-side proxy or a library that
      // can re-calculate these URLs, or using something like ytdl-core.js if it can be run
      // in a content script or background script (might need offscreen document for DOM access).

      console.warn(`No direct URL for itag ${quality}. This may be due to expired URLs or the format not being available. A library like ytdl-core would typically be used here, or a server-side helper.`);
      sendResponse({ status: 'error', message: `Cannot get download URL for quality ${quality}. This often requires a dedicated library or the video format URL has expired.` });
      return true; // Keep message channel open for async response
    }

    // Construct filename
    const videoTitle = videoData.title.replace(/[<>:"/\|?*]+/g, ''); // Sanitize title
    let fileName = `${videoTitle}_${selectedFormat.qualityLabel}.${selectedFormat.container}`;
    if (startTime || endTime) {
      // Note: Slicing is not implemented in this version, but filename reflects intent
      fileName = `${videoTitle}_${selectedFormat.qualityLabel}_${startTime || 'start'}-${endTime || 'end'}.${selectedFormat.container}`;
    }

    if (startTime || endTime) {
        console.warn("Slicing is not implemented in this version. Downloading full video.");
        // Actual slicing would require FFmpeg.js or similar, which is a large dependency
        // and involves fetching the entire video, then processing it.
    }

    console.log(`Attempting to download: ${selectedFormat.url} as ${fileName}`);
    chrome.downloads.download({
      url: selectedFormat.url, // This URL must be a direct downloadable link
      filename: fileName,
      saveAs: true // Optional: prompt user for save location
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        if (downloadId) {
            console.log('Download started with ID:', downloadId);
            sendResponse({ status: 'success', message: 'Download initiated.', downloadId: downloadId });
        } else {
            console.error('Download did not start, no downloadId received. URL might be invalid or blocked by CSP/CORS. Selected Format URL:', selectedFormat.url);
            sendResponse({ status: 'error', message: 'Download could not be started. The URL might be invalid or blocked by browser security policies (e.g., CSP, CORS). Check content script console for more details.' });
        }
      }
    });

    return true; // Indicates that the response will be sent asynchronously
  }
});

console.log("Content script loaded for YouTube Downloader.");
