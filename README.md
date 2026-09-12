# Codyn — Full-Context GitHub Repository Intelligence & Security Platform

<div align="center">

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash_%2F_Thinking-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis_KV-00E599?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![NextAuth v5](https://img.shields.io/badge/Auth.js-NextAuth_v5-purple?style=for-the-badge&logo=auth0&logoColor=white)](https://authjs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-550%2B_Tests_Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)

**Full-context GitHub repository intelligence, interactive architecture exploration, AST code analysis, multi-engine security auditing, and developer profile reasoning — without cloning repositories locally.**

[Explore Codyn](#product-surface) • [How It Works](#step-by-step-process-breakdown) • [Algorithms](#deep-dive-algorithms-and-mathematical-models) • [Features Built](#features-built-everything-we-have-done) • [Testing Suite](#testing-suite--validation) • [Roadmap](#future-scope--roadmap) • [Getting Started](#local-setup--getting-started)

</div>

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [System Architecture](#system-architecture)
- [Step-by-Step Process Breakdown](#step-by-step-process-breakdown)
- [Deep Dive: Algorithms and Mathematical Models](#deep-dive-algorithms-and-mathematical-models)
  - [1. AST Symbol & Declaration Extraction](#1-ast-symbol--declaration-extraction-algorithm)
  - [2. Module Path & Dependency Resolution](#2-module-path--dependency-resolution-algorithm)
  - [3. Circular Dependency Detection via DFS Cycle Traversal](#3-circular-dependency-detection-via-dfs-cycle-traversal)
  - [4. Transitive Change Impact & Blast-Radius BFS Analysis](#4-transitive-change-impact--blast-radius-bfs-analysis)
  - [5. Repository Structural Health & Grade Scoring](#5-repository-structural-health--grade-scoring-algorithm)
  - [6. Star Velocity & Exponential Recency Trending Engine](#6-star-velocity--exponential-recency-trending-engine)
  - [7. Context Selection, Semantic Clustering & Token Budgeting](#7-context-selection-semantic-clustering--token-budgeting)
  - [8. Dual-Gate Security Verification & Calibration](#8-dual-gate-security-verification--calibration-algorithm)
  - [9. Self-Healing Mermaid Diagram Syntax Repair Loop](#9-self-healing-mermaid-diagram-syntax-repair-loop)
  - [10. Cryptographic Token Generation for Report Sharing](#10-cryptographic-token-generation-for-report-sharing)
- [Features Built (Everything We Have Done)](#features-built-everything-we-have-done)
- [Technology Stack](#technology-stack)
- [Testing Suite & Validation](#testing-suite--validation)
- [Future Scope & Roadmap](#future-scope--roadmap)
- [Local Setup & Getting Started](#local-setup--getting-started)
- [Environment Variables](#environment-variables)
- [Attribution & License](#attribution--license)

---

## Executive Summary

**Codyn** is an enterprise-grade repository intelligence and security workspace built for developers, engineering managers, and security auditors. Traditional code analysis tools either require downloading gigabytes of source code to run local static analyzers or provide shallow, context-blind LLM wrappers with high hallucination rates.

Codyn solves this through a **Zero-Clone, AST-Grounded Architecture**:
1. **Zero Local Clones**: Interacts directly with GitHub Git trees and blob storage via Octokit REST and GraphQL APIs.
2. **Deterministic Code Graph**: Parses JavaScript/TypeScript source code into Abstract Syntax Trees (AST) using Babel to extract symbols (functions, classes, interfaces, types) and resolves direct module imports/exports.
3. **Graph-Enriched Grounded AI**: Passes real dependency neighbors, callers, callees, and symbol ranges into Google Gemini (Flash & Thinking models) under strict token budgets.
4. **Multi-Engine Security Auditing**: Combines static pattern matching, AST heuristics, and live npm/OSV vulnerability databases with a dual-gate AI adjudication layer to eliminate false positives.
5. **Verified Remediation**: Validates proposed code fixes against regression suites and targeted rescans before marking vulnerabilities resolved.
6. **Graceful Degradation**: Functions completely in public exploration mode with zero local infrastructure, while scaling dynamically to PostgreSQL and Upstash Redis for persistent authenticated workspaces.

The platform foundation incorporates MIT-licensed RepoMind source, refactored into Next.js 16 App Router, React 19, and Tailwind CSS 4 with Codyn's high-contrast technical visual identity (`#0c0c0c` background, `#00d2ff` accent, and `#1769d2` supporting blue).

---

## System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client Web Interface     │
                                  │   Next.js 16 / React 19 UI    │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │    Next.js App Router / Edge  │
                                  │  Proxy & NextAuth v5 Guards   │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     ┌────────────────────┴─────┐   ┌─────┴─────────────────────┐
                     ▼                          ▼   ▼                           ▼
        ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
        │  Query & Chat Pipeline  │  │  Repository Analysis    │  │  Security Engine V2     │
        │  • Semantic Filter      │  │  • Babel AST Parser     │  │  • AST Vulnerability    │
        │  • Token Budgeting      │  │  • Dependency Resolver  │  │  • OSV / Advisory API   │
        │  • Gemini 2.5 Streaming │  │  • Cycle & Blast Radius │  │  • Dual-Gate AI Verifier│
        └────────────┬────────────┘  └────────────┬────────────┘  └─────────────┬───────────┘
                     │                            │                             │
                     ├────────────────────────────┴─────────────────────────────┤
                     ▼                                                          ▼
        ┌─────────────────────────┐                                ┌─────────────────────────┐
        │   Persistence (Prisma)  │                                │  External Integrations  │
        │  • PostgreSQL (Neon)    │                                │  • GitHub REST/GraphQL  │
        │  • Revisions & Symbols  │                                │  • Google Gemini API    │
        │  • Scans & Share Links  │                                │  • Upstash Redis (KV)   │
        │  • Fix Verifications    │                                │  • Resend Transactional │
        └─────────────────────────┘                                └─────────────────────────┘
```

---

## Step-by-Step Process Breakdown

Here is the exact lifecycle of a repository being analyzed in Codyn:

```
[ User Input ]
      │
      ▼ (Step 1: Input Ingestion & Scope Detection)
[ GitHub API / Octokit ] ──► (Fetch Git Commit SHA & Recursive Tree)
      │
      ▼ (Step 2: Revision Pinning & Cache Verification)
[ Upstash KV / Redis ] ◄──► (Check if Tree SHA is already indexed)
      │
      ├── (If Unindexed) ──► (Step 3: Background Worker Queue)
      │                            │
      │                            ▼
      │                     (Babel AST Parsing: Symbols, Imports, Exports)
      │                            │
      │                            ▼
      │                     (Dependency Graph Construction & Cycle Traversal)
      │                            │
      │                            ▼
      │                     (Persist to PostgreSQL via Prisma ORM)
      │
      ▼ (Step 4: User Action Dispatch)
      ├──► Chat Query        ──► (Token Budgeting ──► Gemini 2.5 ──► Streaming Markdown with Citations)
      ├──► Architecture      ──► (Adjacency List ──► Mermaid.js ──► Self-Healing Error Pipeline)
      ├──► Security Scan     ──► (Static Scan + OSV API ──► Dual-Gate AI Adjudication ──► Signed Report)
      └──► Change Impact     ──► (Invert Dependency Graph ──► BFS Blast Radius ──► Risk Score)
```

### Step 1: Input Ingestion & Identity Resolution
- The user provides a repository (`owner/repo`) or developer profile (`username`) via the URL, search bar, or landing page quick-links.
- The system resolves whether the query targets a GitHub repository or a user profile.
- API authentication guards check for session credentials: anonymous requests proceed under restrictive rate limits; authenticated sessions utilize user-scoped OAuth tokens with granted `repo` scopes for private access.

### Step 2: Revision Pinning & Tree Discovery
- The server retrieves the repository's HEAD commit SHA and recursive Git tree via `@octokit/rest` without cloning files.
- The tree is pinned to an immutable `treeSha`. All subsequent symbols, imports, and intelligence artifacts are permanently keyed to this revision to prevent stale code drifts.

### Step 3: Background Indexing & AST Processing
- An asynchronous job is dispatched via `RepositoryAnalysisJob`.
- The worker loops through all supported files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) and feeds their contents into the Babel parser.
- Symbols (functions, classes, types, interfaces, enums) and imports are extracted, mapped to precise line/column coordinates, and saved into `RepositoryIndexedFile` and `RepositorySymbol` tables.

### Step 4: Dependency Graph Construction & Architecture Rules
- Relative import paths are resolved against real filesystem tree paths.
- A directed dependency graph $G = (V, E)$ is constructed where vertices $V$ are files and directed edges $E$ represent imports.
- Cycle detection algorithms flag recursive imports; layer boundary heuristics check for architectural anti-patterns (e.g., Presentation layer importing Data/Infrastructure directly).

### Step 5: Semantic Context Selection & Token Budgeting
- When a user asks a question, the query is tokenized and classified into semantic domains (`api`, `ui`, `ml`, `config`, `test`, `util`).
- A scored retrieval algorithm ranks relevant files, combining core file priority boosts (`package.json`, `next.config.ts`, `schema.prisma`) with token overlaps.
- A strict token ceiling (`MAX_TOKENS = 12,000`) is enforced using `gpt-tokenizer` before dispatching prompt payloads to the LLM.

### Step 6: Grounded AI Streaming with Provenance Citations
- Prompts are enriched with file contents, symbol tables, and architectural context.
- Gemini 2.5 Flash/Thinking streams the response token-by-token over Server-Sent Events (SSE).
- Every answer contains source provenance: the exact Git revision analyzed and hyperlinked file citations for line-by-line verification.

### Step 7: Architecture Visualization & Self-Healing Diagrams
- The active repository topology is mapped into Mermaid.js format (flowcharts, sequence diagrams, class models).
- The client renders the diagram with pan/zoom controls and theme matching (`#0c0c0c` / `#00d2ff`).
- If Mermaid syntax fails to compile, an automated repair loop (`/api/fix-mermaid`) feeds the syntax error back to Gemini to auto-correct syntax errors in real time.

### Step 8: Multi-Engine Security Auditing & Dual-Gate Triage
- The security scanner executes static AST rule checks (SQL injection, hardcoded secrets, prototype pollution, unsafe deserialization) and queries the npm/OSV vulnerability registry.
- Raw findings undergo a dual-gate adjudication process: AI analyzes surrounding file context to distinguish real threats from test fixtures and intended mock data.
- Findings are triaged into `AUTO_VERIFIED_TRUE`, `AUTO_REJECTED_FALSE`, or `INCONCLUSIVE_HIDDEN`.

### Step 9: Fix Verification & Regression Rescan
- When a fix is submitted, Codyn initiates a `FixVerificationRun`.
- It executes a targeted rescan of the modified files and verifies that regression tests pass.
- If verified clean, the vulnerability lifecycle state moves to `CLOSED` with an audit trail.

### Step 10: Persistence, Dashboard & Signed Sharing
- Scans, chat sessions, and audit histories are written to PostgreSQL via Prisma.
- Shareable reports are generated with cryptographic token hashes (`/report/shared/[token]`) with expiration policies and one-click revocation.

---

## Deep Dive: Algorithms and Mathematical Models

### 1. AST Symbol & Declaration Extraction Algorithm
**Location:** [`src/lib/repository-symbols.ts`](file:///d:/project/aura/src/lib/repository-symbols.ts)

Codyn parses JavaScript and TypeScript source files into a Concrete/Abstract Syntax Tree without executing code, utilizing `@babel/parser` and `@babel/traverse`.

```typescript
function parseRepositorySource(path: string, source: string): ParsedRepositoryFile
```

- **Algorithm:**
  1. Filters path against supported extensions: `/\.(?:[cm]?[jt]sx?)$/i`.
  2. Parses source code using Babel with plugins: `typescript`, `jsx`, `classProperties`, `decorators-legacy`, `dynamicImport`.
  3. Traverses the AST via visitor pattern:
     - `FunctionDeclaration` / `ClassDeclaration` $\to$ Extract identifier name, line/column coordinates, export status.
     - `TSInterfaceDeclaration` / `TSTypeAliasDeclaration` / `TSEnumDeclaration` $\to$ Extract type signatures and export status.
     - `VariableDeclaration` $\to$ Recursively extracts identifiers from destructuring patterns (ObjectPattern, ArrayPattern, RestElement).
     - `ImportDeclaration` $\to$ Extracts module specifiers, imported specifier lists, and whether the import is type-only (`import type`).
  4. Returns `{ symbols, imports, exports, parseError }`.
- **Complexity:** $\mathcal{O}(N)$ where $N$ is the number of AST nodes.

---

### 2. Module Path & Dependency Resolution Algorithm
**Location:** [`src/lib/repository-dependencies.ts`](file:///d:/project/aura/src/lib/repository-dependencies.ts)

Resolves relative imports into canonical repository paths across extension variations.

- **Resolution Rules:**
  Given a source file at path $P_{\text{source}}$ and an import string $S_{\text{import}}$:
  1. Ignore non-relative packages (e.g., `react`, `@prisma/client`).
  2. Compute normalized relative path:
     $$\text{Target} = \text{normalize}(\text{dirname}(P_{\text{source}}) + "/" + S_{\text{import}})$$
  3. Candidate matching with extension fallbacks:
     $$\text{Candidates} = [\text{Target}, \text{Target} + ".ts", \text{Target} + ".tsx", \text{Target} + ".js", \text{Target} + "/index.ts", \dots]$$
  4. Intersect candidates with known Git tree paths to establish the exact edge $(P_{\text{source}} \to P_{\text{target}})$.

---

### 3. Circular Dependency Detection via DFS Cycle Traversal
**Location:** [`src/lib/architecture-rules.ts`](file:///d:/project/aura/src/lib/architecture-rules.ts)

Detects recursive import cycles in the repository module graph using Depth-First Search with recursion-stack state tracking.

```typescript
function cycles(edges: RepositoryDependencyEdge[]): string[][]
```

- **Algorithm:**
  1. Build adjacency list: $\text{Adj}[u] = \{ v \mid (u \to v) \in E \}$.
  2. Maintain two hash sets: `visiting` (current DFS path stack) and `visited` (fully processed subtrees).
  3. For every node $u \in V$:
     $$\text{walk}(u, \text{stack}):$$
     - If $u \in \text{visiting}$: Cycle detected! Extract slice of stack from $u$ to end.
     - If $u \in \text{visited}$: Return (already verified cycle-free).
     - Add $u$ to $\text{visiting}$; append $u$ to $\text{stack}$.
     - For each neighbor $v \in \text{Adj}[u]$: recurse $\text{walk}(v, \text{stack})$.
     - Remove $u$ from $\text{visiting}$; add $u$ to $\text{visited}$.
- **Complexity:** $\mathcal{O}(|V| + |E|)$ time, $\mathcal{O}(|V|)$ space.

---

### 4. Transitive Change Impact & Blast-Radius BFS Analysis
**Location:** [`src/lib/change-impact.ts`](file:///d:/project/aura/src/lib/change-impact.ts)

When a developer changes a file, Codyn computes the upstream blast radius: which files, services, and tests are affected directly and transitively.

- **Mathematical Model:**
  Given directed dependency graph $G = (V, E)$, construct reverse dependency graph $G^R = (V, E^R)$ where:
  $$E^R = \{ (v, u) \mid (u \to v) \in E \}$$
  Perform Breadth-First Search (BFS) from the modified node $x$:
  $$\text{Frontier}_0 = \{ x \}, \quad \text{Visited} = \{ x \}$$
  $$\text{Frontier}_{k+1} = \bigcup_{u \in \text{Frontier}_k} \{ v \mid (u, v) \in E^R \} \setminus \text{Visited}$$
  $$\text{TransitiveDependents}(x) = \text{Visited} \setminus \{ x \}$$
- **Risk Score Formulation:**
  $$\text{Risk Level} = \begin{cases} 
  \text{"high"}, & \text{if } |\text{TransitiveDependents}(x)| \ge 10 \\ 
  \text{"medium"}, & \text{if } 3 \le |\text{TransitiveDependents}(x)| < 10 \\ 
  \text{"low"}, & \text{if } |\text{TransitiveDependents}(x)| < 3 
  \end{cases}$$

---

### 5. Repository Structural Health & Grade Scoring Algorithm
**Location:** [`src/lib/repository-health.ts`](file:///d:/project/aura/src/lib/repository-health.ts)

Evaluates the architectural integrity and maintainability of a repository based on structural metrics.

- **Formula:**
  Let:
  - $N_{\text{src}} = \text{count of source code files}$
  - $N_{\text{test}} = \text{count of test files}$
  - $N_{\text{doc}} = \text{count of documentation files}$
  - $C = \text{count of circular dependency cycles}$
  - $R_{\text{test}} = \frac{N_{\text{test}}}{N_{\text{src}}}$ (if $N_{\text{src}} > 0$, else $0$)

  $$\text{Base Score} = 60$$
  $$\Delta_{\text{doc}} = \begin{cases} +15, & N_{\text{doc}} > 0 \\ 0, & N_{\text{doc}} = 0 \end{cases}$$
  $$\Delta_{\text{test}} = \begin{cases} 
  +20, & R_{\text{test}} \ge 0.25 \\ 
  +10, & 0.10 \le R_{\text{test}} < 0.25 \\ 
  +5, & N_{\text{test}} > 0 \text{ and } R_{\text{test}} < 0.10 \\ 
  0, & N_{\text{test}} = 0 
  \end{cases}$$
  $$\Delta_{\text{cycle}} = -\min(25, C \times 10)$$
  $$\text{Score} = \text{clamp}(60 + \Delta_{\text{doc}} + \Delta_{\text{test}} + \Delta_{\text{cycle}}, 0, 100)$$

- **Grade Mapping:**
  $$\text{Grade} = \begin{cases} 
  \text{"A"}, & \text{Score} \ge 90 \\ 
  \text{"B"}, & 75 \le \text{Score} < 90 \\ 
  \text{"C"}, & 60 \le \text{Score} < 75 \\ 
  \text{"D"}, & 40 \le \text{Score} < 60 \\ 
  \text{"E"}, & \text{Score} < 40 
  \end{cases}$$

---

### 6. Star Velocity & Exponential Recency Trending Engine
**Location:** [`scripts/fetch-trending-repos.mjs`](file:///d:/project/aura/scripts/fetch-trending-repos.mjs) & [`scripts/test-trending-algorithm.mjs`](file:///d:/project/aura/scripts/test-trending-algorithm.mjs)

Identifies rapidly growing repositories using a multi-factor trending algorithm that rewards recent star velocity and penalizes dormant repositories.

- **Formulation:**
  $$\Delta t_{\text{creation}} = \max\left(1, \frac{t_{\text{now}} - t_{\text{created}}}{86,400,000}\right) \quad [\text{days}]$$
  $$\Delta t_{\text{push}} = \max\left(0.1, \frac{t_{\text{now}} - t_{\text{pushed}}}{86,400,000}\right) \quad [\text{days}]$$

  1. **Star Velocity:**
     $$V_{\text{star}} = \frac{\text{stargazers\_count}}{\Delta t_{\text{creation}}}$$
  2. **Push Recency Decay (Exponential Half-Life):**
     $$R_{\text{push}} = \exp\left(-\frac{\Delta t_{\text{push}}}{T_{\text{tier}}}\right) \quad \text{where } T_{\text{tier}} \in \{7, 30\}$$
  3. **Estimated Recent Stars:**
     $$S_{\text{recent}} = V_{\text{star}} \times R_{\text{push}} \times T_{\text{tier}}$$
  4. **Logarithmic Compression:**
     $$\tilde{V} = \log_{10}(V_{\text{star}} + 1), \quad \tilde{S} = \log_{10}(S_{\text{recent}} + 1)$$
  5. **Weighted Composite Score:**
     $$\text{TrendingScore} = (w_{\text{vel}} \cdot \tilde{V}) + (w_{\text{rec}} \cdot \tilde{S}) + (w_{\text{push}} \cdot R_{\text{push}} \cdot 10)$$

  *Default Weights (Weekly Tier):* $w_{\text{vel}} = 0.6$, $w_{\text{rec}} = 0.3$, $w_{\text{push}} = 0.1$.

---

### 7. Context Selection, Semantic Clustering & Token Budgeting
**Location:** [`src/lib/services/repo-index-service.ts`](file:///d:/project/aura/src/lib/services/repo-index-service.ts) & [`src/lib/tokens.ts`](file:///d:/project/aura/src/lib/tokens.ts)

Prevents context window exhaustion while maximizing prompt relevance:
1. **Query Tokenization:** Normalizes camelCase, snake_case, and punctuation into lowercase token sets.
2. **Semantic Domain Classification:** Matches queries against regex clusters:
   - `api`: `/api|endpoint|route|handler|request/i`
   - `ui`: `/component|ui|page|view|layout/i`
   - `ml`: `/gemini|openai|llm|model|ai/i`
   - `config`: `/config|environment|setup|env/i`
3. **Core File Boosting:** Root configurations (`package.json`, `tsconfig.json`, `schema.prisma`) receive baseline priority scores ($+3$ to $+1$).
4. **Semantic Boost Multiplier:** Files matching the detected query domain receive a $1.5\times$ score boost.
5. **Token Pruning:** Exact token counts are computed using `gpt-tokenizer`. File contents are loaded sequentially by descending relevance score until the token budget ($12,000$ tokens) is reached; lower-ranked files are excluded.

---

### 8. Dual-Gate Security Verification & Calibration Algorithm
**Location:** [`src/lib/services/security-verification.ts`](file:///d:/project/aura/src/lib/services/security-verification.ts)

Eliminates the standard $40\%\text{--}60\%$ false-positive rate common to naive security scanners.

- **Gate 1 (Static + Vulnerability Database):**
  Matches AST patterns against common vulnerability signatures (CWE-89 SQLi, CWE-79 XSS, CWE-94 Code Injection) and queries OSV/npm for known CVEs.
- **Gate 2 (AI-Assisted Contextual Adjudication):**
  Extracts 15 lines of surrounding code and imports, asking Gemini:
  - Is this file part of a test fixture, mock, or sample?
  - Is user-controlled input reachable without sanitization?
  - Does the finding represent intended system design?
- **Decision Matrix:**
  $$\text{GateDecision} = \begin{cases} 
  \text{INCLUDE} \ (\text{AUTO\_VERIFIED\_TRUE}), & \text{if Score} \ge 0.70 \text{ and not fixture} \\ 
  \text{EXCLUDE} \ (\text{AUTO\_REJECTED\_FALSE}), & \text{if confidence} < 0.35 \text{ or confirmed mock} \\ 
  \text{EXCLUDE} \ (\text{INCONCLUSIVE\_HIDDEN}), & \text{if confidence intermediate} 
  \end{cases}$$

---

### 9. Self-Healing Mermaid Diagram Syntax Repair Loop
**Location:** [`src/lib/mermaid-router.ts`](file:///d:/project/aura/src/lib/mermaid-router.ts) & [`src/app/api/fix-mermaid/route.ts`](file:///d:/project/aura/src/app/api/fix-mermaid/route.ts)

Mermaid.js frequently breaks when models generate special characters or illegal arrow syntax. Codyn embeds an automated recovery loop:
1. Client attempts `mermaid.render(id, code)`.
2. Upon syntax error exception, client posts `{ code, error: error.message }` to `/api/fix-mermaid`.
3. Gemini processes the syntax error with instructions to strip illegal characters, quote node names containing parentheses, and enforce valid edge syntax (`-->`, `-.->`, `==>`).
4. Repaired code is re-rendered client-side without user intervention.

---

### 10. Cryptographic Token Generation for Report Sharing
**Location:** [`src/lib/services/scan-share-links.ts`](file:///d:/project/aura/src/lib/services/scan-share-links.ts)

Generates tamper-proof, public share links without exposing internal scan database identifiers.
1. Generate 32 bytes of cryptographically secure randomness via `crypto.randomBytes(32).toString('hex')`.
2. Compute SHA-256 digest:
   $$\text{TokenHash} = \text{SHA-256}(\text{rawToken})$$
3. Store $\text{TokenHash}$, $\text{scanId}$, and $\text{expiresAt}$ in `RepoScanShareLink`.
4. The client receives the raw token in the share URL `/report/shared/[token]`. Database lookup matches on the SHA-256 hash. Even a full database leak cannot compromise shared access tokens.

---

## Features Built (Everything We Have Done)

### 1. Workspace & Source Code Exploration
- **Zero-Clone File Explorer:** Pinned Git tree explorer with directory collapse, search filter, and file size annotations.
- **Syntax Highlighting & Line Counter:** React Syntax Highlighter with Tokyo Night/GitHub Dark theme, line numbers, and token count calculations.
- **Revision Selector:** Pinned to immutable commit SHA to ensure all views match identical code.

### 2. Grounded AI Chat & Provenance Citations
- **Repository-Aware Chat Interface:** Ask complex questions about architecture, algorithms, and workflows.
- **Transparent Citations:** Direct file and symbol links accompany every LLM answer.
- **Multi-Turn Chat Resumption:** Persisted conversation runs in PostgreSQL with client-side export to JSON/Markdown.
- **Model Preference Selector:** Dynamically switch between Gemini Flash, Pro, and High-Thinking models.
- **Developer Profile Intelligence:** Query `/chat?q=username` to analyze GitHub user portfolios, top languages, recent commits, and contribution velocity.

### 3. Architecture & Dependency Intelligence
- **Interactive Module Dependency Graph:** Visualizes local imports and package dependencies with selectable nodes and pan/zoom controls.
- **Reverse Dependency Explorer:** Drill down into any file to see immediate importers and 2-hop transitive callers.
- **Circular Dependency Detection:** Alerts developers to dangerous recursive imports with step-by-step cycle paths.
- **Architecture Boundary Auditing:** Automatically flags illegal imports between Presentation, API, Domain, and Data layers.
- **AST-Based Symbol Search:** Search across all functions, classes, interfaces, types, and variables without running local IDEs.
- **Tech Stack Auto-Detection:** Discovers frameworks (Next.js, React, Express), databases (Prisma, Postgres, Redis), infrastructure (Docker, Terraform), and library versions.
- **Structural Health Report:** Evaluates repositories with an A–E letter grade based on test ratio, documentation, and cycle metrics.

### 4. Security & Verification Engine
- **Full-Scan Vulnerability Engine:** Scans files against CWE security rules and queries live OSV vulnerability feeds.
- **Dual-Gate False-Positive Eliminator:** AI-driven triage categorizes findings into verified issues vs. benign test fixtures.
- **Fix Verification Pipeline (`FixVerificationRun`):** Re-scans changed files and verifies regression test suites before signing off on fixes.
- **Signed Security Reports:** Cryptographically secure sharing links with expiration controls.
- **False-Positive Review Workflow:** Community reporting and administrative moderation screens for contested findings.

### 5. Platform, UI & Ecosystem
- **Modern Technical Dark Theme:** Precision palette (`#0c0c0c` surface, `#00d2ff` accent, `#1769d2` blue).
- **User Dashboard:** Dedicated screens for scan histories, saved repositories, starred items, and personal settings.
- **NextAuth v5 Authentication:** GitHub OAuth integration with session persistence in PostgreSQL.
- **Trending Repositories Discovery:** Curated trending lists filtered by star velocity and commit recency.
- **Transactional Email Service:** Resend integration for welcome emails and scan delivery with failed-job webhook retry mechanisms.
- **Admin Intelligence & Analytics:** Protected admin dashboard tracking query counts, token usage, indexing jobs, and blog management.
- **Graceful Degradation:** The entire application runs out-of-the-box in local development with zero external databases or Redis configured.

---

## Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | [Next.js 16.3.4](https://nextjs.org/) (App Router), [React 19.2.0](https://react.dev/) | Server Components, Streaming SSR, API Route Handlers |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | End-to-end static typing, strict type checks |
| **Styling & Icons** | [Tailwind CSS 4.1](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) | Technical dark aesthetic, responsive design system |
| **Motion & Visuals** | [Framer Motion 12](https://motion.dev/), [Mermaid.js 11](https://mermaid.js.org/) | Smooth UI transitions, interactive architecture diagrams |
| **AST & Code Analysis** | [@babel/parser](https://babeljs.io/), [@babel/traverse](https://babeljs.io/) | JavaScript/TypeScript AST symbol and import extraction |
| **AI & LLM Engine** | [@google/genai 1.4](https://www.npmjs.com/package/@google/genai), [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) | Gemini 2.5 Flash, Pro, Thinking models for chat and triage |
| **Tokenization** | [gpt-tokenizer 3.4](https://www.npmjs.com/package/gpt-tokenizer) | Real-time token budget calculation and context truncation |
| **Database & ORM** | [Prisma 6.19](https://www.prisma.io/), [PostgreSQL / Neon](https://neon.tech/) | Relational storage for users, revisions, symbols, scans |
| **Caching & KV** | [Upstash Redis](https://upstash.com/), [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Distributed index caching, tree cache, artifact storage |
| **Authentication** | [NextAuth v5](https://authjs.dev/) (@auth/prisma-adapter) | GitHub OAuth authentication, session management |
| **GitHub APIs** | [Octokit 5.0](https://github.com/octokit), [@octokit/graphql](https://github.com/octokit/graphql.js) | Git trees, commit SHAs, file blobs, user profiles |
| **Email Service** | [Resend 6.9](https://resend.com/), [@react-email/components](https://react.email/) | Transactional emails with React templates |
| **Testing & Quality** | [Vitest 4.0](https://vitest.dev/), [ESLint 9](https://eslint.org/) | Comprehensive unit, integration, and security test suites |

---

## Testing Suite & Validation

Codyn maintains an exhaustive test suite covering all services, algorithms, and UI flows.

```bash
# Run the full test suite (92 test files, 550+ tests)
npm test

# Run repository intelligence tests (AST, dependencies, cycle detection, health, blast radius)
npm run test:repository-intelligence

# Run security scanner and dual-gate AI verification tests
npm run test:security

# Run TypeScript production typecheck
npm run typecheck

# Run ESLint baseline validation
npm run lint

# Validate local environment setup and configuration
npm run setup:local -- --check
```

### Test Suite Breakdown

| Test Area | Key Test Files | Coverage / Verified Behaviors |
|---|---|---|
| **AST & Symbols** | `repository-symbols.test.ts` | Symbol extraction, function/class/type declarations, location accuracy |
| **Dependencies & Cycles** | `repository-dependencies.test.ts`, `architecture-rules.test.ts` | Relative path resolution, DFS cycle detection, layer violation rules |
| **Change Impact & Blast Radius** | `change-impact.test.ts` | Transitive importer BFS traversal, affected file counts, risk assessment |
| **Test Intelligence** | `test-intelligence.test.ts` | Naming convention heuristics, test co-location matching, gap signaling |
| **Architecture Graph** | `architecture-graph.test.ts` | Graph node/edge truncation, bounding, client serialization |
| **Tech Stack & Health** | `tech-stack.test.ts`, `repository-health.test.ts` | Manifest detection (Docker, Terraform, Prisma), A–E scoring formula |
| **Security Scanning** | `security-scanner.test.ts`, `security-benchmark.test.ts` | CWE static patterns, OSV dependency lookup, benchmark corpus |
| **Dual-Gate Verification** | `security-verification.test.ts`, `gemini-security.test.ts` | AI adjudication, threshold tuning, false-positive elimination |
| **Fix Verification** | `fix-verification.test.ts` | Targeted rescans, regression suites, automated sign-offs |
| **Query & Streaming** | `query-pipeline.test.ts`, `gemini.test.ts` | Token budgeting, semantic boosts, SSE chunk streaming |
| **Sharing & Security** | `scan-share-links.test.ts`, `report-access.test.ts` | SHA-256 token hashing, expiration checks, revocation |
| **Local Setup & Hygiene** | `setup-local.test.mjs`, `eslint-baseline.mjs` | Key preservation, AUTH_SECRET generation, rule enforcement |

---

## Future Scope & Roadmap

Based on the [Product Roadmap (`docs/PRODUCT_TODO.md`)](./docs/PRODUCT_TODO.md), here are the planned milestone expansions:

### Milestone 1: Multi-Language AST Support
- [ ] Expand the AST parser beyond JavaScript/TypeScript to support **Python** (`ast`/tree-sitter), **Go**, **Rust**, **Java**, and **C#**.
- [ ] Language-specific manifest parsers (`pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`).

### Milestone 2: Cross-File Call-Graph & Symbol-Reference Resolution
- [ ] Build global reference tables linking function calls directly to their declarations across files.
- [ ] Interactive execution flow diagrams showing API endpoint $\to$ Middleware $\to$ Controller $\to$ Database query.

### Milestone 3: Continuous Pull Request & GitHub Check Bot
- [ ] Implement a GitHub App with webhooks on `pull_request.opened` and `pull_request.synchronize`.
- [ ] Post automated PR reviews detailing:
  - Architecture and layer boundary violations introduced in the PR.
  - Calculated change-impact blast radius and affected critical paths.
  - Missing unit tests for newly introduced functions.
  - Newly introduced dependency CVEs.

### Milestone 4: Continuous Indexing & Cache Streaming
- [ ] Incremental delta indexing: on new commits, re-index only the files modified in that commit SHA.
- [ ] Webhook-driven invalidation of Upstash Redis caches.

### Milestone 5: IDE Integrations (VS Code & JetBrains)
- [ ] Launch Codyn VS Code and JetBrains extensions to surface blast radius and architecture rules directly within developer editors.
- [ ] Inline code lens showing callers, tests, and security status.

### Milestone 6: Enterprise Collaboration & Workspaces
- [ ] Team workspaces with Role-Based Access Control (RBAC) and Single Sign-On (SAML / Okta).
- [ ] Private repository audit logs and compliance export reports (SOC 2, ISO 27001).

### Milestone 7: Self-Hosted & Air-Gapped Deployments
- [ ] Standalone Docker Compose and Helm charts for on-premises deployment.
- [ ] Support for local LLM runtimes (Ollama, vLLM, DeepSeek-R1) in air-gapped environments.

---

## Local Setup & Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Git**

### 1. Clone & Install
```bash
git clone https://github.com/your-username/codyn.git
cd codyn
npm install
```

### 2. Run Local Setup Assistant
Codyn includes an automated setup assistant that preserves existing environment files and generates a cryptographically secure `AUTH_SECRET`:
```bash
npm run setup:local
```
To verify configured credentials without exposing secrets:
```bash
npm run setup:local -- --check
```

### 3. Generate Database Client
Codyn uses a CLI fallback URL so you can generate the Prisma client even without a running database:
```bash
npm run prisma:generate
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file (or let `npm run setup:local` create one for you). Integrations can be enabled incrementally:

```env
# ==========================================
# 1. CORE AI (Required for Chat & Triaging)
# ==========================================
GEMINI_API_KEY=AIzaSy...
GEMINI_FILE_SELECTOR_MODEL=gemini-2.5-flash
GEMINI_LITE_MODEL=gemini-2.5-flash
GEMINI_THINKING_MODEL=gemini-2.5-flash

# ==========================================
# 2. GITHUB INTEGRATION
# ==========================================
# Raises rate limits from 60 to 5,000 req/hr
GITHUB_TOKEN=ghp_...

# Enables GitHub Sign-In via NextAuth v5
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_SECRET=...                  # Auto-generated by setup:local
AUTH_TRUST_HOST=true

# ==========================================
# 3. DATABASE (PostgreSQL / Neon)
# ==========================================
# Enables persistent history, scans, users, share links
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host/dbname?sslmode=require

# ==========================================
# 4. DISTRIBUTED CACHE & ARTIFACTS (Optional)
# ==========================================
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# ==========================================
# 5. TRANSACTIONAL EMAIL (Optional)
# ==========================================
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Codyn <security@codyn.dev>
RESEND_WEBHOOK_SECRET=whsec_...

# ==========================================
# 6. APP OPERATIONS
# ==========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_GITHUB_USERNAME=your-username
CRON_SECRET=...
```

### Graceful Degradation Modes
- **Zero Credentials:** The landing page, public exploration, bundled blogs, and UI components function immediately.
- **`GEMINI_API_KEY` Only:** Enables real-time AI repository and profile chat, architecture diagrams, and quick security scans (in-memory mode).
- **`DATABASE_URL` Connected:** Enables user accounts, saved scan histories, report sharing links, and false-positive submissions.
- **`UPSTASH_REDIS` Connected:** Enables cross-session index caching, quota tracking, and compressed tree caches.

---

## Product Surface

| Route | Functionality |
|---|---|
| `/` | Marketing landing page with instant repository analysis input |
| `/chat` | Application start screen and repository search |
| `/chat?q=owner/repo` | Full-context repository intelligence, AST file browser, and grounded chat |
| `/chat?q=username` | GitHub developer profile intelligence, language breakdown, contribution velocity |
| `/repo/[owner]/[repo]` | Deep repository metadata, dependencies, and health overview |
| `/security-scanner` | Zero-clone repository security scanner with dual-gate AI triage |
| `/report/[scan_id]` | Comprehensive vulnerability audit report with CWE details and fix guides |
| `/report/shared/[token]` | Cryptographically signed, publicly viewable security report |
| `/dashboard` | User dashboard: overview, scan records, starred repositories, settings |
| `/dashboard/scans` | Historical repository scans with status filters |
| `/explore` & `/trending` | Discover repositories ranked by star velocity and recency |
| `/topics/[topic]` | Topic-filtered repository discovery pages |
| `/blog` | Technical articles and engineering deep dives |
| `/admin/*` | Protected admin metrics, background indexing queues, and blog manager |

---

## Attribution & License

- **License:** Distributed under the [MIT License](./LICENSE).
- **Attribution:** The application incorporates foundation concepts and source from the MIT-licensed RepoMind project. All upstream copyrights, notices, and permissions are preserved in [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
- **Visual Identity:** Adapted to Codyn's high-contrast technical brand (`#0c0c0c` dark canvas, `#00d2ff` cyber cyan, `#1769d2` deep blue).

---

<div align="center">
  <sub>Built with precision for developers who demand full context.</sub>
</div>
