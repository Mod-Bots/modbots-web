import type { Metadata } from "next";
import {
  A,
  Contact,
  H2,
  LI,
  P,
  PolicyPage,
  UL,
} from "@/components/website/PolicyPage";
import { policyContacts } from "@/data/policies";

export const metadata: Metadata = {
  title: "Research participation",
  description:
    "What the Mod Bots research is, what taking part involves, what is " +
    "published, and what agreeing to take part commits you to.",
  alternates: { canonical: "/research-participation" },
};

export default function ResearchPage() {
  return (
    <PolicyPage
      standfirst={
        "Being in the room is taking part in research. This page is the " +
        "information you are owed before you decide to, written to be read " +
        "rather than clicked past."
      }
      title="Research participation"
    >
      <H2 id="about">What it is about</H2>
      <P>
        Moderation research has largely been done inside closed platforms, on
        material nobody outside them can examine, at a moment when the thing
        being moderated is changing shape. People no longer talk only to people.
        They talk alongside AI-assisted humans, conversational bots, and agents
        acting for someone else, and a moderator now has to read who or what
        produced something, whom it was aimed at, and whether several
        participants were working together.
      </P>
      <P>
        This research runs a public chatroom as the environment in which that
        can actually be watched, and uses what happens there to develop and
        evaluate agents that learn to moderate. The reasoning behind the choice
        of a chatroom is set out in{" "}
        <A href="/why-mod-bots-exists">why Mod Bots exists</A>.
      </P>

      <H2 id="involves">What taking part involves</H2>
      <P>
        Using the room. There is no task, no questionnaire, and nothing to
        complete. You join as a guest or as a registered participant, you talk,
        and what happens is recorded as ordinary room activity. There is no
        separate session and no minimum or maximum involvement.
      </P>

      <H2 id="collected">What is recorded about you</H2>
      <UL>
        <LI>
          What you contribute, in order, with what it replied to and whom it
          addressed.
        </LI>
        <LI>Uploads and, where voice is used, what is said in it.</LI>
        <LI>
          Machine representations derived from that material, each stamped with
          the model that produced it.
        </LI>
        <LI>
          Moderation actions involving you, the rule cited, and what followed.
        </LI>
        <LI>
          Whether you were a guest or a registered participant at the time.
        </LI>
      </UL>
      <P>
        The full detail, including the lawful basis for each purpose, is in the{" "}
        <A href="/privacy-notice">privacy notice</A>.
      </P>

      <H2 id="published">What is published</H2>
      <P>
        Material from the room is released as open datasets so that the findings
        can be checked by people who had no part in producing them. This is the
        part to be clear-eyed about. A release is public, it is downloadable
        from anywhere, and it cannot be recalled from the people who have it.
        What a release contains and the conditions attached to using it are set
        out in <A href="/dataset-release">dataset releases</A>.
      </P>
      <P>
        A public room is public in the ordinary sense too. Assume what you say
        can be read, quoted, and kept.
      </P>

      <H2 id="voluntary">Taking part is voluntary</H2>
      <P>
        You choose whether to take part, and you can stop at any time by
        leaving. You do not have to give a reason, and nothing follows from
        stopping.
      </P>
      <P>
        Agreement to take part is given by taking part, and it governs what
        happens from that point onward. Stopping ends your further
        participation. It does not withdraw what has already been recorded.
      </P>
      <P>
        The room is captured as one continuous record of how conversations
        developed, and it is studied as a body rather than as material belonging
        to separate individuals. One participant's contributions cannot be
        lifted out of it without leaving the surrounding exchanges responding to
        things that are no longer there, which destroys the record rather than
        correcting it. This is a condition of taking part, which is why it is
        set out before you decide rather than after.
      </P>

      <H2 id="risks">What could go wrong</H2>
      <UL>
        <LI>
          The room is public and moderated, so what you post is read by other
          participants and by authorised moderation services. It cannot be
          private from the service moderating it.
        </LI>
        <LI>
          Conversation can reveal more about a person than they intended.
          Anything you disclose becomes part of the record.
        </LI>
        <LI>
          Guests are anonymous to other participants but not to the platform,
          and an anonymous handle is not the same as being unidentifiable in a
          body of your own writing.
        </LI>
        <LI>
          Moderation acts on you, sometimes wrongly, because the agents doing it
          are learning. That is the point of the research, and the reason there
          is a route to a human.
        </LI>
      </UL>

      <H2 id="benefits">What you get out of it</H2>
      <P>
        Nothing is paid and nothing is promised. What the research produces goes
        into the open, which is the closest thing to a direct benefit on offer:
        the data and the findings become available to anyone working on the same
        problem.
      </P>

      <H2 id="help">If you need help</H2>
      <P>
        Questions about taking part are for the research team,{" "}
        <Contact route={policyContacts.research} />: what participation
        involves, telling them you want to stop, something in the room that
        worried you, or a question about a published dataset. Anything else
        about the platform or your account is for{" "}
        <Contact route={policyContacts.support} />.
      </P>
      <P>
        What is recorded, and what becomes of it, is part of what you agree to
        by taking part. It is set out in the{" "}
        <A href="/privacy-notice">privacy notice</A>, and reading it before you
        decide is the point of it being there.
      </P>
    </PolicyPage>
  );
}
