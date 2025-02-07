import { AccessToken } from "livekit-server-sdk";

export const prerender = false;

/**
 * @description Generate a token for LiveKit
 * @method GET
 * @param {any} context - Request context
 * @endpoint GET /livekit-token
 * @returns {Promise<Response>} Token
 */
export async function GET(context: any): Promise<Response> {
    // Generate a new token
    let accessToken: AccessToken = new AccessToken(
        context?.locals?.runtime?.env?.LIVEKIT_KEY || import.meta.env.LIVEKIT_KEY,
        context?.locals?.runtime?.env?.LIVEKIT_SECRET || import.meta.env.LIVEKIT_SECRET,
        {
            identity: `User-${Math.random().toString(36).substring(7)}`,
        },
    );

    // Set permissions
    accessToken.addGrant({
        roomCreate: false,
        roomJoin: true,
        roomList: false,
        roomRecord: false,
        roomAdmin: false,
        room: context?.locals?.runtime?.env?.LIVEKIT_ROOM || import.meta.env.LIVEKIT_ROOM,
        ingressAdmin: false,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
        canUpdateOwnMetadata: false,
        hidden: false,
        recorder: false,
        agent: false,
    });

    // Return the token
    return new Response(
        JSON.stringify(
            await accessToken.toJwt(),
        ),
    );
}