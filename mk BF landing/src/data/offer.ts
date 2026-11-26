/**
 * The whole campaign in one place: dates, discount, models and regular prices.
 * Pages, the order form, the e-mail and the server-side price check all read from here.
 *
 * Regular prices: the current regular prices on meblikarpat.com.ua (oak, oil-wax finish), confirmed by the client on 2026-11-26.
 * Black Friday prices are always calculated from `discountPercent`; the production build refuses to run until `approved` is all true.
 */

export type Category = 'chairs' | 'tables';

export interface Product {
  slug: string;
  category: Category;
  name: string;
  /** "Стілець" / "Стіл": used in the order e-mail and screen-reader text */
  kind: string;
  descriptor: string;
  specs: string[];
  /** Regular retail price in UAH, as on the main site */
  regular: number;
  /** true when the main site shows "від" (the price depends on the chosen size) */
  from?: boolean;
  /** Set to override the price computed from `discountPercent` */
  bfPriceOverride?: number;
  /** true when the table has an extension leaf (shows the «Розкладний» badge) */
  extendable?: boolean;
  image: string;
  imageAlt: string;
  image2: string;
  image2Alt: string;
  sourceUrl: string;
}

export const offer = {
  /** Black Friday 2026 is Friday 27 November. Times are Kyiv time. */
  startsAt: '2026-11-27T00:00:00+02:00',
  /** End of the campaign (Cyber Monday), confirmed by the client on 2026-11-26. */
  endsAt: '2026-11-30T23:59:59+02:00',
  /** Discount on every model in the campaign, confirmed by the client on 2026-11-26. */
  discountPercent: 15,
  /** Last order date that still arrives by Christmas (25 December). The client promises Christmas delivery for orders placed during the campaign, so this is the campaign's last day. null = unknown, shown as a TODO. */
  christmasOrderBy: '2026-11-30' as string | null,
  /** Flip each to true once the client confirms it. */
  approved: { prices: true, dates: true },
  maxQty: 50,
};

export const products: Product[] = [
  {
    slug: 'bone',
    category: 'chairs',
    name: 'Боне',
    kind: 'Стілець',
    descriptor: 'Авторська модель із вирізом у спинці та м’яким сидінням. Підійде для їдальні, вітальні й кухні.',
    specs: ['840 × 550 × 480 мм', 'Висота сидіння 470 мм', 'Каркас: дуб'],
    regular: 4940,
    image: 'bone-1.jpg',
    imageAlt: 'Стілець «Боне» з вирізом у спинці, бежева тканина, ніжки з дуба',
    image2: 'bone-2.jpg',
    image2Alt: 'Стілець «Боне», вигляд ззаду',
    sourceUrl: 'https://meblikarpat.com.ua/stilec-bone/',
  },
  {
    slug: 'boris',
    category: 'chairs',
    name: 'Борис',
    kind: 'Стілець',
    descriptor: 'М’яке сидіння й спинка на каркасі з масиву дуба. Гармонійне поєднання сучасного стилю та функціональності.',
    specs: ['780 × 510 × 470 мм', 'Висота сидіння 480 мм', 'Каркас: дуб'],
    regular: 6560,
    image: 'boris-1.jpg',
    imageAlt: 'Стілець «Борис» зі світло-сірою оббивкою на дубовому каркасі',
    image2: 'boris-2.jpg',
    image2Alt: 'Стілець «Борис», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stilec-boris/',
  },
  {
    slug: 'layt',
    category: 'chairs',
    name: 'Лайт',
    kind: 'Стілець',
    descriptor: 'Мінімалістичний стілець у стилі модерн: трапецієвидне сидіння, спинка під кутом, ніжки з дуба.',
    specs: ['850 × 580 × 500 мм', 'Висота сидіння 470 мм', 'Каркас: дуб'],
    regular: 5070,
    bfPriceOverride: 4305, // price set by the client (the formula gives 4309)
    image: 'layt-1.jpg',
    imageAlt: 'Стілець «Лайт» зі світлою оббивкою на дубових ніжках',
    image2: 'layt-2.jpg',
    image2Alt: 'Стілець «Лайт», вигляд ззаду',
    sourceUrl: 'https://meblikarpat.com.ua/stilec-layt/',
  },
  {
    slug: 'fin',
    category: 'tables',
    name: 'Фін',
    kind: 'Стіл',
    descriptor: 'Лаконічний стіл у мінімалістичному стилі: посилена дубова стільниця на металевому профілі.',
    specs: ['100 × 200 см', 'Стільниця: дуб', 'Опора: металевий профіль'],
    regular: 29410,
    image: 'fin-1.jpg',
    imageAlt: 'Стіл «Фін» з дубовою стільницею на чорній металевій опорі',
    image2: 'fin-2.jpg',
    image2Alt: 'Стіл «Фін», вигляд спереду',
    sourceUrl: 'https://meblikarpat.com.ua/stil-fin-oak/',
  },
  {
    slug: 'verke-12r',
    category: 'tables',
    name: 'Верке 12Р',
    kind: 'Стіл',
    descriptor: 'Прямокутний стіл на чотирьох трапецієвидних ніжках. Розкладається: додаткова вставка 40 см.',
    specs: ['80 × 120 см', 'Вставка 40 см', 'Масив дуба'],
    regular: 21390,
    extendable: true,
    image: 'verke-12r-1.jpg',
    imageAlt: 'Прямокутний розкладний стіл «Верке 12Р» з масиву дуба',
    image2: 'verke-12r-2.jpg',
    image2Alt: 'Стіл «Верке 12Р», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stil-derev-janij-verke-prjamokutnij/',
  },
  {
    slug: 'verke-10r',
    category: 'tables',
    name: 'Верке 10Р',
    kind: 'Стіл',
    descriptor: 'Компактний круглий стіл: зі вставкою 40 см стає овальним і приймає більше гостей.',
    specs: ['100 × 100 см', 'Вставка 40 см', 'Масив дуба'],
    regular: 19520,
    extendable: true,
    image: 'verke-10r-1.jpg',
    imageAlt: 'Круглий розкладний стіл «Верке 10Р» з масиву дуба',
    image2: 'verke-10r-2.jpg',
    image2Alt: 'Стіл «Верке 10Р», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stil-derev-janij-verke-kruglij/',
  },
];

/** Rounded down to a whole hryvnia, so the advertised saving is never smaller than promised. */
export const bfPrice = (p: Product) =>
  p.bfPriceOverride ?? Math.floor((p.regular * (100 - offer.discountPercent)) / 100);

export const company = {
  name: 'Меблі Карпат',
  phone: '+380679690202',
  phoneDisplay: '+380 67 969 02 02',
  email: 'info@meblikarpat.com.ua',
  site: 'https://meblikarpat.com.ua/',
  since: 2002,
  /** Full legal name, tax ID and address for the privacy page. null = not shown on the page. */
  legalEntity: null as string | null,
  /** How long requests that did not become an order are kept (set by the developer on 2026-11-26, to be confirmed by the client). */
  retention: '12 місяців' as string | null,
  /** Date shown on the privacy page. */
  privacyUpdated: '2026-11-26',
};
