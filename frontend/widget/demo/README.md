# Widget Demo

This folder contains demo files for testing the Astra RAG Widget.

## Files

### test-website.html
A sample business website with rich content about "Tech Solutions Inc." This page contains:
- Product features
- Pricing information ($99, $299, Custom)
- Company information
- Contact details

Use this to test the RAG chatbot's ability to answer questions about the website content.

### crawl-config.json
Example configuration file showing how developers specify which URLs to crawl for their knowledge base.

### index.html
Interactive demo dashboard for:
- Triggering crawls
- Initializing chats
- Testing the full RAG pipeline

## Testing Flow

1. **Serve the test website locally:**
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Or using Node.js
   npx http-server -p 8080
   ```

2. **Open test-website.html** in your browser at `http://localhost:8080/test-website.html`

3. **Start the backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Open index.html** (demo dashboard) in your browser

5. **Follow the demo workflow:**
   - Click "Start Crawl" and enter `http://localhost:8080/test-website.html`
   - Wait for crawl to complete
   - Click "Initialize Chat"
   - Open the chatbot widget and ask questions like:
     - "What are your pricing plans?"
     - "Tell me about your AI features"
     - "How can I contact support?"

## Example Questions to Test

- "What is the price of the Professional plan?"
- "What features are included in the Starter package?"
- "When was Tech Solutions Inc. founded?"
- "What is your support email?"
- "Tell me about your security features"
- "Do you have a mobile app?"
