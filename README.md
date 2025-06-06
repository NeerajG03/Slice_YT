# YouTube Video Downloader Chrome Extension

This Chrome extension allows users to download YouTube videos directly from the video page. It provides options to select video quality and includes UI for video slicing (though the slicing functionality is not yet implemented).

## Features

*   **Video Discovery**: Automatically detects when you are on a YouTube video page.
*   **Quality Selection**: Displays available MP4 video formats and qualities in the extension popup.
*   **Direct Download**: Initiates video downloads using the browser's download manager.
*   **Slicing UI**: Provides input fields for specifying start and end times for downloads (Note: actual video slicing is not currently functional; the full video will be downloaded).
*   **User-Friendly Popup**: Simple interface for interacting with the extension.

## How to Install and Test

To install and test this extension locally, follow these steps:

1.  **Download the Extension Files**:
    *   If you have `git` installed, clone the repository.
    *   Otherwise, download the extension files as a ZIP archive and extract them to a folder on your computer. Ensure all files (`manifest.json`, `popup.html`, `popup.js`, `content.js`, `style.css`, and the `images` folder) are present.

2.  **Open Chrome Extensions Page**:
    *   Launch your Google Chrome browser.
    *   Navigate to `chrome://extensions` by typing it into the address bar and pressing Enter.

3.  **Enable Developer Mode**:
    *   On the `chrome://extensions` page, look for the "Developer mode" toggle, usually located in the top-right corner.
    *   Click the toggle to enable Developer mode.

4.  **Load the Extension**:
    *   With Developer mode enabled, you should see new buttons appear, including "Load unpacked."
    *   Click the "Load unpacked" button.
    *   A file dialog will open. Navigate to the folder where you saved/extracted the extension files.
    *   Select the folder itself (the one containing `manifest.json`). Do *not* select individual files.
    *   Click "Select Folder" (or "Open").

5.  **Verify Installation**:
    *   The "YouTube Video Downloader" extension should now appear in your list of installed extensions.
    *   An icon for the extension should also appear in your Chrome toolbar (usually to the right of the address bar). You might need to click the puzzle piece icon (Extensions) to pin it to the toolbar.

6.  **Test the Extension**:
    *   Navigate to any YouTube video page (e.g., `https://www.youtube.com/watch?v=your_video_id`).
    *   Click the YouTube Video Downloader extension icon in your toolbar.
    *   The popup should open, displaying the video's title and available quality options.
    *   Select a desired quality.
    *   (Optional) Enter start/end times, keeping in mind that slicing is not yet functional.
    *   Click the "Download" button.
    *   A "Save As" dialog should appear, allowing you to choose where to save the MP4 file. The download should then begin.
    *   Verify the downloaded file is playable and matches the selected quality (where possible to distinguish).
    *   Test on different videos and with different quality settings.
    *   Test the UI feedback (status messages, disabled buttons when appropriate).

## Known Limitations

*   **Video Slicing Not Functional**: While the UI for start and end times exists, the extension currently downloads the entire video. The slicing feature is planned for a future update.
*   **Download URL Reliability**: The method used to fetch video download links relies on parsing information from the YouTube page. This can be fragile and may break if YouTube changes its page structure. Some video formats or qualities might not always be available or their URLs may expire quickly. For more robust downloading, especially of all formats (including adaptive ones), a more advanced solution like integrating `ytdl-core` or using a server-side component would be necessary.
*   **Adaptive Formats (Muxing)**: The extension primarily lists MP4 formats that are already combined (video + audio). It may list some video-only MP4 adaptive formats. Downloading these will result in a video without sound. Full support for adaptive formats requires downloading separate audio and video streams and then muxing them, which is not implemented.
*   **Live Streams**: Downloading active live streams is not supported. Video-on-demand (VOD) versions of past live streams should work like regular videos.
*   **Age-Restricted/Private Videos**: These may not download correctly due to YouTube's access restrictions.

## Development Notes

The extension consists of the following main files:
*   `manifest.json`: Defines the extension's structure, permissions, and behavior.
*   `popup.html`: The HTML structure for the extension's popup interface.
*   `popup.js`: Handles the logic for the popup, including user interactions, communication with the content script, and UI updates.
*   `content.js`: A content script injected into YouTube video pages to extract video information and manage the download process.
*   `style.css`: Contains basic CSS rules for styling the popup.
*   `images/`: Contains placeholder icons for the extension.

Feel free to contribute to the development or report issues.
