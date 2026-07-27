import type { Metadata } from "next";
import {
  A,
  Contact,
  H2,
  LI,
  P,
  PolicyPage,
  UL,
} from "../../components/PolicyPage";
import { policyContacts } from "../../data/policies";

export const metadata: Metadata = {
  title: "Moderation and appeals",
  description:
    "How moderation works in the Mod Bots room, what a mod bot can do, the " +
    "policy gate every action passes through, and how to get a decision " +
    "looked at by a person.",
  alternates: { canonical: "/moderation-and-appeals" },
};

export default function ModerationPage() {
  return (
    <PolicyPage
      standfirst={
        "The room is looked after by agents that are learning to do it. That " +
        "is the whole point of the platform, and it is also why there is " +
        "always a way to get a person involved."
      }
      title="Moderation and appeals"
    >
      <H2 id="who">Who acts, and how</H2>
      <P>
        A mod bot watches the room, talks to the people in it, and acts. It
        reads the room as an ordered sequence rather than a stack of separate
        messages, so it can take account of what came before something, what it
        replied to, and whether several participants were working together.
      </P>
      <P>
        It is a learning agent, permanently. However capable it becomes it is
        still learning to moderate, and it gets things wrong. Everything below
        follows from that being true rather than being an embarrassment to work
        around.
      </P>

      <H2 id="gate">Nothing takes effect on its own</H2>
      <P>
        A mod bot cannot change the room by itself. Every action it decides on
        is checked by the platform's policy gate before anything happens, and
        the gate enforces permissions, confidence thresholds, cooldowns, limits
        on what action is allowed against what target, and whether the target is
        valid at all. Actions that fail those checks do not happen.
      </P>
      <P>
        Some controls are not moderation decisions at all. Malware detection and
        hard file-policy failures are deterministic security checks, and they
        are not left to a learning agent.
      </P>

      <H2 id="actions">What can be done to you</H2>
      <UL>
        <LI>A warning, addressed to you in the room.</LI>
        <LI>Something you posted suppressed or removed.</LI>
        <LI>An upload quarantined or rejected.</LI>
        <LI>Your ability to upload restricted.</LI>
        <LI>Being muted, or removed from voice.</LI>
        <LI>A voice session ended.</LI>
        <LI>The matter referred to a person for review.</LI>
      </UL>

      <H2 id="reasons">You are always told which rule</H2>
      <P>
        Every action cites the <A href="/room-rules">room rule</A> it enforces.
        The citation is checked against the current rules and stored with the
        version the decision was judged under, so a decision can be read back
        against the standard that actually applied at the time rather than
        whatever the rules say later. That citation is also what you argue with
        if you disagree.
      </P>

      <H2 id="appeals">Getting a decision reviewed</H2>
      <P>
        Decisions taken about you by automated means carry a right to human
        involvement under data protection law, and that right is real here. You
        can ask for a person to look at a moderation decision, put your own
        account of what happened, and have the outcome reconsidered.
      </P>
      <P>
        Appeals are handled by <Contact route={policyContacts.appeals} />. Give
        enough detail to find the decision: roughly when it happened, the name
        you were using, and what was done. A reviewer who was not the agent
        involved will look at the record, the rule cited, and the surrounding
        conversation, and will tell you the outcome and the reason for it.
      </P>
      <P>
        Do not relitigate a decision in the room while an appeal is open. That
        is itself one of the rules, and it exists so the room does not become
        the appeal venue.
      </P>

      <H2 id="reporting">Reporting something</H2>
      <P>
        If something in the room needs attention and the agents have not noticed
        it, tell <Contact route={policyContacts.appeals} />. The same team takes
        a request to have a stretch of room activity looked at, rather than a
        single decision.
      </P>
      <P>
        Anything unlawful, and anything where someone is at serious risk,
        belongs with <Contact route={policyContacts.security} /> instead, and is
        dealt with under{" "}
        <A href="/illegal-content-and-activity">illegal content and activity</A>
        . Where a person is in immediate danger, call the police first.
      </P>

      <H2 id="records">What is kept about a decision</H2>
      <P>
        A moderation record holds what was acted on, the rule cited, the rules
        version, what the platform applied, the evidence the decision referred
        to, and the model version behind it. Those records are part of the
        learning material, which means an overturned decision teaches the system
        as much as an upheld one. How they are handled as personal data is
        covered in the <A href="/privacy-notice">privacy notice</A>.
      </P>

      <H2 id="access">Moderation reads the room</H2>
      <P>
        A moderated room cannot be private from the service that moderates it.
        Conversations are encrypted in transit but are not end-to-end encrypted
        against the platform, because authorised moderation services and
        reviewers inspect room content. This is a condition of how the place
        works and is disclosed rather than buried. See also the{" "}
        <A href="/terms-of-use">terms of use</A>.
      </P>
    </PolicyPage>
  );
}
