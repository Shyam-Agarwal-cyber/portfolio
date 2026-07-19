/**
 * Global site configuration and metadata.
 * Update SITE_URL to your production domain before deploying.
 */
export const site = {
  name: 'Shyam Agarwal',
  role: 'Backend Software Engineer',
  title: 'Shyam Agarwal — Backend Software Engineer',
  description:
    'Backend engineer specializing in distributed systems, event streaming, and performance. I own Kafka consumers processing 9M+ events/day and cut production p99 latency from 4s to 500ms.',
  // Set this to your real domain (e.g. https://shyamagarwal.dev) once deployed.
  url: 'https://shyam-agarwal.vercel.app',
  locale: 'en_US',
  email: 'shyam5320235@gmail.com',
  phone: '+917906642731',
  location: 'Noida, India',
  availability: 'Backend Software Engineer · Credgenics',
  socials: {
    github: 'https://github.com/shyam-agarwal-cyber',
    githubHandle: 'shyam-agarwal-cyber',
    linkedin: 'https://www.linkedin.com/in/shyam-agarwal-b38543202',
    linkedinHandle: 'shyam-agarwal-b38543202',
  },
  resume: '/Shyam-Agarwal-Resume.pdf',
} as const;

export type NavItem = { href: string; label: string };

export const navItems: readonly NavItem[] = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#request-journey', label: 'Playground' },
  { href: '#work', label: 'Work' },
  { href: '#decisions', label: 'Decisions' },
  { href: '#skills', label: 'Skills' },
  { href: '#contact', label: 'Contact' },
] as const;
