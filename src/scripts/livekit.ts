import { Room, RoomEvent, Track } from "livekit-client";
import { State } from "../types/state";

/**
 * Dispatch a custom event
 * @param {string} name - Event name
 * @param {any} data - Event data
 * @returns {void}
 */
function dispatchEvent(name: string, data: any): void {
    document.dispatchEvent(
        new CustomEvent(name, { detail: data })
    );
}

/**
 * Get a Livekit token from the server
 * @returns {Promise<string>}
 */
async function getLivekitToken(): Promise<string> {
    const response: Response = await fetch("/token");
    return await response.json();
}

/**
 * Connect and show camera feed
 * @returns {Promise<void>}
 */
async function startLive(): Promise<void> {
    dispatchEvent("status", State.CONNECTING);
    const token: string = await getLivekitToken();
    let audioTrack: any = undefined;

    // creates a new room with options
    let room: Room | undefined = new Room({
        adaptiveStream: true, dynacast: false, reconnectPolicy: {
            nextRetryDelayInMs: (): number => {
                return 1000;
            }
        }
    });

    // pre-warm connection, this can be called as early as your page is loaded
    await room.prepareConnection(import.meta.env.LIVEKIT_WS_URL, token);

    // set up event listeners
    room
        .on(RoomEvent.Connected, (): void => {
            dispatchEvent("status", State.CONNECTED)
        })
        .on(RoomEvent.Reconnecting, (): void => {
            dispatchEvent("status", State.RECONNECTING)
        })
        .on(RoomEvent.Reconnected, (): void => {
            dispatchEvent("status", State.CONNECTED)
        })
        .on(RoomEvent.Disconnected, (): void => {
            dispatchEvent("status", State.DISCONNECTED)
        })
        .on(RoomEvent.TrackSubscribed, (track, publication): void => {
            if (track.kind === Track.Kind.Video) {
                if (publication.trackName.startsWith("Cam Link 4K")) {
                    const player: HTMLElement = document.getElementById("main") as HTMLElement;
                    track.attach(player.querySelector("video") as HTMLMediaElement);
                    (player.querySelector("img") as HTMLImageElement).style.opacity = "0";
                } else {
                    const player: HTMLElement = document.getElementById("alt") as HTMLElement;
                    track.attach(player.querySelector("video") as HTMLMediaElement);
                    (player.querySelector("img") as HTMLImageElement).style.opacity = "0";
                }
            }

            if (track.kind === Track.Kind.Audio) {
                audioTrack = track;
                track.attach(document.getElementById("audio") as HTMLMediaElement);
            }
            // console.log(`Subscribed to ${publication.trackName} (${track.kind})`)
        })
        .on(RoomEvent.TrackUnsubscribed, (track, publication): void => {
            if (track.kind === Track.Kind.Video) {
                if (publication.trackName.startsWith("Cam Link 4K")) {
                    const player: HTMLElement = document.getElementById("main") as HTMLElement;
                    track.detach(player.querySelector("video") as HTMLMediaElement);
                    (player.querySelector("img") as HTMLImageElement).style.opacity = "1";
                } else {
                    const player: HTMLElement = document.getElementById("alt") as HTMLElement;
                    track.detach(player.querySelector("video") as HTMLMediaElement);
                    (player.querySelector("img") as HTMLImageElement).style.opacity = "1";
                }
            }

            if (track.kind === Track.Kind.Audio) {
                track.detach(document.getElementById("audio") as HTMLMediaElement);
            }
            // console.log(`Unsubscribed of ${publication.trackName} (${track.kind})`)
        })
        .on(RoomEvent.DataReceived, (data): void => {
            dispatchEvent("data", JSON.parse(new TextDecoder().decode(data)));
        })
        .on(RoomEvent.RoomMetadataChanged, (metadata: string): void => {
            dispatchEvent("metadata", metadata)
            console.log(JSON.parse(metadata || "{}")?.car);
        });

    // connect to room
    await room.connect(import.meta.env.LIVEKIT_WS_URL, token);
    dispatchEvent("metadata", room.metadata);
    console.log(JSON.parse(room?.metadata || "{}")?.car);

    function attachAudio(): void {
        if (audioTrack) {
            audioTrack.attach(document.getElementById("audio") as HTMLMediaElement);
        }
    }

    function wantReconnect(): void {
        if (!room) {
            setTimeout(startLive);
            return;
        }
        room.disconnect(true);
        document.addEventListener("status", isDisconnected);
    }

    function isDisconnected(event: any): void {
        if (event.detail === State.DISCONNECTED) {
            document.removeEventListener("status", isDisconnected);
            document.removeEventListener("reconnect", wantReconnect);
            document.removeEventListener("attach-audio", attachAudio);
            room = undefined;
            audioTrack = undefined;
            setTimeout(startLive);
        }
    }

    document.addEventListener("reconnect", wantReconnect);
    document.addEventListener("attach-audio", attachAudio);
}

setTimeout(startLive);