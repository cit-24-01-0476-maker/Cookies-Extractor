chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if ((request.action === "inject_cookies" || request.action === "inject_spotify") && Array.isArray(request.cookies)) {
        (async () => {
            try {
                let service = request.service;
                if (!service) {
                    if (request.cookies.some(c => (c.domain && c.domain.includes("crunchyroll.com")) || c.name === "c_cloud_auth" || c.name === "cx_tokenId")) {
                        service = "crunchyroll";
                    } else if (request.cookies.some(c => (c.domain && c.domain.includes("netflix.com")) || c.name === "NetflixId")) {
                        service = "netflix";
                    } else {
                        service = "spotify";
                    }
                }

                if (service === "crunchyroll") {
                    // පරණ Crunchyroll session cookies ඉවත් කිරීම
                    const oldCookies = ["c_cloud_auth", "cx_tokenId", "cx_userId", "etp_rt", "session_id"];
                    for (const name of oldCookies) {
                        try {
                            await chrome.cookies.remove({ url: "https://www.crunchyroll.com/", name });
                        } catch (e) {}
                    }

                    for (const cookie of request.cookies) {
                        const isHostCookie = cookie.name.startsWith("__Host-");
                        let domain = cookie.domain || ".crunchyroll.com";
                        if (!domain.startsWith(".") && !domain.startsWith("http")) {
                            domain = "." + domain;
                        }

                        const cookieDetails = {
                            url: "https://www.crunchyroll.com/",
                            name: cookie.name,
                            value: cookie.value,
                            path: cookie.path || "/",
                            secure: cookie.secure !== false,
                            sameSite: "no_restriction",
                            expirationDate: Math.floor(Date.now() / 1000) + 31536000
                        };

                        if (!isHostCookie) {
                            cookieDetails.domain = domain.includes("crunchyroll.com") ? ".crunchyroll.com" : domain;
                        }

                        try {
                            await chrome.cookies.set(cookieDetails);
                        } catch (e) {
                            console.warn("Skipped Crunchyroll cookie:", cookie.name, e);
                        }
                    }

                    await chrome.tabs.create({ url: "https://www.crunchyroll.com/" });
                    sendResponse({ status: "success", service: "crunchyroll" });

                } else if (service === "netflix") {
                    // පරණ Netflix session cookies ඉවත් කිරීම
                    const oldCookies = ["NetflixId", "SecureNetflixId", "nfvdid", "gsid"];
                    for (const name of oldCookies) {
                        try {
                            await chrome.cookies.remove({ url: "https://www.netflix.com/", name });
                        } catch (e) {}
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
                    try {
                        await chrome.cookies.remove({ url: "https://open.spotify.com/", name: "sp_dc" });
                        await chrome.cookies.remove({ url: "https://open.spotify.com/", name: "sp_key" });
                    } catch (e) {}

                    for (const cookie of request.cookies) {
                        const isHostCookie = cookie.name.startsWith("__Host-");
                        const targetUrl = (cookie.domain && cookie.domain.includes("accounts.spotify.com"))
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