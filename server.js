const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

let queue = [];

console.log(`🚀 Matchmaking Server running on port ${PORT}`);

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.action === "find_match") {
                ws.userData = { userId: data.userId, placeId: data.placeId };
                
                // منع التكرار في الطابور
                if (!queue.some(p => p.userId === data.userId)) {
                    queue.push({ ws, userId: data.userId });
                    console.log(`Player ${data.userId} joined queue. Queue size: ${queue.length}`);
                }

                // لما يتوفر 2 لعيبة نعملهم Match
                if (queue.length >= 2) {
                    const p1 = queue.shift();
                    const p2 = queue.shift();

                    const matchData = {
                        action: "match_found",
                        p1: p1.userId,
                        p2: p2.userId
                    };

                    p1.ws.send(JSON.stringify(matchData));
                    p2.ws.send(JSON.stringify(matchData));
                    console.log(`Match created between ${p1.userId} and ${p2.userId}`);
                }
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    });

    ws.on('close', () => {
        queue = queue.filter(player => player.ws !== ws);
    });
