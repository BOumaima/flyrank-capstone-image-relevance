# Build Log

## Project

AI Image Relevance System

## Development approach

The project was implemented incrementally with a verification and Git
commit checkpoint after each major stage.

## 1. Backend initialization

Created the Node.js/Express backend, health endpoint, environment
example, Git ignore rules, and npm scripts.

The project uses Node's environment-file support:

``` powershell
node --env-file=.env
```

## 2. Structured metadata

Added Zod validation for:

``` text
subject
category
attributes
caption
confidence
```

Verified valid and invalid metadata cases.

## 3. PostgreSQL

Added PostgreSQL through Docker Compose and created persistent tables
for images, embeddings, posts, and LLM usage.

Added a reproducible schema initializer.

## 4. Dataset

Created a 40-image dataset across four categories:

``` text
animals
vehicles
food
nature
```

Added `dataset/manifest.json`.

## 5. Gemini vision

Added `src/llm/vision.js` using structured JSON output.

The response is validated before persistence.

## 6. Vision model availability issue

An initially configured vision model returned a provider 404.

The model was made configurable through `GEMINI_MODEL` and the project
was moved to a working configured model.

## 7. Batch processing

Implemented `src/jobs/processImages.js`.

The job:

1.  scans the dataset
2.  skips processed filenames
3.  calls vision analysis
4.  validates metadata
5.  assigns review status
6.  saves metadata
7.  logs usage

## 8. Retry handling

Added:

``` text
src/utils/retry.js
src/utils/retryableError.js
src/utils/getRetryDelay.js
```

Transient failures are retried. Quota exhaustion is not repeatedly
retried.

## 9. Gemini quota limitation

During processing, temporary provider errors and quota/rate limitations
prevented all 40 images from being processed.

Current state:

``` text
40 dataset images
24 processed
16 unprocessed
```

The job remains idempotent so processing can continue later.

## 10. Image embeddings

Added image embedding generation with:

``` text
gemini-embedding-2
768 dimensions
```

Embeddings are persisted in PostgreSQL.

## 11. Post embeddings

Added post embedding generation and idempotent post seeding.

The evaluation set was expanded to 10 posts.

## 12. Embedding persistence bug

During verification, `testEmbeddingStorage.js` failed because the entire
embedding response object was passed as `vector`.

The actual embedding function returns:

``` js
{
    vector: [...],
    usage: ...
}
```

The test was corrected to extract:

``` js
const embeddingResult = await generateEmbedding(image.caption);
const vector = embeddingResult.vector;
```

After the fix:

``` text
Embedding saved.
Image ID: 9
Dimensions: 768
```

## 13. Semantic ranking

Implemented cosine similarity and ranking.

For the red fox post:

``` text
1. red-fox.jpg - 0.4000
2. cat.jpg - 0.2809
3. golden-retriever.jpg - 0.2572
```

## 14. Mismatch guard

Implemented checks for:

``` text
category
subject
confidence
similarity
```

Current thresholds:

``` text
confidence: 0.70
similarity: 0.24
```

Verified:

``` text
fox → accepted
wolf → rejected
low confidence → rejected
wrong category → rejected
```

## 15. No-confident-match behavior

Implemented `no_confident_match` with human-readable rejection reasons.

This prevents the system from forcing a recommendation when no candidate
passes the guard.

## 16. Review workflow

Added:

``` text
GET /images/review
PATCH /images/:id/review
```

Tested:

-   `needs_review`
-   `accepted`
-   `rejected`
-   invalid status
-   nonexistent image ID

## 17. Evaluation

The evaluation set contains 10 posts.

Current run:

``` text
Correct matches: 6/10
Wrong matches: 0
No confident match: 4
Top-1 precision: 60.00%
```

This score is provisional because four expected images are not yet
processed.

## 18. Usage tracking

Added the `llm_usage` table and logging helper.

Vision token usage is recorded when returned by the provider.

Embedding usage metadata was unavailable, so embedding cost is not
fabricated.

## 19. Guard normalization

Normalized text comparisons so casing differences do not cause
unnecessary mismatches.

Subject matching also handles cases where a detected subject contains
the expected subject, while still rejecting unrelated subjects.

## 20. Documentation

Prepared:

``` text
README.md
EVIDENCE.md
BUILDLOG.md
```

The documentation records implementation evidence and limitations
honestly, including the provisional evaluation result and incomplete
image processing.

## 21. AI-assisted development

AI assistance was used to:

-   break the capstone into implementation stages
-   explain backend architecture
-   review implementation ideas
-   diagnose runtime/database errors
-   design validation and mismatch-guard behavior
-   improve retry/error handling
-   interpret evaluator requirements
-   review test outputs
-   draft documentation

AI suggestions were treated as proposals and verified by running the
actual application, database checks, tests, and Git checkpoints.

## 22. Current status

Implemented and verified:

``` text
✓ Express backend
✓ PostgreSQL persistence
✓ Reproducible database schema
✓ 40-image dataset
✓ Structured vision output
✓ Zod validation
✓ Batch processing
✓ Retry handling
✓ Image embeddings
✓ Post embeddings
✓ Semantic ranking
✓ Mismatch guard
✓ No-confident-match behavior
✓ Review workflow
✓ Idempotent processing/seeding
✓ Evaluation dataset
✓ Usage logging
✓ Evaluation reporting
✓ Documentation
```

Remaining operational task:

``` text
Process the remaining 16 images after Gemini quota/rate limitations clear.
Then regenerate missing embeddings if necessary and rerun the full evaluation.
```

The current 60% Top-1 precision must remain labeled **provisional**
until that final run is completed.