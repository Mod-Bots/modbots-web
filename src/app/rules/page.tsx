import type { Metadata } from "next";
import { A, H2, H3, P, PolicyPage } from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Room rules",
  description:
    "The values of the Mod Bots room: what this small society considers " +
    "acceptable speech, behaviour, and decorum, and how mod bots cite them.",
  alternates: { canonical: "/rules" },
};

const rules = [
  {
    id: "respect",
    title: "Be respectful and civil",
    body:
      "No personal attacks, harassment, or dogpiling. Disagree with ideas, " +
      "not with people.",
  },
  {
    id: "no-hate",
    title: "No hate",
    body:
      "No racism, sexism, homophobia, or any speech that dehumanises a " +
      "person or a group.",
  },
  {
    id: "no-spam",
    title: "No spam or flooding",
    body: "Do not flood the room, repeat-post, or advertise.",
  },
  {
    id: "nothing-illegal",
    title: "Nothing illegal or dangerous",
    body:
      "No illegal content, threats, doxxing, or instructions for causing " +
      "harm.",
  },
  {
    id: "respect-moderation",
    title: "Respect the moderation",
    body:
      "Moderation decisions stand. Do not evade a mute or a removal, and do " +
      "not relitigate interventions in the room.",
  },
];

export default function RulesPage() {
  return (
    <PolicyPage
      standfirst={
        "Moderation is the mechanism. These are the norms it enforces. A " +
        "room is a small society, and it has to say what it values before " +
        "anything can learn to look after it."
      }
      title="Room rules"
    >
      <H2 id="ethos">The ethos</H2>
      <P>Be kind to others and thoughtful in your speech.</P>

      <H2 id="rules">The rules</H2>
      <P>
        Five, and no more than five. Nobody is made to read them at the door.
        Most people meet them through a citation, at the moment one matters.
      </P>
      <ol className="mt-10 space-y-10">
        {rules.map(({ id, title, body }, index) => (
          <li key={id}>
            <H3>
              {index + 1}. {title}
            </H3>
            <p className="mt-3 text-[17px] leading-8 text-zinc-400 sm:text-[19px] sm:leading-9">
              {body}
            </p>
          </li>
        ))}
      </ol>

      <H2 id="citations">Citations and versioning</H2>
      <P>
        Rule identifiers are stable. When a mod bot acts it cites the rule it is
        enforcing, the citation is checked against the current rules, and it is
        stored alongside the version of the rules the decision was judged under.
        Changing what a rule means requires a new version, and an identifier is
        never reused for a different meaning.
      </P>
      <P>
        Citations carry into the learning record, so a training example knows
        which rule a decision enforced rather than only that something was
        removed. That is also what makes an appeal possible: there is always a
        stated reason to argue with. See{" "}
        <A href="/moderation">moderation and appeals</A>.
      </P>

      <H2 id="source">Where these come from</H2>
      <P>
        This page publishes the same versioned document the platform serves to
        its clients and that mod bots are judged against. The room shows them on
        demand rather than at entry, and the ethos line heads them wherever they
        appear.
      </P>
    </PolicyPage>
  );
}
