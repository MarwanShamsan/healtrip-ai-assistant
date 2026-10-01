import { get_provider_details } from "./get-provider-details";
import { search_doctors } from "./search-doctors";
import { search_hospitals } from "./search-hospitals";

export const providerTools = {
  search_doctors,
  search_hospitals,
  get_provider_details,
} as const;

export type ProviderToolName = keyof typeof providerTools;

export {
  search_doctors,
  search_hospitals,
  get_provider_details,
};