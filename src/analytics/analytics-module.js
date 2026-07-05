export const AnalyticsModule = (() => {

    function getVisitorId() {
        let id = localStorage.getItem("lovify_visitor_id");

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("lovify_visitor_id", id);
        }

        return id;
    }

    function getSessionId() {
        let id = sessionStorage.getItem("lovify_session_id");

        if (!id) {
            id = crypto.randomUUID();
            sessionStorage.setItem("lovify_session_id", id);
        }

        return id;
    }

    function getBrowser() {
        return navigator.userAgent;
    }

    function getDevice() {
        if (/mobile/i.test(navigator.userAgent)) {
            return "Mobile";
        }

        if (/tablet/i.test(navigator.userAgent)) {
            return "Tablet";
        }

        return "Desktop";
    }

    function getUTM(name) {
        const params = new URLSearchParams(window.location.search);

        return params.get(name);
    }
async function trackVisit() {

    try {

        const payload = {

            visitor_id: getVisitorId(),

            session_id: getSessionId(),

            browser: getBrowser(),

            device: getDevice(),

            referrer: document.referrer || "direct",

            landing_page: window.location.pathname,

            utm_source: getUTM("utm_source"),

            utm_medium: getUTM("utm_medium"),

            utm_campaign: getUTM("utm_campaign")

        };

        const { error } = await supabaseClient
            .from("website_visits")
            .insert(payload);

        if (error) {
            console.error("Analytics error:", error);
        }

    } catch (error) {

        console.error("Analytics failed:", error);

    }

}
async function trackSongPlay(song) {

    if (!song?.id) {
        return;
    }

    try {
const { error: rpcError } =
    await supabaseClient.rpc(
        "increment_song_play",
        {
            song_uuid: song.id
        }
    );

console.log(
    "RPC:",
    rpcError
);
const { error: insertError } =
    await supabaseClient
    .from("song_play_events")
    .insert({ 
        
                song_id: song.id,

                visitor_id: getVisitorId(),

                session_id: getSessionId()

            });
console.log(
    "Insert:",
    insertError
);
    } catch (error) {

        console.error(
            "Song analytics failed",
            error
        );

    }

}
return {

    trackVisit,

    trackSongPlay

};

})();