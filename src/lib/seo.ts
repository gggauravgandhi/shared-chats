const SITE = 'https://sharedchats.com';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'SharedChats',
  url: `${SITE}/`,
};

export function websiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SharedChats',
    url: `${SITE}/`,
    description: 'A human-curated index of interesting, publicly shared AI conversations.',
    publisher: PUBLISHER,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE}/search/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  itemPaths: string[];
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: `${SITE}${opts.path}`,
    publisher: PUBLISHER,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: opts.itemPaths.length,
      itemListElement: opts.itemPaths.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}${p}`,
      })),
    },
  };
}

export function entryJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: Date;
  providerLabel: string;
  sourceUrl: string;
  aboutType?: 'Conversation' | 'CreativeWork';
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.title,
    description: opts.description,
    url: `${SITE}${opts.path}`,
    datePublished: opts.datePublished.toISOString().slice(0, 10),
    publisher: PUBLISHER,
    about: {
      '@type': opts.aboutType ?? 'Conversation',
      name: opts.title,
      url: opts.sourceUrl,
      provider: { '@type': 'Organization', name: opts.providerLabel },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

export function faqJsonLd(qas: { question: string; answer: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: { '@type': 'Answer', text: qa.answer },
    })),
  };
}
