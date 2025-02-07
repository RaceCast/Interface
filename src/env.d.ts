interface ImportMetaEnv {
    readonly LIVEKIT_WS_URL: string;
    readonly LIVEKIT_KEY: string;
    readonly LIVEKIT_SECRET: string;
    readonly LIVEKIT_ROOM: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}