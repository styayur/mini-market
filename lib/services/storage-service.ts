import type { PersistedMarketplaceState } from "@/types/marketplace";
import {
  clearMarketplaceState,
  exportMarketplaceData,
  importMarketplaceData,
  readMarketplaceState,
  writeMarketplaceState,
} from "@/lib/storage.ts";

export class StorageService {
  read() { return readMarketplaceState(); }
  write(state: PersistedMarketplaceState) { writeMarketplaceState(state); }
  clearActiveState() { clearMarketplaceState(); }
  export(state: PersistedMarketplaceState) { return exportMarketplaceData(state); }
  import(raw: string) { return importMarketplaceData(raw); }
}

export const storageService = new StorageService();
