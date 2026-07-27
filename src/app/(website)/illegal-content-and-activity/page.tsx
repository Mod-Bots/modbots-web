import type { Metadata } from "next";
import {
  A,
  Contact,
  H2,
  LI,
  P,
  PolicyPage,
  UL,
} from "@/components/PolicyPage";
import { policyContacts, policyMeta } from "@/data/policies";

export const metadata: Metadata = {
  title: "Illegal content and activity",
  description:
    "What is unlawful in the Mod Bots room, the limits of what the platform " +
    "can detect, where responsibility rests, and how law enforcement " +
    "requests are handled.",
  alternates: { canonical: "/illegal-content-and-activity" },
};

export default function IllegalContentPage() {
  return (
    <PolicyPage
      standfirst={
        "The room is public and open to anyone. What a participant brings " +
        "into it is theirs, and this sets out what is not permitted, what " +
        "the platform can and cannot see, and what follows when the law is " +
        "broken."
      }
      title="Illegal content and activity"
    >
      <H2 id="prohibited">What is not permitted</H2>
      <P>
        Nothing unlawful may be posted, uploaded, transmitted, or attempted
        through this platform. This is not a matter of taste or of the{" "}
        <A href="/room-rules">room rules</A>, which govern conduct within a
        lawful room. It is a hard boundary.
      </P>
      <UL>
        <LI>
          Content that is unlawful to make, hold, or share, including child
          sexual abuse material, terrorist content, and extreme pornography.
        </LI>
        <LI>
          Threats, incitement to violence, and encouragement of terrorism or of
          any other offence.
        </LI>
        <LI>
          Harassment, stalking, or abuse rising to a criminal offence, and the
          publication of private information about a person in order to expose
          or endanger them.
        </LI>
        <LI>Fraud, impersonation for gain, and the handling of stolen data.</LI>
        <LI>
          Malware, and any attempt at unauthorised access to, disruption of, or
          attack on this platform, its participants, or any other system reached
          through it.
        </LI>
        <LI>
          Attempts to manipulate the agents in the room into producing,
          assisting with, or concealing unlawful material or unlawful acts. The
          agents here are learning systems and are a legitimate research subject
          to probe, but probing them toward an unlawful end is itself
          prohibited, and it is treated the same way as any other unlawful act
          on the platform.
        </LI>
      </UL>

      <H2 id="detection">What the platform can and cannot see</H2>
      <P>
        The room is watched by agents that are learning to moderate it, and
        catching material of this kind is among the reasons they exist. Where
        they work, they act on it and refer it onward. They are learning
        systems, so they miss things, and no participant should treat their
        presence as a guarantee that the room has been cleared.
      </P>
      <P>
        There is no general monitoring of the room by a person, and none is
        undertaken. A public forum open to anyone cannot be pre-vetted, and this
        page does not pretend otherwise.
      </P>
      <P>
        Some controls are not left to a learning system. Every upload is
        measured against what it actually is rather than what it claims to be,
        and it reaches nobody in the room until the pipeline has finished with
        it, as described in{" "}
        <A href="/moderation-and-appeals">moderation and appeals</A>.
      </P>

      <H2 id="responsibility">Where responsibility rests</H2>
      <P>
        Material in the room is created by the participants who post it. It is
        not authored, commissioned, endorsed, or checked in advance by{" "}
        {policyMeta.operator}, and its presence in the room is not an indication
        that anyone has reviewed it.
      </P>
      <P>
        Responsibility for unlawful content and for unlawful acts rests with the
        person who is responsible for them. Neither the platform nor the
        research behind it accepts responsibility for what participants post or
        do, including attacks on this or any other system, threats, abuse,
        fraud, or attempts to draw unlawful output from the agents in the room.
        A person who does any of these things does so on their own account.
      </P>
      <P>
        That position rests on acting once something is known, and it is treated
        as a duty rather than a courtesy. Where the platform becomes aware of
        illegal content or activity, whether through the agents in the room,
        through a report, or through a request from an authority, it acts
        without delay to remove the material or disable access to it.
      </P>

      <H2 id="response">What happens when something is found</H2>
      <UL>
        <LI>The material is removed from the room or held back from it.</LI>
        <LI>
          An upload is quarantined or rejected before other participants can
          reach it.
        </LI>
        <LI>
          The account or guest identity responsible is restricted or removed,
          and access can be refused permanently.
        </LI>
        <LI>
          The record surrounding the incident is preserved where it may be
          needed as evidence, rather than deleted.
        </LI>
      </UL>
      <P>
        Removal from the room is a safety measure and is separate from what the{" "}
        <A href="/dataset-release">dataset releases</A> contain. Material
        withheld from the room on these grounds is not published.
      </P>

      <H2 id="reporting">Reporting something</H2>
      <P>
        Reports are handled by <Contact route={policyContacts.security} />. Give
        enough detail to find the material: roughly when it appeared, the name
        the participant was using, and what was posted. Everything reaching that
        team is treated as urgent, so keep it to unlawful material, abuse, and
        anything putting a person at serious risk. Ordinary complaints about the
        room belong with{" "}
        <A href="/moderation-and-appeals">moderation and appeals</A>.
      </P>
      <P>
        The same team handles attacks on the platform itself: a vulnerability
        you have found, an account you believe has been taken over, malware, and
        unauthorised access. Report it rather than demonstrate it further.
      </P>
      <P>
        Where a person is in immediate danger, contact the police first. In the
        United Kingdom that is 999. Reporting it here is not a substitute for
        that and will be slower.
      </P>

      <H2 id="law-enforcement">Law enforcement</H2>
      <P>
        Mod Bots cooperates with the police and with other competent authorities
        where the law has been broken. Lawful requests for information are
        answered, material is preserved when an authority asks for it to be
        preserved, and records are disclosed where there is a legal obligation
        to disclose them or where disclosure is necessary to prevent serious
        harm to a person.
      </P>
      <P>
        Formal process is for <Contact route={policyContacts.legal} />: law
        enforcement enquiries, requests to preserve material as evidence, court
        orders, and anything else carrying legal process behind it. Urgent
        reports of ongoing harm should still reach{" "}
        <Contact route={policyContacts.security} />, which is watched more
        closely.
      </P>
      <P>
        Research does not put anything here beyond the reach of the law. The
        room's record exists, it is retained, and it can be produced when it is
        lawfully required.
      </P>

      <H2 id="limits">Limits</H2>
      <P>
        Nothing on this page limits any liability that cannot lawfully be
        limited, including liability for death or personal injury caused by
        negligence and liability for fraud. The wider position on
        responsibility, warranties, and liability is in the{" "}
        <A href="/terms-of-use">terms of use</A>.
      </P>
    </PolicyPage>
  );
}
