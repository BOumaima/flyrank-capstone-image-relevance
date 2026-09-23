# EVIDENCE

This file records concrete proof for the capstone requirements and evaluator probes.

## 1. Structured image metadata

The image metadata schema is validated with Zod.

Test output:

```text
Valid metadata: true
Invalid metadata: false
```

Implementation:
- `src/schemas/imageMetadata.js`
- `src/schemas/imageMetadata.test.js`

## 2. Vision model structured output

The vision integration uses Gemini structured JSON output with the fields:

- `subject`
- `category`
- `attributes`
- `caption`
- `confidence`

The response is validated with the Zod image metadata schema before being used by the application.

Implementation:
- `src/llm/vision.js`

## 3. Batch image processing

The batch job scans the dataset by category, sends images to the vision model, validates the returned metadata, and persists successful results in PostgreSQL.

Implementation:
- `src/jobs/processImages.js`

The first batch run also exposed real API failures, including HTTP 503 and HTTP 429 responses. These failures were retained in the build history rather than hidden.

## 4. Retry handling

Retry behavior was tested with simulated retryable and non-retryable errors.

Retryable status codes currently include:

- 429
- 500
- 502
- 503
- 504

Implementation:
- `src/utils/retry.js`
- `src/utils/retryableError.js`
- `src/utils/getRetryDelay.js`

## 5. LLM usage tracking

LLM usage is persisted in PostgreSQL in the `llm_usage` table.

Tracked fields include:

- model
- status
- token counts
- estimated cost
- image filename when applicable

Implementation:
- `src/db/schema.sql`
- `src/db/usage.js`

## 6. Image embeddings

Image captions are converted into embeddings and stored in PostgreSQL.

Observed embedding dimensions:

```text
768
```

The embedding model used by the project is configured through:

```text
GEMINI_EMBEDDING_MODEL
```

Current configured model:

```text
gemini-embedding-2
```

Implementation:
- `src/llm/embedding.js`
- `src/db/embeddings.js`
- `src/jobs/generateImageEmbeddings.js`

## 7. Post embeddings

Blog posts are also embedded so that posts and image descriptions can be compared semantically.

Five initial posts were seeded and their embeddings were generated successfully.

Implementation:
- `src/data/posts.js`
- `src/db/posts.js`
- `src/jobs/seedPosts.js`
- `src/jobs/generatePostEmbeddings.js`

## 8. Similarity ranking

Cosine similarity is used to rank image candidates for a post.

Example result for the red fox post:

```text
1. red-fox.jpg - 0.4000
2. cat.jpg - 0.2809
3. golden-retriever.jpg - 0.2572
4. bear.jpg - 0.2459
5. wolf.jpg - 0.2426
```

The red fox image ranked first.

Implementation:
- `src/matching/cosineSimilarity.js`
- `src/matching/rankImages.js`

## 9. Mismatch guard

The mismatch guard checks:

1. category
2. subject
3. confidence
4. semantic similarity

Test results:

```text
FOX: { accepted: true, reason: 'Candidate passed the mismatch guard' }

WOLF: {
  accepted: false,
  reason: 'Subject mismatch: expected red fox, detected wolf'
}

LOW CONFIDENCE: {
  accepted: false,
  reason: 'Low confidence: 0.50 is below 0.70'
}

WRONG CATEGORY: {
  accepted: false,
  reason: 'Category mismatch: expected red fox, detected vehicle'
}
```

Implementation:
- `src/matching/mismatchGuard.js`

## 10. No-confident-match behavior

A post whose candidates do not pass the mismatch guard returns:

```json
{
  "status": "no_confident_match",
  "match": null
}
```

The response also includes rejection reasons for the evaluated candidates.

A temporary technology post was used to verify this behavior because the image library did not contain a matching technology image.

Implementation:
- `src/matching/findMatch.js`

## 11. Matching API

The matching endpoint is:

```text
GET /posts/:id/images
```

Observed API behaviors include:

```text
Valid post with no suitable image:
status = 200
status = "no_confident_match"

Invalid post ID:
status = 400

Unknown post:
status = 404
```

Implementation:
- `src/controllers/postImagesController.js`
- `src/routes/postRoutes.js`

## 12. Top-1 evaluation

The initial evaluation set contains five labeled posts.

Observed result:

```text
Post 1: expected=red-fox.jpg, top1=red-fox.jpg, CORRECT
Post 2: expected=wolf.jpg, top1=wolf.jpg, CORRECT
Post 3: expected=mountain.jpg, top1=bear.jpg, WRONG
Post 4: expected=car.jpg, top1=car.jpg, CORRECT
Post 5: expected=apple.jpg, top1=apple.jpg, CORRECT

Correct: 4/5
Top-1 precision: 80.00%
```

The mountain failure is intentionally recorded as a failure. The evaluation result was not changed to hide the incorrect prediction.

Implementation:
- `src/evaluation/evalSet.js`
- `src/evaluation/runEval.js`

## 13. Database persistence

The project uses PostgreSQL running through Docker Compose.

Main persisted data currently includes:

- images
- image embeddings
- posts
- post embeddings
- LLM usage

Implementation:
- `docker-compose.yml`
- `src/db/schema.sql`

## 14. Secrets

API keys are loaded from environment variables and `.env` is excluded from Git.

The repository contains `.env.example` with placeholder values.

## 15. Known gaps still to be completed

The following requirements are not yet represented as completed evidence and must be addressed before the final capstone is considered complete:

- all 40 dataset images persisted and processed successfully
- low-confidence images explicitly flagged for review
- embedding calls fully attributed in usage/cost tracking
- idempotency for batch/seeding operations
- review/approval workflow
- evaluation set expanded to 10+ labeled posts
- final threshold tuning using the evaluation set
- final README and `capstone.yaml`
- final acceptance tests

This section is intentionally explicit so the evidence file does not claim unfinished work as completed.