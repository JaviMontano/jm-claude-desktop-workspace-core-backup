---
name: rag-memory-curator
description: Curate durable `rag-memory-*` files for JM Labs tasks. Use whenever an input, attachment, ephemeral note, conversation snippet, or admin repair step must be preserved so the workspace can recover context even if the original artifact disappears.
---

# RAG Memory Curator

Use this skill to turn transient input into compact, durable task memory.

## First reads

1. Read `/Users/deonto/jm-claude-desktop-workspace-core/CLAUDE.md`.
2. Read the target task folder if it already exists.

## Memory contract

Every `rag-memory-*` must preserve:

- metadata for source, timestamp, and resolution mode
- `Key Insights`
- `Key Takeaways`
- transcription or clear description of the original input
- references to copied attachments or artifacts when present

## Writing discipline

1. Preserve the original meaning before compressing it.
2. Make the memory independently useful without the original attachment.
3. Prefer concrete nouns, names, paths, and decisions over vague summaries.
4. Record uncertainty explicitly when the input is partial or ambiguous.

## Output format

```text
Memory target: <task path>
Captured: <insights and takeaways preserved>
Missing or uncertain: <what could not be recovered>
References: <attachments or related artifacts>
```

## Hard boundaries

- Do not replace transcription with pure summary.
- Do not drop file references when attachments were provided.
- Do not invent certainty that is absent from the source input.
