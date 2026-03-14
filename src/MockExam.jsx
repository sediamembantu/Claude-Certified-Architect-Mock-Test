import { useState, useEffect, useCallback, useRef } from "react";

const QUESTIONS = [
  // ═══════════════════════════════════════════════════════════════
  // DOMAIN 1: Agentic Architecture & Orchestration (27%) — 11 Qs
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your customer support agent uses an agentic loop that checks for the string \"I have completed the task\" in the assistant's response to decide when to stop looping. In testing, you find the agent sometimes stops prematurely when it uses similar phrasing mid-conversation, and other times loops indefinitely when it resolves the issue without that exact phrase. What is the correct fix?",
    options: [
      "A) Terminate the loop based on stop_reason === 'end_turn' from the API response, not by parsing the assistant's text output.",
      "B) Add more trigger phrases like \"Task complete\" and \"Issue resolved\" to the text-matching logic to improve detection coverage.",
      "C) Set a maximum iteration count of 10 and terminate whenever it is reached, regardless of task completion.",
      "D) Instruct the model in the system prompt to always end its final message with a specific delimiter like '###DONE###'.",
    ],
    correct: 0,
    explanation:
      "The API's stop_reason field is the designed mechanism for determining loop control. When stop_reason is 'tool_use', the loop should continue executing tools; when it's 'end_turn', the model has decided it's finished. Parsing natural language (B, D) is fragile and an explicit anti-pattern. Arbitrary iteration caps (C) are a fallback safety measure, not a primary stopping mechanism.",
  },
  {
    id: 2,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Multi-Agent Research System",
    question:
      "Your multi-agent research system has a coordinator that delegates to a web search subagent and a document analysis subagent. During testing, the synthesis subagent produces reports missing key findings that the search subagent discovered. Logs show the coordinator passes only a brief summary like \"Search found 12 relevant articles about renewable energy\" to the synthesis subagent. What is the root cause?",
    options: [
      "A) The synthesis subagent's model temperature is set too high, causing it to ignore provided context.",
      "B) Subagent context must be explicitly provided in the prompt — the coordinator is passing insufficient detail rather than the actual findings.",
      "C) The synthesis subagent needs access to the web search tool so it can re-fetch the articles independently.",
      "D) The coordinator should use a shared memory store that all subagents read from automatically.",
    ],
    correct: 1,
    explanation:
      "Subagents operate with isolated context and do not inherit the coordinator's conversation history. The coordinator must explicitly pass complete findings — including actual search results, document analysis outputs, and metadata — in the subagent's prompt. A brief summary is insufficient. Shared memory (D) doesn't exist in the Agent SDK; subagents don't automatically share state.",
  },
  {
    id: 3,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Customer Support Resolution Agent",
    question:
      "A customer writes: \"I need to return my damaged laptop AND I was overcharged on my last bill.\" Your agent currently handles only the first issue mentioned, then presents a resolution and ends the conversation. What architectural change best addresses this?",
    options: [
      "A) Add instructions to the system prompt to always ask the customer if they have additional concerns before ending the conversation.",
      "B) Decompose multi-concern requests into distinct items, investigate each in parallel using shared context, then synthesize a unified resolution.",
      "C) Implement a queue system where each concern is processed as a separate conversation with separate context.",
      "D) Increase the model's max_tokens to ensure it has enough output space to address both concerns.",
    ],
    correct: 1,
    explanation:
      "Multi-concern customer requests should be decomposed into distinct items, each investigated (potentially in parallel) using shared customer context, then synthesized into a single unified resolution. Option A only catches missed concerns after the fact. Option C loses shared context. Option D addresses output length, not the decomposition logic.",
  },
  {
    id: 4,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Multi-Agent Research System",
    question:
      "Your coordinator agent needs to invoke three subagents to research different subtopics simultaneously. What is the correct way to achieve parallel subagent execution?",
    options: [
      "A) Have the coordinator emit multiple Task tool calls in a single response turn.",
      "B) Use Python's asyncio.gather() in the coordinator's system prompt to run subagents concurrently.",
      "C) Create three separate coordinator instances, each managing one subagent.",
      "D) Configure the coordinator with a 'parallel_execution: true' flag in the AgentDefinition.",
    ],
    correct: 0,
    explanation:
      "Parallel subagent execution is achieved by having the coordinator emit multiple Task tool calls in a single response. The runtime can then execute these concurrently. There is no 'parallel_execution' flag (D). asyncio in system prompts (B) conflates application code with prompt instructions. Multiple coordinators (C) loses centralized orchestration.",
  },
  {
    id: 5,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your agent needs to verify customer identity before processing refunds. Currently, the system prompt says: \"Always verify the customer's identity using get_customer before processing any refund.\" Logs show this instruction is followed 88% of the time. For the remaining 12%, the agent skips verification when the customer provides convincing order details. The compliance team requires 100% enforcement. What approach provides the strongest guarantee?",
    options: [
      "A) Add a PostToolUse hook that intercepts process_refund calls and checks whether get_customer was called earlier in the conversation.",
      "B) Add few-shot examples showing the agent always calling get_customer first, even when the customer provides order numbers.",
      "C) Implement a programmatic prerequisite that blocks process_refund and lookup_order until get_customer has returned a verified customer ID.",
      "D) Change the system prompt to use stronger language: \"You MUST NEVER process a refund without first calling get_customer. This is a non-negotiable requirement.\"",
    ],
    correct: 2,
    explanation:
      "When deterministic compliance is required (100% enforcement), programmatic prerequisites that gate downstream tool calls provide guaranteed enforcement. Prompt-based approaches (B, D) are probabilistic — even strong language has non-zero failure rates. A PostToolUse hook (A) catches violations after the fact but doesn't prevent the attempt.",
  },
  {
    id: 6,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your agent processes refunds up to $500 per policy. You need to ensure refunds above $500 are never processed and instead routed to a human supervisor. What is the most appropriate implementation?",
    options: [
      "A) Add a tool call interception hook that blocks process_refund when the amount exceeds $500 and redirects to an escalate_to_human workflow.",
      "B) Include the $500 limit in the process_refund tool description and trust the model to check amounts before calling.",
      "C) Add a PostToolUse hook that reverses any refund over $500 after it has been processed.",
      "D) Set max_tokens low enough that the model cannot generate a tool call with a large refund amount.",
    ],
    correct: 0,
    explanation:
      "A tool call interception hook provides deterministic enforcement of the $500 limit before the tool executes. Relying on the model to self-enforce (B) has a non-zero failure rate for business-critical rules. Reversing after processing (C) is dangerous — the refund may already be issued. Option D is nonsensical; max_tokens doesn't constrain parameter values.",
  },
  {
    id: 7,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Developer Productivity with Claude",
    question:
      "You're using Claude Code to explore a large unfamiliar codebase. After 45 minutes of investigation, Claude starts giving vague responses like \"based on typical patterns in codebases like this\" instead of referencing specific classes it discovered earlier. What is happening and what should you do?",
    options: [
      "A) The model is experiencing context degradation from an extended session. Use scratchpad files to persist key findings and consider using /compact or spawning subagents for further exploration.",
      "B) The model's temperature has drifted over the session. Restart with a lower temperature setting.",
      "C) The codebase is too large for Claude to handle. Switch to a model with a larger context window.",
      "D) Claude Code has a session time limit. End the session and start a new one with the same query.",
    ],
    correct: 0,
    explanation:
      "Context degradation in extended sessions causes models to give inconsistent, generic answers rather than referencing specific findings. The remedy is to persist key findings in scratchpad files, use /compact to reduce accumulated context, and delegate verbose exploration to subagents. Temperature doesn't drift (B), and there's no session time limit (D).",
  },
  {
    id: 8,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Multi-Agent Research System",
    question:
      "Your coordinator agent always invokes all four subagents (web search, document analysis, synthesis, report generation) in sequence, regardless of query complexity. For a simple factual question like \"What is the current GDP of Malaysia?\", this creates unnecessary latency and cost. What is the best architectural improvement?",
    options: [
      "A) Design the coordinator to analyze query requirements and dynamically select which subagents to invoke based on complexity, rather than always routing through the full pipeline.",
      "B) Add a classifier model before the coordinator that routes simple questions directly to a single-turn API call.",
      "C) Set a latency budget and terminate the pipeline early if processing time exceeds it.",
      "D) Cache responses to frequently asked questions and bypass the agent system entirely.",
    ],
    correct: 0,
    explanation:
      "The coordinator should analyze query requirements and dynamically select subagents rather than always running the full pipeline. This is a core coordinator responsibility. A separate classifier (B) adds unnecessary infrastructure. Latency budgets (C) don't address the root cause. Caching (D) only works for repeated queries.",
  },
  {
    id: 9,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Developer Productivity with Claude",
    question:
      "You completed a detailed codebase analysis yesterday and saved the session as 'refactor-analysis'. Today, several files have been modified by teammates. You need to continue the analysis. What is the best approach?",
    options: [
      "A) Start a fresh session and re-do the entire analysis from scratch to ensure accuracy.",
      "B) Resume the session with --resume refactor-analysis and inform the agent about specific file changes for targeted re-analysis.",
      "C) Resume the session with --resume refactor-analysis and continue as if nothing changed, since the session has the prior context.",
      "D) Use fork_session to create a branch from yesterday's session and run the full analysis again in the fork.",
    ],
    correct: 1,
    explanation:
      "When prior context is mostly valid but some files have changed, resuming with --resume and informing the agent about specific changes allows targeted re-analysis without losing valuable prior context. Starting fresh (A) wastes the prior work. Resuming without mentioning changes (C) risks stale analysis. Forking (D) is for exploring divergent approaches, not for incremental updates.",
  },
  {
    id: 10,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Multi-Agent Research System",
    question:
      "You want your coordinator to instruct the synthesis subagent on how to produce the final report. Which prompt design approach is most effective for the coordinator-to-subagent delegation?",
    options: [
      "A) Provide step-by-step procedural instructions: \"First, organize by theme. Second, write an introduction. Third, add citations. Fourth, write a conclusion.\"",
      "B) Specify research goals and quality criteria: \"Produce a report that covers all identified themes, preserves source attribution for every claim, flags conflicting findings, and distinguishes well-supported from contested conclusions.\"",
      "C) Give a single high-level instruction: \"Write a good research report based on the findings.\"",
      "D) Provide a rigid template with exact section headings and word counts for each section.",
    ],
    correct: 1,
    explanation:
      "Coordinator prompts should specify research goals and quality criteria rather than step-by-step procedural instructions. This enables subagent adaptability — the synthesis agent can organize the report in whatever way best serves the content. Procedural instructions (A) are brittle. Vague instructions (C) produce inconsistent quality. Rigid templates (D) prevent adaptation to varied content.",
  },
  {
    id: 11,
    domain: "Agentic Architecture & Orchestration",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your agent receives heterogeneous data formats from different MCP tools: get_customer returns Unix timestamps, lookup_order returns ISO 8601 dates, and the billing system returns numeric status codes (1=active, 2=suspended). The agent sometimes misinterprets these formats. What is the best solution?",
    options: [
      "A) Add format descriptions to the system prompt explaining each tool's data formats.",
      "B) Implement PostToolUse hooks that normalize all timestamps to ISO 8601 and convert status codes to human-readable strings before the model processes them.",
      "C) Standardize all backend APIs to return the same format.",
      "D) Add few-shot examples showing the model correctly interpreting each format.",
    ],
    correct: 1,
    explanation:
      "PostToolUse hooks that intercept tool results and normalize formats before the model sees them provide deterministic data normalization. This is more reliable than prompt-based approaches (A, D) and more practical than requiring all backends to change (C). Hooks transform the data at the boundary, so the model always sees consistent formats.",
  },
  // ═══════════════════════════════════════════════════════════════
  // DOMAIN 2: Tool Design & MCP Integration (18%) — 7 Qs
  // ═══════════════════════════════════════════════════════════════
  {
    id: 12,
    domain: "Tool Design & MCP Integration",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your agent has two tools: 'analyze_content' (description: \"Analyzes content\") and 'analyze_document' (description: \"Analyzes documents\"). Logs show the agent randomly selects between them regardless of whether the input is a web page or a PDF. What is the most effective first step?",
    options: [
      "A) Rename them to 'extract_web_results' and 'extract_pdf_data' with detailed descriptions specifying input types, expected formats, example queries, and when to use each.",
      "B) Remove one tool and have the remaining tool handle both content types.",
      "C) Add a routing layer that pre-selects the correct tool based on URL patterns.",
      "D) Add system prompt instructions: \"Use analyze_content for web pages and analyze_document for PDFs.\"",
    ],
    correct: 0,
    explanation:
      "Tool descriptions are the primary mechanism LLMs use for tool selection. When descriptions are minimal and overlapping, the model cannot differentiate between tools. Renaming for clarity and expanding descriptions with input formats, examples, and boundaries directly addresses the root cause. System prompt instructions (D) add token overhead without fixing the underlying description quality.",
  },
  {
    id: 13,
    domain: "Tool Design & MCP Integration",
    scenario: "Multi-Agent Research System",
    question:
      "Your synthesis subagent has access to 18 tools including web search, database queries, file operations, and formatting utilities. It frequently misuses tools outside its specialization — for example, attempting raw web searches instead of using its provided findings. What should you do?",
    options: [
      "A) Add stronger instructions to the system prompt telling the synthesis agent to only use synthesis-related tools.",
      "B) Restrict the synthesis subagent's tool set to only those relevant to its role (e.g., verify_fact, format_output), routing complex needs through the coordinator.",
      "C) Increase the model size to improve tool selection accuracy across all 18 tools.",
      "D) Add a retry mechanism that re-runs the tool call with the correct tool when misuse is detected.",
    ],
    correct: 1,
    explanation:
      "Giving an agent access to too many tools degrades tool selection reliability. Agents with tools outside their specialization tend to misuse them. The fix is scoping each agent's tools to their role, with limited cross-role tools for specific high-frequency needs (like verify_fact for simple lookups). Prompt instructions (A) are probabilistic.",
  },
  {
    id: 14,
    domain: "Tool Design & MCP Integration",
    scenario: "Structured Data Extraction",
    question:
      "Your extraction pipeline has a generic 'analyze_document' tool that handles text extraction, summarization, and claim verification. Different extraction tasks require different behaviors, and the agent frequently applies the wrong analysis mode. What is the best refactoring approach?",
    options: [
      "A) Add a 'mode' parameter to analyze_document that specifies the analysis type.",
      "B) Split into purpose-specific tools: 'extract_data_points', 'summarize_content', and 'verify_claim_against_source', each with defined input/output contracts.",
      "C) Add detailed few-shot examples showing correct mode selection for each task type.",
      "D) Create a wrapper tool that asks the model which analysis mode to use before calling analyze_document.",
    ],
    correct: 1,
    explanation:
      "Splitting generic tools into purpose-specific tools with clear input/output contracts makes tool selection more reliable. Each tool's description can precisely define its use case. A mode parameter (A) still requires the model to select correctly. A wrapper tool (D) adds complexity without solving the description clarity problem.",
  },
  {
    id: 15,
    domain: "Tool Design & MCP Integration",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your MCP tool 'process_refund' fails when the order has already been refunded. Currently it returns: {\"error\": \"Operation failed\"}. The agent responds to the customer with \"I encountered an error processing your refund\" and doesn't attempt any recovery. How should you improve the error response?",
    options: [
      "A) Return structured error metadata: {\"isError\": true, \"errorCategory\": \"business\", \"isRetryable\": false, \"message\": \"Order #12345 was already refunded on 2024-01-15 for $49.99\", \"customerMessage\": \"This order has already been refunded.\"}",
      "B) Return a success response with the original refund details so the agent doesn't know it failed.",
      "C) Implement automatic retry with exponential backoff and only surface the error after 3 failed attempts.",
      "D) Throw an unhandled exception to terminate the agent loop and escalate to a human.",
    ],
    correct: 0,
    explanation:
      "Structured error metadata enables the agent to make intelligent recovery decisions. The errorCategory distinguishes business errors from transient failures, isRetryable prevents wasted retries, and the detailed message plus customerMessage allow appropriate responses. Generic errors (the current state) prevent informed decision-making. Retrying a business rule violation (C) is pointless.",
  },
  {
    id: 16,
    domain: "Tool Design & MCP Integration",
    scenario: "Developer Productivity with Claude",
    question:
      "You want to set up an MCP server for your team's Jira integration that all developers can use when they clone the repo. Credentials should not be committed to version control. Where should this be configured?",
    options: [
      "A) In .mcp.json at the project root, using environment variable expansion like ${JIRA_API_TOKEN} for credentials.",
      "B) In ~/.claude.json on each developer's machine with hardcoded credentials.",
      "C) In the project's CLAUDE.md file with instructions telling Claude how to connect to Jira.",
      "D) In a .env file committed to the repository with Jira credentials.",
    ],
    correct: 0,
    explanation:
      "Project-scoped MCP servers go in .mcp.json (version controlled, shared with team) with environment variable expansion (${JIRA_API_TOKEN}) for credential management without committing secrets. ~/.claude.json (B) is for personal/experimental servers. CLAUDE.md (C) provides instructions, not server configuration. Committing credentials (D) is a security anti-pattern.",
  },
  {
    id: 17,
    domain: "Tool Design & MCP Integration",
    scenario: "Developer Productivity with Claude",
    question:
      "Your team's agent has both built-in Grep and a more capable MCP-based code search tool. Logs show the agent almost always uses Grep and ignores the MCP tool. The MCP tool's description says: \"Searches code.\" What is the most likely cause and fix?",
    options: [
      "A) Built-in tools always take priority over MCP tools. You need to disable Grep.",
      "B) The MCP tool's description is too minimal. Enhance it to explain its capabilities, supported query types, and how its results differ from Grep.",
      "C) The agent needs explicit system prompt instructions to never use Grep.",
      "D) MCP tools load after built-in tools and are deprioritized by default.",
    ],
    correct: 1,
    explanation:
      "When MCP tool descriptions are minimal, the agent defaults to familiar built-in tools. Enhancing the MCP tool description to explain its full capabilities and advantages over built-in alternatives improves adoption. There's no inherent priority system (A, D). Disabling useful built-in tools (A) or banning them via prompts (C) are heavy-handed and reduce flexibility.",
  },
  {
    id: 18,
    domain: "Tool Design & MCP Integration",
    scenario: "Developer Productivity with Claude",
    question:
      "You need the agent to first call extract_metadata on a document before running any enrichment tools. The agent sometimes skips metadata extraction and goes directly to enrichment. How do you enforce this ordering for the first tool call?",
    options: [
      "A) Use tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"} for the first API call, then switch to tool_choice: \"auto\" for subsequent turns.",
      "B) Add a system prompt instruction: \"Always call extract_metadata first before any other tool.\"",
      "C) Set tool_choice: \"any\" to guarantee the model calls some tool, hoping it picks the right one.",
      "D) Remove all other tools from the first turn and add them back in subsequent turns.",
    ],
    correct: 0,
    explanation:
      "Forced tool selection with tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"} guarantees the specific tool is called first. Then switching to \"auto\" for subsequent turns allows the model to choose freely. \"any\" (C) guarantees a tool call but not which tool. Prompt instructions (B) are probabilistic. Dynamically modifying tool lists (D) is unnecessarily complex.",
  },
  // ═══════════════════════════════════════════════════════════════
  // DOMAIN 3: Claude Code Configuration & Workflows (20%) — 8 Qs
  // ═══════════════════════════════════════════════════════════════
  {
    id: 19,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Code Generation with Claude Code",
    question:
      "A new team member reports that Claude Code is not following the team's coding standards. When you check, the standards are defined in ~/.claude/CLAUDE.md on the original developer's machine. What's the problem?",
    options: [
      "A) User-level CLAUDE.md files (~/.claude/CLAUDE.md) are not shared via version control — they apply only to that user. Move the standards to the project-level .claude/CLAUDE.md.",
      "B) The new team member needs to copy the file to their own ~/.claude/ directory.",
      "C) User-level files override project-level files, so the new team member's empty user-level config is overriding the standards.",
      "D) Claude Code only reads CLAUDE.md from the repository root, not from ~/.claude/.",
    ],
    correct: 0,
    explanation:
      "User-level settings in ~/.claude/CLAUDE.md apply only to that user and are not shared via version control. Team-wide standards should be in project-level configuration (.claude/CLAUDE.md or root CLAUDE.md) so all team members get them automatically. Option D is incorrect — Claude Code reads from multiple levels in the hierarchy.",
  },
  {
    id: 20,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Code Generation with Claude Code",
    question:
      "Your project has React components (functional + hooks), API handlers (async/await + custom error handling), and test files (spread throughout directories alongside source files). You want Claude to automatically apply the correct conventions based on what file is being edited. What is the most maintainable approach?",
    options: [
      "A) Create .claude/rules/ files with YAML frontmatter glob patterns: 'src/components/**/*' for React, 'src/api/**/*' for handlers, '**/*.test.*' for tests.",
      "B) Put all conventions in the root CLAUDE.md under separate headers and let Claude infer which applies.",
      "C) Place a CLAUDE.md file in every subdirectory with that directory's specific conventions.",
      "D) Create skills in .claude/skills/ for each code type and invoke them manually when needed.",
    ],
    correct: 0,
    explanation:
      "Path-specific rules in .claude/rules/ with glob patterns enable automatic, conditional convention loading based on the file being edited. This is especially important for test files spread throughout the codebase — **/*.test.* matches regardless of directory. Directory-level CLAUDE.md files (C) can't handle cross-directory patterns. Skills (D) require manual invocation. Inference from headers (B) is unreliable.",
  },
  {
    id: 21,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Code Generation with Claude Code",
    question:
      "You want to create a codebase analysis skill that produces verbose output (scanning hundreds of files, generating dependency graphs). You're concerned this output will pollute the main conversation context and consume tokens for subsequent tasks. What frontmatter configuration addresses this?",
    options: [
      "A) Set 'context: fork' in the skill's SKILL.md frontmatter to run the skill in an isolated sub-agent context.",
      "B) Set 'max_tokens: 1000' in the skill frontmatter to limit output length.",
      "C) Set 'output: silent' in the frontmatter to suppress output entirely.",
      "D) Add '/compact' at the end of the skill to automatically compress context after execution.",
    ],
    correct: 0,
    explanation:
      "The 'context: fork' frontmatter option runs skills in an isolated sub-agent context, preventing verbose output from polluting the main conversation. The skill's results are summarized and returned without the full exploratory context accumulating in the main session. 'max_tokens' and 'output: silent' (B, C) are not valid SKILL.md frontmatter options.",
  },
  {
    id: 22,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Code Generation with Claude Code",
    question:
      "Your team's CLAUDE.md has grown to 2,000 lines covering testing conventions, API standards, deployment procedures, accessibility rules, and security guidelines. Claude Code occasionally ignores or contradicts some conventions. What is the best approach to improve consistency?",
    options: [
      "A) Split into focused files in .claude/rules/: testing.md, api-conventions.md, deployment.md, accessibility.md, security.md — each loaded only when relevant.",
      "B) Prioritize the most important rules at the top of the file and add \"IMPORTANT:\" prefixes.",
      "C) Duplicate the critical rules at both the beginning and end of the file to leverage the primacy and recency effects.",
      "D) Create a summary of all rules in the first 100 lines and keep the detailed rules below.",
    ],
    correct: 0,
    explanation:
      "Splitting a monolithic CLAUDE.md into focused topic-specific files in .claude/rules/ reduces the amount of context loaded for any given task. With path-scoped rules, only relevant conventions load, improving both adherence and token efficiency. The other options try to work around the core problem of information overload.",
  },
  {
    id: 23,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Code Generation with Claude Code",
    question:
      "You're asked to restructure a monolithic Python application into microservices. The codebase has 200+ files with complex interdependencies, and there are multiple valid approaches to defining service boundaries. Which approach should you take?",
    options: [
      "A) Use direct execution with a detailed upfront specification of all microservice boundaries and module assignments.",
      "B) Start in plan mode to explore the codebase, map dependencies, and design an approach before making any changes.",
      "C) Use direct execution to make incremental changes, letting natural boundaries emerge through refactoring.",
      "D) Skip plan mode since you already know you want microservices — go directly to implementation.",
    ],
    correct: 1,
    explanation:
      "Plan mode is designed for complex tasks with architectural decisions, multiple valid approaches, and large-scale changes. Monolith-to-microservices restructuring requires understanding dependencies before committing to boundaries. Direct execution (A, C, D) risks costly rework when dependencies are discovered late. The complexity is evident upfront — it shouldn't be an afterthought.",
  },
  {
    id: 24,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Claude Code for Continuous Integration",
    question:
      "Your CI pipeline runs 'claude \"Review this PR for issues\"' but the job hangs and eventually times out. Logs indicate Claude Code is waiting for interactive input. How do you fix this?",
    options: [
      "A) Use the -p flag: claude -p \"Review this PR for issues\"",
      "B) Set the CLAUDE_NONINTERACTIVE=true environment variable.",
      "C) Pipe the prompt via stdin: echo \"Review this PR for issues\" | claude",
      "D) Add the --headless flag: claude --headless \"Review this PR for issues\"",
    ],
    correct: 0,
    explanation:
      "The -p (or --print) flag runs Claude Code in non-interactive mode, processing the prompt and outputting results to stdout without waiting for user input. The other options reference features that don't exist (CLAUDE_NONINTERACTIVE, --headless) or use workarounds that don't properly address Claude Code's command-line interface.",
  },
  {
    id: 25,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Claude Code for Continuous Integration",
    question:
      "Your CI pipeline needs Claude Code to output structured JSON findings that can be automatically posted as inline PR comments. Which CLI flags should you use?",
    options: [
      "A) -p with --output-format json and --json-schema to enforce a specific output structure.",
      "B) -p with --format json and a system prompt requesting JSON output.",
      "C) --batch-mode with --response-type json.",
      "D) -p with a system prompt that says \"Respond only in valid JSON\" and manual parsing.",
    ],
    correct: 0,
    explanation:
      "The --output-format json flag produces JSON output, and --json-schema enforces a specific schema for machine-parseable structured findings. These are the documented Claude Code CLI flags for CI integration. --format and --batch-mode (B, C) don't exist. Relying solely on system prompts for JSON (D) is unreliable compared to CLI enforcement.",
  },
  {
    id: 26,
    domain: "Claude Code Configuration & Workflows",
    scenario: "Code Generation with Claude Code",
    question:
      "You're implementing a new feature in an unfamiliar domain (payment processing). Before diving into code, you want Claude to help you understand potential edge cases and design considerations you might not have anticipated. Which iterative refinement technique is most appropriate?",
    options: [
      "A) The interview pattern: have Claude ask you questions to surface considerations like retry idempotency, partial payment states, and currency rounding before implementing.",
      "B) Write the implementation first and then ask Claude to review it for issues.",
      "C) Provide 2-3 input/output examples of the desired payment flow and implement from those.",
      "D) Write a comprehensive test suite first and iterate based on test failures.",
    ],
    correct: 0,
    explanation:
      "The interview pattern has Claude ask questions to surface domain-specific considerations the developer may not have anticipated — critical in unfamiliar domains like payment processing. Input/output examples (C) and test-driven development (D) are valuable techniques but assume you already know the edge cases. Implementing first (B) risks missing critical concerns.",
  },
  // ═══════════════════════════════════════════════════════════════
  // DOMAIN 4: Prompt Engineering & Structured Output (20%) — 8 Qs
  // ═══════════════════════════════════════════════════════════════
  {
    id: 27,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Structured Data Extraction",
    question:
      "Your extraction pipeline uses a system prompt that says \"Return the extracted data as JSON.\" Output often contains markdown code fences, missing fields, and occasional syntax errors. What is the most reliable approach to guarantee valid, schema-compliant output?",
    options: [
      "A) Use tool_use with a JSON schema defined as the tool's input parameters, and set tool_choice to force that specific tool.",
      "B) Add \"Return ONLY valid JSON with no markdown formatting\" to the system prompt.",
      "C) Implement regex-based post-processing to strip markdown fences and fix common JSON errors.",
      "D) Use temperature=0 to make output deterministic and reduce formatting variations.",
    ],
    correct: 0,
    explanation:
      "Tool use (tool_use) with JSON schemas is the most reliable approach for guaranteed schema-compliant structured output. The schema defines required fields and types, and the model's output is constrained to valid JSON matching the schema — eliminating syntax errors entirely. Prompt instructions (B) and temperature changes (D) are probabilistic. Regex post-processing (C) is fragile.",
  },
  {
    id: 28,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Structured Data Extraction",
    question:
      "Your invoice extraction tool has a schema with 'vendor_name' as a required field. When processing invoices that don't clearly state the vendor (e.g., informal receipts), the model fabricates plausible vendor names to satisfy the required constraint. How should you fix this?",
    options: [
      "A) Make 'vendor_name' an optional/nullable field so the model can return null when the information isn't present.",
      "B) Add a system prompt instruction: \"Do not make up vendor names. Leave the field empty if not found.\"",
      "C) Add a 'confidence' field alongside 'vendor_name' so the model can indicate uncertainty.",
      "D) Pre-process documents to detect vendor names before sending to the extraction model.",
    ],
    correct: 0,
    explanation:
      "When source documents may not contain certain information, schema fields should be optional/nullable to prevent the model from fabricating values to satisfy required constraints. This is a schema design principle — the structure should match the reality of the data. Prompt instructions (B) work against the schema's required constraint. A confidence field (C) doesn't prevent fabrication.",
  },
  {
    id: 29,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Structured Data Extraction",
    question:
      "Your extraction tool has an 'industry' field with enum values: [\"technology\", \"healthcare\", \"finance\", \"manufacturing\"]. Documents from the education sector are being incorrectly classified as \"technology\" because there's no matching enum value. What is the best schema fix?",
    options: [
      "A) Add an \"other\" enum value paired with a \"industry_detail\" string field for specifying unlisted industries.",
      "B) Add every possible industry to the enum list to ensure complete coverage.",
      "C) Remove the enum constraint and use a free-text string field.",
      "D) Add a \"not_applicable\" enum value for documents that don't fit.",
    ],
    correct: 0,
    explanation:
      "The \"other\" + detail string pattern provides extensibility: the enum maintains structure for known categories while the detail field captures specifics for unlisted values. Exhaustive enums (B) are impossible to maintain. Free-text (C) loses the structure benefits. \"not_applicable\" (D) doesn't capture what the actual industry is.",
  },
  {
    id: 30,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Claude Code for Continuous Integration",
    question:
      "Your CI code review pipeline flags too many false positives — minor style issues and local coding patterns that are intentional team conventions. Developers have started ignoring all automated feedback. What is the most effective prompt engineering fix?",
    options: [
      "A) Write specific review criteria defining which issues to report (bugs, security vulnerabilities) and which to skip (minor style, local patterns established by >3 occurrences). Temporarily disable the highest false-positive categories.",
      "B) Add \"Only report high-confidence findings\" to the system prompt.",
      "C) Increase the model's temperature to produce more varied and less repetitive findings.",
      "D) Add a confidence threshold: instruct the model to rate each finding 1-10 and only output those above 7.",
    ],
    correct: 0,
    explanation:
      "Explicit categorical criteria defining what to report vs. skip outperform vague instructions like \"high-confidence\" or \"conservative.\" Disabling high false-positive categories restores developer trust while you improve prompts for those categories. Self-reported confidence (B, D) is poorly calibrated. Temperature (C) affects randomness, not precision.",
  },
  {
    id: 31,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Structured Data Extraction",
    question:
      "Your extraction pipeline processes documents with varied structures — some have inline citations, others have bibliographies, some have methodology sections while others embed details in narrative prose. Detailed prompt instructions produce inconsistent results across these formats. What technique would most improve consistency?",
    options: [
      "A) Add 2-4 few-shot examples demonstrating correct extraction from each document format, showing how to handle inline citations differently from bibliographies.",
      "B) Pre-classify documents by format type and use different extraction prompts for each.",
      "C) Increase max_tokens to ensure the model has enough room to process complex structures.",
      "D) Switch to a larger model that can better handle format variation.",
    ],
    correct: 0,
    explanation:
      "Few-shot examples are the most effective technique for achieving consistent output when detailed instructions alone are interpreted inconsistently. Examples that demonstrate correct handling of varied document structures (inline vs bibliography, narrative vs structured) enable the model to generalize to novel variations. Pre-classification (B) adds complexity without necessarily improving extraction quality.",
  },
  {
    id: 32,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Claude Code for Continuous Integration",
    question:
      "Your team wants to save costs on the overnight technical debt analysis that processes 500 files nightly. A teammate suggests using the Message Batches API. Which consideration is most important when evaluating this change?",
    options: [
      "A) The Batches API offers 50% cost savings and is appropriate here since the overnight report is a non-blocking, latency-tolerant workload with no real-time SLA.",
      "B) The Batches API cannot be used because it doesn't support multi-turn tool calling, which the analysis requires.",
      "C) The Batches API should not be used because it processes requests in random order.",
      "D) The Batches API is only for processing over 10,000 requests at a time.",
    ],
    correct: 0,
    explanation:
      "The Message Batches API provides 50% cost savings with up to 24-hour processing. It's ideal for non-blocking, latency-tolerant workloads like overnight reports. If the analysis doesn't require multi-turn tool calling within a single request (just single-turn extraction per file), it's a great fit. There's no minimum batch size (D), and results can be correlated via custom_id.",
  },
  {
    id: 33,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Structured Data Extraction",
    question:
      "Your extraction pipeline validates output and finds that line items don't sum to the stated total on 15% of invoices. The JSON schema is strictly enforced via tool_use with no syntax errors. What type of error is this, and how should you address it?",
    options: [
      "A) This is a semantic validation error — tool_use eliminates syntax errors but not logical inconsistencies. Add a self-correction flow that extracts both 'calculated_total' and 'stated_total' and flags discrepancies.",
      "B) This is a schema error — add a validation rule to the JSON schema that enforces sum constraints.",
      "C) This is a model capability limitation — switch to a larger model with better arithmetic.",
      "D) This is a tool_use bug — the schema should automatically enforce mathematical consistency.",
    ],
    correct: 0,
    explanation:
      "Strict JSON schemas via tool_use eliminate syntax errors but cannot enforce semantic constraints like mathematical relationships between fields. Extracting both calculated and stated totals and flagging discrepancies via a validation pass addresses the semantic layer. JSON Schema (B) doesn't support cross-field arithmetic validation. Tool_use (D) constrains structure, not semantics.",
  },
  {
    id: 34,
    domain: "Prompt Engineering & Structured Output",
    scenario: "Claude Code for Continuous Integration",
    question:
      "Your CI pipeline generates test cases for new code. Developers complain that many generated tests duplicate scenarios already covered by the existing test suite. How should you address this?",
    options: [
      "A) Provide existing test files in context so test generation can identify already-covered scenarios and focus on uncovered edge cases.",
      "B) Generate tests without context and use a deduplication step afterward to remove duplicates.",
      "C) Limit test generation to only the specific functions modified in the PR.",
      "D) Reduce the number of generated tests per file to minimize the chance of duplication.",
    ],
    correct: 0,
    explanation:
      "Providing existing tests in context allows the model to see what's already covered and generate complementary tests for uncovered scenarios. Post-hoc deduplication (B) wastes generation budget. Limiting scope (C) might miss integration tests. Reducing count (D) doesn't address relevance — you might get fewer but still duplicate tests.",
  },
  // ═══════════════════════════════════════════════════════════════
  // DOMAIN 5: Context Management & Reliability (15%) — 6 Qs
  // ═══════════════════════════════════════════════════════════════
  {
    id: 35,
    domain: "Context Management & Reliability",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your customer support agent handles multi-issue sessions. After 15 turns of conversation about 3 different orders, the agent starts confusing order numbers and refund amounts between issues. Progressive summarization was enabled, and the summary condensed \"Order #4521 — $89.99 damaged laptop, refund approved\" into \"customer had a laptop issue.\" What is the fix?",
    options: [
      "A) Extract transactional facts (order numbers, amounts, statuses, dates) into a persistent 'case facts' block included in each prompt, outside the summarized conversation history.",
      "B) Increase the context window size to avoid triggering summarization.",
      "C) Disable summarization entirely so no information is lost.",
      "D) Add instructions telling the model to always repeat key facts in its responses.",
    ],
    correct: 0,
    explanation:
      "Progressive summarization risks condensing critical numerical values and identifiers into vague summaries. The fix is extracting transactional facts into a separate persistent context layer (a 'case facts' block) that is included in every prompt and never summarized. Disabling summarization (C) causes context overflow. Increasing window size (B) only delays the problem.",
  },
  {
    id: 36,
    domain: "Context Management & Reliability",
    scenario: "Multi-Agent Research System",
    question:
      "Your research system aggregates findings from 8 subagents into a single input for the synthesis agent. The synthesis agent consistently covers findings from the first 2 and last 2 subagents thoroughly but omits or misrepresents findings from the middle 4 subagents. What is this phenomenon and how do you mitigate it?",
    options: [
      "A) This is the 'lost in the middle' effect. Place a key findings summary at the beginning of the aggregated input and organize detailed results with explicit section headers.",
      "B) This is a token limit issue. Reduce the number of subagents to 4.",
      "C) This is a model attention limitation. Switch to a model with a larger context window.",
      "D) This is a prompt ordering bias. Randomize the order of subagent findings for each run.",
    ],
    correct: 0,
    explanation:
      "The 'lost in the middle' effect means models reliably process information at the beginning and end of long inputs but may omit findings from middle sections. Mitigation: place a summary of key findings at the beginning and use explicit section headers throughout. Randomizing (D) just shifts which findings are missed. A larger context window (C) doesn't solve the attention distribution problem.",
  },
  {
    id: 37,
    domain: "Context Management & Reliability",
    scenario: "Customer Support Resolution Agent",
    question:
      "Your agent's lookup_order tool returns 40+ fields per order (shipping address, warehouse codes, tracking IDs, internal audit flags, etc.) when only 5 fields are relevant for customer-facing support. After several tool calls, the accumulated verbose responses consume most of the context window. What should you do?",
    options: [
      "A) Trim tool outputs to only return-relevant fields before they accumulate in context.",
      "B) Use a model with a larger context window to accommodate the full tool outputs.",
      "C) Summarize all tool outputs after each tool call using a separate summarization prompt.",
      "D) Limit the number of tool calls the agent can make per session.",
    ],
    correct: 0,
    explanation:
      "Trimming verbose tool outputs to only relevant fields before they accumulate in context is the most efficient approach. This prevents unnecessary token consumption from irrelevant data. Larger context windows (B) are wasteful. Per-call summarization (C) adds latency and cost. Limiting tool calls (D) restricts functionality.",
  },
  {
    id: 38,
    domain: "Context Management & Reliability",
    scenario: "Customer Support Resolution Agent",
    question:
      "A customer says: \"I want to speak to a manager.\" Your agent has access to all the tools needed to resolve the customer's billing dispute. What should the agent do?",
    options: [
      "A) Honor the explicit request immediately and escalate to a human agent with a structured handoff summary.",
      "B) Attempt to resolve the issue first, then offer escalation if the customer is still unsatisfied.",
      "C) Ask the customer why they want a manager to determine if escalation is truly necessary.",
      "D) Inform the customer that the AI can resolve most issues faster than a human agent.",
    ],
    correct: 0,
    explanation:
      "When a customer explicitly requests a human agent, the request should be honored immediately. This is a core escalation principle — explicit customer requests for humans should not be overridden by the agent's capability assessment. The agent should compile a structured handoff summary (customer ID, issue, attempted resolution, recommended action) for the human agent.",
  },
  {
    id: 39,
    domain: "Context Management & Reliability",
    scenario: "Multi-Agent Research System",
    question:
      "Two credible subagents return conflicting statistics: one reports \"AI market size: $150B (IDC, 2024)\" and the other reports \"AI market size: $184B (Gartner, 2024)\". How should the synthesis agent handle this in the final report?",
    options: [
      "A) Preserve both values with source attribution and annotate the conflict, distinguishing well-established findings from contested data points.",
      "B) Average the two values and report $167B as the market size.",
      "C) Use the more recent or higher-authority source and discard the other.",
      "D) Omit the market size entirely since the data is contradictory.",
    ],
    correct: 0,
    explanation:
      "Conflicting statistics from credible sources should be preserved with full attribution rather than arbitrarily resolved. The synthesis should annotate conflicts and let the reader assess the sources. Averaging (B) creates a fabricated number. Selecting one (C) hides legitimate disagreement. Omitting (D) loses valuable information.",
  },
  {
    id: 40,
    domain: "Context Management & Reliability",
    scenario: "Structured Data Extraction",
    question:
      "Your extraction pipeline achieves 97% overall accuracy. Your manager proposes automating all high-confidence extractions without human review. Before doing this, what validation step is most critical?",
    options: [
      "A) Analyze accuracy by document type and field to verify consistent performance across all segments — the 97% aggregate may mask poor performance on specific types.",
      "B) Run the pipeline on 100 more documents to confirm the 97% figure is stable.",
      "C) Add a confidence threshold and automatically process everything above 0.95.",
      "D) Have two independent model instances process each document and only auto-approve when they agree.",
    ],
    correct: 0,
    explanation:
      "Aggregate accuracy metrics can mask poor performance on specific document types or fields. Before automating high-confidence extractions, you must validate accuracy by segment (document type, field) to ensure consistent performance. A 97% overall rate could mean 100% on invoices but 80% on contracts — making full automation risky for the latter.",
  },
];

const DOMAIN_COLORS = {
  "Agentic Architecture & Orchestration": { bg: "#1a1a2e", accent: "#e94560", light: "#ff6b81" },
  "Tool Design & MCP Integration": { bg: "#1a1a2e", accent: "#0f3460", light: "#53a8b6" },
  "Claude Code Configuration & Workflows": { bg: "#1a1a2e", accent: "#5c2d91", light: "#b19cd9" },
  "Prompt Engineering & Structured Output": { bg: "#1a1a2e", accent: "#1b6b4a", light: "#4ecdc4" },
  "Context Management & Reliability": { bg: "#1a1a2e", accent: "#b8860b", light: "#f0c040" },
};

const DOMAIN_SHORT = {
  "Agentic Architecture & Orchestration": "D1: Agentic",
  "Tool Design & MCP Integration": "D2: Tools & MCP",
  "Claude Code Configuration & Workflows": "D3: Claude Code",
  "Prompt Engineering & Structured Output": "D4: Prompts",
  "Context Management & Reliability": "D5: Context",
};

const DOMAIN_WEIGHT = {
  "Agentic Architecture & Orchestration": "27%",
  "Tool Design & MCP Integration": "18%",
  "Claude Code Configuration & Workflows": "20%",
  "Prompt Engineering & Structured Output": "20%",
  "Context Management & Reliability": "15%",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MockExam() {
  const [phase, setPhase] = useState("start"); // start | exam | review | results
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [flagged, setFlagged] = useState(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  const startExam = () => {
    setQuestions(shuffle(QUESTIONS));
    setAnswers({});
    setCurrent(0);
    setShowExplanation(false);
    setTimer(0);
    setTimerActive(true);
    setFlagged(new Set());
    setPhase("exam");
  };

  const selectAnswer = (qId, optIdx) => {
    if (showExplanation) return;
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const toggleFlag = () => {
    const qId = questions[current].id;
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const submitExam = () => {
    setTimerActive(false);
    setPhase("results");
  };

  const q = questions[current];
  const totalAnswered = Object.keys(answers).length;

  const getScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct) correct++;
    });
    return correct;
  };

  const getScaledScore = () => {
    const raw = getScore() / questions.length;
    return Math.round(100 + raw * 900);
  };

  const getDomainScores = () => {
    const domains = {};
    questions.forEach((q) => {
      if (!domains[q.domain]) domains[q.domain] = { correct: 0, total: 0 };
      domains[q.domain].total++;
      if (answers[q.id] === q.correct) domains[q.domain].correct++;
    });
    return domains;
  };

  // ── START SCREEN ──
  if (phase === "start") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 640, padding: "48px 40px", background: "linear-gradient(145deg, #12121a 0%, #1a1a2e 100%)", borderRadius: 16, border: "1px solid #2a2a3e", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #e94560, #5c2d91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>C</div>
            <span style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", fontWeight: 600 }}>Mock Examination</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 8px", lineHeight: 1.2, background: "linear-gradient(90deg, #e0e0e0, #a0a0b0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Claude Certified Architect — Foundations
          </h1>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            40 scenario-based questions across 5 domains. Minimum passing scaled score: 720/1000.
          </p>

          <div style={{ display: "grid", gap: 8, marginBottom: 32 }}>
            {Object.entries(DOMAIN_SHORT).map(([full, short]) => (
              <div key={full} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#15152200", borderRadius: 8, border: `1px solid ${DOMAIN_COLORS[full].accent}44` }}>
                <span style={{ fontSize: 13, color: DOMAIN_COLORS[full].light }}>{short}</span>
                <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>{DOMAIN_WEIGHT[full]}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 16px", background: "#1e1e30", borderRadius: 10, border: "1px solid #2a2a3e", marginBottom: 32, fontSize: 13, color: "#999", lineHeight: 1.6 }}>
            <strong style={{ color: "#ccc" }}>Exam rules:</strong> Single best answer per question. No penalty for guessing. Questions are randomized. You can flag questions and return to them. Explanations are shown after submission.
          </div>

          <button onClick={startExam} style={{ width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 600, background: "linear-gradient(135deg, #e94560, #c7254e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", letterSpacing: 0.5, transition: "transform 0.15s", }} onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")} onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}>
            Begin Exam
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ──
  if (phase === "results") {
    const score = getScore();
    const scaled = getScaledScore();
    const passed = scaled >= 720;
    const domainScores = getDomainScores();

    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", padding: "40px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Score Card */}
          <div style={{ padding: "40px", background: "linear-gradient(145deg, #12121a, #1a1a2e)", borderRadius: 16, border: `2px solid ${passed ? "#4ecdc4" : "#e94560"}`, marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 16 }}>Scaled Score</div>
            <div style={{ fontSize: 64, fontWeight: 800, fontFamily: "monospace", color: passed ? "#4ecdc4" : "#e94560", lineHeight: 1 }}>{scaled}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>/ 1000</div>
            <div style={{ marginTop: 20, padding: "8px 24px", display: "inline-block", borderRadius: 20, fontSize: 14, fontWeight: 600, background: passed ? "#4ecdc422" : "#e9456022", color: passed ? "#4ecdc4" : "#e94560", border: `1px solid ${passed ? "#4ecdc444" : "#e9456044"}` }}>
              {passed ? "PASS" : "NOT YET PASSING"}
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
              {score}/{questions.length} correct ({Math.round((score / questions.length) * 100)}%) · Time: {formatTime(timer)}
            </div>
          </div>

          {/* Domain Breakdown */}
          <div style={{ padding: "24px", background: "#12121a", borderRadius: 12, border: "1px solid #2a2a3e", marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#ccc" }}>Domain Breakdown</h3>
            {Object.entries(domainScores).map(([domain, { correct, total }]) => {
              const pct = Math.round((correct / total) * 100);
              const col = DOMAIN_COLORS[domain];
              return (
                <div key={domain} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: col?.light || "#aaa" }}>{DOMAIN_SHORT[domain] || domain}</span>
                    <span style={{ color: "#888", fontFamily: "monospace" }}>{correct}/{total} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#1e1e30", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${col?.accent || "#555"}, ${col?.light || "#888"})`, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review Questions */}
          <button onClick={() => { setCurrent(0); setShowExplanation(true); setPhase("exam"); }} style={{ width: "100%", padding: "14px 0", fontSize: 14, fontWeight: 600, background: "#1e1e30", color: "#ccc", border: "1px solid #2a2a3e", borderRadius: 10, cursor: "pointer", marginBottom: 12 }}>
            Review All Questions with Explanations
          </button>
          <button onClick={() => setPhase("start")} style={{ width: "100%", padding: "14px 0", fontSize: 14, fontWeight: 600, background: "transparent", color: "#888", border: "1px solid #2a2a3e", borderRadius: 10, cursor: "pointer" }}>
            Retake Exam
          </button>
        </div>
      </div>
    );
  }

  // ── EXAM SCREEN ──
  if (!q) return null;
  const domainCol = DOMAIN_COLORS[q.domain] || { accent: "#555", light: "#aaa" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif" }}>
      {/* Top Bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0a0a0fee", borderBottom: "1px solid #1e1e30", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#888", fontFamily: "monospace" }}>Q {current + 1}/{questions.length}</span>
          <span style={{ fontSize: 12, color: domainCol.light, padding: "3px 10px", background: `${domainCol.accent}22`, borderRadius: 12, border: `1px solid ${domainCol.accent}44` }}>{DOMAIN_SHORT[q.domain]}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#888", fontFamily: "monospace" }}>{formatTime(timer)}</span>
          <span style={{ fontSize: 12, color: "#666" }}>{totalAnswered}/{questions.length} answered</span>
        </div>
      </div>

      {/* Progress Dots */}
      <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 4, borderBottom: "1px solid #1a1a2e" }}>
        {questions.map((qq, i) => {
          const isAnswered = answers[qq.id] !== undefined;
          const isCurrent = i === current;
          const isFlagged = flagged.has(qq.id);
          const isCorrectInReview = showExplanation && answers[qq.id] === qq.correct;
          const isWrongInReview = showExplanation && answers[qq.id] !== undefined && answers[qq.id] !== qq.correct;
          let bg = "#1e1e30";
          if (isCorrectInReview) bg = "#4ecdc4";
          else if (isWrongInReview) bg = "#e94560";
          else if (isAnswered) bg = "#5c5c7a";
          return (
            <div key={qq.id} onClick={() => setCurrent(i)} style={{ width: 18, height: 18, borderRadius: 4, background: bg, border: isCurrent ? "2px solid #fff" : isFlagged ? "2px solid #f0c040" : "1px solid #2a2a3e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: isCurrent ? "#fff" : "transparent", transition: "all 0.15s", }} title={`Q${i + 1}: ${qq.domain}`}>
              {isCurrent ? i + 1 : ""}
            </div>
          );
        })}
      </div>

      {/* Question Body */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 100px" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: 6 }}>Scenario: {q.scenario}</div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "#d0d0d8", marginBottom: 28 }}>{q.question}</p>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt, idx) => {
            const selected = answers[q.id] === idx;
            const isCorrect = idx === q.correct;
            let borderColor = "#2a2a3e";
            let bg = "#12121a";
            if (showExplanation && selected && isCorrect) { borderColor = "#4ecdc4"; bg = "#4ecdc411"; }
            else if (showExplanation && selected && !isCorrect) { borderColor = "#e94560"; bg = "#e9456011"; }
            else if (showExplanation && isCorrect) { borderColor = "#4ecdc466"; bg = "#4ecdc408"; }
            else if (selected) { borderColor = domainCol.light; bg = `${domainCol.accent}15`; }

            return (
              <div key={idx} onClick={() => selectAnswer(q.id, idx)} style={{ padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${borderColor}`, background: bg, cursor: showExplanation ? "default" : "pointer", fontSize: 14, lineHeight: 1.6, color: selected ? "#e0e0e0" : "#aaa", transition: "all 0.15s", }}>
                {opt}
                {showExplanation && isCorrect && <span style={{ marginLeft: 8, fontSize: 12, color: "#4ecdc4" }}>✓ Correct</span>}
                {showExplanation && selected && !isCorrect && <span style={{ marginLeft: 8, fontSize: 12, color: "#e94560" }}>✗</span>}
              </div>
            );
          })}
        </div>

        {showExplanation && (
          <div style={{ marginTop: 20, padding: "16px 18px", background: "#1a1a2e", borderRadius: 10, border: "1px solid #2a2a3e", fontSize: 13, lineHeight: 1.7, color: "#bbb" }}>
            <strong style={{ color: "#f0c040" }}>Explanation:</strong> {q.explanation}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0a0a0fee", borderTop: "1px solid #1e1e30", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} style={{ padding: "8px 18px", fontSize: 13, background: "#1e1e30", color: current === 0 ? "#444" : "#ccc", border: "1px solid #2a2a3e", borderRadius: 8, cursor: current === 0 ? "default" : "pointer" }}>
            ← Prev
          </button>
          <button onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1} style={{ padding: "8px 18px", fontSize: 13, background: "#1e1e30", color: current === questions.length - 1 ? "#444" : "#ccc", border: "1px solid #2a2a3e", borderRadius: 8, cursor: current === questions.length - 1 ? "default" : "pointer" }}>
            Next →
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!showExplanation && (
            <button onClick={toggleFlag} style={{ padding: "8px 18px", fontSize: 13, background: flagged.has(q.id) ? "#f0c04022" : "#1e1e30", color: flagged.has(q.id) ? "#f0c040" : "#888", border: `1px solid ${flagged.has(q.id) ? "#f0c04044" : "#2a2a3e"}`, borderRadius: 8, cursor: "pointer" }}>
              {flagged.has(q.id) ? "⚑ Flagged" : "⚐ Flag"}
            </button>
          )}
          {!showExplanation && (
            <button onClick={submitExam} style={{ padding: "8px 24px", fontSize: 13, fontWeight: 600, background: totalAnswered === questions.length ? "linear-gradient(135deg, #e94560, #c7254e)" : "#2a2a3e", color: totalAnswered === questions.length ? "#fff" : "#888", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Submit ({totalAnswered}/{questions.length})
            </button>
          )}
          {showExplanation && (
            <button onClick={() => setPhase("results")} style={{ padding: "8px 24px", fontSize: 13, fontWeight: 600, background: "#1e1e30", color: "#ccc", border: "1px solid #2a2a3e", borderRadius: 8, cursor: "pointer" }}>
              Back to Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
