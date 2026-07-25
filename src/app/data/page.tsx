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
  title: "Dataset releases",
  description:
    "What a Mod Bots dataset release contains, the licence it carries, the " +
    "conditions on using it, and what is deliberately left out.",
  alternates: { canonical: "/data" },
};

export default function DataPage() {
  return (
    <PolicyPage
      standfirst={
        "The room produces the material this research runs on, and that " +
        "material is published rather than kept. These are the terms it goes " +
        "out under."
      }
      title="Dataset releases"
    >
      <H2 id="status">Current status</H2>
      <P>
        There is nothing to download yet. The first release is being prepared,
        and when it is ready it will appear on this page with its coverage, its
        checksums, and the model versions that were running while it was
        collected. This page exists now so that anyone taking part can read the
        terms before contributing to something released under them, rather than
        after.
      </P>

      <H2 id="contains">What a release contains</H2>
      <P>
        Releases are drawn from public room activity and published as
        conversation windows rather than loose messages. A window is an ordered
        stretch of the room with its structure intact, because the unit a
        moderation agent has to learn from is a situation and a message on its
        own is not one.
      </P>
      <UL>
        <LI>
          The ordered contributions in the window, with reply and reference
          edges and who each was addressed to.
        </LI>
        <LI>
          Whether a human, a chat bot, or a mod bot produced each one, and
          whether a human was a guest or registered at the time.
        </LI>
        <LI>
          Moderation actions taken across the window, the rule each cited, the
          rules version it was judged under, and what the platform applied.
        </LI>
        <LI>
          Machine observations derived from the material, each carrying the
          processor and model version that produced it, so a result can be
          reproduced and an error traced to where it was made.
        </LI>
        <LI>Human annotations, where the research produced any.</LI>
        <LI>
          A manifest referencing versioned stored objects, so a release can be
          rebuilt exactly rather than approximately.
        </LI>
      </UL>

      <H2 id="excluded">What is left out</H2>
      <UL>
        <LI>
          Raw live audio, which is not retained by default. Recording,
          retention, and dataset use of voice apply only under an explicit{" "}
          <A href="/rules">room rule</A> with visible notice.
        </LI>
        <LI>
          Anything withdrawn or deleted before the release was cut. Deletion
          propagates through the derived data and into every subsequent release.
        </LI>
        <LI>
          Account credentials, technical security records, and material held
          back by moderation rather than published to the room.
        </LI>
      </UL>

      <H2 id="licence">Licence</H2>
      <Rows>
        <Row term="Data">Creative Commons Attribution 4.0 International</Row>
        <Row term="Attribution">
          Cite the release by name and version, and the platform it came from
        </Row>
        <Row term="Conditions">Binding, and set out below</Row>
      </Rows>
      <P>
        Attribution rather than public domain dedication is a deliberate choice.
        This is conversation between identifiable people, not read speech from a
        script, and the conditions below need something to attach to.
      </P>

      <H2 id="conditions">Conditions on use</H2>
      <P>
        These bind anyone who downloads a release. They exist because the people
        in the data were talking to each other, not filling in a form.
      </P>
      <UL>
        <LI>
          Do not attempt to re-identify participants, or to link the data to
          other sources in order to do so.
        </LI>
        <LI>
          Do not use it to profile, target, contact, or make decisions about any
          individual appearing in it.
        </LI>
        <LI>
          Honour deletion. Where a later release removes material, do not
          reconstruct it from an earlier one or redistribute the removed
          material.
        </LI>
        <LI>
          Do not redistribute a modified release as though it were an official
          one.
        </LI>
        <LI>Pass these conditions on with the data if you share it further.</LI>
      </UL>

      <H2 id="removal">Getting something removed</H2>
      <P>
        If you contributed to the room and want your material out, or you are
        named in someone else's contribution, write to {policyMeta.controller}{" "}
        at {policyMeta.postalAddress}. It will be removed from the live record,
        from the derived data, and from every later release. A release already
        published cannot be recalled from the people who downloaded it, which is
        why the terms of taking part say so before you take part. See{" "}
        <A href="/research">research participation</A> and the{" "}
        <A href="/privacy">privacy notice</A>.
      </P>

      <H2 id="versioning">Versioning</H2>
      <P>
        Releases are versioned and never edited in place. A correction produces
        a new version with a note saying what changed and why, so that a
        published result can always be checked against the exact material it was
        computed from.
      </P>
    </PolicyPage>
  );
}
