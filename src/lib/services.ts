/**
 * Every string in this file is the copy published on breezehc.com.
 * Keep it that way — edits here change what the site says.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] };

export type Service = {
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  image: string;
  /** Short line used on the home page + cross-link cards. */
  blurb: string;
  blocks: Block[];
  /** The "Schedule it" call-out at the bottom of every service page. */
  scheduleIt: string;
};

export const services: Service[] = [
  {
    slug: "heating",
    title: "Heating",
    tagline: "Keeping you warm and oh-so-cozy",
    icon: "flame",
    image: "/template-2/family-comfort.jpg",
    blurb:
      "From new installations and retrofits to emergency repairs and maintenance, Breeze delivers award-winning Middle Tennessee heating services to TN customers. Your satisfaction is our priority.",
    blocks: [
      {
        type: "p",
        text: "Breeze Heating and Cooling is one of Middle Tennessee's most beloved heating contractors. Delivering best-in-class service that's prompt and professional, our friendly techs provide a full range of heating maintenance, repairs and installation.",
      },
      { type: "h3", text: "Middle Tennessee heating services include:" },
      {
        type: "list",
        items: [
          "Heating installations & retrofits",
          "Geothermal heat pump systems",
          "Mini-split systems & hybrid systems",
          "Residential heating service",
          "Emergency heating repairs",
        ],
      },
    ],
    scheduleIt:
      "To request emergency service or schedule a heating repair, call 615-523-9898. A qualified technician will be in touch before you know it!",
  },
  {
    slug: "cooling",
    title: "Cooling",
    tagline: "Drink in that Cool, Breeze Air",
    icon: "snowflake",
    image: "/template-2/cooling-photo.jpg",
    blurb:
      "Our expert technicians work to cool your TN home efficiently and affordably with high-quality Middle Tennessee cooling systems, maintenance and emergency repairs. Trust us with your comfort.",
    blocks: [
      {
        type: "p",
        text: "Breeze Heating and Cooling is one of Middle Tennessee's most beloved cooling contractors. Delivering best-in-class service that's prompt and professional, our friendly techs provide a full range of cooling maintenance, repairs and installation.",
      },
      { type: "h3", text: "Middle Tennessee's cooling services include:" },
      {
        type: "list",
        items: [
          "Air conditioning installations & retrofits",
          "Geothermal heat pump systems",
          "Mini-split & hybrid systems",
          "Residential A/C service",
          "Emergency A/C repairs",
          "Air conditioning repairs",
          "Cooling maintenance & safety inspections",
          "Solar-assisted air conditioning",
          "Duct & ventilation repairs",
          "Commercial A/C service",
        ],
      },
    ],
    scheduleIt:
      "To request emergency service or schedule a cooling repair, call 615-523-9898. A qualified technician will be in touch before you know it!",
  },
  {
    slug: "repairs-and-services",
    title: "Repairs & Services",
    tagline: "Yep. We Fix It.",
    icon: "wrench",
    image: "/template-2/repair-technician.jpg",
    blurb:
      "When your heating or cooling system malfunctions, Breeze's home climate specialists are there in a jiffy, working to preserve your safety and restore optimal temperatures.",
    blocks: [
      {
        type: "p",
        text: "When your heating or cooling system malfunctions, Breeze's home climate specialists are there in a jiffy, working to preserve your safety and restore optimal temperatures. And, since money doesn't grow on trees—we respect your budget as we diagnose problems and recommend solutions.",
      },
      {
        type: "h3",
        text: "Middle Tennessee's heating and air conditioning repairs include:",
      },
      {
        type: "list",
        items: [
          "Heat pumps and gas furnaces",
          "Mini-split and hybrid systems",
          "Heat pumps",
          "Air flow and ventilation problems",
          "Thermostat repairs",
        ],
      },
    ],
    scheduleIt:
      "To chat with a technician or request a service call, fill out our simple online form. For emergency repairs or immediate service, call 615-523-9898 anytime. You'll speak with a live person 24/7, because personal service is our specialty.",
  },
  {
    slug: "indoor-quality",
    title: "Indoor quality",
    tagline: "Breathe Easy with IAQ Innovation",
    icon: "leaf",
    image: "/images/Why-We-Should-At-Home.jpg",
    blurb:
      "Indoor air is up to seven times as polluted as outdoor air. At Breeze, we care about the air you breathe — and we have the tools to test it and fix it.",
    blocks: [
      {
        type: "p",
        text: "Indoor air is up to seven times as polluted as outdoor air, and it's a growing health concern for today's families. This type of air pollution contributes to respiratory infections, asthma and allergies, and may exacerbate lung disease. At Breeze, we care about the air you breathe. If you have infants or seniors living in your home, or your family suffers from respiratory conditions, it is especially important to address indoor air pollution.",
      },
      {
        type: "h3",
        text: "Diagnosing & Treating Indoor Air Pollution with HomeAdvice",
      },
      { type: "p", text: "The diagnostic process involves three simple steps:" },
      {
        type: "list",
        items: [
          "Breeze places a monitor in your home for a period of three to five days. Data is automatically transmitted to our data center through the cellular network or a phone line.",
          "Data is evaluated and matched with the best possible solutions.",
          "Our indoor air quality consultant returns to your home with a full report from HomeAdvice.",
        ],
      },
    ],
    scheduleIt:
      "Breeze utilizes the AirAdvice for Homes™ program to assess and address indoor air quality. Designed to “make the invisible visible,” the system uncovers hidden indoor air quality and energy waste issues in your home. To learn more about the HomeAdvice Air Monitor, you can also give us a buzz at 615-523-9898 to schedule your IAQ appointment!",
  },
  {
    slug: "water-heater-solutions",
    title: "Water heater solutions",
    tagline: "Water Heater Solutions",
    icon: "drop",
    image: "/images/Guy-water-heating-solution-full.jpg",
    blurb:
      "Tank or tankless, gas or electric — we help you weigh the options and install it right, for efficiency that pays you back every month.",
    blocks: [
      {
        type: "p",
        text: "A water heater replacement offers options and requires decisions. While some homeowners will simply read the faded label on the existing unit and replace it with an exact equivalent, others seize the opportunity to upgrade performance and energy efficiency or ensure a longer service life. Some will decide to utilize a different fuel, while others will move away from conventional storage tank heaters entirely. Here are some questions to ask before a water heater replacement:",
      },
      { type: "h3", text: "Fuel Type: Gas or Electric?" },
      {
        type: "p",
        text: "Most homes in the U.S. utilize natural gas for heating water. Water heater efficiency is measured by a unit's energy factor (EF) rating. Standard gas water heaters have an EF in the range of 0.6, while electric heaters typically rate above 0.9. Despite the superior EF rating, the substantial cost differential of electricity versus gas in locales where both are available means operating costs are usually lower with a gas heater than an electric model.",
      },
      { type: "h3", text: "Style: Tank or Tankless?" },
      {
        type: "p",
        text: "Conventional storage tank water heaters have a longstanding drawback: the tank. Water stored in the tank loses heat between each usage and must be constantly reheated, wasting energy. In addition, a unit with an adequate first hour rating must be chosen to match home usage. A tankless unit heats only the amount of hot water you use when you need it. No water is stored, so no energy is lost on standby. However, tankless units must be carefully sized to household demands for adequate performance. In some cases, multiple tankless units will be required for a single household.",
      },
      { type: "h3", text: "Tankless Heater Installers in Nashville, TN" },
      {
        type: "p",
        text: "More and more people are choosing tankless water heaters over traditional water heaters these days, and for good reason. Tankless heaters are designed to provide hot water on demand, reducing standby energy losses that cost you money. In addition, tankless heaters typically last about twice as long as standard heaters. And some tankless heaters may qualify for tax rebates, saving you even more. If you're in the market for tankless water heater installation in Nashville, TN, call Breeze Heating and Cooling to learn more about the options we offer.",
      },
      { type: "h3", text: "Proper Installation is Key" },
      {
        type: "p",
        text: "Your tankless water heater needs to be professionally installed for optimal energy efficiency. With an expert staff, we have the tools to tackle your tankless water heater installation project. And when you work with us, you'll benefit from our:",
      },
      {
        type: "list",
        items: [
          "Easy appointment scheduling",
          "Reasonable rates",
          "Knowledgeable, courteous professionals",
        ],
      },
    ],
    scheduleIt:
      "For more information about our tankless water heaters or to schedule an estimate, call us today at 615-523-9898.",
  },
  {
    slug: "mini-split-systems",
    title: "Mini-split systems",
    tagline: "Safeguarding Your Comfort with Mini-Split Systems",
    icon: "grid",
    image: "/template-2/mini-split-photo.jpg",
    blurb:
      "Cost-effective, ductless heating and cooling — especially useful in additions or homes with non-ducted heating systems.",
    blocks: [
      {
        type: "p",
        text: "Designed to provide cost-effective heating and cooling service, mini-split systems are especially useful in building additions or homes with non-ducted (radiant, hot water or propane) heating systems. Made of an outdoor condenser and indoor evaporator, mini-split systems are highly efficient because they incur no energy loss due to ducting.",
      },
      {
        type: "p",
        text: "Along with their energy-saving construction, mini-split systems can be wall- or ceiling mounted. They're known for their compact, sleek design, zone heating and cooling capabilities, and remote activation. For the convenience of residential and commercial customers, Breeze technicians are trained and certified to install ductless systems and mini-splits from leading HVAC manufacturers. We also provide system consultations upon request.",
      },
    ],
    scheduleIt:
      "Call 615-523-9898 to schedule a Middle Tennessee mini-split system repair, maintenance service or installation—or to discuss this energy-efficient HVAC technology with our home climate experts.",
  },
  {
    slug: "energy-audits",
    title: "Energy audits",
    tagline: "The Power of Home Energy Audits",
    icon: "gauge",
    image: "/images/mass-energy-audit.png",
    blurb:
      "Improve HVAC performance while significantly reducing energy costs — with a 100% satisfaction guarantee.",
    blocks: [
      {
        type: "p",
        text: "Energy audits are perfect for homeowners who wish to improve HVAC performance while significantly reducing energy costs. During your energy audit, a specially trained Comfort and Indoor Air Quality Consultant will visit your home. Using advanced diagnostic instruments and testing procedures, the consultant will (1) identify problems that impact the indoor environment, and (2) provide you with a personalized plan to solve these problems.",
      },
      { type: "h3", text: "During your energy audit, you will learn how to:" },
      {
        type: "list",
        items: [
          "Achieve comfortable, balanced temperatures throughout your home",
          "Maintain healthy, year-round humidity levels",
          "Reduce dust, system noise and repair bills",
          "Save money on utility bills (typically 10-50%)",
        ],
      },
      {
        type: "p",
        text: "For your peace of mind, Comfort Institute Member Contractors offer a 100% satisfaction guarantee on energy audits. That means you won't pay a dime after audit completion if you didn't find the check-up worthwhile.",
      },
    ],
    scheduleIt:
      "Ready to begin? Call 615-523-9898 to schedule your home energy audit, or to discuss a new, high-efficiency heating and cooling system with our talented technicians.",
  },
  {
    slug: "commercial-industrial",
    title: "Commercial & Industrial",
    tagline: "Commercial & Industrial Services in Middle Tennessee",
    icon: "building",
    image: "/images/commercial-and-industrial-icon-1.jpg",
    blurb:
      "Expertise and training to service and install nearly any type of commercial heating, cooling, and indoor air quality system.",
    blocks: [
      {
        type: "p",
        text: "Breeze commercial technicians have the expertise and training to service and install nearly any type of commercial heating, cooling, and indoor air quality system. Breeze has installed and managed systems in facilities throughout the Middle Tennessee area. Commercial service offerings include:",
      },
      {
        type: "list",
        items: [
          "New & replacement heating systems",
          "New & replacement cooling systems",
          "Emergency HVAC repairs",
          "Replacement filter programs",
          "Preventative maintenance agreements",
          "Energy audits",
        ],
      },
      { type: "h3", text: "Preventative Maintenance" },
      {
        type: "p",
        text: "For your convenience, Breeze offers preventative maintenance programs that improve the longevity and functionality of commercial equipment. Preventative maintenance advantages include:",
      },
      {
        type: "list",
        items: [
          "Optimized efficiency and performance",
          "Same-day service for equipment malfunctions",
          "Consistent comfort levels (achieved through the calibration of mechanical system controls)",
          "Improved building operations and employee productivity",
          "Reduction of costly downtime and unexpected repair bills",
          "Peace of mind that your system is operating at peak efficiency",
        ],
      },
    ],
    scheduleIt:
      "All commercial building requirements are not the same, and Breeze tailors each maintenance plan to meet your facility-specific needs. To request a commercial service or sales appointment, or get more information about our commercial products and services, call 615-523-9898 or email breezehc@gmail.com.",
  },
  {
    slug: "residential",
    title: "Residential",
    tagline: "The Answer to Your Perfect Home Climate",
    icon: "home",
    image: "/images/residental-full.jpg",
    blurb:
      "Licensed, certified and trained to keep your Middle Tennessee home comfortable and safe during seasonal extremes.",
    blocks: [
      {
        type: "p",
        text: "You're in luck: Breeze technicians are licensed, certified and trained to keep your Middle Tennessee home comfortable and safe during seasonal extremes. Whether you require system maintenance, service or new installations, you'll find our professionalism and quality unrivaled. Best of all, we proudly guarantee our workmanship—and we recommend products that offer high-performance, low-maintenance benefits. Just call 615-523-9898 or email our team today, and we'll send a trained, certified HVAC professional straight to your doorstep.",
      },
      {
        type: "h3",
        text: "Middle Tennessee residential HVAC services include:",
      },
      {
        type: "list",
        items: [
          "Heating installation and retrofits",
          "Cooling installation and retrofits",
          "Heat pumps",
          "Hybrid and mini-split systems",
          "Dehumidifiers and IAQ systems",
          "Programmable thermostat repairs",
          "Ventilation and duct repairs",
          "Emergency HVAC services",
          "Comfort Club maintenance agreements",
        ],
      },
    ],
    scheduleIt:
      "Addressing all of your indoor climate concerns, Breeze is Middle Tennessee's #1 choice for residential heating & cooling service. To chat with our team or schedule residential HVAC service in the Middle Tennessee area, call 615-523-9898 today.",
  },
  {
    slug: "property-manager",
    title: "Property manager",
    tagline: "Middle Tennessee Property Management Services",
    icon: "keys",
    image: "/images/property-manager.jpg",
    blurb:
      "Partnering with Middle Tennessee property managers to maintain tenant comfort and safety — during business hours or after.",
    blocks: [
      {
        type: "p",
        text: "Providing heating and cooling services for rental properties and vacation homes, Breeze Heating & Air partners with Middle Tennessee property managers to maintain tenant comfort and safety. Whether your property requires attention during business hours or afterhours, our technicians are prompt and professional. To ensure a seamless, no-hassle experience for you and your tenants, Breeze (1) personally contacts tenants to schedule convenient appointment times, (2) arrives promptly and provides professional service, and (3) handles any necessary follow-up.",
      },
      {
        type: "p",
        text: "In addition to providing seasonal maintenance and emergency repairs, Breeze retrofits and installs high-efficiency equipment that lasts for years. Tailoring solutions to your property objectives and budget parameters, we recommend the best brands and products on the market.",
      },
      {
        type: "p",
        text: "Trained and experienced NATE-certified technicians who have undergone extensive industry and diagnostic training will perform your repairs and installations. It is our goal to get equipment up and running as soon as possible—without disrupting residents, tenants or guests.",
      },
      { type: "h3", text: "Breeze's property management services include:" },
      {
        type: "list",
        items: [
          "Heating system installation",
          "Cooling system installation",
          "Heating repairs & service",
          "Cooling repairs & service",
          "Emergency HVAC service",
          "Heat pump service",
          "Hybrid and mini-split systems",
          "Ventilation and duct repairs",
          "Seasonal maintenance agreements",
        ],
      },
    ],
    scheduleIt:
      "To request an emergency repair, set up a maintenance agreement, or discuss rental property requirements, call 615-523-9898 today. We look forward to partnering with you!",
  },
  {
    slug: "comfort-club",
    title: "Comfort club",
    tagline: "Made in the Shade with Breeze's Comfort Club",
    icon: "shield",
    image: "/images/father-Copy.jpg",
    blurb:
      "A super-groovy way to maintain HVAC equipment and keep you cozy — for a modest investment.",
    blocks: [
      {
        type: "p",
        text: "It's true: Breeze's Comfort Club is a super-groovy way to maintain HVAC equipment and keep you cozy. For a modest investment, you'll enjoy optimal indoor climate and peace of mind while our qualified team of professionals work to protect your system and your safety!",
      },
      {
        type: "h3",
        text: "Depending upon your plan, Comfort Club benefits may include:",
      },
      { type: "list", items: ["Priority Service", "Extended Business Hours"] },
      { type: "h3", text: "How it Works" },
      {
        type: "p",
        text: "Joining Breeze's Comfort Club is affordable and convenient. First, fill out our service request form or call 615-523-9898 to schedule an inspection during normal business hours. A technician will assess your equipment for proper operation and set up a Comfort Club Agreement that is tailored to your system, comfort and budget requirements.",
      },
      { type: "h3", text: "About EZ-Pay" },
      {
        type: "p",
        text: "As part of our Comfort Club perks, Breeze is pleased to offer EZ-Pay. This program makes the worry-free upkeep and repair of your home comfort systems even simpler when you pay by credit card or automatic bank draft. No more mailed renewals, and no need to purchase stamps. In addition, automatic payments mean no lapsed coverage—so your plan is always available when you need it most!",
      },
      {
        type: "p",
        text: "With EZ-Pay, your credit card is charged monthly or annually, and your agreement is automatically renewed. If you decide to cancel before the plan renews, just call, email or send us a letter stating that you'd like to discontinue service. Should service be discontinued during your contract year, the remaining agreement balance will be charged to the credit card account you provide. Don't worry; if there are changes to your coverage at any point, the most current copy of our Comfort Club Agreement is always available.",
      },
    ],
    scheduleIt:
      "Fill out our service request form or call 615-523-9898 to schedule an inspection and set up your Comfort Club Agreement.",
  },
  {
    slug: "financing",
    title: "Financing",
    tagline: "HVAC Financing",
    icon: "tag",
    image: "/images/financing.jpg",
    blurb:
      "Monthly payment options on home comfort equipment, through reputable finance partners.",
    blocks: [
      {
        type: "p",
        text: "At Breeze Heating & Cooling, we understand that high-performance, energy efficient heating and cooling equipment is a significant investment. When it is time to replace your furnace, air conditioner or heat pump, we work within your budget to meet your energy and comfort requirements. Once your new system is installed, you will begin saving money on energy bills—and can apply the savings to the cost of your new system!",
      },
      {
        type: "p",
        text: "For the convenience of our customers, Breeze Heating & Cooling partners with reputable finance companies to offer monthly payment options on home comfort equipment. Contact our team to request an application today!",
      },
    ],
    scheduleIt:
      "Contact our team at 615-523-9898 to request a financing application today!",
  },
  {
    slug: "wi-fi-and-learning-thermostats",
    title: "Wi-Fi and Learning Thermostats",
    tagline: "Smart Control Over Every Degree",
    icon: "wifi",
    image: "/images/Wifi.jpg",
    blurb:
      "Wi-Fi and learning thermostats put your comfort — and your energy bill — in your pocket.",
    blocks: [
      {
        type: "p",
        text: "Breeze Heating and Cooling is one of Middle Tennessee's most beloved heating contractors. Delivering best-in-class service that's prompt and professional, our friendly techs install and configure Wi-Fi and learning thermostats alongside the full range of heating maintenance, repairs and installation.",
      },
      { type: "h3", text: "Middle Tennessee heating services include:" },
      {
        type: "list",
        items: [
          "Heating installations & retrofits",
          "Geothermal heat pump systems",
          "Mini-split systems & hybrid systems",
          "Residential heating service",
          "Emergency heating repairs",
        ],
      },
    ],
    scheduleIt:
      "To request emergency service or schedule a thermostat installation, call 615-523-9898. A qualified technician will be in touch before you know it!",
  },
];

export const serviceBySlug = (slug: string) =>
  services.find((s) => s.slug === slug);

/** The six services featured on the home page, in the order the live site shows them. */
export const featuredServiceSlugs = [
  "heating",
  "cooling",
  "repairs-and-services",
  "mini-split-systems",
  "water-heater-solutions",
  "indoor-quality",
];
