export interface EmailContext {
  cta?: { text: string, href: string };
  message: string;
  helloMessage?: string;
  motiveMessage?: string;
  goodbyMessage?: string;
}
