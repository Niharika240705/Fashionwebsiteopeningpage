import { Source, ISource } from '../../models/Source.model';

export async function getEnabledSource(sourceId: string): Promise<ISource> {
  const source = await Source.findOne({ sourceId, enabled: true });
  if (!source) {
    throw new Error(`Source ${sourceId} is not enabled or does not exist`);
  }
  return source;
}

export function assertSourceMayIngest(source: ISource, mode: string): void {
  if (mode === 'permitted_scrape' && !source.allowsScraping) {
    throw new Error(`Source ${source.sourceId} does not permit scraping`);
  }
}

export function isAllowedDestination(source: ISource, destinationUrl: string): boolean {
  try {
    const host = new URL(destinationUrl).hostname.replace(/^www\./, '');
    if (!source.allowedDestinationHosts?.length) {
      return host.includes(source.domain.replace(/^www\./, ''));
    }
    return source.allowedDestinationHosts.some((allowed) => {
      const normalized = allowed.replace(/^www\./, '');
      return host === normalized || host.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}
