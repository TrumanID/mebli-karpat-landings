/** Language-neutral company data (SPEC Appendix B). null = client input still missing: the UI hides it. */
export const site = {
  url: 'https://b2b.meblikarpat.com.ua',
  name: 'Mebli Karpat',
  alternateName: 'Меблі Карпат',
  foundingDate: '2002',
  phone: '+380679690202',
  phoneDisplay: '+380 67 969 02 02',
  email: 'info@meblikarpat.com.ua',
  whatsapp: null as string | null, // TODO(client): WhatsApp number, digits only
  catalogPdf: null as string | null, // D5: the catalogue CTA stays hidden until a PDF exists
  mainSite: 'https://meblikarpat.com.ua/',
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/meblikarpat' },
    { label: 'Facebook', href: 'https://www.facebook.com/mebel.karpat' },
    { label: 'YouTube', href: 'https://youtube.com/channel/UCjFkDFlNqB1dCZHzrTEi1yA/videos' },
  ],
};
