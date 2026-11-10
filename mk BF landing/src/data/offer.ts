/**
 * The whole campaign in one place: dates, discount, models and regular prices.
 * Pages, the order form, the e-mail and the server-side price check all read from here.
 *
 * Regular prices: meblikarpat.com.ua product pages, read on 2026-11-09 (oak, oil-wax finish).
 * Anything marked EXAMPLE is a placeholder: the production build refuses to run until `approved` is all true.
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
  image: string;
  imageAlt: string;
  image2: string;
  image2Alt: string;
  sourceUrl: string;
}

export const offer = {
  /** Black Friday 2026 is Friday 27 November. Times are Kyiv time. */
  startsAt: '2026-11-27T00:00:00+02:00',
  /** EXAMPLE: end of the campaign (here Cyber Monday). */
  endsAt: '2026-11-30T23:59:59+02:00',
  /** EXAMPLE: discount on every model in the campaign. */
  discountPercent: 20,
  /** Last order date that still arrives by Christmas (25 December). null = unknown, shown as a TODO. */
  christmasOrderBy: null as string | null,
  /** Flip each to true once the client confirms it. */
  approved: { prices: false, dates: false },
  priceCheckedOn: '2026-11-09',
  maxQty: 50,
};

export const products: Product[] = [
  {
    slug: 'sydney',
    category: 'chairs',
    name: 'Сідней',
    kind: 'Стілець',
    descriptor: 'Стьобана спинка під зручним кутом і трапецієвидне сидіння на ніжках з масиву дуба.',
    specs: ['880 × 540 × 600 мм', 'Висота сидіння 500 мм', 'Каркас: дуб'],
    regular: 5715,
    image: 'sydney-1.jpg',
    imageAlt: 'Стілець «Сідней» зі світлою стьобаною оббивкою на дубових ніжках',
    image2: 'sydney-2.jpg',
    image2Alt: 'Стілець «Сідней», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stilec-sydney/',
  },
  {
    slug: 'forte-01',
    category: 'chairs',
    name: 'Форте 01',
    kind: 'Стілець',
    descriptor: 'Широке сидіння і вигнута спинка з вирізом-аркою. Ніжки з бука або дуба.',
    specs: ['840 × 500 × 550 мм', 'Висота сидіння 470 мм', 'Каркас: бук або дуб'],
    regular: 5170,
    image: 'forte-01-1.jpg',
    imageAlt: 'Стілець «Форте 01» з вирізом-аркою на спинці, світла тканина',
    image2: 'forte-01-2.jpg',
    image2Alt: 'Стілець «Форте 01», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stilec-forte-01/',
  },
  {
    slug: 'lounge',
    category: 'chairs',
    name: 'Лаунж',
    kind: 'Стілець',
    descriptor: 'Напівкругла спинка, яка огортає, на міцному дубовому каркасі.',
    specs: ['790 × 600 × 540 мм', 'Висота сидіння 490 мм', 'Каркас: дуб'],
    regular: 6880,
    image: 'lounge-1.jpg',
    imageAlt: 'Стілець «Лаунж» з напівкруглою спинкою, рожево-бежева тканина',
    image2: 'lounge-2.jpg',
    image2Alt: 'Стілець «Лаунж», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stilec-lounge/',
  },
  {
    slug: 'grand',
    category: 'tables',
    name: 'Гранд',
    kind: 'Стіл',
    descriptor: 'Потягніть стільницю, і вставка 40 см підніметься сама. Масив дуба.',
    specs: ['1400 × 800 мм, висота 750 мм', 'Розкладається до 1800 мм', 'Масив дуба'],
    regular: 31620,
    image: 'grand-1.jpg',
    imageAlt: 'Прямокутний розкладний стіл «Гранд» з масиву дуба',
    image2: 'grand-2.jpg',
    image2Alt: 'Стіл «Гранд», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stil-derev-janij-grand/',
  },
  {
    slug: 'gdansk',
    category: 'tables',
    name: 'Гданськ',
    kind: 'Стіл',
    descriptor: 'Овальний стіл з двома вставками по 50 см, які зберігаються окремо.',
    specs: ['Овальна стільниця', 'Дві вставки по 500 мм', 'Масив дуба'],
    regular: 34020,
    from: true,
    image: 'gdansk-1.jpg',
    imageAlt: 'Овальний розкладний стіл «Гданськ» з масиву дуба',
    image2: 'gdansk-2.jpg',
    image2Alt: 'Стіл «Гданськ», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stil-gdansk/',
  },
  {
    slug: 'fabio',
    category: 'tables',
    name: 'Фабіо',
    kind: 'Стіл',
    descriptor: 'Компактний круглий стіл, який з двома вставками по 50 см приймає більше гостей.',
    specs: ['Кругла стільниця', 'Дві вставки по 500 мм', 'Масив дуба'],
    regular: 33570,
    from: true,
    image: 'fabio-1.jpg',
    imageAlt: 'Круглий розкладний стіл «Фабіо» з масиву дуба',
    image2: 'fabio-2.jpg',
    image2Alt: 'Стіл «Фабіо», інший ракурс',
    sourceUrl: 'https://meblikarpat.com.ua/stil-fabio/',
  },
];

/** Rounded down to whole tens of hryvnias, so the advertised saving is never smaller than promised. */
export const bfPrice = (p: Product) =>
  p.bfPriceOverride ?? Math.floor((p.regular * (100 - offer.discountPercent)) / 100 / 10) * 10;

export const company = {
  name: 'Меблі Карпат',
  phone: '+380679690202',
  phoneDisplay: '+380 67 969 02 02',
  email: 'info@meblikarpat.com.ua',
  site: 'https://meblikarpat.com.ua/',
  since: 2002,
};
