import type { Metadata } from "next";
import {
  A,
  H2,
  LI,
  P,
  PolicyPage,
  Row,
  Rows,
  UL,
} from "../../components/PolicyPage";
import { policyMeta } from "../../data/policies";

export const metadata: Metadata = {
  title: "Research participation",
  description:
    "What the Mod Bots study is, what taking part involves, what is " +
    "published, how to withdraw, and who to complain to.",
  alternates: { canonical: "/research" },
};

export default function ResearchPage() {
  return (
    <PolicyPage
      standfirst={
        "Taking part in the room is taking part in a study. This page is the " +
        "information you are owed before you decide to, written to be read " +
        "rather than clicked past."
      }
      title="Research participation"
    >
      <H2 id="study">The study</H2>
      <Rows>
        <Row term="Researcher">{policyMeta.controller}</Row>
        <Row term="Institution">{policyMeta.institution}</Row>
        <Row term="Ethics">
          Approved by the research ethics process at {policyMeta.institution}
        </Row>
        <Row term="Contact">{policyMeta.postalAddress}</Row>
      </Rows>

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
        This study runs a public chatroom as the environment in which that can
        actually be watched, and uses what happens there to develop and evaluate
        agents that learn to moderate. The reasoning behind the choice of a
        chatroom is set out in <A href="/why">why Mod Bots exists</A>.
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
        <A href="/privacy">privacy notice</A>.
      </P>

      <H2 id="published">What is published</H2>
      <P>
        Material from the room is released as open datasets so that the findings
        can be checked by people who had no part in producing them. This is the
        part to be clear-eyed about. A release is public, it is downloadable
        from anywhere, and it cannot be recalled from the people who have it.
        What a release contains and the conditions attached to using it are set
        out in <A href="/data">dataset releases</A>.
      </P>
      <P>
        A public room is public in the ordinary sense too. Assume what you say
        can be read, quoted, and kept.
      </P>

      <H2 id="voluntary">It is voluntary, and so is stopping</H2>
      <P>
        You choose whether to take part and you can stop at any moment by
        leaving. You do not have to give a reason, and nothing follows from
        stopping.
      </P>
      <P>
        You can also ask for what you contributed to be withdrawn. It will be
        removed from the room, from the derived data, and from every subsequent
        release. The one thing that cannot be undone is a release already
        published, for the reason above. That limit is the honest boundary of
        withdrawal here, and it is stated up front rather than discovered later.
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
          are learning. That is the point of the study, and the reason there is
          a route to a human.
        </LI>
      </UL>

      <H2 id="benefits">What you get out of it</H2>
      <P>
        Nothing is paid and nothing is promised. What the study produces goes
        into the open, which is the closest thing to a direct benefit on offer:
        the data and the findings become available to anyone working on the same
        problem.
      </P>

      <H2 id="complaints">If you are unhappy</H2>
      <P>
        Raise it with {policyMeta.controller} at {policyMeta.postalAddress}. If
        that does not resolve it, the research ethics process at{" "}
        {policyMeta.institution} will take a complaint about the conduct of the
        study. For anything about your personal data specifically, you can go
        directly to the {policyMeta.supervisoryAuthority} at{" "}
        <A href={policyMeta.supervisoryAuthorityUrl}>ico.org.uk</A> without
        raising it here first.
      </P>
    </PolicyPage>
  );
}
