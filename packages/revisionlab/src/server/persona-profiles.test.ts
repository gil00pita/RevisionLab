import assert from "node:assert/strict";
import test from "node:test";
import { builtInPersonaSuggestions } from "../persona-template-suggestions.js";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";

test("basic personas and all built-in templates become editable, unvalidated profiles", async (t) => {
  const f = await reviewFixture(t);
  const basic = await f.call("personas", "POST", { name: "Just a name" });
  assert.equal(basic.status, 201);
  const basicId = (await basic.json()).id;
  const state = await f.state();
  assert.equal(state.personas[0].researchStatus, "Assumption-Based");
  assert.equal(state.personas[0].confidenceLevel, "Not Assessed");
  const empty = await (await f.call(`personas/${basicId}/profile`)).json();
  assert.ok(empty.sections.some((item: { id: string }) => item.id === "standard:goals"));
  assert.equal(empty.values.length, 0);

  assert.equal(builtInPersonaSuggestions.length, 10);
  for (const [index, template] of builtInPersonaSuggestions.entries()) {
    const response = await f.call("personas", "POST", { name: `${template.name} ${index}`, templateId: template.id });
    assert.equal(response.status, 201);
    const { id } = await response.json();
    const profile = await (await f.call(`personas/${id}/profile`)).json();
    assert.ok(profile.values.filter((value: { fieldId: string }) => value.fieldId === "standard:primary-goals").length >= 5);
    assert.ok(profile.values.every((value: { illustrative: boolean }) => value.illustrative));
    assert.equal(profile.evidence.length, 0);
  }
});

test("attribute IDs and evidence survive editing; roles and validation protect profile writes", async (t) => {
  const f = await reviewFixture(t);
  const id = (await (await f.call("personas", "POST", { name: "Research subject" })).json()).id;
  const commenter = await f.login("commenter");
  assert.equal((await f.call(`personas/${id}/profile`, "GET", undefined, commenter)).status, 200);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: "standard:primary-goals", value: "Finish onboarding" }, commenter)).status, 403);
  const created = await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: "standard:primary-goals", value: "Finish onboarding" });
  assert.equal(created.status, 200);
  const valueId = (await created.json()).id;
  const evidence = await f.call(`personas/${id}/profile`, "POST", { action: "evidence.add", title: "Interview notes", type: "Interview", valueIds: [valueId] });
  assert.equal(evidence.status, 200);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "value.update", id: valueId, fieldId: "standard:primary-goals", value: "Complete onboarding" })).status, 200);
  const profile = await (await f.call(`personas/${id}/profile`)).json();
  assert.equal(profile.values.find((value: { id: string }) => value.id === valueId).value, "Complete onboarding");
  assert.deepEqual(profile.evidence[0].valueIds, [valueId]);
  assert.ok(profile.activity.some((item: { action: string }) => item.action.includes("Primary goals")));
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "metadata", personaType: "Secondary", researchStatus: "Partially Validated", confidenceLevel: "Medium", lastValidatedAt: "2026-10-08" })).status, 200);
  assert.equal((await f.state()).personas[0].researchStatus, "Partially Validated");
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: "standard:technical-comfort", value: 7 })).status, 400);
  const number = await f.call(`personas/${id}/profile`, "POST", { action: "field.add", sectionId: "standard:behaviours", name: "Skill score", type: "number", validation: { min: 1, max: 3 } });
  assert.equal(number.status, 200);
  const numberId = (await number.json()).id;
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: numberId, value: 4 })).status, 400);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: numberId, value: 2 })).status, 200);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "field.update", id: numberId, sectionId: "standard:behaviours", name: "Skill score", type: "number", validation: { min: 1, max: 1 } })).status, 400);
  const secondGoal = await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: "standard:primary-goals", value: "Share results", position: 1 });
  const secondGoalId = (await secondGoal.json()).id;
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "value.move", id: secondGoalId, direction: "up" })).status, 200);
  const reordered = await (await f.call(`personas/${id}/profile`)).json();
  assert.deepEqual(reordered.values.filter((value: { fieldId: string }) => value.fieldId === "standard:primary-goals").map((value: { id: string }) => value.id), [secondGoalId, valueId]);
  assert.deepEqual(reordered.evidence[0].valueIds, [valueId]);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "evidence.link", evidenceId: reordered.evidence[0].id, valueId: secondGoalId })).status, 200);
  assert.deepEqual((await (await f.call(`personas/${id}/profile`)).json()).evidence[0].valueIds.sort(), [secondGoalId, valueId].sort());
});

test("custom sections, shared fields, templates, and private files persist without copying evidence", async (t) => {
  const f = await reviewFixture(t);
  const first = (await (await f.call("personas", "POST", { name: "First" })).json()).id;
  const second = (await (await f.call("personas", "POST", { name: "Second" })).json()).id;
  const section = await f.call(`personas/${first}/profile`, "POST", { action: "section.add", name: "Research", shared: true });
  assert.equal(section.status, 200);
  const sectionId = (await section.json()).id;
  const field = await f.call(`personas/${first}/profile`, "POST", { action: "field.add", name: "Technical proficiency", type: "rating", sectionId, shared: true });
  assert.equal(field.status, 200);
  const fieldId = (await field.json()).id;
  const secondProfile = await (await f.call(`personas/${second}/profile`)).json();
  assert.ok(secondProfile.fields.some((item: { id: string }) => item.id === fieldId));
  assert.equal((await f.call(`personas/${second}/profile`, "POST", { action: "value.add", fieldId, value: 2 })).status, 200);
  const matches = await (await f.call(`personas/filters?fieldId=${fieldId}&operator=lte&value=2`)).json();
  assert.ok(matches.fields.some((item: { id: string }) => item.id === fieldId));
  assert.deepEqual(matches.personaIds, [second]);
  assert.equal((await f.call(`personas/${first}/profile`, "POST", { action: "field.update", id: fieldId, name: "Technical proficiency", type: "short-text", sectionId, shared: true })).status, 409);

  const upload = await f.call(`personas/${first}/files`, "POST", { name: "research.png", data: TEST_PNG });
  assert.equal(upload.status, 201);
  const artifactId = (await upload.json()).artifactId;
  const fileField = await f.call(`personas/${first}/profile`, "POST", { action: "field.add", name: "Research file", type: "file", sectionId, shared: false });
  const fileFieldId = (await fileField.json()).id;
  assert.equal((await f.call(`personas/${first}/profile`, "POST", { action: "value.add", fieldId: fileFieldId, value: `artifact:${artifactId}` })).status, 200);
  assert.equal((await f.call(`artifacts/${artifactId}`)).status, 200);
  assert.equal((await f.call(`personas/${second}/profile`, "POST", { action: "value.add", fieldId: fileFieldId, value: `artifact:${artifactId}` })).status, 404);

  const custom = await f.call("personas/templates", "POST", { name: "Reusable research", sourcePersonaId: first });
  assert.equal(custom.status, 201);
  const templateId = (await custom.json()).id;
  const templates = await (await f.call("personas/templates")).json();
  const saved = templates.saved.find((item: { id: string }) => item.id === templateId);
  assert.ok(saved.profile.fields.some((item: { id: string }) => item.id === fileFieldId));
  assert.ok(saved.profile.values.every((item: { value: string }) => !String(item.value).startsWith("artifact:")));
  const third = await f.call("personas", "POST", { name: "Third", templateId });
  assert.equal(third.status, 201);
  const thirdProfile = await (await f.call(`personas/${(await third.json()).id}/profile`)).json();
  assert.equal(thirdProfile.evidence.length, 0);
  assert.ok(thirdProfile.fields.some((item: { name: string }) => item.name === "Research file"));
});

test("profile values, files, and templates participate in workspace history", async (t) => {
  const f = await reviewFixture(t);
  const id = (await (await f.call("personas", "POST", { name: "History" })).json()).id;
  await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: "standard:primary-goals", value: "Initial" });
  await f.call(`personas/${id}/profile`, "POST", { action: "value.add", fieldId: "standard:primary-goals", value: "Later" });
  const change = (await (await f.call("history")).json()).history[0];
  assert.equal((await f.call(`history/${change.id}/restore`, "POST", {})).status, 200);
  const profile = await (await f.call(`personas/${id}/profile`)).json();
  assert.deepEqual(profile.values.map((item: { value: string }) => item.value), ["Initial"]);
});

test("feedback can be linked once to a persona without changing research status", async (t) => {
  const f = await reviewFixture(t);
  const id = (await (await f.call("personas", "POST", { name: "Reviewer" })).json()).id;
  const comment = await f.call("comments", "POST", { route: "/", body: "Navigation was confusing" });
  assert.equal(comment.status, 201);
  const feedbackId = `comment:${(await comment.json()).id}`;
  const body = { action: "evidence.add", title: "Navigation feedback", type: "Feedback", feedbackId, valueIds: [] };
  assert.equal((await f.call(`personas/${id}/profile`, "POST", body)).status, 200);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", body)).status, 409);
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { ...body, feedbackId: "comment:missing" })).status, 404);
  const profile = await (await f.call(`personas/${id}/profile`)).json();
  assert.equal(profile.evidence.length, 1);
  assert.equal(profile.evidence[0].feedbackId, feedbackId);
  assert.equal((await f.state()).personas[0].researchStatus, "Assumption-Based");
});

test("editing a copied template changes future personas only", async (t) => {
  const f = await reviewFixture(t);
  const builtIn = builtInPersonaSuggestions[0];
  const original = await f.call("personas", "POST", { name: "Original", templateId: builtIn.id });
  const originalId = (await original.json()).id;
  const created = await f.call("personas/templates", "POST", { name: "Edited copy", sourceTemplateId: builtIn.id });
  assert.equal(created.status, 201);
  const templateId = (await created.json()).id;
  const template = (await (await f.call("personas/templates")).json()).saved.find((item: { id: string }) => item.id === templateId);
  assert.ok(template.profile.values.length > 0);
  template.profile.values[0].value = "Revised goal";
  assert.equal((await f.call(`personas/templates/${templateId}`, "PATCH", { name: template.name, description: "Revised", profile: template.profile })).status, 200);
  const later = await f.call("personas", "POST", { name: "Later", templateId });
  assert.equal(later.status, 201);
  const laterId = (await later.json()).id;
  const earlierProfile = await (await f.call(`personas/${originalId}/profile`)).json();
  const laterProfile = await (await f.call(`personas/${laterId}/profile`)).json();
  assert.notEqual(earlierProfile.values.find((item: { fieldId: string }) => item.fieldId === "standard:primary-goals").value, "Revised goal");
  assert.equal(laterProfile.values.find((item: { fieldId: string }) => item.fieldId === "standard:primary-goals").value, "Revised goal");
});

test("pre-profile workspace snapshots restore persona defaults and standard fields", async (t) => {
  const f = await reviewFixture(t);
  const id = (await (await f.call("personas", "POST", { name: "Legacy history" })).json()).id;
  await f.call("settings", "PATCH", { widgetColor: "purple" });
  const entry = (await (await f.call("history")).json()).history[0];
  const row = (await f.client.execute({ sql: "SELECT snapshot_json FROM workspace_history WHERE id = ?", args: [entry.id] })).rows[0];
  const snapshot = JSON.parse(String(row.snapshot_json));
  for (const key of Object.keys(snapshot)) if (key.startsWith("persona_") && key !== "personas") delete snapshot[key];
  for (const key of ["persona_type", "template_id", "research_status", "confidence_level", "last_validated_at", "created_by", "updated_by"]) delete snapshot.personas[0][key];
  await f.client.execute({ sql: "UPDATE workspace_history SET snapshot_json = ? WHERE id = ?", args: [JSON.stringify(snapshot), entry.id] });
  assert.equal((await f.call(`history/${entry.id}/restore`, "POST", {})).status, 200);
  const persona = (await f.state()).personas[0];
  assert.equal(persona.researchStatus, "Assumption-Based");
  assert.equal(persona.confidenceLevel, "Not Assessed");
  const profile = await (await f.call(`personas/${id}/profile`)).json();
  assert.ok(profile.fields.some((item: { id: string }) => item.id === "standard:primary-goals"));
});

test("explicit template reapplication retains evidence links and research status", async (t) => {
  const f = await reviewFixture(t);
  const id = (await (await f.call("personas", "POST", { name: "Template user", templateId: builtInPersonaSuggestions[0].id })).json()).id;
  const original = await (await f.call(`personas/${id}/profile`)).json();
  const value = original.values.find((item: { fieldId: string }) => item.fieldId === "standard:primary-goals");
  await f.call(`personas/${id}/profile`, "POST", { action: "evidence.add", title: "Interview", type: "Interview", valueIds: [value.id] });
  await f.call(`personas/${id}/profile`, "POST", { action: "metadata", personaType: "Primary", researchStatus: "Partially Validated", confidenceLevel: "Medium", lastValidatedAt: null });
  assert.equal((await f.call(`personas/${id}/profile`, "POST", { action: "template.reset" })).status, 200);
  const profile = await (await f.call(`personas/${id}/profile`)).json();
  assert.ok(profile.values.length > 0);
  assert.ok(!profile.values.some((item: { id: string }) => item.id === value.id));
  assert.deepEqual(profile.evidence[0].valueIds, [value.id]);
  assert.equal((await f.state()).personas[0].researchStatus, "Partially Validated");
});
