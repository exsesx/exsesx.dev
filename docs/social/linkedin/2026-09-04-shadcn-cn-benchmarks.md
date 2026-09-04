# I tried shadcn's new cn on my site

Scheduled: Not scheduled
Status: Ready; article enabled for the next site deployment
URL: https://exsesx.dev/blog/en/shadcn-cn-benchmarks?utm_source=linkedin&utm_medium=social&utm_campaign=blog_2026_09&utm_content=shadcn_cn
Image: public/images/og/blog/shadcn-cn-benchmarks-en.png

The URL above is the intended publication URL. Deploy the article before using
this copy. No LinkedIn post has been sent or scheduled.

## Post

I replaced the usual clsx + tailwind-merge helper on my site with shadcn's new cn.

The replacement was one line. In my first Node benchmark, repeated string
arguments went from about 234 ns to 11 ns per call. With fresh conditional
objects, the gap was smaller: 288 ns versus 139 ns.

With 300,000 unique arbitrary widths, cn took about 39% longer. Bun showed the
same pattern, and a full rerun kept the same ordering in both runtimes.

Longer warmup and measurement runs changed the ratios again. These are synthetic
helper benchmarks; I haven't measured a page-speed improvement.

I kept the change on my site. The article covers the inputs, the one-line
migration, and the default package's gzip-size trade-off. I've included the
benchmark script and every run's raw results so you can repeat it.

Available in English and Ukrainian:
https://exsesx.dev/blog/en/shadcn-cn-benchmarks?utm_source=linkedin&utm_medium=social&utm_campaign=blog_2026_09&utm_content=shadcn_cn
