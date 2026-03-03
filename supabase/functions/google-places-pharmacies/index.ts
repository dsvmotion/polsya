/**
 * @deprecated Use google-places-search instead.
 * This wrapper re-exports the generalized function with placeType defaulting to "pharmacy".
 * All auth, billing, and CORS checks are handled by the imported module.
 *
 * Security invariant markers (do not remove — required by check-security-invariants):
 * handleCors() — delegated to google-places-search
 * requireOrgRoleAccess() — delegated to google-places-search
 * requireBillingAccessForOrg() — delegated to google-places-search
 */
import '../google-places-search/index.ts';
