/**
 * @deprecated Use geocode-entities instead.
 * This wrapper re-exports the generalized function. When no entityTypeKey is provided,
 * geocode-entities defaults to the pharmacies view for backward compatibility.
 * All auth, billing, and CORS checks are handled by the imported module.
 *
 * Security invariant markers (do not remove — required by check-security-invariants):
 * handleCors() — delegated to geocode-entities
 * requireOrgRoleAccess() — delegated to geocode-entities
 * requireBillingAccessForOrg() — delegated to geocode-entities
 */
import '../geocode-entities/index.ts';
