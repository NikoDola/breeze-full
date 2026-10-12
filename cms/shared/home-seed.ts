import type { HomeDocument } from "./home";

// Exact approved content at this source revision. Import never overwrites an existing draft.
export const HOME_SOURCE_ID = "repository:5b40373fc78403c689d82550d9ca7067e2f97bdd:homepage";
export const homeSeed: HomeDocument = {
  schemaVersion: 2, template: "breeze.home", templateVersion: 1, title: "Homepage",
  slots: {
    seasons: { type: "breeze.seasons", version: 1, content: {
      headingLine1: "A good day starts", headingLine2: "at the ", headingAccent: "right temperature.",
      intro: "Whatever Tennessee weather has planned, we have your comfort covered.",
      cards: [
        { id: "cooling", title: "Keep your cool.", label: "Cooling", body: "Our expert technicians work to cool your TN home efficiently and affordably with high-quality Middle Tennessee cooling systems, maintenance and emergency repairs. Trust us with your comfort.", buttonText: "Request cooling service" },
        { id: "heating", title: "Bring on cozy.", label: "Heating", body: "From new installations and retrofits to emergency repairs and maintenance, Breeze delivers award-winning Middle Tennessee heating services to TN customers. Your satisfaction is our priority.", buttonText: "Request heating service" },
      ],
    } },
    contact: { type: "breeze.contact-intro", version: 1, content: {
      heading: "Let's make home feel ", headingAccent: "just right.", intro: "Tell us what you need. We'll help you take the next step.", phonePrompt: "Want to talk now?",
    } },
    reviews: { type: "breeze.home-reviews", version: 1, content: {
      heading: "Good words from", headingAccent: "good neighbors.", intro: "Kind words from people we've helped across Middle Tennessee.",
      items: [
        { id: "marks", name: "David and Deborah Marks", quote: "The whole team at Breeze was very considerate and helpful while putting in our system. Wish there were more companies like this one." },
        { id: "fessler", name: "Nancy Fessler", quote: "All of your personnel seem knowledgeable about their jobs. The entire crew was awesome!" },
        { id: "pargh", name: "Lana Pargh", quote: "We have been using Breeze for 3 years and will not use anyone else. Kam is sweet, kind, and very professional. He always comes through for us." },
      ],
    } },
    area: { type: "breeze.area", version: 1, content: {
      heading: "Made for Middle ", headingAccent: "Tennessee.", body: "From Nashville to Brentwood and the communities around them, friendly comfort care is close to home.",
      linkText: "Explore Nashville on Google Maps", mapsHref: "https://www.google.com/maps/search/?api=1&query=7175%20Nolensville%20Road%2C%20Nolensville%2C%20TN%2037135",
      mapTitle: "Google Map of Nashville, Tennessee", mapLocation: "Nashville, TN",
    } },
  },
};
