# COORDINATION.md — Inter-Specialist Coordination Rules

## Preamble

All specialist coordination flows through Governor. Specialists do not self-coordinate, assign work to each other, or negotiate scope changes directly. If a coordination issue arises that isn't covered here, escalate to Governor.

This file is the single authoritative source for inter-specialist coordination rules. Each specialist's AGENT.md defines their own domain authority; this file defines how domains interact.

---

## Architect ↔ Product

- Product defines what the system does (features, flows, requirements); Architect defines how it does it (services, data model, APIs)
- Architect ensures the system can deliver what Product specifies; if infeasible, Architect escalates immediately
- Architect consults Product on tech stack choices that affect user experience (latency, offline capability, real-time data)
- Product consults Architect on whether requirements are technically achievable before finalizing spec
- Product and Architect collaborate on features with architectural implications (scale, real-time, offline)

## Architect ↔ Backend

- Architect defines service boundaries, APIs, and data model; Backend implements within those boundaries
- Backend must follow Architect's data model and API contracts exactly
- If Backend discovers the architecture won't work in practice, Backend escalates immediately — no workarounds
- Architect reviews Backend's schema and API designs for alignment with system design

## Architect ↔ Frontend

- Architect defines what data Frontend receives and in what format (API contracts)
- Frontend must respect API contracts — no requesting fields outside the spec, no undocumented assumptions
- If Frontend needs data not in the API, the request goes through Governor as a spec change
- Frontend and Architect collaborate on app-state management strategy

## Architect ↔ Design

- Design produces UX flows that must be technically feasible within the architecture
- Architect ensures the system can deliver responsive, fast experiences Design requires
- If Design needs capabilities with architectural cost (real-time data, geolocation, offline), Architect plans for it and surfaces tradeoffs
- Architect consults Design on tech choices that affect UI performance or capabilities

## Architect ↔ DevOps

- Architect defines service count, dependencies, and failure modes; DevOps uses that to build deployment, monitoring, and failover
- Architect and DevOps collaborate on scaling strategy (traffic routing, bottleneck identification)
- If DevOps finds the architecture operationally fragile, they rework together and escalate if needed
- DevOps specifies operational constraints that may influence architecture (e.g., scaling ceilings)

## Architect ↔ Security

- Architect defines security boundaries (data flows, encryption requirements, auth boundaries)
- Security implements authentication, authorization, and secrets handling within those boundaries
- Architect and Security collaborate on threat model (what can a compromised service do? Is that acceptable?)
- If Security finds architectural gaps, they escalate together to Governor

## Architect ↔ QA

- Architect defines what is testable and at what granularity (service isolation, integration points)
- QA defines test strategy based on architectural testability
- Architect ensures the design enables independent testing of each service
- If QA needs hooks for testing, Architect incorporates them into the design

## Architect ↔ Docs

- Architect produces the system design document; Docs makes it accessible and maintainable
- Architect owns the "why" (design rationale); Docs owns the "how to explain it"
- Docs surfaces where architecture is unclear — a signal that the design itself may need refinement

## Architect ↔ Analytics

- Architect defines where measurements can be taken and what data is available
- Analytics instruments based on available measurement points
- Architect ensures the system produces the data Analytics needs for decision-making

## Product ↔ Backend

- Product specifies what features to build and acceptance criteria; Backend implements the APIs and logic
- Backend raises concerns if a feature is hard to implement (but attempts unless truly infeasible)
- If Product's spec is unclear, Backend asks for clarification — no guessing
- Product reviews Backend's APIs for alignment with intended user flows

## Product ↔ Frontend

- Product specifies user flows and interactions; Frontend implements them in the UI
- Frontend must follow Product's spec; if Frontend sees a better way, it escalates rather than deviating
- Product reviews Frontend implementation for alignment with intended user experience
- If Frontend needs different behavior than specified, that's a spec change requiring Governor involvement

## Product ↔ Design

- Product defines what the product does (flows, features); Design makes those flows beautiful and usable
- Product and Design collaborate on interaction patterns (error handling, feedback, edge cases)
- Design challenges Product if flows are confusing or incoherent — a signal the spec may need revision
- If Design proposes a flow that changes product capabilities, that requires Product approval

## Product ↔ QA

- Product defines acceptance criteria; QA writes test cases from those criteria
- QA surfaces where Product's spec is ambiguous — a signal the spec needs clarity
- QA asks "what should happen if X?" — if Product hasn't defined it, Product must
- Product and QA collaborate to clarify acceptance criteria until they're unambiguous and testable

## Product ↔ DevOps

- Product defines expected scale and usage patterns; DevOps builds infrastructure for those patterns
- Product and DevOps collaborate on feature launch readiness (is the system ready for the load?)

## Product ↔ Security

- Product defines what data the product handles; Security defines how that data is protected
- Product and Security collaborate on privacy/compliance features (e.g., user data deletion, consent)
- Security raises concerns if the user model is too permissive

## Product ↔ Docs

- Product defines what the product is; Docs writes documentation explaining it to users
- Product reviews Docs for accuracy and accessibility
- Docs surfaces where the product is confusing — a signal the product design may need clarity

## Product ↔ Analytics

- Product defines what success looks like; Analytics instruments to measure it
- Product and Analytics collaborate on the measurement plan (events, dimensions, metrics)

## Product ↔ GTM

- Product defines features and capabilities; GTM positions and markets them
- GTM raises concerns if a feature is hard to position or understand
- Product and GTM collaborate on feature launch sequencing
- GTM helps Product understand market demand and competitive positioning

## Backend ↔ Frontend

- Backend provides APIs with documented contracts (request/response shapes, error codes); Frontend consumes them
- Frontend must respect the API contract exactly — no requesting fields Backend doesn't provide
- If Frontend needs different data, that's a spec change routed through Governor
- Backend and Frontend collaborate on error handling (what should the UI show when the API fails?)
- Backend reviews Frontend's API usage to ensure it respects contracts

## Backend ↔ Design

- Design specifies what users interact with; Backend builds the logic to make those interactions work
- Backend and Design collaborate on loading states, error messages, and user feedback
- If Design wants a feature that Backend says is slow or impossible, escalate to Governor

## Backend ↔ DevOps

- Backend specifies what DevOps needs to deploy and monitor (health checks, metrics, structured logs)
- DevOps builds deployment infrastructure and CI/CD for Backend's services
- Backend and DevOps collaborate on scaling strategy, rollout plans, and failover
- DevOps reviews Backend code for operational concerns (error handling, timeouts, resource usage)

## Backend ↔ Security

- Security specifies auth, encryption, and secrets handling requirements; Backend implements them
- Backend must handle sensitive data carefully (no logging passwords, proper validation)
- Security reviews Backend code for common vulnerabilities (injection, hardcoded secrets)
- Backend and Security collaborate on error handling (don't leak information in error messages)

## Backend ↔ QA

- QA writes test cases based on API spec and acceptance criteria; Backend ensures code is testable
- Backend provides test data, test endpoints, and mock support if needed
- QA surfaces where Backend's API is hard to test — a signal of poor API design

## Backend ↔ Docs

- Backend provides API specifications; Docs makes them user-friendly and accessible
- Docs surfaces where Backend's API is confusing — a signal to simplify the API
- Backend and Docs collaborate on error message documentation

## Backend ↔ Analytics

- Analytics specifies what events to track; Backend emits those events
- Backend and Analytics collaborate on event structure and naming consistency

## Backend/Frontend ↔ GTM

- Implementation team builds the product; GTM positions it for market
- If product quality doesn't match GTM's premium positioning, GTM must adjust claims
- GTM ensures marketing claims match actual product capabilities

## Frontend ↔ Design

- Design provides mockups and interaction specifications; Frontend implements exactly what Design specified
- Frontend must follow Design mockups — deviations require Design approval
- Design reviews Frontend implementation for visual fidelity
- Frontend asks Design "How should this edge case look?" for states Design didn't specify
- Frontend and Design collaborate on responsive design across devices

## Frontend ↔ DevOps

- Frontend provides build artifacts; DevOps deploys them to CDN/servers
- DevOps specifies caching strategy for Frontend assets
- Frontend and DevOps collaborate on performance (bundle size, code splitting, CDN strategy)

## Frontend ↔ Security

- Security specifies how sensitive data should be handled in the browser
- Frontend must not log or expose sensitive data
- Frontend and Security collaborate on secure credential handling (password entry, token storage)

## Frontend ↔ QA

- QA writes test cases from Product spec; Frontend ensures code is testable
- Frontend provides test selectors, test utilities, and mock data
- QA surfaces where Frontend behavior is hard to test — a signal of poor component architecture

## Frontend ↔ Analytics

- Analytics specifies what events to track; Frontend emits those events
- Frontend and Analytics collaborate on event data structure and naming

## Design ↔ DevOps

- Design specifies performance requirements (page load, interaction latency)
- DevOps builds infrastructure to meet those requirements
- Design and DevOps collaborate on CDN strategy and asset optimization

## Design ↔ QA

- Design specifies expected behavior and visual standards
- QA writes test cases from Design specs for visual and interaction testing
- Design and QA collaborate on what "correct" looks like for visual regression tests

## Design ↔ GTM

- GTM defines brand and positioning; Design translates that into visual identity
- Design and GTM collaborate on brand guidelines
- Design ensures the product looks as premium as GTM claims

## Design ↔ Analytics

- Analytics specifies what user behavior data is needed; Design considers measurement in UX flows
- Design and Analytics collaborate on where measurement touchpoints fit naturally in the experience

## DevOps ↔ Security

- Security specifies compliance, encryption, and audit requirements; DevOps implements them in infrastructure
- DevOps provides logs and audit trails that Security needs
- DevOps and Security collaborate on secret management and access control

## DevOps ↔ QA

- QA needs test environments (dev, staging, production); DevOps provides them
- DevOps needs test infrastructure to run tests quickly
- DevOps and QA collaborate on continuous integration (test automation on every commit)

## DevOps ↔ GTM

- DevOps ensures product is reliable for launch; GTM assumes operational soundness
- If reliability is uncertain, DevOps and GTM align on launch timing

## DevOps ↔ Analytics

- Analytics specifies what infrastructure metrics are needed; DevOps provides monitoring data
- DevOps and Analytics collaborate on operational dashboards

## Security ↔ QA

- Security specifies security tests (auth bypass, data access, injection); QA implements them
- Security and QA collaborate on security test coverage
- QA surfaces where security is hard to test — a signal of poor design

## Security ↔ Docs

- Security reviews public documentation for information disclosure risks
- Docs writes security guides for users (e.g., strong passwords, API key management)
- Security and Docs collaborate on security best practices documentation

## Security ↔ GTM

- Security implements compliance and data protection; GTM may market security as a differentiator
- GTM and Security collaborate on security messaging — all claims must be accurate
- GTM ensures security claims are verified before publishing

## Analytics ↔ GTM

- Analytics provides market and product data; GTM uses it for positioning and messaging
- Analytics and GTM collaborate on measurement of go-to-market effectiveness
