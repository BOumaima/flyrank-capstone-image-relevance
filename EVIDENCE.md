# Capstone Evidence

This document maps the capstone requirements to concrete implementation
evidence.

## 1. Dataset

**Requirement:** At least 40 images across at least four categories with
a labeled evaluation set.

**Evidence:** `dataset/` contains 40 images across `animals`,
`vehicles`, `food`, and `nature`, with 10 images per category.
`dataset/manifest.json` records the dataset. `src/evaluation/evalSet.js`
contains 10 labeled evaluation posts.

**Status:** PASS

## 2. Structured image metadata

**Evidence:** `src/llm/vision.js` requests structured JSON containing
`subject`, `category`, `attributes`, `caption`, and `confidence`.
`src/schemas/imageMetadata.js` validates the result with Zod.

Test:

``` powershell
node src/schemas/imageMetadata.test.js
```

Result:

``` text
Valid metadata: true
Invalid metadata: false
```

**Status:** PASS

## 3. Low-confidence flagging

**Evidence:** `src/config/imageReview.js` defines a `0.70` threshold.
`src/jobs/processImages.js` stores results below the threshold as
`needs_review`.

**Status:** PASS

## 4. Batch processing and retries

**Evidence:** `src/jobs/processImages.js` processes the dataset, skips
existing filenames, validates metadata, persists results, assigns review
status, and logs usage. Retry logic is implemented in
`src/utils/retry.js`, `src/utils/retryableError.js`, and
`src/utils/getRetryDelay.js`.

Test:

``` powershell
node src/utils/testRetry.js
```

Result:

``` text
Running attempt 1
Attempt 1 failed. Retrying in 500ms...
Running attempt 2
Attempt 2 failed. Retrying in 1000ms...
Running attempt 3
Result: success
```

**Status:** PASS

## 5. Semantic image matching

**Evidence:** `src/llm/embedding.js`,
`src/jobs/generateImageEmbeddings.js`,
`src/jobs/generatePostEmbeddings.js`,
`src/matching/cosineSimilarity.js`, and `src/matching/rankImages.js`.

The project uses `gemini-embedding-2` with 768 dimensions.

Red fox ranking test:

``` text
1. red-fox.jpg - 0.4000
2. cat.jpg - 0.2809
3. golden-retriever.jpg - 0.2572
```

**Status:** PASS

## 6. Mismatch guard

**Evidence:** `src/matching/mismatchGuard.js` checks category, subject,
confidence, and similarity.

Verified results:

``` text
FOX: accepted
WOLF: rejected — Subject mismatch: expected red fox, detected wolf
LOW CONFIDENCE: rejected — Low confidence: 0.50 is below 0.70
WRONG CATEGORY: rejected — Category mismatch: expected animal, detected vehicle
```

**Status:** PASS

## 7. No confident match

**Evidence:** `src/matching/findMatch.js` returns
`status: no_confident_match` with human-readable rejection reasons when
all candidates fail the guard.

The current evaluation contains four `no_confident_match` results.

**Status:** PASS

## 8. Human review workflow

**Evidence:** Implemented in `src/controllers/imageReviewController.js`,
`src/db/images.js`, and `src/routes/postRoutes.js`.

Endpoints:

``` text
GET /images/review
PATCH /images/:id/review
```

The workflow was tested with `needs_review`, `accepted`, and `rejected`
states, plus invalid status and nonexistent image-ID cases.

**Status:** PASS

## 9. Persistence

**Evidence:** PostgreSQL schema is in `src/db/schema.sql`;
initialization is in `src/db/initSchema.js`.

Connection test:

``` powershell
node --env-file=.env src/db/testConnection.js
```

Result:

``` text
Database connected: { now: ... }
```

Embedding persistence test:

``` powershell
node --env-file=.env src/db/testEmbeddingStorage.js
```

Result:

``` text
Embedding saved.
Image ID: 9
Dimensions: 768
```

**Status:** PASS

## 10. Idempotency

**Evidence:** Image filenames are unique and processing skips existing
images. Post titles are unique and post seeding uses conflict-safe
persistence.

**Status:** PASS

## 11. Boundary validation

**Evidence:** Zod validates image metadata. The review controller
validates that image IDs are integers and statuses are `accepted` or
`rejected`.

**Status:** PASS

## 12. LLM usage tracking

**Evidence:** `src/db/usage.js` writes operation, model, status, token
fields when available, and estimated cost when available into
`llm_usage`.

Test:

``` powershell
node --env-file=.env src/db/testUsage.js
```

Result:

``` text
Usage logged.
```

Embedding usage metadata was unavailable from the provider response, so
no artificial token or dollar values are inserted.

**Status:** PASS with documented limitation

## 13. Evaluation

**Evidence:** `src/evaluation/evalSet.js` defines 10 labeled posts and
`src/evaluation/runEval.js` computes Top-1 precision.

Current run:

``` text
Correct matches: 6/10
Wrong matches: 0
No confident match: 4
Top-1 precision: 60.00%
```

This is **provisional** because four expected images have not yet
completed vision processing.

**Status:** PARTIAL / PROVISIONAL

## 14. Secrets hygiene

**Evidence:** `.env` is ignored and `.env.example` is tracked. Secrets
are supplied through environment variables.

**Status:** PASS

## 15. Reproducibility

**Evidence:** `docker-compose.yml`, `src/db/initSchema.js`,
`src/jobs/seedPosts.js`, `src/evaluation/runEval.js`, `README.md`, and
`capstone.yaml` define the run/seed/test workflow.

**Status:** PASS

## 16. Layered architecture

**Evidence:** Responsibilities are separated into `controllers`, `db`,
`jobs`, `llm`, `matching`, `routes`, `schemas`, `utils`, and
`evaluation`.

**Status:** PASS

## 17. Current limitation

The repository contains all 40 dataset images, but only 24 have
completed vision processing at this checkpoint. The remaining 16 were
blocked by Gemini provider quota/rate limitations.

The 60% evaluation result must therefore remain labeled provisional
until the remaining images are processed and the evaluation is rerun.