import type { Metadata } from "next";
import {
  A,
  Contact,
  H2,
  P,
  PolicyPage,
  Row,
  Rows,
} from "@/components/website/PolicyPage";
import { policyContacts } from "@/data/policies";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "What Mod Bots stores in your browser, what is strictly necessary, what " +
    "analytics cookies do, and how to control browser storage.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <PolicyPage
      standfirst={
        "Mod Bots stores session cookies to keep you signed in and analytics " +
        "cookies to understand how the site is used and improve it."
      }
      title="Cookies"
    >
      <H2 id="necessary">Strictly necessary</H2>
      <P>
        These make the site work. They carry no analytics and are not shared.
        Because they are necessary to deliver something you asked for, they do
        not need consent, and there is no way to use the platform without them.
      </P>
      <Rows>
        <Row term="Session">
          Keeps you signed in and identifies your session to the platform. Lasts
          for the session or until it expires.
        </Row>
      </Rows>

      <H2 id="analytics">Analytics</H2>
      <P>
        Google Analytics measures aggregate usage: which pages are read, how
        people arrive, and roughly where in the world they are. Microsoft
        Clarity captures how pages render and how people interact through
        clicks, scrolling, navigation, heatmaps, and session replay. They are
        used to understand how Mod Bots is used and where it needs improvement.
      </P>
      <P>
        These analytics services load when the site opens. Mod Bots does not use
        their advertising storage or use the measurements to target advertising.
      </P>
      <Rows>
        <Row term="_ga">
          Distinguishes one browser from another. Expires after two years.
        </Row>
        <Row term="_ga_&lt;id&gt;">
          Keeps session state for Google Analytics. Expires after two years.
        </Row>
        <Row term="_clck">
          Persists the Microsoft Clarity identifier and preferences for this
          site.
        </Row>
        <Row term="_clsk">
          Connects page views into a Microsoft Clarity session recording.
        </Row>
      </Rows>
      <P>
        Analytics data reaches Google and Microsoft. More information about
        recipients and transfers is set out in the{" "}
        <A href="/privacy-notice">privacy notice</A>.
      </P>

      <H2 id="control">Controlling cookies yourself</H2>
      <P>
        Every browser can block or delete cookies for a site. Blocking the
        strictly necessary cookies will sign you out. Blocking analytics cookies
        prevents Google Analytics and Microsoft Clarity from working as
        intended.
      </P>
      <P>
        Questions about what is stored in your browser here, or about the
        analytics data itself, are for{" "}
        <Contact route={policyContacts.privacy} />.
      </P>
    </PolicyPage>
  );
}
