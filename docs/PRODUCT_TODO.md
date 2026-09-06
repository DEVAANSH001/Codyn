# Codyn product build backlog

This backlog is based on the V0–V3 product brief and the implementation present on 2026-09-06. It deliberately separates work that is already available from the missing foundations needed to make Codyn reliable at scale.

## Already implemented

- [x] Analyze public GitHub repositories without cloning them locally.
- [x] Browse repository files and preview source code.
- [x] Ask repository questions with streaming AI responses and full-file context selection.
- [x] Generate Mermaid architecture, flow, and sequence diagrams from repository context.
- [x] Search repository files with text, regular-expression, and limited JavaScript/TypeScript AST search.
- [x] Run security triage with source-pattern checks, limited AST checks, and npm/OSV advisory lookup.
- [x] Provide dashboard, authentication, scans, report export/sharing, and administrative screens when the required services are configured.
- [x] Fetch selected GitHub activity data, including commits, contributors, issues, pull requests, releases, and workflow runs.

## Milestone 1 — make repository analysis trustworthy

These are the highest-priority prerequisites. They replace heuristic/context-limited analysis with a durable repository knowledge model.

- [~] Define a versioned repository knowledge-model schema: repository revision, files, symbols, imports/exports, references, tests, and findings. Repository revisions, jobs, indexed files, symbols, and dependency edges are now persisted; references, tests, and findings follow in later slices.
- [~] Build a background repository-analysis job pipeline with durable job state, progress events, cancellation, retry, and resumability. A protected scheduler endpoint now claims and processes one persistent job at a time with terminal failure/cancellation states; progress events, retry policy, and resume support remain.
- [ ] Add incremental indexing keyed to repository commit/tree SHA, so unchanged files are not processed again.
- [~] Parse and store JavaScript/TypeScript symbols: functions, classes, interfaces, variables, imports, exports, and source ranges. A test-backed parser now extracts these facts; persistence is part of the worker/artifact slice.
- [~] Build import/dependency edges between files and resolve local-module paths. JS/TS relative imports now resolve deterministically into test-backed graph edges and can be persisted; the worker and explorer integration are next.
- [ ] Build initial symbol-reference and call-graph edges where they can be resolved with confidence.
- [~] Persist index artifacts and metadata instead of depending only on short-lived cache entries. The artifact writer durably replaces indexed files, symbols, and dependency facts per revision; it will be invoked by the queued worker next.
- [ ] Expose honest indexing progress: files discovered, parsed, skipped, failed, and completed.
- [ ] Add indexed-repository query retrieval that selects source evidence, dependency neighbors, and symbols—not only path/token matches.
- [ ] Add provenance to all AI answers: revision analyzed, files/symbols used, and any coverage limits.

## Milestone 2 — repository navigation and architecture intelligence

- [ ] Replace the current structural architecture tab with an interactive dependency graph backed by the stored model.
- [ ] Support graph drill-down: select a file/module and show upstream, downstream, and transitive dependencies.
- [ ] Add request/data-flow views when an entry point and relevant route/handler path can be inferred.
- [ ] Add callers, callees, importers, exports, related files, and related tests to the code explorer.
- [ ] Support repository-wide symbol search beyond the current JS/TS AST search.
- [ ] Detect the technology stack from manifests, source usage, infrastructure files, databases, and dependency versions.
- [ ] Produce a code-grounded 10-minute repository tour: purpose, start commands, entry points, important modules, and interactions.
- [ ] Produce a repository health report covering architecture, dependency health, tests, documentation, complexity, and maintainability—with methodology and confidence levels.

## Milestone 3 — secure, scalable repository access

- [ ] Implement private-repository access using the signed-in user’s GitHub authorization, with explicit scopes and access checks.
- [ ] Add GitHub App or OAuth token lifecycle handling appropriate for private repository analysis.
- [ ] Establish production infrastructure for PostgreSQL, Redis/queue processing, artifact/blob storage, and observability.
- [ ] Add repository/file-content cache invalidation, retention, quotas, and cleanup policies.
- [ ] Add support for more languages, beginning with Python, Go, Java, and Ruby.
- [ ] Define large-repository policies: tree/file-size limits, prioritization, partial-result signaling, and background completion.

## Milestone 4 — security and dependency intelligence

- [ ] Expand dependency vulnerability coverage beyond exact npm lockfile versions and include ecosystem-aware lockfile parsing.
- [ ] Add dependency version drift, deprecated package/API, and compatibility-risk detection.
- [ ] Map security findings to reachable modules, dependency paths, owners, and likely impact.
- [ ] Add severity normalization and confidence scoring; retain clear false-positive and coverage reporting.
- [ ] Add verified remediation workflow: proposed fix, evidence, re-scan, and report comparison.
- [ ] Add scheduled security/dependency re-analysis after the continuous-indexing foundation exists.

## Milestone 5 — Git, ownership, and documentation intelligence

- [ ] Add file-level Git blame and commit-to-symbol/file history views.
- [ ] Implement “Why does this code exist?” by joining current code, blame, commits, and pull-request context.
- [ ] Add architecture time-machine comparisons between revisions and time ranges.
- [ ] Map contributors to files/modules and calculate ownership concentration and bus-factor risks.
- [ ] Build contribution onboarding: issue recommendations, relevant code, expected skills, complexity, and starter roadmap.
- [ ] Generate architecture, module, API, onboarding, and contribution documentation from indexed code with citations.

## Milestone 6 — change safely (V2)

- [ ] Implement change-impact analysis for a file, symbol, diff, or natural-language change request.
- [ ] Traverse direct and transitive dependency/call-graph impact; identify APIs, services, workers, data operations, and tests.
- [ ] Calculate change-risk scores with transparent contributing factors.
- [ ] Add pull-request analysis: architecture changes, dependency/API changes, likely regressions, missing tests, and PR risk score.
- [ ] Define architecture rules and detect layer violations, circular dependencies, boundary violations, and unexpected coupling.
- [ ] Add test intelligence: map code to tests, identify untested critical paths, and recommend regression scenarios.
- [ ] Add debugging intelligence for pasted errors/stack traces, including likely paths, relevant symbols, and recent-change correlation.

## Milestone 7 — continuous intelligence (V3)

- [ ] Subscribe to repository changes and incrementally re-index changed files.
- [ ] Track and alert on architecture, dependency, security, ownership, and PR-risk changes.
- [ ] Maintain historical repository-model snapshots for evolution views.
- [ ] Add continuous dependency/security monitoring.
- [ ] Add runtime/production-signal correlation only after repository intelligence is reliable and access/privacy boundaries are defined.
- [ ] Define specialized analysis agents only after their inputs, outputs, permissions, and evaluation criteria are specified.

## Cross-cutting quality and release work

- [ ] Add end-to-end tests for public repository analysis, indexing jobs, private-access controls, reports, and failure recovery.
- [ ] Establish benchmark repositories and evaluation metrics for retrieval quality, graph accuracy, tour accuracy, and security precision/recall.
- [ ] Add rate limiting, abuse prevention, audit logging, telemetry, error monitoring, and cost controls for GitHub/AI requests.
- [ ] Publish data retention, privacy, and repository-content handling policies before expanding private repository support.
- [ ] Ensure mobile responsiveness and progressive graph rendering for large repositories.

## Recommended first implementation slice

Build the smallest end-to-end foundation before adding more UI features:

1. Versioned repository index record and background job state.
2. JavaScript/TypeScript AST symbol and import extraction.
3. Persisted file dependency graph for one repository revision.
4. Index-progress API and UI using the real job state.
5. “Dependencies” panel in the file explorer that reads from that graph.
6. Tests using a small fixture repository, followed by one real public-repository smoke test.

This slice unlocks accurate architecture exploration, stronger contextual chat, change impact, test mapping, and PR intelligence without rebuilding the platform separately for each feature.
