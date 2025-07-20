document.addEventListener("MEDIA_EXTRACTOR_TOGGLE", function () {
  const originalContent = document.documentElement.innerHTML;

  // Helper function to normalize URLs
  const normalizeUrl = (url) => {
    try {
      return new URL(url).href.split("?")[0]; // Remove query parameters
    } catch {
      return url;
    }
  };

  // Helper function to hash SVG content
  const hashSvg = (content) => {
    // Simple hash function for SVG content
    return content.replace(/\s+/g, " ").trim();
  };

  // Create sets to track unique items
  const seenUrls = new Set();
  const seenSvgHashes = new Set();

  // Collect all media elements with deduplication
  const mediaElements = {
    images: Array.from(document.querySelectorAll("img"))
      .map((img) => ({
        src: normalizeUrl(img.src),
        type: "image",
      }))
      .filter((img) => {
        if (!img.src || seenUrls.has(img.src)) return false;
        seenUrls.add(img.src);
        return true;
      }),

    svgs: Array.from(document.querySelectorAll("svg"))
      .map((svg) => ({
        content: svg.outerHTML,
        type: "svg",
        hash: hashSvg(svg.outerHTML),
      }))
      .filter((svg) => {
        if (!svg.content || seenSvgHashes.has(svg.hash)) return false;
        seenSvgHashes.add(svg.hash);
        return true;
      }),

    inlinedSvgs: Array.from(
      document.querySelectorAll(
        '[data-src*=".svg"], [style*="background-image"]',
      ),
    )
      .map((el) => {
        const svgUrl =
          el.dataset.src ||
          getComputedStyle(el).backgroundImage.match(
            /url\(['"]?([^'"()]+)['"]?\)/,
          )?.[1];
        return svgUrl
          ? {
              src: normalizeUrl(svgUrl),
              type: "svg",
            }
          : null;
      })
      .filter((svg) => {
        if (!svg || !svg.src || seenUrls.has(svg.src)) return false;
        seenUrls.add(svg.src);
        return true;
      }),

    video: Array.from(document.querySelectorAll('video, source[type^="video"]'))
      .map((vid) => ({
        src: normalizeUrl(vid.src || vid.currentSrc),
        type: "video",
      }))
      .filter((vid) => {
        if (!vid.src || seenUrls.has(vid.src)) return false;
        seenUrls.add(vid.src);
        return true;
      }),

    audio: Array.from(document.querySelectorAll('audio, source[type^="audio"]'))
      .map((aud) => ({
        src: normalizeUrl(aud.src || aud.currentSrc),
        type: "audio",
      }))
      .filter((aud) => {
        if (!aud.src || seenUrls.has(aud.src)) return false;
        seenUrls.add(aud.src);
        return true;
      }),
  };

  // Create media grid view
  const grid = document.createElement("div");
  grid.className = "media-extractor-grid";

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.className = "media-extractor-close";
  closeBtn.onclick = () => {
    document.documentElement.innerHTML = originalContent;
    location.reload();
  };
  grid.appendChild(closeBtn);

  // Add media elements
  Object.values(mediaElements)
    .flat()
    .forEach((media) => {
      const card = document.createElement("div");
      card.className = "media-card";

      if (media.type === "svg" && media.content) {
        card.innerHTML = media.content;
      } else {
        const element = document.createElement(
          media.type === "video"
            ? "video"
            : media.type === "audio"
              ? "audio"
              : "img",
        );
        element.src = media.src;
        if (["video", "audio"].includes(media.type)) {
          element.controls = true;
        }
        card.appendChild(element);
      }

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.onclick = () => downloadMedia(media);
      card.appendChild(downloadBtn);

      grid.appendChild(card);
    });

  // Replace page content
  document.body.innerHTML = "";
  document.body.appendChild(grid);
});

async function downloadMedia(media) {
  try {
    if (media.type === "svg" && media.content) {
      const blob = new Blob([media.content], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      await downloadBlob(url, "image.svg");
      URL.revokeObjectURL(url);
    } else {
      // Try direct download first
      try {
        const response = await fetch(media.src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const filename =
          media.src.split("/").pop().split("?")[0] ||
          `download.${
            media.type === "video"
              ? "mp4"
              : media.type === "audio"
                ? "mp3"
                : "jpg"
          }`;
        await downloadBlob(url, filename);
        URL.revokeObjectURL(url);
      } catch (fetchError) {
        // If fetch fails due to CORS, fall back to chrome.downloads API
        const filename =
          media.src.split("/").pop().split("?")[0] ||
          `download.${
            media.type === "video"
              ? "mp4"
              : media.type === "audio"
                ? "mp3"
                : "jpg"
          }`;

        // Send message to background script to handle download
        chrome.runtime.sendMessage({
          type: "download",
          url: media.src,
          filename: filename,
        });
      }
    }
  } catch (error) {
    console.error("Download failed:", error);
    alert('Download failed. Please try right-clicking and "Save As" instead.');
  }
}

function downloadBlob(url, filename) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(resolve, 100);
  });
}
