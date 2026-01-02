Awesome — here are the **4 concrete docs** you can drop straight into your repo:

- `docs/architecture.md`
- `docs/api-spec.md`
- `docs/data-schema.md`
- `docs/mvp-tasks.md` (GitHub-issues-ready)

---

```markdown
# docs/architecture.md

## Degree Autopilot — System Architecture

Degree Autopilot is a multi-service platform that auto-plans **all remaining semesters** for a student and optimizes for **workload/risk**, using:

- **Structured rules/constraints** (degree requirements, prereqs, MC limits, offerings)
- **Optimization** (OR-Tools CP-SAT)
- **RAG + embeddings** (module similarity + conceptual collision)
- **Workload/risk modeling** (rules-first → ML later)

### Services (deployed separately)

1. **Frontend** (Next.js)

- Planner UI, onboarding, timeline, risk dashboard
- Calls Backend only

2. **Backend API** (Node.js/TS)

- Auth, profiles, plan storage, module cache
- Orchestrates calls to AI service
- Owns ingestion jobs (NUSMods sync + scraping + indexing)

3. **AI Service** (Python/FastAPI)

- Planner optimizer (CP-SAT)
- Workload/risk scoring
- RAG similarity / collision scoring

### Data stores

- **Postgres**: users, plans, cached modules, requirements, scraped comments
- **Vector index**: pgvector in Postgres (MVP), optional Qdrant later
- **Redis** (optional): cache for heavy queries

---

## Key Flows

### 1) Generate multi-semester plan

1. Frontend sends `POST /plans/generate` with profile + constraints
2. Backend fetches:
   - module catalogue (cached NUSMods)
   - degree requirement rules
   - user completed modules
3. Backend calls AI:
   - `POST /ai/plan/generate` with structured inputs
4. AI returns:
   - plan (semester → modules)
   - scores (workload/risk)
   - warnings (collision + prereq chain pressure)
   - alternatives (2–3 variants)
5. Backend persists plan + scores
6. Frontend renders timeline + controls

### 2) Regenerate with user pins / sliders

- User pins a module to a semester, changes max MC or “safe ↔ fast” slider
- Backend calls AI regenerate; new plan stored as a new version

### 3) Ingestion pipeline

- Scheduled job:
  - Pull NUSMods module data → normalize → store in Postgres
- Scrape comments (if enabled):
  - scrape → clean → dedupe → safety filter → store → embed → index

---

## RAG / Similarity Design

### Why RAG

We use RAG/embeddings to detect:

- “Conceptual closeness” between modules
- “Collision risk” when stacking similar/mentally-heavy modules

### Corpus

- NUSMods descriptions + learning outcomes
- Scraped comments/reviews (sanitized)
- Optional: syllabi/outline text (if available)

### Outputs

- `similarity(moduleA, moduleB) -> score`
- `collision(semesterModules[]) -> penalty`

These are used as **soft constraints** / objective terms in optimization.

---

## Optimization Strategy

### Hard constraints (must satisfy)

- Prereqs / coreqs (best-effort parsing + curated rules)
- Degree requirement completion
- MC bounds per semester
- Semester offerings availability
- Internship/exchange blocked semesters

### Objective (optimize)

Weighted sum (user-adjustable):

- minimize total overload risk
- minimize workload variance (avoid spikes)
- minimize conceptual collision penalties
- minimize remaining semesters (if “graduate fast”)
- maximize preference alignment (focus areas)

---

## MVP Constraints

MVP intentionally avoids:

- timetable clash resolution (lecture/tutorial slots)
- “guaranteed GPA prediction”
- full support for every degree

Start with:

- 1–2 programmes (e.g., CS + DSA)
- valid plan + risk scoring + similarity warnings
```

---

````markdown
# docs/api-spec.md

## API Spec Overview

### Conventions

- All requests/response JSON
- `id` fields are UUID strings
- Dates are ISO strings
- Backend is the only public API; AI service is internal

---

## Backend API (Public)

### Health

GET `/health`
Response: `{ "ok": true }`

---

## Modules

### Get module list (cached)

GET `/modules?search=CS2040&limit=50`
Response:

```json
{
  "modules": [
    {
      "code": "CS2040",
      "title": "Data Structures and Algorithms",
      "mcs": 4,
      "description": "...",
      "semestersOffered": ["1", "2"],
      "prereqText": "...",
      "faculty": "SoC"
    }
  ]
}
```
````

### Get module details

GET `/modules/:code`
Response includes the above plus any derived metadata:

- normalized prereq graph (if available)
- embedding status (if indexed)
- workload stats (if present)

---

## User Profile

### Upsert profile

POST `/profile`
Body:

```json
{
  "programmes": ["CS", "DSA_SECOND_MAJOR"],
  "completedModules": ["CS1010", "MA1521"],
  "maxMcsPerSemester": 20,
  "blockedSemesters": ["Y2S2"],
  "preferences": {
    "objective": "BALANCED",
    "focusAreas": ["AI", "SYSTEMS"],
    "riskTolerance": "MEDIUM"
  }
}
```

Response: `{ "ok": true }`

---

## Plans

### Generate plan (new)

POST `/plans/generate`
Body:

```json
{
  "profileId": "uuid",
  "constraints": {
    "startSemester": "Y2S1",
    "maxMcsPerSemester": 20,
    "minMcsPerSemester": 16,
    "blockedSemesters": ["Y2S2"],
    "mustTake": ["CS2100"],
    "mustAvoid": ["CS2106"]
  },
  "controls": {
    "tradeoff": {
      "fastGraduation": 0.4,
      "lowRisk": 0.6
    }
  }
}
```

Response:

```json
{
  "planId": "uuid",
  "version": 1,
  "timeline": [
    {
      "term": "Y2S1",
      "modules": ["CS2040", "CS2100", "MA2001"],
      "mcs": 12,
      "scores": { "workload": 0.72, "risk": 0.66, "collision": 0.31 },
      "warnings": [
        {
          "type": "PREREQ_CHAIN",
          "message": "CS3230 depends on MA2001; take MA2001 early."
        }
      ]
    }
  ],
  "alternatives": [
    { "name": "Safer", "planId": "uuid-alt-1" },
    { "name": "Faster", "planId": "uuid-alt-2" }
  ]
}
```

### Regenerate plan (new version)

POST `/plans/:planId/regenerate`
Body:

```json
{
  "pins": [{ "term": "Y2S1", "module": "CS2100" }],
  "locks": [{ "term": "Y2S1", "modules": ["CS2100"] }],
  "controls": {
    "tradeoff": { "fastGraduation": 0.2, "lowRisk": 0.8 }
  }
}
```

Response: same shape as generate, with incremented version.

### Get plan

GET `/plans/:planId`
Response: full plan + versions + metadata

---

## Ingestion (Admin / internal)

### Trigger NUSMods sync

POST `/admin/ingest/nusmods`
Response: `{ "started": true }`

### Trigger scraping run

POST `/admin/ingest/scrape`
Response: `{ "started": true }`

---

## AI Service (Internal)

### Generate optimized plan

POST `/ai/plan/generate`
Body:

```json
{
  "catalog": {
    "modules": [
      /*...*/
    ],
    "offerings": {
      /*...*/
    }
  },
  "requirements": {
    /* degree rules */
  },
  "completed": ["CS1010"],
  "constraints": {
    /* max MC, blocked terms, mustTake */
  },
  "objective": {
    /* weights */
  }
}
```

Response:

```json
{
  "timeline": [
    /* term allocations */
  ],
  "scores": { "totalRisk": 0.62, "totalSemesters": 6 },
  "termScores": {
    "Y2S1": { "risk": 0.66, "workload": 0.72, "collision": 0.31 }
  },
  "warnings": [
    /*...*/
  ],
  "debug": { "solverStatus": "OPTIMAL" }
}
```

### Similarity query

POST `/ai/rag/similarity`
Body:

```json
{ "moduleA": "CS2040", "moduleB": "CS3230" }
```

Response:

```json
{
  "similarity": 0.78,
  "explanations": ["Both are algorithmic and proof-heavy."]
}
```

### Collision score for a semester

POST `/ai/rag/collision-score`
Body:

```json
{ "modules": ["CS2040", "MA2001", "CS2100"] }
```

Response:

```json
{ "collision": 0.31, "topPairs": [["CS2040", "MA2001", 0.62]] }
```

````

---

```markdown
# docs/data-schema.md

## Postgres Schema (MVP)

> Use pgvector for embeddings (optional in MVP1; recommended by MVP2)

### Extensions
- `uuid-ossp`
- `vector` (pgvector)

---

## Tables

### users
- `id` UUID PK
- `email` TEXT UNIQUE
- `created_at` TIMESTAMP

### profiles
- `id` UUID PK
- `user_id` UUID FK(users.id)
- `programmes` JSONB               // e.g. ["CS","DSA_SECOND_MAJOR"]
- `completed_modules` TEXT[]       // module codes
- `max_mcs_per_sem` INT
- `blocked_terms` TEXT[]           // e.g. ["Y2S2"]
- `preferences` JSONB              // riskTolerance, focusAreas, objective
- `updated_at` TIMESTAMP

### modules
Cached from NUSMods
- `code` TEXT PK
- `title` TEXT
- `mcs` INT
- `description` TEXT
- `faculty` TEXT
- `prereq_text` TEXT
- `coreq_text` TEXT
- `semesters_offered` TEXT[]       // ["1","2"]
- `last_synced_at` TIMESTAMP

### module_offerings
- `id` UUID PK
- `module_code` TEXT FK(modules.code)
- `term` TEXT                      // e.g. "Y2S1" or generic "S1"
- `is_offered` BOOLEAN
- `meta` JSONB                     // optional extra

> MVP: store generic semester offerings ("S1"/"S2") from NUSMods.
> Later: store year-specific offering reliability.

### degree_requirements
Start with hardcoded rules for CS + DSA (or store as JSON)
- `id` UUID PK
- `programme_key` TEXT             // "CS", "DSA_SECOND_MAJOR"
- `rules` JSONB                    // structured requirement groups
- `version` INT
- `updated_at` TIMESTAMP

### plans
- `id` UUID PK
- `profile_id` UUID FK(profiles.id)
- `created_at` TIMESTAMP
- `latest_version` INT

### plan_versions
- `id` UUID PK
- `plan_id` UUID FK(plans.id)
- `version` INT
- `objective_weights` JSONB        // slider weights
- `constraints` JSONB              // mustTake, mustAvoid, max MC, pins
- `timeline` JSONB                 // term → module list + MC
- `scores` JSONB                   // term scores + totals
- `warnings` JSONB
- `created_at` TIMESTAMP

### scraped_comments (optional MVP2)
- `id` UUID PK
- `source` TEXT                    // reddit, forum, etc.
- `module_code` TEXT
- `text` TEXT
- `created_at` TIMESTAMP
- `hash` TEXT UNIQUE               // dedupe
- `safety_flags` JSONB             // pii/toxicity flags
- `embedding` vector(768) NULL     // if using pgvector

### module_embeddings (optional MVP1+)
- `module_code` TEXT PK
- `embedding` vector(768)
- `model_name` TEXT
- `updated_at` TIMESTAMP

---

## Indices
- `modules(code)`
- `scraped_comments(module_code)`
- `scraped_comments(hash)`
- Vector index (if using pgvector):
  - `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops);`

---

## Requirement Rules Format (JSONB idea)
Example (simplified):
```json
{
  "core": { "mustComplete": ["CS1010","CS2040"], "mcs": 40 },
  "focusAreas": [
    { "name": "AI", "chooseAtLeast": 2, "from": ["CS3244","CS4246"] }
  ],
  "unrestrictedElectivesMcs": 20
}
````

````

---

```markdown
# docs/mvp-tasks.md

## MVP Milestones (GitHub Issues Ready)

### Milestone 0 — Repo + Dev Environment
- [ ] Init monorepo structure: `frontend/ backend/ ai/ docs/ infra/`
- [ ] Docker Compose for local dev (postgres + optional redis)
- [ ] CI basics (lint/test) for each service

---

## Milestone 1 — Module Data (NUSMods) + Basic UI
### Backend
- [ ] Implement NUSMods sync job: fetch module catalogue → normalize → store
- [ ] `GET /modules` list/search
- [ ] `GET /modules/:code` detail endpoint

### Frontend
- [ ] Onboarding page: choose programme + add completed modules
- [ ] Module search + select UI (fast + usable)

---

## Milestone 2 — Degree Requirements Engine (CS + DSA)
### Backend
- [ ] Encode CS degree requirement rules (JSONB `degree_requirements`)
- [ ] Encode DSA second major rules
- [ ] Implement “progress checker”: completed → requirements remaining
- [ ] Endpoint `POST /profile` and store profile

### Frontend
- [ ] “Progress” view: show unmet requirements groups

---

## Milestone 3 — AI Plan Generator (Valid Plan First)
### AI Service
- [ ] Define structured input contract for optimizer
- [ ] Implement CP-SAT model (OR-Tools):
  - hard constraints: prereqs (best-effort), MC limits, offerings, requirements
- [ ] Return a valid multi-semester timeline

### Backend
- [ ] `POST /plans/generate` orchestrates inputs → calls AI → stores plan
- [ ] `GET /plans/:id`

### Frontend
- [ ] Planner timeline UI showing semester cards + MC totals

---

## Milestone 4 — Risk/Workload Scoring (Rules-based)
### AI Service
- [ ] Add simple workload score per module (proxy features)
- [ ] Add “semester overload” scoring (sum + penalty for stacks)
- [ ] Return termScores + warnings

### Frontend
- [ ] Risk meter per semester
- [ ] Warnings display (prereq chain pressure, heavy stack)

---

## Milestone 5 — Regenerate with Controls
### Backend
- [ ] `POST /plans/:id/regenerate` supports:
  - pins/locks
  - objective weight slider
- [ ] Plan versioning in DB

### Frontend
- [ ] Slider: “Fast ↔ Safe”
- [ ] Pin module to semester (basic)
- [ ] Regenerate button

---

## Milestone 6 (Optional MVP2) — RAG Similarity + Scraped Signals
### Ingestion
- [ ] Scraper pipeline (start with 1 source)
- [ ] Cleaning/dedupe + safety filter
- [ ] Embeddings + index

### AI Service
- [ ] Similarity endpoint + collision score endpoint
- [ ] Add collision penalty into objective

### Frontend
- [ ] Collision warnings: “These two modules overlap heavily conceptually”
- [ ] Explainability: show top 2 similar pairs

---

## Definition of Done (MVP1)
- Generates a valid multi-semester plan for CS + DSA
- Stores plans and versions
- Shows workload/risk per semester
- Lets user adjust “fast vs safe” and pin modules
- Uses NUSMods data cache reliably


````
