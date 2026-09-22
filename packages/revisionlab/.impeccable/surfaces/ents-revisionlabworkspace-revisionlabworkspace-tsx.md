---
version: 1
slug: "ents-revisionlabworkspace-revisionlabworkspace-tsx"
primary_target: "packages/revisionlab/src/components/RevisionLabWorkspace/RevisionLabWorkspace.tsx"
related_targets: ["packages/revisionlab/src/components/FlowBoard","packages/revisionlab/src/components/PinnedScreen","packages/revisionlab/src/components/FeedbackThread"]
---

# Flow whiteboard and pinned feedback

Scope: the existing embedded workspace's flow review surface. Mode: Operate.

Reviewers need to understand the recorded journey, then discuss an exact area of one captured screen. Owners/editors can arrange the screen cards and describe explicit branches; commenters can inspect and discuss without editing the graph.

Inherit the existing white paper, navy tools, blue selections, and Chakra component vocabulary. The default flow view is a spatial whiteboard with actual captured screens and directional connectors. Recorded order produces solid arrows; labelled manual connections use dashed arrows and never imply discovered navigation. Keep flow, persona, and version visible.

Open a card to inspect the uncropped screen, click its image to draft a normalized pin, and use the adjacent discussion for comments/replies. Pins remain attached to the exact historical screenshot. Provide keyboard placement with percentage fields, labelled pin buttons, drag handles with arrow-key movement, native scrolling/panning, and zoom controls. On mobile the discussion follows the image and selection brings it into view.

Persist board layout and discussions through the existing SQLite/libSQL API. Board edits autosave with a quiet waiting/saving/saved status, recoverable failures, and explicit conflict recovery. Undo replaces the manual Save/Discard controls and reverses grouped local board operations, including edits already saved. Internal navigation waits for pending saves; comments and recording controls retain explicit submission. Reject stale revisions. Keep automatic action replay, inferred branches, and DOM-element re-anchoring outside this increment. There are no unresolved visual-world decisions; full graph obstacle avoidance is not promised.
