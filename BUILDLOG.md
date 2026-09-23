# BUILDLOG

This log records how the capstone was built, where AI assistance was used, what went wrong, and what changed.

## Step 1 — Initialize backend

### What was built
- Node.js project
- Express server
- `/health` endpoint
- development and start scripts
- environment variable example
- Git ignore rules

### AI assistance
AI helped structure the initial Express project and suggest a minimal backend layout.

### Result
The API starts successfully and exposes a health endpoint.

---

## Step 2 — Define image metadata schema

### What was built
A Zod schema for:

- subject
- category
- attributes
- caption
- confidence

### AI assistance
AI helped translate the capstone's structured metadata requirement into a Zod validation schema and test.

### Result
Valid and invalid metadata objects were correctly distinguished.

---

## Step 3 — Add PostgreSQL

### What was built
- PostgreSQL 16 through Docker Compose
- database connection using `pg`
- initial `images` table

### AI assistance
AI helped design the initial PostgreSQL schema and connection setup.

### Result
The application connected successfully to PostgreSQL.

---

## Step 4 — Build image dataset

### What was built
A 40-image dataset organized into four categories:

- animals
- vehicles
- food
- nature

A manifest records the dataset filenames and categories.

### AI assistance
AI helped organize the dataset structure and manifest.

### Result
The initial dataset contains 40 images across four categories.

---

## Step 5 — Integrate Gemini vision

### What was built
Gemini vision analysis was added through `@google/genai`.

The model receives an image and returns structured metadata.

### What went wrong
The initial vision model configuration returned a 404 model error. The configured model was updated after following the API error's supported-model guidance.

The first JSON approach also produced Markdown code fences.

### What changed
The request was changed to use structured JSON output with:

- `responseMimeType`
- `responseSchema`

### Result
The vision response became machine-readable JSON.

---

## Step 6 — Validate AI output

### What was built
Gemini output is passed through the Zod schema before the application accepts it.

### AI assistance
AI helped place validation at the model boundary so invalid model output does not enter the application as trusted data.

### Result
Invalid structured output is rejected.

---

## Step 7 — Add batch image processing

### What was built
A batch job scans the dataset, analyzes each image, and saves valid metadata to PostgreSQL.

### What went wrong
The first batch run encountered real API failures, including:

- HTTP 503
- HTTP 429

For example, `vehicles/bus.jpg` failed with a 503 high-demand response.

### Result
The batch continued processing other images instead of stopping the entire job.

---

## Step 8 — Add retries and usage tracking

### What was built
- retry helper
- retryable HTTP status detection
- retry delay handling
- `llm_usage` table
- usage logging helper

### AI assistance
AI helped design exponential-backoff retry behavior and separate retryable from non-retryable errors.

### Result
Retry behavior was tested with simulated failures, and usage records can be persisted.

---

## Step 9 — Generate image embeddings

### What was built
Image captions are converted into 768-dimensional embeddings and stored in PostgreSQL.

### AI assistance
AI helped structure the embedding module, persistence layer, and idempotent embedding job.

### Result
Image embeddings were generated and stored successfully for the processed image records.

---

## Step 10 — Generate post embeddings

### What was built
Five initial blog posts were added with subjects and categories.

Post embeddings were generated using the same embedding model.

### AI assistance
AI helped design the post persistence and embedding job.

### Result
Five posts and their embeddings were stored successfully.

---

## Step 11 — Add semantic similarity ranking

### What was built
Cosine similarity compares post embeddings with image embeddings.

Candidates are sorted from highest to lowest similarity.

### AI assistance
AI helped implement and test the cosine similarity function and ranking flow.

### Result
The red fox article ranked `red-fox.jpg` first.

---

## Step 12 — Add mismatch guard

### What was built
The mismatch guard checks:

1. category
2. subject
3. confidence
4. similarity

### AI assistance
AI helped separate semantic ranking from deterministic acceptance rules.

### Result
A wolf candidate for a red fox post was rejected with an explicit subject-mismatch reason.

---

## Step 13 — Handle no confident match

### What was built
If no candidate passes the mismatch guard, the system returns:

```text
no_confident_match
```

with rejection reasons.

### What was tested
A temporary technology post was created when the image library had no technology image.

### Result
The system refused to invent a confident match.

---

## Step 14 — Add matching API

### What was built
Endpoint:

```text
GET /posts/:id/images
```

The API validates the post ID and returns the matching result or a useful error.

### Result
Valid, invalid, and unknown post IDs were tested.

---

## Step 15 — Add evaluation

### What was built
A labeled evaluation set and a top-1 precision script were added.

### Result
Initial evaluation:

```text
Correct: 4/5
Top-1 precision: 80.00%
```

One important failure was observed:

```text
expected=mountain.jpg
top1=bear.jpg
```

### Lesson
Semantic similarity alone is not sufficient for trustworthy image selection. Evaluation must expose failures rather than hide them.

---

## Step 16 — Evidence and build documentation

### What is being documented
- concrete test evidence
- implementation locations
- AI assistance
- failures and fixes
- known unfinished requirements

### Principle
The documentation should distinguish completed work from remaining work instead of claiming that unfinished requirements are complete.

---

## Lessons learned so far

### 1. AI output must be treated as untrusted input
Structured output and schema validation are both necessary.

### 2. Semantic similarity is not enough
An image can be semantically related to a post without being the correct image for the post.

### 3. The mismatch guard is a separate decision layer
Ranking answers "what is similar?" while the guard answers "is this candidate acceptable?"

### 4. Evaluation should expose weaknesses
The current 80% top-1 precision result shows that at least one evaluated case needs improvement.

### 5. External API failures are part of the system design
The 503 and 429 failures demonstrated why retry handling, progress tracking, and later idempotency are important.

### 6. Build evidence while implementing
Keeping test outputs and failure explanations makes the final capstone easier to verify and review.