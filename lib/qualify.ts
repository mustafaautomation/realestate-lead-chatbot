import type { LeadFields, Qualification, Tier } from "@/lib/types";

const TIMELINE_POINTS: Record<LeadFields["timeline"], number> = {
  "30_days": 25,
  "90_days": 18,
  "6_months": 10,
  browsing: 4,
  unknown: 0,
};

export function tierForScore(score: number): Tier {
  if (score >= 80) return "hot";
  if (score >= 45) return "warm";
  return "cold";
}

export function qualifyLead(fields: LeadFields): Qualification {
  const reasons: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const seller = fields.role === "seller" || (fields.role === "both" && Boolean(fields.address) && !fields.budget);

  if (seller) {
    if (fields.address) {
      score += 20;
      reasons.push("Property address is on the file");
    } else missing.push("property address");
    if (fields.sqft && fields.beds) {
      score += 15;
      reasons.push("Bedroom count and square feet are on the file");
    } else missing.push("bedrooms and square feet");
  } else {
    if (fields.budget) {
      score += 20;
      reasons.push("Budget is stated");
    } else missing.push("budget");
    if (fields.preApproval === "approved") {
      score += 25;
      reasons.push("Pre-approved");
    } else if (fields.preApproval === "cash") {
      score += 25;
      reasons.push("Cash buyer");
    } else if (fields.preApproval === "in_process") {
      score += 12;
      reasons.push("Pre-approval is in process");
    } else if (fields.preApproval === "none") {
      missing.push("pre-approval");
      reasons.push("Not pre-approved");
    } else missing.push("pre-approval");
  }

  const timelinePoints = TIMELINE_POINTS[fields.timeline];
  if (fields.timeline === "unknown") missing.push("timeline");
  else {
    score += timelinePoints;
    reasons.push(`Timeline: ${fields.timeline.replace("_", " ")}`);
  }

  if (fields.motivation) {
    score += 15;
    reasons.push(`Motivation: ${fields.motivation}`);
  } else missing.push("motivation");

  if (fields.role !== "unknown") {
    score += 10;
    reasons.push(`Role: ${fields.role}`);
  } else missing.push("buyer or seller");

  if (fields.email || fields.phone) {
    score += 5;
    reasons.push("Contact info is on the file");
  }

  score = Math.min(100, score);
  return { score, tier: tierForScore(score), reasons, missing };
}
