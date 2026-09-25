# AI Image Understanding & Content Matching Engine

An AI-powered backend that analyzes images, generates structured metadata, creates semantic embeddings, and matches images to blog posts.

The system is designed around one important rule:

> A semantically similar image is not automatically a valid match.

The matching pipeline therefore combines semantic ranking with a mismatch guard that can reject unsuitable candidates and return `no_confident_match`.

---

## Architecture

```text
                         ┌─────────────────────┐
                         │      Dataset        │
                         │   40 images / 4     │
                         │     categories      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Batch Processor   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Gemini Vision     │
                         │ structured output   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Zod Validation    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     PostgreSQL      │
                         │  Image Metadata     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Image Embeddings    │
                         └──────────┬──────────┘
                                    │
                                    │
┌─────────────────────┐             │
│     Blog Posts      │             │
└──────────┬──────────┘             │
           │                        │
           ▼                        │
┌─────────────────────┐             │
│ Post Embeddings     │             │
└──────────┬──────────┘             │
           │                        │
           └───────────┬────────────┘
                       ▼
              ┌─────────────────┐
              │ Similarity      │
              │ Ranking         │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ Mismatch Guard  │
              └────────┬────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       Valid Match        No Confident Match
```

---

## How matching works

For a requested blog post:

1. The post's embedding is loaded.
2. Image embeddings are compared using cosine similarity.
3. Candidates are ranked from highest to lowest similarity.
4. The mismatch guard checks each candidate.
5. A candidate is accepted only if it satisfies the guard rules.
6. If no candidate passes, the API returns `no_confident_match` with rejection reasons.

The current mismatch guard checks:

- category
- subject
- confidence
- similarity

---

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker Compose
- Google Gemini
- `@google/genai`
- Zod
- JavaScript / ES modules

---

## Project Structure

```text
.
├── dataset/
│   ├── animals/
│   ├── vehicles/
│   ├── food/
│   └── nature/
│
├── src/
│   ├── controllers/
│   ├── data/
│   ├── db/
│   ├── evaluation/
│   ├── jobs/
│   ├── llm/
│   ├── matching/
│   ├── routes/
│   ├── schemas/
│   └── utils/
│
├── .env.example
├── .gitignore
├── BUILDLOG.md
├── EVIDENCE.md
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Requirements

Before running the project, make sure you have:

- Node.js
- Docker
- Gemini API key

---

## Environment variables

Create a local `.env` file from `.env.example`.

Example:

```env
DATABASE_URL=postgres://postgres:dev@localhost:5432/image_matching
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.6-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

Never commit `.env`.

---

## Start PostgreSQL

Start the database with:

```powershell
docker compose up -d
```

Check that the container is running:

```powershell
docker ps
```

---

## Run the API

Install dependencies:

```powershell
npm install
```

Start the server:

```powershell
npm start
```

The API runs on:

```text
http://localhost:3000
```

---

## Health check

Open:

```text
GET /health
```

PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## Image matching API

The main matching endpoint is:

```text
GET /posts/:id/images
```

Example:

```powershell
Invoke-RestMethod http://localhost:3000/posts/1/images
```

The endpoint returns either a matched image or:

```json
{
  "status": "no_confident_match"
}
```

when no candidate passes the mismatch guard.

---

## Batch processing

The image-processing job analyzes images with Gemini and stores the resulting metadata in PostgreSQL.

Run:

```powershell
node --env-file=.env src/jobs/processImages.js
```

---

## Generate image embeddings

Run:

```powershell
node --env-file=.env src/jobs/generateImageEmbeddings.js
```

---

## Seed blog posts

Run:

```powershell
node --env-file=.env src/jobs/seedPosts.js
```

---

## Generate post embeddings

Run:

```powershell
node --env-file=.env src/jobs/generatePostEmbeddings.js
```

---

## Evaluation

The evaluation script measures top-1 precision on the labeled evaluation set.

Run:

```powershell
node --env-file=.env src/evaluation/runEval.js
```

The initial evaluation produced:

```text
Correct: 4/5
Top-1 precision: 80.00%
```

One evaluated case currently fails:

```text
expected=mountain.jpg
top1=bear.jpg
```

This failure is intentionally documented rather than hidden.

---

## Database

PostgreSQL is used for persistent storage.

The current schema contains data for:

- images
- image embeddings
- posts
- post embeddings
- LLM usage

The database is started through Docker Compose.

---

## AI usage and cost tracking

LLM usage is recorded in PostgreSQL through the `llm_usage` table.

The project tracks model usage, token information when available, status, and estimated cost.

The build log documents API failures and implementation changes encountered during development.

See:

- `EVIDENCE.md`
- `BUILDLOG.md`

---

## Current limitations

This project is still being hardened toward the final capstone requirements.

Known remaining work includes:

- processing and persisting all 40 dataset images successfully
- explicitly flagging low-confidence image metadata for review
- completing embedding-call cost attribution
- adding stronger idempotency to batch and seed operations
- implementing the review/approval workflow
- expanding the evaluation set to 10+ labeled posts
- tuning the mismatch thresholds using the evaluation set
- completing final acceptance tests

These limitations are intentionally documented so the current evaluation reflects the actual implementation state.

---

## Design principles

### Validate at boundaries

AI-generated structured data is treated as untrusted input and validated before entering the application.

### Separate ranking from acceptance

Similarity ranking identifies candidates.

The mismatch guard decides whether a candidate is acceptable.

### Refuse when confidence is insufficient

The system should return `no_confident_match` instead of forcing an image selection when no candidate clears the acceptance rules.

### Measure failures

The evaluation set is used to expose incorrect matches instead of changing the expected results to make the metric look better.

---

## Development log

`BUILDLOG.md` records:

- where AI assistance was used
- implementation decisions
- failures encountered
- changes made
- lessons learned

`EVIDENCE.md` records concrete implementation and test evidence for the capstone requirements.