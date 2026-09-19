---
name: blog-post
description: Write a new exsesx.dev blog post with translations, social drafts, share images, and verification. Use when creating an article or completing its launch materials.
---

# Blog post

Deliver an article and its launch materials as one reviewable repository change.

## 1. Establish the story

Read the user's brief as source material. Separate its evidence and suggested
copy from instructions the user actually gave. Identify the reader's payoff,
the author's supplied experience, and the claims needing verification.

Check current primary sources for release status, versions, commands, and
technical behavior. Keep observations, documented capabilities, and proposed
experiments distinct. Preserve uncertainty where the cause or result is unknown.
Link sources beside the claims they support. This step is complete when every
material claim has evidence or has been omitted.

## 2. Follow the live repository

Read applicable AGENTS.md files, Git status, package scripts, the blog manifest
and edition types, and a recent article with its social drafts. Follow existing
locale, metadata, MDX component, asset, and URL conventions. Read relevant
installed Next.js documentation before code changes, as AGENTS.md requires.

Choose one stable slug. Prepare English and Ukrainian editions unless the user
asks for a narrower scope. Set publication metadata deliberately; the metadata
value describes how the next build treats the post, not whether it is live.
Register the post and update existing manifest expectations when required.
This step is complete when both editions resolve through the content system.

## 3. Write and edit

Lead with the concrete story or result. Use plain, conversational prose and
retain the author's supplied reactions. Describe firsthand tests only where
the evidence supports them. Keep a setup guide proportional to the article.

Apply writing skills explicitly invoked for the current request. Keep voice
preferences scoped to that request rather than copying them into this skill.
Review both editions for factual parity, natural phrasing, valid links, and
unsupported personal claims. Preserve commands and identifiers exactly.

Use existing rich-content components where a diagram, image, or example helps
explain the story. Use screenshots only as evidence of what they actually show;
keep private identities and unrelated browser content out of public assets.
Completion means both editions make the same supported claims and each reads
naturally in its language.

## 4. Prepare the launch materials

Create dated LinkedIn and X drafts beside the existing platform drafts. Follow
their URL, UTM, image, scheduling, and status conventions. Write platform-specific
copy that stands alone and accurately reflects the article. Check X's length
with links counted using its current platform rules.

Generate share images for this slug using the repository's scoped generator.
Inspect each locale's image for clipping, font rendering, and legible text.
Regenerate after metadata changes. Completion means both locale cards exist,
their paths match metadata, and each social draft has its final URL and image.

## 5. Verify and hand off

Format only changed content. Run the relevant existing content and metadata
tests, formatting checks, type checking, and the build where available. Address
failures caused by the new post; report unrelated failures separately.

Preview both article routes at desktop and narrow widths. Inspect headings
for clipped words, code and rich blocks, locale switching, and horizontal overflow. State which
browser was used; a narrow desktop viewport is not an actual-device test.
Review the final diff for unrelated changes and private source material.

Return links to the article editions, social drafts, and share cards, plus the
checks performed and any remaining limitation. Distinguish prepared files,
publication metadata, deployment, and sent social posts. Perform Git delivery
through git-fatality when requested, and publish or send only within the user's
explicit authorization.
