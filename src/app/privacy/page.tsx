import type { Metadata } from "next";
import {
  A,
  H2,
  H3,
  LI,
  P,
  PolicyPage,
  Row,
  Rows,
  UL,
} from "../../components/PolicyPage";
import { policyMeta } from "../../data/policies";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "Who is responsible for personal data on Mod Bots, what is collected, " +
    "the lawful basis for it, how long it is kept, and your rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      standfirst={
        "Mod Bots is a research platform. Almost everything it collects is " +
        "personal data, and this notice says who holds it, why they are " +
        "allowed to, and what you can do about it."
      }
      title="Privacy notice"
    >
      <H2 id="controller">Who is responsible</H2>
      <Rows>
        <Row term="Controller">{policyMeta.controller}</Row>
        <Row term="Research at">{policyMeta.institution}</Row>
        <Row term="Contact">{policyMeta.postalAddress}</Row>
        <Row term="Applies to">
          modbots.ai, the Mod Bots chatroom, and the desktop application
        </Row>
      </Rows>

      <H2 id="collected">What is collected</H2>
      <P>
        The room is the research instrument, so what happens in it is recorded
        rather than sampled. Six categories cover it.
      </P>

      <H3>Identity</H3>
      <P>
        Registered participants have a unique username, an optional display
        name, a discriminator, and a stored password verifier or an identifier
        from the sign-in provider. Guests give or receive a display name only.
        Every participant, guest or registered, is held under an opaque internal
        identifier that is not derived from the name.
      </P>

      <H3>What you contribute</H3>
      <P>
        Messages, images, files, recorded audio and video, and live voice, in
        the order they happened, together with what each contribution replied to
        or referred to and who it addressed. Display names chosen by guests are
        treated as contributed content.
      </P>

      <H3>What the machines derive from it</H3>
      <P>
        Uploaded and spoken material is processed into forms a model can learn
        from: extracted text, captions, safety labels, perceptual hashes,
        embeddings, and timestamped transcripts. Each derived record carries the
        processor and model version that produced it.
      </P>

      <H3>Moderation records</H3>
      <P>
        What a mod bot acted on, the rule it cited, the version of the rules it
        was judged under, what the platform applied, and the evidence the
        decision referred to.
      </P>

      <H3>Technical records</H3>
      <P>
        IP address, connection and session records, and service telemetry, kept
        for security, abuse prevention, and keeping the platform running.
      </P>

      <H3>Analytics</H3>
      <P>
        Aggregate usage measurement through Google Analytics, and only if you
        allow analytics cookies. Nothing is measured if you decline. See the{" "}
        <A href="/cookies">cookie notice</A>.
      </P>

      <H2 id="basis">The lawful basis</H2>
      <Rows>
        <Row term="Public task">
          Article 6(1)(e). The research itself: collecting room activity and
          using it to develop and evaluate moderation agents, as academic
          research carried out at {policyMeta.institution}.
        </Row>
        <Row term="Contract">
          Article 6(1)(b). Creating your account, signing you in, and giving you
          access to the room.
        </Row>
        <Row term="Legitimate interests">
          Article 6(1)(f). Security, abuse prevention, and service integrity.
          The interest is keeping a public room safe and usable.
        </Row>
        <Row term="Consent">
          Article 6(1)(a) and the Privacy and Electronic Communications
          Regulations. Analytics cookies only.
        </Row>
      </Rows>
      <P>
        Consent is deliberately not the basis for the research. Consent under
        data protection law has to be freely given and freely withdrawn, and
        resting a research record on it would mean the lawfulness of years of
        collected material could evaporate participant by participant. Public
        task is the appropriate basis and is the standard one for university
        research. That is a separate question from research ethics, where your
        informed agreement is still required and still yours to withdraw. How
        that works is set out in{" "}
        <A href="/research-participation">research participation</A>.
      </P>

      <H3>Sensitive categories</H3>
      <P>
        Conversation is not tidy. What people say in a room can reveal health,
        religious or philosophical belief, political opinion, racial or ethnic
        origin, trade union membership, or sexual orientation, whether or not
        anyone intended it to. Where that happens the processing relies on
        Article 9(2)(j), processing necessary for research purposes, with the
        safeguards required by Article 89(1) and the Data Protection Act 2018.
      </P>
      <P>
        Voice needs saying separately. Raw live audio is not retained by
        default. If speaker attribution were ever used to recognise a particular
        person rather than to separate one speaker from another, it would be
        biometric data used for identification. That will not be switched on
        without separate explicit consent and an updated version of this notice
        published before it starts.
      </P>

      <H2 id="recipients">Who receives it</H2>
      <UL>
        <LI>
          The platform's own services: the room backend, media processing
          workers, bot runtimes, and the machine learning service.
        </LI>
        <LI>
          Infrastructure providers that host the platform and store its objects,
          acting on instructions and under contract.
        </LI>
        <LI>
          Google, for analytics, and only if you have allowed analytics cookies.
        </LI>
        <LI>
          Named academic collaborators, under agreement, where the research
          requires it.
        </LI>
        <LI>
          Anyone at all, through the published datasets. This is the recipient
          that matters most and the one people overlook, so it is stated
          plainly: material from the public room is released openly, and once a
          release is out it is in the hands of whoever downloaded it. What a
          release contains, and what it deliberately leaves out, is set out in{" "}
          <A href="/data">dataset releases</A>.
        </LI>
      </UL>

      <H2 id="transfers">Transfers outside the United Kingdom</H2>
      <P>
        Analytics data reaches Google in the United States, under the UK
        extension to the EU-US Data Privacy Framework and the standard
        contractual clauses where the framework does not apply. Published
        datasets can be downloaded from anywhere, which means release decisions
        are made on the assumption that the material is worldwide and permanent.
      </P>

      <H2 id="retention">How long it is kept</H2>
      <P>
        This is a development deployment and content is retained for research
        use. Separate retention and deletion schedules for original uploads,
        derived material, transcripts, embeddings, moderation evidence, and
        datasets are being defined and will be published in this notice before
        any non-local deployment. Technical records are kept for as long as they
        are useful for security and no longer.
      </P>
      <P>
        Deletion propagates. When something is removed it is removed from the
        derived records and excluded from later releases, not only hidden in the
        room.
      </P>

      <H2 id="automated">Decisions taken about you by machines</H2>
      <P>
        Mod bots are learning agents. They watch the room, talk to the people in
        it, and act, and the actions available to them include warning you,
        removing something you posted, restricting your uploads, muting you, and
        removing you from voice. Every one of those passes through the
        platform's policy gate before it takes effect, and each cites the rule
        it enforces.
      </P>
      <P>
        You are entitled to know the logic behind that, to have a human look at
        a decision, to give your side of it, and to challenge the outcome. How
        to do each of those is in{" "}
        <A href="/moderation">moderation and appeals</A>.
      </P>

      <H2 id="rights">Your rights</H2>
      <UL>
        <LI>Access: a copy of what is held about you.</LI>
        <LI>Rectification: correction of what is wrong.</LI>
        <LI>Erasure: deletion, within the limits below.</LI>
        <LI>Restriction: a pause on processing while something is disputed.</LI>
        <LI>Objection: to processing carried out under public task.</LI>
        <LI>Portability: your data in a reusable form, where it applies.</LI>
        <LI>
          Complaint: to the {policyMeta.supervisoryAuthority}, at{" "}
          <A href={policyMeta.supervisoryAuthorityUrl}>ico.org.uk</A>, at any
          time and without going through us first.
        </LI>
      </UL>
      <P>
        Two honest limits. Research processing carries exemptions under Schedule
        2 of the Data Protection Act 2018 where meeting a request in full would
        prevent or seriously impair the research, and where that applies it will
        be explained rather than used silently. And a dataset that has already
        been published cannot be recalled from people who downloaded it. What
        can be done, and will be, is removal from the live record, from the
        derived data, and from every subsequent release.
      </P>
      <P>
        To exercise any of these, write to {policyMeta.controller} at{" "}
        {policyMeta.postalAddress}.
      </P>

      <H2 id="changes">Changes</H2>
      <P>
        This notice is versioned. Material changes are published here with a new
        version number before the practice they describe begins, not after.
      </P>
    </PolicyPage>
  );
}
