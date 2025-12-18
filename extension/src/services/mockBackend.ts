export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const mockScrape = async (): Promise<{ title: string; tokenCount: number }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                title: "Technex Hackathon 2025",
                tokenCount: 1420
            });
        }, 2000);
    });
};

export const mockChat = async (_query: string, context: boolean): Promise<string> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!context) {
                resolve("Please analyze the page first so I can give you a better answer.");
                return;
            }

            const responses = [
                "Based on the page content, this appears to be a hackathon event focused on innovation.",
                "I can see details about the schedule. Would you like me to summarize the timeline?",
                "The contact information listed is support@technex.com.",
                "Yes, according to the FAQ section, teams can have up to 4 members."
            ];

            resolve(responses[Math.floor(Math.random() * responses.length)]);
        }, 1000 + Math.random() * 1000); // Random 1-2s delay
    });
};
