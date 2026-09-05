import { getCanonicalSiteUrl } from "@/lib/site-url";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

type SoftwareApplicationInput = {
  name: string;
  description: string;
  path: string;
  featureList?: string[];
  category?: string;
};

function toAbsoluteUrl(path: string): string {
  if (!path) return getCanonicalSiteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getCanonicalSiteUrl()}${normalized}`;
}

export function buildRootStructuredData() {
  const baseUrl = getCanonicalSiteUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}#website`,
        url: baseUrl,
        name: "Codyn",
        alternateName: ["Codyn AI"],
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/chat?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}#organization`,
        name: "Codyn",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/icon.svg`,
          width: 256,
          height: 256,
        },
        sameAs: ["https://github.com/DEVAANSH001/Codyn"],
      },
    ],
  };
}

export function buildBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildFaqStructuredData(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildSoftwareApplicationStructuredData(input: SoftwareApplicationInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    applicationCategory: input.category ?? "DeveloperApplication",
    operatingSystem: "Web",
    url: toAbsoluteUrl(input.path),
    description: input.description,
    featureList: input.featureList,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function buildBlogPostingStructuredData(input: {
  title: string;
  excerpt: string;
  image: string;
  author: string;
  slug: string;
  publishedAtIso: string;
  updatedAtIso: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.excerpt,
    image: input.image,
    author: {
      "@type": "Person",
      name: input.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Codyn",
      logo: {
        "@type": "ImageObject",
        url: `${getCanonicalSiteUrl()}/icon.svg`,
      },
    },
    datePublished: input.publishedAtIso,
    dateModified: input.updatedAtIso,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toAbsoluteUrl(`/blog/${input.slug}`),
    },
  };
}

export function buildItemListStructuredData(input: {
  name: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: toAbsoluteUrl(item.path),
    })),
  };
}
