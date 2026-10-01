# AI Image Relevance System

A backend system that understands an image library, generates structured
image metadata, embeds image descriptions and blog posts, and recommends
images to posts using semantic similarity plus a mismatch guard.

The system is designed to prefer **no confident match** over returning
an obviously unsuitable image.

## 1. Project goal

``` text
Images
   │
   ▼
Batch processing
   │
   ▼
Gemini vision analysis
   │
   ▼
Validated image metadata
   │
   ▼
Caption embeddings
   │
   ▼
Image vectors ───────────────┐
                             │
Posts ──► post embeddings ───┤
                             ▼
                    Semantic ranking
                             │
                             ▼
                      Mismatch guard
                       │           │
                       ▼           ▼
                  Match       No confident match
```

## 2. Main features

-   40-image dataset across four categories: animals, vehicles, food,
    and nature.
-   Gemini vision analysis with structured JSON output.
-   Zod validation for image metadata.
-   Confidence-based review status.
-   Retry handling for transient provider failures.
-   PostgreSQL persistence.
-   Image and post embeddings using `gemini-embedding-2`.
-   Cosine-similarity ranking.
-   Mismatch guard based on category, subject, vision confidence, and
    semantic similarity.
-   Explicit `no_confident_match` responses with rejection reasons.
-   Image review workflow.
-   Idempotent image and post processing.
-   LLM usage logging.
-   Evaluation dataset with 10 posts.

## 3. Architecture

``` text
HTTP routes
    │
    ▼
Controllers
    │
    ▼
Matching / application logic
    │
    ├── Ranking
    ├── Mismatch guard
    └── Review decisions
    │
    ▼
Database layer
    │
    ├── images
    ├── image_embeddings
    ├── posts
    ├── post_embeddings
    └── llm_usage
    │
    ▼
PostgreSQL
```

LLM-specific code is isolated under `src/llm/`. Batch jobs are under
`src/jobs/`. Evaluation code is under `src/evaluation/`.

## 4. Repository structure

``` text
src/
├── config/
├── controllers/
├── data/
├── db/
├── evaluation/
├── jobs/
├── llm/
├── matching/
├── routes/
├── schemas/
├── utils/
└── server.js

dataset/
├── animals/
├── vehicles/
├── food/
├── nature/
└── manifest.json
```

## 5. Requirements

-   Node.js
-   Docker
-   PostgreSQL through Docker Compose
-   Gemini API key

## 6. Environment

Create `.env` from `.env.example`.

``` env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=your_vision_model
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
DATABASE_URL=postgres://postgres:dev@localhost:5432/image_matching
```

Do not commit `.env`.

## 7. Start PostgreSQL and initialize the database

``` powershell
docker compose up -d
node --env-file=.env src/db/initSchema.js
```

Verify:

``` powershell
node --env-file=.env src/db/testConnection.js
```

## 8. Start the API

``` powershell
npm start
```

Base URL:

``` text
http://localhost:3000
```

Health endpoint:

``` text
GET /health
```

## 9. Seed posts

``` powershell
node --env-file=.env src/jobs/seedPosts.js
```

The seed operation is idempotent by post title.

## 10. Process images

``` powershell
node --env-file=.env src/jobs/processImages.js
```

The job validates metadata, assigns review status, persists results,
logs LLM usage, retries transient failures, and skips already processed
filenames.

### Current processing status

The repository contains all 40 dataset images.

At this documentation checkpoint, 24 images have successfully completed
vision processing and are persisted in PostgreSQL. 16 remain unprocessed
because Gemini requests encountered provider quota/rate limitations.

The job is idempotent, so the remaining images can be processed later
without reprocessing successful records.

## 11. Generate embeddings

``` powershell
node --env-file=.env src/jobs/generateImageEmbeddings.js
node --env-file=.env src/jobs/generatePostEmbeddings.js
```

Embedding model:

``` text
gemini-embedding-2
```

Configured dimensions:

``` text
768
```

## 12. Image matching

Endpoint:

``` text
GET /posts/:id/images
```

Example:

``` text
GET /posts/1/images
```

Flow:

``` text
Post
  │
  ▼
Post embedding
  │
  ▼
Cosine similarity ranking
  │
  ▼
Candidate images
  │
  ▼
Mismatch guard
  │
  ├── accepted → match
  │
  └── rejected → try next candidate
                    │
                    ▼
             no confident match
```

## 13. Mismatch guard

The guard checks:

1.  Category compatibility.
2.  Subject compatibility.
3.  Vision confidence.
4.  Semantic similarity.

Current defaults:

``` text
minimum confidence: 0.70
minimum similarity: 0.24
```

Example rejection reasons:

``` text
Subject mismatch: expected red fox, detected wolf
Low confidence: 0.50 is below 0.70
Category mismatch: expected animal, detected vehicle
```

## 14. Review workflow

Get images requiring review:

``` text
GET /images/review
```

Update an image:

``` text
PATCH /images/:id/review
```

Supported decisions:

``` text
accepted
rejected
```

## 15. Evaluation

Run:

``` powershell
node --env-file=.env src/evaluation/runEval.js
```

Top-1 precision:

``` text
correct first suggestions / total evaluation posts
```

Current provisional result:

``` text
Correct matches: 6/10
Wrong matches: 0
No confident match: 4
Top-1 precision: 60.00%
```

This is **not the final dataset score**. Four expected images are among
the images that have not completed vision processing, so the evaluation
must be rerun after the remaining images are successfully processed.

## 16. Verified examples

For `The Secret Life of Red Foxes`, the system returns `red-fox.jpg`
with confidence `0.98` and similarity approximately `0.4000`.

A forced wolf candidate is rejected with:

``` text
Subject mismatch: expected red fox, detected wolf
```

A low-confidence candidate at `0.50` is rejected against the `0.70`
threshold.

A wrong-category candidate is rejected.

## 17. LLM usage tracking

LLM operations are stored in `llm_usage`.

Tracked fields include:

-   operation
-   image filename when applicable
-   model
-   status
-   input tokens when available
-   output tokens when available
-   total tokens when available
-   estimated cost when available

Successful vision calls returned token usage.

The embedding responses used by this implementation did not provide
usage metadata, so embedding token usage and dollar cost are recorded as
unavailable rather than invented.

## 18. Testing

``` powershell
node src/schemas/imageMetadata.test.js
node src/utils/testRetry.js
node src/matching/testCosineSimilarity.js
node --env-file=.env src/matching/testRanking.js
node src/matching/testMismatchGuard.js
node --env-file=.env src/matching/testFindMatch.js
node --env-file=.env src/db/testConnection.js
node --env-file=.env src/db/testEmbeddingStorage.js
node --env-file=.env src/db/testUsage.js
```

Verified:

-   valid metadata accepted
-   invalid metadata rejected
-   retry logic succeeds after transient failures
-   cosine similarity behaves correctly
-   red fox ranks first
-   wolf mismatch rejected
-   low-confidence candidate rejected
-   wrong category rejected
-   full red fox matching flow succeeds
-   PostgreSQL connection succeeds
-   768-dimensional embedding is persisted
-   usage logging succeeds

## 19. Current limitations

### Incomplete image processing

40 images exist in the dataset, but 24 have currently completed vision
processing. The remaining 16 were blocked by provider quota/rate
limitations.

### Provisional evaluation

The current 60% Top-1 precision is provisional because the image corpus
used by the evaluator is incomplete.

### Embedding cost visibility

The embedding response did not provide usage metadata. No dollar cost is
invented without a documented pricing basis.

### Dataset licensing

The dataset images were generated for the project. This README does not
make an independent third-party licensing claim.

## 20. Security

-   API credentials are supplied through environment variables.
-   `.env` is ignored by Git.
-   `.env.example` contains placeholders only.
-   Secrets must not be committed.

## 21. Reproducibility

``` powershell
docker compose up -d
node --env-file=.env src/db/initSchema.js
node --env-file=.env src/jobs/seedPosts.js
npm start
```

Then, when provider quota permits:

``` powershell
node --env-file=.env src/jobs/processImages.js
node --env-file=.env src/jobs/generateImageEmbeddings.js
node --env-file=.env src/jobs/generatePostEmbeddings.js
node --env-file=.env src/evaluation/runEval.js
```

See `EVIDENCE.md` for requirement-by-requirement evidence and
`BUILDLOG.md` for implementation history.