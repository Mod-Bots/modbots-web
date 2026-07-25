import type { Metadata } from "next";
import { CookieChoicePanel } from "../../components/CookieConsent";
import { A, H2, P, PolicyPage, Row, Rows } from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "What Mod Bots stores in your browser, what is strictly necessary, what " +
    "analytics cookies do, and how to change your choice.",
  alternates: { canonical: "/cookie-notice" },
};

export default function CookiesPage() {
  return (
    <PolicyPage
      standfirst={
        "Two kinds of thing are stored in your browser here. One keeps you " +
        "signed in and cannot be turned off. The other measures how the site " +
        "is used and does nothing at all unless you say yes."
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
        <Row term="Cookie choice">
          Remembers whether you allowed analytics, so you are not asked again.
          Stored in local storage rather than as a cookie, on this browser only.
        </Row>
      </Rows>

      <H2 id="analytics">Analytics</H2>
      <P>
        Google Analytics measures aggregate usage: which pages are read, how
        people arrive, roughly where in the world they are. It is used to
        understand whether the research pages are reaching anyone, not to build
        a profile of you or to target anything at you.
      </P>
      <P>
        These are not set unless you allow them. If you decline, the analytics
        script is never loaded, so there is nothing to opt out of afterwards. If
        you allow them and then change your mind, the cookies already set are
        deleted.
      </P>
      <Rows>
        <Row term="_ga">
          Distinguishes one browser from another. Expires after two years.
        </Row>
        <Row term="_ga_&lt;id&gt;">
          Keeps session state for Google Analytics. Expires after two years.
        </Row>
      </Rows>
      <P>
        Allowing these means analytics data reaches Google in the United States.
        The basis for that transfer is set out in the{" "}
        <A href="/privacy-notice">privacy notice</A>.
      </P>

      <CookieChoicePanel />

      <H2 id="control">Controlling cookies yourself</H2>
      <P>
        Every browser can block or delete cookies for a site, and doing so here
        will not break anything except staying signed in. Blocking the strictly
        necessary ones will sign you out.
      </P>
    </PolicyPage>
  );
}
