import { Server } from 'http';
export declare function broadcast(channel: string, data: object): void;
export declare function broadcastToAuction(auctionId: string, data: object): void;
export declare function broadcastToTrip(tripId: string, data: object): void;
export declare function broadcastToUser(userId: string, data: object): void;
export declare function setupWebSocket(server: Server): import("ws").Server<typeof import("ws"), typeof import("http").IncomingMessage>;
//# sourceMappingURL=index.d.ts.map