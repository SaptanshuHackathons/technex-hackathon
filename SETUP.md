# Setup Instructions

## Backend Setup

### 1. Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from **Project Settings > API**
3. Add to `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

### 2. Create Database Tables

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the SQL from `backend/supabase_schema.sql`

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start Backend

```bash
python main.py
```

Backend will run on `http://localhost:8000`

## Frontend Setup

### 1. Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Start Frontend

The frontend is already running. If you need to restart:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## Testing the Integration

### 1. Test Scraping (via curl)

```bash
curl -X POST http://localhost:8000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Caesar_cipher","max_depth":1}'
```

Expected response:

- `success: true`
- `chat_id`: UUID
- `crawl_id`: UUID
- `pages`: Array of scraped pages

### 2. Test Tree Endpoint

```bash
curl http://localhost:8000/api/chats/{YOUR_CHAT_ID}/tree
```

Expected: Hierarchical page structure

### 3. Test Query

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the Caesar cipher?","chat_id":"YOUR_CHAT_ID","limit":10}'
```

### 4. Test Frontend Flow

1. Open `http://localhost:3000`
2. Enter a URL (e.g., `https://example.com`)
3. Click "Scrape"
4. You should be redirected to `/chat?id={chat_id}`
5. Sidebar should show the page tree
6. Type a question and press Enter
7. Should receive an AI-generated response with sources

## Troubleshooting

### Backend Issues

- **Supabase connection error**: Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- **Tables don't exist**: Run `supabase_schema.sql` in Supabase SQL Editor
- **Import errors**: Run `pip install -r requirements.txt`

### Frontend Issues

- **API connection error**: Check `NEXT_PUBLIC_API_URL` in `.env.local`
- **CORS error**: Ensure backend CORS allows `http://localhost:3000`

### Common Errors

- **"Chat ID not found"**: Make sure to scrape first, which creates a chat session
- **Empty sidebar**: Check if pages were stored in Supabase `pages` table
- **No AI response**: Check if embeddings were generated and stored in Qdrant
