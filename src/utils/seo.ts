export const seoData = {
  home: {
    title: "Coffice - Espace de Coworking Premium à Alger | Mohammadia Mall",
    description:
      "Coffice, espace de coworking moderne au Mohammadia Mall, Alger. Bureaux privés, salles de réunion, domiciliation d'entreprise. WiFi haut débit, kitchenette, terrasse. Réservez dès maintenant.",
    keywords: [
      "coworking alger",
      "espace de travail alger",
      "bureau partagé alger",
      "domiciliation entreprise algérie",
      "location bureau alger",
      "salle de réunion alger",
      "mohammadia mall coworking",
      "bureau flexible alger",
      "espace professionnel alger",
    ],
  },
  spaces: {
    title: "Nos Espaces de Travail - Coffice Alger | Bureaux et Salles de Réunion",
    description:
      "Découvrez nos espaces de coworking: 2 box de 4 places, 1 box de 3 places, open space 12 places avec postes informatiques, salle de réunion avec terrasse. Mohammadia Mall, 4ème étage.",
    keywords: [
      "bureaux alger",
      "salle de réunion alger",
      "espace coworking mohammadia",
      "box privé alger",
      "open space alger",
      "bureau équipé alger",
    ],
  },
  pricing: {
    title: "Tarifs Coworking Alger - Coffice | Formules Flexibles",
    description:
      "Tarifs compétitifs pour votre espace de travail à Alger. Formules à l'heure, journée ou mois. Domiciliation à partir de 12 000 DA/mois. Devis gratuit.",
    keywords: [
      "prix coworking alger",
      "tarif bureau alger",
      "abonnement coworking algérie",
      "location bureau prix alger",
      "domiciliation tarif algérie",
    ],
  },
  about: {
    title: "À Propos de Coffice - Coworking Alger | Notre Histoire",
    description:
      "Coffice est un espace de coworking nouvelle génération situé au Mohammadia Mall, Alger. Dédié aux entrepreneurs, freelances et entreprises en quête de flexibilité.",
    keywords: [
      "coworking alger histoire",
      "espace travail algérie",
      "coffice alger",
      "coworking mohammadia mall",
    ],
  },
  domiciliation: {
    title: "Domiciliation d'Entreprise à Alger - Coffice | Adresse Commerciale",
    description:
      "Domiciliez votre entreprise au Mohammadia Mall, Alger. Adresse prestigieuse, réception courrier, assistance administrative. À partir de 12 000 DA/mois. CNRC au 5ème étage.",
    keywords: [
      "domiciliation entreprise alger",
      "adresse commerciale algérie",
      "siège social alger",
      "domiciliation société algérie",
      "création entreprise alger",
    ],
  },
};

export const structuredData = {
  organization: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://coffice.dz/#organization",
    name: "Coffice",
    alternateName: "Coffice Coworking Alger",
    description:
      "Espace de coworking moderne à Alger avec bureaux privés, salles de réunion, domiciliation d'entreprise et services professionnels.",
    url: "https://coffice.dz",
    logo: "https://coffice.dz/logo-web-transparent-black.png",
    telephone: "+213-23-804-924",
    email: "desk@coffice.dz",
    hasMap: "https://maps.app.goo.gl/cvuRLycBuDHYEEVv7",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Mohammadia Mall, 4ème étage, Bureau 1178",
      addressLocality: "Alger",
      addressRegion: "Alger",
      postalCode: "16000",
      addressCountry: "DZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.7538,
      longitude: 3.0588,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    priceRange: "DA",
    currenciesAccepted: "DZD",
    paymentAccepted: "Cash, Virement",
    areaServed: {
      "@type": "City",
      name: "Alger",
    },
    image: "https://coffice.dz/espace-coworking.jpeg",
    sameAs: [
      "https://maps.app.goo.gl/cvuRLycBuDHYEEVv7",
      "https://www.instagram.com/coffice_dz/",
      "https://www.linkedin.com/showcase/cofficedz/",
      "https://www.facebook.com/coffice.dz",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services Coffice",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Espace Coworking",
            description: "Accès à nos espaces de travail partagés",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Bureau Privé",
            description: "Box privés de 3 à 4 places",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Salle de Réunion",
            description: "Salle de réunion équipée avec terrasse panoramique",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Domiciliation d'Entreprise",
            description: "Domiciliation commerciale avec adresse au Mohammadia Mall, réception courrier, assistance administrative",
          },
        },
      ],
    },
  },
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Où se trouve Coffice à Alger ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Coffice est situé au Mohammadia Mall, 4ème étage, Bureau 1178 à Alger. Facilement accessible et proche du CNRC (5ème étage).",
        },
      },
      {
        "@type": "Question",
        name: "Quels sont les tarifs de domiciliation ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La domiciliation d'entreprise commence à 12 000 DA par mois. Les contrats sont de 6 mois ou 1 an avec une réduction de 10% pour l'engagement annuel.",
        },
      },
      {
        "@type": "Question",
        name: "Quels espaces sont disponibles chez Coffice ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nous disposons de 2 box de 4 places, 1 box de 3 places, 1 open space de 12 places avec 2 postes informatiques puissants, et 1 salle de réunion avec terrasse.",
        },
      },
      {
        "@type": "Question",
        name: "Quels services sont inclus ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nos services incluent : WiFi haut débit, kitchenette équipée, réception du courrier, assistance administrative, accès à la salle de réunion (selon formule).",
        },
      },
      {
        "@type": "Question",
        name: "Comment réserver un espace ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vous pouvez réserver directement sur notre site web en créant un compte, ou nous contacter par téléphone ou email. Les réservations sont confirmées sous 24h.",
        },
      },
    ],
  },
};

export const updatePageTitle = (title: string) => {
  document.title = title;
};

export const updateMetaDescription = (description: string) => {
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute("content", description);
};

export const updateMetaKeywords = (keywords: string[]) => {
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement("meta");
    metaKeywords.setAttribute("name", "keywords");
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute("content", keywords.join(", "));
};

export const addCanonicalLink = (url: string) => {
  let canonicalLink = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement;
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute("href", url);
};

export const updateOpenGraphTags = (data: {
  title: string;
  description: string;
  url?: string;
  image?: string;
}) => {
  const ogTags = [
    { property: "og:title", content: data.title },
    { property: "og:description", content: data.description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Coffice" },
    { property: "og:locale", content: "fr_DZ" },
  ];

  if (data.url) {
    ogTags.push({ property: "og:url", content: data.url });
  }
  if (data.image) {
    ogTags.push({ property: "og:image", content: data.image });
  }

  ogTags.forEach(({ property, content }) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  });
};

export const updateTwitterTags = (data: {
  title: string;
  description: string;
  image?: string;
}) => {
  const twitterTags = [
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: data.title },
    { name: "twitter:description", content: data.description },
  ];

  if (data.image) {
    twitterTags.push({ name: "twitter:image", content: data.image });
  }

  twitterTags.forEach(({ name, content }) => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  });
};

export const injectStructuredData = (data: object) => {
  const existingScript = document.querySelector(
    'script[type="application/ld+json"][data-seo="true"]',
  );
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo", "true");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};
