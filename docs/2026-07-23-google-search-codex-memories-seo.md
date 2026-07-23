# Google visibility for the Codex Memories article

**Date:** 2026-07-23  
**URL:** <https://exsesx.dev/blog/en/codex-memories>

## Conclusion

The most likely explanation is ordinary discovery and indexing lag: the article declares
that it was published today, while Google says new content can take a few days to enter
the index and a crawl request can take from a few days to a few weeks
([live article](https://exsesx.dev/blog/en/codex-memories);
[Google Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en);
[Google recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)).
This is an inference, not a confirmed diagnosis; only Search Console's URL Inspection
report can show what Google currently knows about this exact URL
([Google URL Inspection guidance](https://support.google.com/webmasters/answer/12482179?hl=en)).

An exact-title search is not a deterministic indexing test: Google ranks results using
many signals and generates title links automatically from the `<title>`, visible title,
headings, links, and other page signals
([How Google Search works](https://developers.google.com/search/docs/fundamentals/how-search-works);
[Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)).

## Live-verified production state

- At 2026-07-23 15:08 UTC, the English article returned HTTP `200` without an
  `X-Robots-Tag`; its rendered HTML had a self-referencing canonical URL, English and
  Ukrainian alternates, and no `noindex` directive
  ([live article](https://exsesx.dev/blog/en/codex-memories)).
- The visible H1 is “How I use Codex Memories between coding sessions,” while the HTML
  `<title>` is “How I use Codex Memories in 0.145.0: config, tools, and workflow | Oleh
  Vanin”; this is not an indexing blocker, although Google may choose either signal when
  forming the result title
  ([live article](https://exsesx.dev/blog/en/codex-memories);
  [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)).
- `robots.txt` allows the site and declares the sitemap
  ([live robots.txt](https://exsesx.dev/robots.txt)).
- The live sitemap contains both locale URLs and their alternates with a
  `2026-07-23T08:30:00.000Z` `lastmod`
  ([live sitemap](https://exsesx.dev/sitemap.xml)).
- The deployed English Blog index links to the article with a standard `<a href>`
  ([live Blog index](https://exsesx.dev/blog/en)); Google recommends that every important
  page be linked from at least one other page with a crawlable link
  ([Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).

These public checks establish technical crawlability, not Google indexing; Google says
that meeting its technical requirements makes a page eligible for indexing but does not
guarantee indexing
([Google Search technical requirements](https://developers.google.com/search/docs/essentials/technical)).

## Prioritized actions

1. **Inspect the exact canonical URL in Search Console now.** Check “URL is on Google,”
   last crawl, page fetch, “Indexing allowed?”, and Google-selected canonical; if the
   crawl date is empty, run **Test live URL** and then **Request indexing**
   ([Google URL Inspection guidance](https://support.google.com/webmasters/answer/12482179?hl=en)).
2. **Confirm `https://exsesx.dev/sitemap.xml` in Search Console's Sitemaps report.** The
   public sitemap is already correct, but the report reveals whether Google fetched and
   processed it; sitemap submission is only a hint and cannot guarantee crawling or
   indexing
   ([Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)).
3. **Submit one indexing request, then wait rather than repeatedly resubmitting.** Google
   says repeated requests do not accelerate crawling, inclusion is not guaranteed, and
   to allow at least a week after a sitemap or indexing request before assuming a problem
   ([Google recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl);
   [Google missing-page guidance](https://support.google.com/webmasters/answer/7474347?hl=en)).
4. **If Search Console says the URL is indexed, measure instead of relying on one manual
   search.** Filter the Performance report by this page and the target query to inspect
   impressions and clicks; rare or anonymized queries may be omitted
   ([Google Performance report guidance](https://support.google.com/webmasters/answer/17011259?hl=en)).
5. **Only if the page is indexed but gets no relevant impressions, revisit relevance.**
   Keep the visible title, `<title>`, and article focus mutually consistent; if this exact
   phrase is the target, a coherent option is “How I use Codex Memories between coding
   sessions (Codex 0.145.0),” while avoiding keyword stuffing
   ([Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)).
   Add genuine contextual links from the homepage or related Codex article, and continue
   emphasizing firsthand workflow evidence, concrete examples, original analysis, and
   clear authorship
   ([Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable);
   [Google people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).

## Search Console-only unknowns

The public site cannot reveal Google's index status, last crawl, rendered crawl result,
Google-selected canonical, sitemap processing history, manual actions, or query
impressions; those require the verified Search Console property
([Google URL Inspection guidance](https://support.google.com/webmasters/answer/12482179?hl=en);
[Google Performance report guidance](https://support.google.com/webmasters/answer/17011259?hl=en)).
