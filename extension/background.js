chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if ((request.action === "inject_cookies" || request.action === "inject_spotify") && Array.isArray(request.cookies)) {
        (async () => {
            try {
                const isNetflix = request.service === "netflix" || request.cookies.some(c => c.domain.includes("netflix.com"));

                if (isNetflix) {
                    // පරණ Netflix session cookies ඉවත් කිරීම
                    const oldCookies = ["NetflixId", "SecureNetflixId", "nfvdid", "gsid"];
                    for (const name of oldCookies) {
                        await chrome.cookies.remove({ url: "https://www.netflix.com/", name });
                    }

                    for (const cookie of request.cookies) {
                        const cookieDetails = {
                            url: "https://www.netflix.com/",
                            domain: ".netflix.com",
                            name: cookie.name,
                            value: cookie.value,
                            path: cookie.path || "/",
                            secure: cookie.secure !== false,
                            httpOnly: cookie.name === "NetflixId" || cookie.name === "SecureNetflixId",
                            sameSite: "no_restriction",
                            expirationDate: Math.floor(Date.now() / 1000) + 31536000
                        };

                        try {
                            await chrome.cookies.set(cookieDetails);
                        } catch (e) {
                            console.warn("Skipped Netflix cookie:", cookie.name, e);
                        }
                    }

                    await chrome.tabs.create({ url: "https://www.netflix.com/browse" });
                    sendResponse({ status: "success", service: "netflix" });

                } else {
                    // පරණ Spotify session cookies ඉවත් කිරීම
                    await chrome.cookies.remove({ url: "https://open.spotify.com/", name: "sp_dc" });
                    await chrome.cookies.remove({ url: "https://open.spotify.com/", name: "sp_key" });

                    for (const cookie of request.cookies) {
                        const isHostCookie = cookie.name.startsWith("__Host-");
                        const targetUrl = cookie.domain.includes("accounts.spotify.com")
                            ? "https://accounts.spotify.com/"
                            : "https://open.spotify.com/";

                        const cookieDetails = {
                            url: targetUrl,
                            name: cookie.name,
                            value: cookie.value,
                            path: "/",
                            secure: true,
                            httpOnly: cookie.name === "sp_dc" || cookie.name === "sp_key",
                            sameSite: "no_restriction",
                            expirationDate: Math.floor(Date.now() / 1000) + 31536000
                        };

                        if (!isHostCookie) {
                            cookieDetails.domain = ".spotify.com";
                        }

                        try {
                            await chrome.cookies.set(cookieDetails);
                        } catch (e) {
                            console.warn("Skipped Spotify cookie:", cookie.name, e);
                        }
                    }

                    await chrome.tabs.create({ url: "https://open.spotify.com/" });
                    sendResponse({ status: "success", service: "spotify" });
                }
            } catch (err) {
                sendResponse({ status: "error", message: err.message });
            }
        })();

        return true;
    }
});