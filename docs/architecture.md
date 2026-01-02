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
