window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.action !== "INJECT_SPOTIFY_COOKIES") {
        return;
    }

    chrome.runtime.sendMessage(
        { action: "inject_spotify", cookies: event.data.cookies },
        (response) => {
            window.postMessage({
                action: "SPOTIFY_INJECT_RESPONSE",
                response: response || { status: "error", message: "No response from background" }
            }, "*");
        }
    );
});