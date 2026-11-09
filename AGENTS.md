# Together, Apart. — Proximity Without Dependence

This repository holds the research atlas for ARCH 6004, a multigenerational housing proposal at Southwark Grounds on Kaurna Country, Adelaide, near Winwood and Holland. The atlas should help a reader move from a source, through a specific finding, to a decision that can be tested in plan or section.

## Design position

Give priority to related households living in independent dwellings, each with its own front door and domestic routine. The XL dwelling explores generations sharing one home. Treat this hierarchy as a working proposition. Use the latest dated drawing and Adam’s latest explicit decision. If they conflict, identify the discrepancy and its spatial consequence.

| Driver | Question to test in the drawing |
| --- | --- |
| DEFINE — Domestic Independence | Where does private territory begin? Can each household arrive, cook, rest and receive a visitor independently? |
| EXTEND — Domestic Territory | What can someone do in the alcove, verandah, balcony or front yard? Show furniture, the door swing and the clear path past it. |
| MEDIATE — Collective Relationships | Where can someone meet, pause, pass or withdraw? Who controls the choice? |

The working six-storey scheme tests S beside M and above L. XL may span two levels. Verify dimensions, bedroom counts and dwelling mix against current plans. For a vertical pairing, trace the journey between actual front doors by lift and stair. Keep the single-loaded walkway passable when the entry is occupied. Test furniture, sightlines and daily activities before adding partitions to a sparse plan.

## Research and classification

Use [100 Points of Research in Notion](https://app.notion.com/p/d7491c0a79fa4720b5332f0ec267ea73) as the sole source for atlas research records and chapter reading lists. For each refresh, match every published record by its stable Notion page ID, refresh its display number and properties, and exclude unmatched or archived rows. Publish the curated snapshot to GitHub Pages after verification. Each row holds one research point. A paper or built project can support several points. Both the default table and Research Point List sort by **Display Number**, ascending. Preserve that number when tracing a finding back to Notion.

| Existing Notion fields | How to use them |
| --- | --- |
| Type, Research Method | Record what the source is and how evidence was gathered. A journal article can report interviews or analyse a precedent. |
| Theme, Research Threads | Start housing searches with **Housing + Care**, **Multigenerational Living** and **Domestic Agency + Thresholds**. Check the individual finding for relevance. |
| Citation / Link, Page / Location, Evidence / Quote | Give the original source and the page, figure or drawing that supports the claim. Preserve the distinction between a quotation and a paraphrase. |
| Reliability | Retain the recorded rating of High, Medium, Low or Unassessed. Explain limitations relevant to the particular finding. |
| Key Insight, Application to Design | State what the evidence supports, then describe the implication for Southwark Grounds and the drawing that could test it. |
| Exegesis Collection, Argument Claim | Use the collection to locate material in the exegesis. Earlier argument tags reflect The Civic Skin. Carry them forward only where the original claim applies. |

Prioritise substantive Australian papers, reports and documented built projects. Use international precedents where they clarify a design decision. Keep the earlier T1 façade research centre available for the exegesis history. Keep ARCH 5004 documentation separate.

## Site navigation and exegesis

Use four main pages in this order: Home, Exegesis, Research and About. Home keeps its opening title, question and courtyard image, followed by the scrollable illustrated overview. Each chapter heading and contents item links to the corresponding chapter subpage.

Exegesis presents the complete public-facing manuscript as one continuous read. Provide individually addressable chapters in the same order: Position, Research, Design approach, Development, Proposal and Reflection. Keep each chapter consistent with its passage in the continuous version. Include relevant project images, captions and further reading drawn from the atlas. Keep draft production notes and private source links out of the public document.

Research retains its dashboard, six-question framework and source filters. Place architectural implications inside their research entries. About holds Adam’s short profile and verified social links. Add further accounts when Adam supplies the URLs.

## Website drawing files

The published website is maintained in `hingstonadam/together-apart-atlas` on GitHub. Its static structure (`index.html`, `atlas.css`, `atlas.js`, chapter directories and `assets/`) is the authority for website code.

The local asset workspace is `C:\Users\adamh\OneDrive - University of Adelaide\Architecture\1. PROJECTS\(M) Graduate Project\HousingResearchAtlas\Website`.

```text
Website/
  Images/
    Home/                 Original PNG masters for Home
      Optimized/          Generated JPEG copies for publication
    Exegesis/
      Introduction/
      Full Exegesis/      Position, Research, Design-Approach,
                          Development, Proposal, Reflection
  Publish/                Prepared files from the latest repository update
  image-map.json          Source filenames, destinations and placements
  README.md               Local update workflow
```

| Home master in Images/Home | Website destination | Placement |
| --- | --- | --- |
| Cover Image.png | assets/renders/home-cover.jpg | Home hero |
| 01_Position.png | assets/renders/home-position.jpg | Home Position section |
| 04_Development.png | assets/diagrams/home-development.jpg | Home Development section |

Regenerate the matching JPEG under `Images/Home/Optimized/` whenever a master changes. Keep the complete image proportions for chapter figures. The Research, Design approach, Proposal and Reflection PNGs currently contain placeholder instructions; replace those masters with final artwork before publishing them.

Keep source masters in OneDrive and publish optimised copies to the existing repository asset directories. Fetch the latest repository files before preparing an update; `Publish/` is a partial update package, not a complete checkout. Record source-to-destination mappings in `Website/image-map.json`. Update image references, captions and alt text in the relevant pages. Keep relative paths compatible with the GitHub Pages repository subpath. OneDrive changes require a corresponding GitHub commit before they appear online.

The local `HousingResearchAtlas/src/`, `build.mjs` and `dist/` belong to the separate research workspace prototype. Changes there do not update this public website. Retain editable Revit, Rhino and InDesign originals in their existing project locations. Keep the established diagram paths `assets/diagrams/{define,extend,mediate}.webp` available to existing pages.

## Six-question framework

Show all six questions on the Research page in their original order, with a short explanation of how each evaluates a data point. Use the same headings for the answers in every entry. The headings come from the [6 Question Template](https://app.notion.com/p/3bb501e23466803a81a8ee00e0ed63b4). For housing entries, frame relevance around proximity, household independence and control over daily contact.

| Question | What the answer should establish |
| --- | --- |
| 01 — What is it? | Identify the source, project or observation and its context. |
| 02 — Why is it relevant? | Explain which part of the project inquiry this point informs. |
| 03 — What did I learn? | Give a specific finding and identify the evidence that supports it. |
| 04 — What does it challenge? | Name the assumption that the finding calls into question and explain why. |
| 05 — What does it connect to? | Link a related data point, reading, site observation or drawing and explain the relationship. |
| 06 — What could architecture do with this? | Translate the finding into one spatial decision or design test. State what to check in plan or section. |

## Research entry format

1. **Header.** Show the data point number (`Display Number`), title (`Research Point`), Type and Method (`Research Method`), followed by Date collected. Use the Notion collection timestamp in Adelaide local time. Show “Not recorded” when the collection date is missing. Preserve earlier manuscript reference numbers when the live register is renumbered. Keep the original number when sorting or filtering.
2. **Key insight.** Lead with the finding in one or two sentences. Follow it with a direct quotation when the source provides relevant, verifiable wording. Credit the source and give the page, figure or location where available. Render paraphrases as ordinary prose.
3. **Six answers.** Show each numbered question with its own answer. Use the Notion entry body and supporting properties. Keep gaps visible as “Not yet recorded” and preserve open questions. Never infer a missing number, method, quotation or answer.

## Research dashboard

Make the interactive visualisation the main element of the research dashboard. Let readers choose the field to explore. Start with **Research Method** as a pie chart and offer **Type** and **Reliability** as alternative breakdowns. Count individual data points from the same published dataset used by the entry list. Include an “Unrecorded” category for missing values.

Selecting a slice or its keyboard-accessible legend item filters the list by that exact field and value. For example, selecting **Precedent analysis** shows entries whose Research Method is Precedent analysis. Show the active filter and matching count, and provide a clear control to remove it. Keep other categories available so readers can switch directly between them. Changing the breakdown clears the previous chart selection and preserves independent search filters. The selected category count must match the number of displayed entries.

## Atlas content and publishing

- Organise browsing around adaptable layouts, relationships between dwelling sizes, shared circulation, and independence within shared territory.
- In research entries, show location, documented dwelling mix, access strategy, shared spaces, evidence quality and the architectural implication. Mark missing facts as “Unknown” and keep each citation attached to its finding.
- Distinguish **confirmed evidence**, **tentative interpretation** and **open question**. A landing drawn beside two doors establishes proximity. A claim about residents regularly meeting there needs evidence of use.
- Relate findings to DEFINE, EXTEND or MEDIATE and link the design argument to its supporting sources in the Exegesis.
- Keep the site compatible with static hosting on GitHub Pages and its repository subpath. Use a curated snapshot for publication. Check navigation, assets, filters and chapter links from the deployed base path when changing them. Keep unpublished research and credentials out of public assets.

## Drawings and editorial work

Write in Australian English, use metric units and retain the project’s terminology. For critique, identify the most consequential weakness and propose a change Adam can test in Revit, Rhino/Grasshopper, InDesign or D5 as appropriate.

Use three identical plan fragments for DEFINE / EXTEND / MEDIATE. Keep scale and orientation fixed and change only the overlay. Use the latest agreed household colours and distinguish a route from a place where someone stops. For the poster, follow the latest Montserrat layout on one portrait sheet, B0 maximum, with a reading hierarchy at roughly 6 m, 1 m and 0.5 m.

The T3 review is scheduled for 13 November 2026. Prioritise dwelling relationships, routes between front doors, inhabited thresholds and lived-in interiors for that review. Refresh the milestone from the current brief or Adam’s direction once it passes.
