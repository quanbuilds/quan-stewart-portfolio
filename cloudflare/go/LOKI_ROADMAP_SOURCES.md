# Loki's business-stage guidance

Reviewed 2026-10-17. `src/loki-roadmap.js` contains original, short summaries of
Acquisition.com's public Scaling Roadmap. These are a source-grounded reasoning
lens, not a claim that Loki is affiliated with or endorsed by Alex Hormozi,
Leila Hormozi, or Acquisition.com. The AI uses are TideLine's adaptations.
The guides are not model training data; the summaries are runtime context.

Official course index: https://www.acquisition.com/training/scalingstart

The public PDF source prefix is:
`https://www.acquisition.com/hubfs/0-100M%20Scaling%20Course%20PDFs%20%28v6%29/`

| Stage | Original guide filename | Pages checked | Focus retained | TideLine AI adaptation |
|---|---|---|---|---|
| 0 Improvise | Your_ACQ_100MScalingRoadmap-Stage0_.pdf | 5-8 | Find useful demand through small trials and feedback. | Draft interview questions and sort feedback. |
| 1 Monetize | Your_ACQ_100MScalingRoadmap-Stage01_.pdf | 5-8 | Make a useful paid offer and collect a first real payment. | Turn feedback into clear offer wording and objection drafts. |
| 2 Advertise | Your_ACQ_100MScalingRoadmap-Stage02_.pdf | 5-8 | Repeat a working acquisition activity and track results. | Draft message variations; compare replies and purchases. |
| 3 Stabilize | Your_ACQ_100MScalingRoadmap-Stage03_.pdf | 5-8 | Fix a recurring customer problem and train help; reduce unused tools. | Turn an owner walkthrough into a short checklist. |
| 4 Prioritize | Your_ACQ_100MScalingRoadmap-Stage04_.pdf | 5-8 | Serve best-fit customers; improve shared information and follow-up. | Sort inquiries, draft follow-ups and flag unassigned work. |
| 5 Productize | Your_ACQ_100MScalingRoadmap-Stage05_.pdf | 5-8 | Consistent delivery and a relevant premium next offer for current customers. | Summarize needs and draft training and offer experiments. |
| 6 Optimize | Your_ACQ_100MScalingRoadmap-Stage06_.pdf | 5-8 | Improve efficiency, training, measurement and access protection. | Compare outcomes and surface exceptions for review. |
| 7 Categorize | Your_ACQ_100MScalingRoadmap-Stage07_.pdf | 5-8 | Organize overwhelmed functions, records and spending accountability. | Classify requests and prepare team summaries. |
| 8 Specialize | Your_ACQ_100MScalingRoadmap-Stage08_.pdf | 5-8 | Specialist roles and consistent cross-team customer experience. | Draft role-specific instructions and flag conflicting answers. |
| 9 Capitalize | Your_ACQ_100MScalingRoadmap-Stage09_.pdf | 5-8 | Evaluate new growth avenues while protecting the core. | Assemble scenarios and diligence questions from supplied evidence. |

Use the owner's current constraint, not headcount alone. Do not require revenue
or staff numbers before offering a useful first action. Explain things simply
without dumbing down the decision. These principles inform advice at all stages;
Loki should not turn the conversation into a roadmap quiz.

AI help must specify input, expected output, a copy-ready prompt and a human
check. Drafting is available in the conversation. Inbox/calendar reads, software
writes and recurring monitoring require an actual connected capability; this
public audit does not have those capabilities. Never invent their execution.

# PDF renderer dependency

The browser serves `signallabs/vendor/jspdf-4.2.1.umd.min.js`, obtained from the
npm `jspdf@4.2.1` package. The upstream license is adjacent. The text-only renderer
uses no HTML conversion, external uploads or dynamic code. PDFs include only
allowlisted report fields and the owner's business description. They exclude
access tokens and raw conversation history. Open and Download use the same
locally created PDF, regenerated when the report changes or is restored.


# TideLine PDF design references

The generated PDF uses the current public TideLine site's Playfair Display and
IBM Plex Sans, its navy/ice palette, existing boat asset and wave motif. The
landscape action spreads borrow the scan order from the owner's existing
operations proposal and at-a-glance partnership brief; the Voyage cockpit
informs clear priority/check/recovery distinctions. Older SignalLabs black/gold
materials were reviewed as layout references, not used to replace TideLine's
current identity.

`signallabs/loki-pdf-brand.js` embeds Latin font subsets and a resized copy of
the existing boat asset for local PDF rendering. Font sources are Google Fonts'
`google/fonts` repositories for Playfair Display and IBM Plex Sans; OFL licenses
are in `signallabs/vendor/fonts/`. No external font request or upload is needed
when a visitor opens or downloads a plan.
