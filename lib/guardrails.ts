const CLASS =
  "(?:black|white|hispanic|latino|latina|latinx|asian|african[- ]american|jewish|muslim|christian|catholic|immigrant|immigrants|foreigners?|gay|lesbian|transgender|disabled|disability|handicapped|single mothers|section 8)";

const FEATURE_ALLOW =
  /\b(?:white|black)\s+(?:oak|kitchen|kitchens|cabinet|cabinets|appliance|appliances|counter|counters|countertop|countertops|trim|quartz|marble|granite|fridge|refrigerator|hardware|window|windows|door|doors)\b/gi;

export const STEERING_REPLY =
  "I can't help with that. Summit Ridge follows the Fair Housing Act, so I don't steer buyers toward or away from neighborhoods, and I don't comment on protected characteristics or on who lives in an area. I also won't rank schools or safety, because those rankings are often a stand-in for demographics. I can compare homes by price, bedrooms, property type, and the features of the house. What budget and bedroom count should I use?";

export const SCHOOL_DISCLAIMER =
  "I don't rank schools or describe a neighborhood by who lives there. School quality is often used as a stand-in for demographics, which this desk will not do. Official district pages are the place for enrollment data. I can still compare homes by price, size, type, and the property itself.";

export const INJECTION_REPLY =
  "I only help with Summit Ridge listings, the published notes, and scheduling. I can't change those instructions or set aside the Fair Housing rules.";

export const OFF_TOPIC_REPLY =
  "I stay on Summit Ridge home search: listings, neighborhoods, fees, financing basics, valuations, and showings. I can't help with that other topic.";

export const HANDOFF_REPLY =
  "I'll hand this to a person on the Summit Ridge desk. This is a portfolio demo, so nobody is actually paged. The ticket is on the admin desk with a short summary.";

export const LOW_CONFIDENCE_REPLY =
  "I don't have that in the brokerage notes, so I won't guess. I'll hand it to a person on the desk. This is a portfolio demo, so nobody is actually paged.";

export type GuardDecision =
  | { action: "allow"; schoolDisclaimer: boolean }
  | { action: "refuse"; category: "steering" | "school_proxy" | "injection" | "off_topic"; reply: string };

function isOffTopic(text: string): boolean {
  const off = /\b(weather|forecast|temperature|super bowl|world series|write (?:me )?a (?:python|javascript|poem)|recipe for|song lyrics|homework|stock price|bitcoin)\b/i.test(text);
  if (!off) return false;
  return !/\b(bed|listing|condo|showing|tour|buy|sell|mortgage|commission|budget)\b/i.test(text);
}

function stripped(message: string): string {
  return message.replace(FEATURE_ALLOW, " ");
}

export function screenMessage(message: string): GuardDecision {
  const text = stripped(message);
  if (
    /\bignore (?:all |any |previous |prior |your )?instructions\b/i.test(text) ||
    /\b(system prompt|developer message|jailbreak)\b/i.test(text) ||
    /\bbypass (?:the )?fair housing\b/i.test(text) ||
    /\byou are now\b/i.test(text)
  ) {
    return { action: "refuse", category: "injection", reply: INJECTION_REPLY };
  }

  if (isOffTopic(text)) {
    return { action: "refuse", category: "off_topic", reply: OFF_TOPIC_REPLY };
  }

  const steering = [
    new RegExp(String.raw`\b(?:avoid|without|fewer|less|no|not too many|too many|away from|don't want|do not want|exclude|only)\b[\s\S]{0,48}\b${CLASS}\b`, "i"),
    new RegExp(String.raw`\b${CLASS}\b[\s\S]{0,60}\b(?:neighborhoods?|areas?|communities|community|part of town|side of town|schools?|families|people)\b`, "i"),
    /\b(?:demographic|racial makeup|ethnic makeup|who lives|what race|percentage of)\b/i,
    /\badults?[-\s]only\b|\bno kids neighborhood\b|\bchild-?free (?:neighborhood|area|community)\b/i,
    /\b(?:safe|safest|low crime|high crime)\b[\s\S]{0,40}\b(?:neighborhood|area|for)\b/i,
  ];
  if (steering.some((pattern) => pattern.test(text))) {
    return { action: "refuse", category: "steering", reply: STEERING_REPLY };
  }

  const schoolProxy = [
    new RegExp(String.raw`\b(?:good|best|top|bad|worst|quality|highly rated)\s+schools?\b[\s\S]{0,80}\b(?:because|so that|so we|avoid|demographic|race|racial|${CLASS})\b`, "i"),
    new RegExp(String.raw`\bschools?\b[\s\S]{0,50}\b(?:to avoid|without|fewer|proxy|stand-in|stand in)\b[\s\S]{0,40}\b${CLASS}\b`, "i"),
    new RegExp(String.raw`\b${CLASS}\b[\s\S]{0,40}\bschools?\b`, "i"),
  ];
  if (schoolProxy.some((pattern) => pattern.test(text))) {
    return { action: "refuse", category: "school_proxy", reply: STEERING_REPLY };
  }

  const schoolRank = /\b(?:best|worst|top|good|bad|great|highly rated|quality)\s+schools?\b/i.test(text) || /\bschools?\b[\s\S]{0,24}\b(?:ratings?|ranked|quality)\b/i.test(text);
  return { action: "allow", schoolDisclaimer: schoolRank };
}

const OUTPUT_BLOCK = [
  /\b(?:mostly|predominantly|percent|percentage)\b[\s\S]{0,40}\b(?:white|black|hispanic|asian|immigrant)/i,
  /\b(?:white|black|hispanic|asian)\s+(?:neighborhood|area|families|people|community)\b/i,
  /\byou(?:'d| would) fit in\b/i,
  /\b(?:best|top-rated|highly rated|good) schools?\b[\s\S]{0,40}\b(?:in|at|near)\b/i,
  /\bthis neighborhood has (?:good|great|the best) schools\b/i,
];

export function outputViolatesFairHousing(text: string): boolean {
  return OUTPUT_BLOCK.some((pattern) => pattern.test(text));
}

export function enforceOutput(text: string): string {
  if (outputViolatesFairHousing(text)) return STEERING_REPLY;
  return text;
}
