/** Verbatim testimonials as published on breezehc.com/reviews. */

export type Review = { name: string; text: string };

export const reviews: Review[] = [
  {
    name: "David and Deborah Marks",
    text: "The whole team at Breeze was very considerate and helpful while putting in our system. Wish there were more companies like this one.",
  },
  {
    name: "Glenn Hughes",
    text: "I am very satisfied with Breeze Heating and Cooling. From the initial consultation to final clearance, they were truly professional. All systems available for my size home were offered and I was not pressured to select one unit over another. Installation began on time and was completed sooner than I expected. It was a pleasure to do business with this company.",
  },
  {
    name: "Mr. and Mrs. Johnson",
    text: "Very great job installing; very knowledgable and work was done in timely manner. Very happy with results from new unit. The cost on electric bills decreased almost 40%. Thank you for your help!!",
  },
  {
    name: "Mary Jane Perkins",
    text: "I'm very happy with the system. Also with the contractors that installed at my house. They were nice and friendly. They even removed their shoes to walk in my home. I congratulate their professionalism and sensitivities.",
  },
  {
    name: "Michael Jennings",
    text: "Highly professional. Kam was outstanding. Thank to all Breeze family who did a great pre and post-installation, survey and inspection on the new system.",
  },
  {
    name: "Charlie Smith",
    text: "From the initial consultation to the completion on installation and post inspection, every phase was completed with much professionalism. So far, we are absolutely, unquestionably satisfied with our new system. Plus, the quietness can't be beat. A complete 5-star service and product.",
  },
  {
    name: "Sunny Whitehurst",
    text: "Happy with room temperature. They did a good job! Also, air filtration system. Someone we know was happy with the system. If someone needs a new system, I'll recommend Breeze Heating and Cooling. Thank you!",
  },
  {
    name: "Nancy Fessler",
    text: "All of your personnel seem knowledgeable about their jobs. The entire crew was awesome!",
  },
  {
    name: "Jack Stewardt",
    text: "Very highly qualified and professional personnel throughout the dealings with the preparation and installation of the unit. I have nothing but complete praise for the entire crew.",
  },
  {
    name: "Robin Rose",
    text: "We were very pleased and satisfied with the whole process of purchasing a unit for our home – both with the product and Breeze's Heating & Cooling installation. We look forward to enjoying many years of quality air and saving on our energy bills.",
  },
  {
    name: "John and Michele Tarrillio",
    text: "Simply the best HVAC Company that I dealt with in the last 20 years. I've owned several homes, and never dealt with anyone so honest, knowledgeable, and proficient from start to finish. Without a doubt will continue to use Breeze.",
  },
  {
    name: "Bettye Stanley",
    text: "Kam was referred by a friend that spoke highly of him and his service. The ac had stopped cooling in my duplex and when I phoned to set up an appointment, he said he would be here in 20 minutes. He came, discovered coolant leak, removed the frozen ice, filled with freon and ac was cooling when he left. Price was below what other companies would have charged. Kam was personable, efficient, informative and truly cares about his customers. I will highly recommend him and Breeze heating and cooling to my friends.",
  },
  {
    name: "Jerome Braden",
    text: "Recently my HVAC went out. In a desperate attempt to get it fixed as soon as possible i quickly scanned through company info online and chose Breeze Heating and Cooling. I was not expecting the best service i just crossed my fingers and hoped that i would not be ripped off and that i would be treated fairly. To my surprise after dealing with Kam, who completed my service and is also the owner, i ended up with the best customer service experience i have ever had. He was fast, friendly and courteous. He never once tried to talk me into buying a new unit. He mentioned that would only be a last resort. He also taught me a few things in the process. In the end i also ended up spending way less than i was expecting. Prior to starting my career with the Federal Government and the Veteran's Administration i worked for a private sector company that won the J.D. Power award for best customer service 6 years running up through the year i left. The service i received from Kam and Breeze Heating and cooling is the kind of service that wins those awards. He will be the only one servicing my HVAC for as long as i own my home.",
  },
  {
    name: "Lana Pargh",
    text: "We have been using Breeze for 3 years and will not use anyone else. Kam is sweet, kind, and very professional. He always comes through for us. We own 6 rental properties and he takes care of all of them. I don't ever have to worry about anything when he is on the job. My husband and I use him exclusively. I am very confident that you will have an amazing experience. Please consider Kam with Breeze next time you need help. He will save the day! 🙂",
  },
  {
    name: "Darron Osborne",
    text: "This is a great company. I'm always looking for that local company that is not trying to take advantage of me, and can still compete with the big guys on their quality. This is one of them. They saved me $1300 dollars. The big guys can't touch their pricing and honesty. They went out of their way on getting my business, negotiating, and installation. It's nice to find a company like this in today's world. They normally aren't open Saturday's but made an exception since my AC was completely out. I will recommend them to everyone I know who needs HVAC service, and I will use them from NOW ON!",
  },
];

/** The short ones read best in the home-page carousel. */
export const featuredReviews = reviews.filter((r) => r.text.length < 320);
