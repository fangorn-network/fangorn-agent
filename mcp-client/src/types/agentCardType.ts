/**
 * A2A Protocol - Agent Card TypeScript Interfaces
 *
 * Based on the Agent2Agent (A2A) Protocol Specification RC v1.0
 * https://a2a-protocol.org/latest/specification
 *
 * NOTE: The official JS SDK (@a2a-js/sdk) already exports these types, but
 * is currently aligned to v0.3.0. These interfaces reflect the RC v1.0 spec,
 * including supportedInterfaces, protocolVersions, signatures, and the
 * updated SecurityScheme model. If you're using @a2a-js/sdk, you may want
 * to extend or override its types with these until the SDK catches up.
 */

// =============================================================================
// Agent Discovery Objects (Section 4.4)
// =============================================================================

/**
 * Standard transport protocol identifiers.
 */
export type Transport = "JSONRPC" | "GRPC" | "HTTP+JSON";

/**
 * A self-describing manifest for an agent. It provides essential metadata including the agent's identity, capabilities, 
 * skills, supported communication methods, and security requirements.
 * @see Section 4.4.1
 */
export interface AgentCard {
  /** Human-readable name for the agent. */
  name: string;

  /** Human-readable description of the agent's purpose and functionality. */
  description: string;

  /**
   * Declares the supported protocol interfaces (transport + URL + version).
   * The first entry is the preferred interface.
   */
  supportedInterfaces: AgentInterface[];

  /** The service provider of the agent. */
  provider?: AgentProvider;

  /** Version of the agent. */
  version: string;

  /** A url to provide additional documentation about the agent. */
  documentationUrl?: string;

  /** A2A capability supported by this agent. */
  capabilities: AgentCapabilities;

  /**
   * The security scheme details used for authenticating with this agent
   */
  securitySchemes?: Record<string, SecurityScheme>;

  /**
   * Security requirements for contacting the agent.
   * Array of SecurityRequirement.
   * From https://spec.openapis.org/oas/v3.2.0.html#security-requirement-object
   */
  securityRequirements?: Record<string, string[]>[];

  /**
   * The set of interaction modes that the agent supports across all skills. This can be overridden per skill. Defined as media types.
   */
  defaultInputModes: string[];

  /**
   * The media types supported as outputs from this agent.
   */
  defaultOutputModes: string[];

  /** 
   * Skills represent an ability of an agent. It is largely a descriptive concept but represents a more focused set 
   * of behaviors that the agent is likely to succeed at.
   */
  skills: AgentSkill[];

  /** JSON Web Signatures computed for this AgentCard. */
  signatures?: AgentCardSignature[];

  /** An optional URL to an icon for the agent.*/
  iconUrl?: string | null;
}

/**
 * Represents the service provider of an agent.
 *
 * @see Section 4.4.2
 */
export interface AgentProvider {

  /** A URL for the agent provider's website or relevant documentation. */
  url: string;

  /** The name of the agent provider's organization. */
  organization: string;
}

/**
 * Defines optional capabilities supported by an agent.
 *
 * @see Section 4.4.3
 */
export interface AgentCapabilities {
  /** Indicates if the agent supports streaming responses. */
  streaming?: boolean;

  /** Indicates if the agent supports sending push notifications for asynchronous task updates.*/
  pushNotifications?: boolean;

  /** A list of protocol extensions supported by the agent. */
  extensions?: AgentExtension[];

  /** Indicates if the agent supports providing an extended agent card when authenticated. */
  extendedAgentCard?: boolean;
}

/**
 * A declaration of a protocol extension supported by an agent.
 *
 * @see Section 4.4.4
 */
export interface AgentExtension {
  /** The unique URI identifying the extension. */
  uri?: string;

  /** A human-readable description of how this agent uses the extension. */
  description?: string;

  /**
   * If true, the client must understand and comply with the extension's requirements.
   */
  required?: boolean;

  /** Optional, extension-specific configuration parameters.*/
  params?: any;
}

/**
 * Represents a distinct capability or function that an agent can perform.
 *
 * @see Section 4.4.5
 */
export interface AgentSkill {
  /** A unique identifier for the agent's skill. */
  id: string;

  /** A human-readable name for the skill. */
  name: string;

  /** A detailed description of the skill. */
  description: string;

  /** A set of keywords describing the skill's capabilities. */
  tags: string[];

  /** Example prompts or scenarios that this skill can handle. */
  examples?: string[];

  /**
   * The set of supported input media types for this skill, 
   * overriding the agent's defaults.
   */
  inputModes?: string[];

  /**
   * The set of supported output media types for this skill, 
   * overriding the agent's defaults.
   */
  outputModes?: string[];

  /**
   * Security schemes necessary for this skill.
   */
  securityRequirements?: Array<SecurityScheme>;
}

/**
 * Declares a combination of a target URL, transport and protocol version for interacting with the agent. 
 * This allows agents to expose the same functionality over multiple protocol binding mechanisms.
 *
 * @see Section 4.4.6
 */
export interface AgentInterface {
  /** The URL where this interface is available. Must be a valid absolute HTTPS URL in production. */
  url: string;

  /** The protocol binding supported at this URL. This is an open form string, to be easily extended for other protocol bindings. 
   * The core ones officially supported are JSONRPC, GRPC and HTTP+JSON.
   */
  protocolBinding: string;

  /** 
   * Tenant to be set in the request when calling the agent.
   */
  tenant?: string;

  /**
   * The version of the A2A protocol this interface exposes. 
   * Use the latest supported minor version per major version
   */
  protocolVersion: string;

}

/**
 * Digital signature for an AgentCard, using JWS (RFC 7515).
 *
 * @see Section 4.4.7
 */
export interface AgentCardSignature {
  /**
   * The protected JWS header for the signature. This is always a base64url-encoded JSON object
   */
  protected: string;

  /**
   * The computed signature, base64url-encoded.
   */
  signature: string;

  /**
   * The unprotected JWS header values.
   */
  header?: any;
}

// =============================================================================
// Security Objects (Section 4.5)
// =============================================================================

/**
 * Defines a security scheme that can be used to secure an agent's endpoints. 
 * This is a discriminated union type based on the OpenAPI 3.2 Security Scheme Object.
 * A SecurityScheme MUST contain exactly one of the following: 
 * apiKeySecurityScheme, httpAuthSecurityScheme, oauth2SecurityScheme, openIdConnectSecurityScheme, mtlsSecurityScheme
 *
 * @see Section 4.5.1
 */
export type SecurityScheme =
  | {apiKeySecurityScheme: APIKeySecurityScheme}
  | {httpAuthSecurityScheme: HTTPAuthSecurityScheme}
  | {oauth2SecurityScheme: OAuth2SecurityScheme}
  | {openIdConnectSecurityScheme: OpenIdConnectSecurityScheme}
  | {mtlsSecurityScheme: MutualTlsSecurityScheme};

/**
 * Defines a security scheme using an API key.
 *
 * @see Section 4.5.2
 */
export interface APIKeySecurityScheme {

  /** An optional description for the security scheme. */
  description?: string;

  /** The location of the API key.*/
  location: "query" | "header" | "cookie";

  /** The name of the header, query parameter, or cookie. */
  name: string;

}

/**
 * Defines a security scheme using HTTP authentication.
 *
 * @see Section 4.5.3
 */
export interface HTTPAuthSecurityScheme {

  /** An optional description for the security scheme. */
  description?: string;

  /** The name of the HTTP Authentication scheme to be used in the Authorization header, as defined in RFC7235 (e.g., "Bearer"). 
   * This value should be registered in the IANA Authentication Scheme registry. 
   */
  scheme: string;

  /** A hint to the client to identify how the bearer token is formatted (e.g., "JWT"). 
   * This is primarily for documentation purposes. 
   */
  bearerFormat?: string;

}

/**
 * Defines a security scheme using OAuth 2.0.
 *
 * @see Section 4.5.4
 */
export interface OAuth2SecurityScheme {

  /** An optional description for the security scheme. */
  description?: string;

  /** OAuth 2.0 flow definitions. */
  flows: OAuthFlows;

  /**
   * URL to the oauth2 authorization server metadata RFC8414 (https://datatracker.ietf.org/doc/html/rfc8414). 
   * TLS is required.
   */
  oauth2MetadataUrl?: string;

}

/**
 * OpenID Connect security scheme.
 *
 * @see Section 4.5.5
 */
export interface OpenIdConnectSecurityScheme {

  /** An optional description for the security scheme. */
  description?: string;

  /** The OpenID Connect Discovery URL for the OIDC provider's metadata. 
   * See: https://openid.net/specs/openid-connect-discovery-1_0.html 
   */
  openIdConnectUrl: string;

}

/**
 * Mutual TLS (mTLS) security scheme.
 *
 * @see Section 4.5.6
 */
export interface MutualTlsSecurityScheme {
  /** An optional description for the security scheme. */
  description?: string;
}

/**
 * Container for OAuth 2.0 flow definitions.
 * There are two types not included here (types not defined in spec)
 * implicit: ImplicitOAuthFlow 
 * password: PasswordOAuthFlow
 * OAuthFlows MUST contain exactly one of the following: authorizationCode, clientCredentials, implicit, password, deviceCode
 *
 * @see Section 4.5.7
 */
export type OAuthFlows =   
  | { authorizationCode: AuthorizationCodeOAuthFlow }
  | { clientCredentials: ClientCredentialsOAuthFlow }
  | { deviceCode: DeviceCodeOAuthFlow };

/**
 * OAuth 2.0 Authorization Code flow.
 *
 * @see Section 4.5.8
 */
export interface AuthorizationCodeOAuthFlow {
  /** The authorization URL to be used for this flow. */
  authorizationUrl: string;

  /** The token URL to be used for this flow. */
  tokenUrl: string;

  /** The URL to be used for obtaining refresh tokens. */
  refreshUrl?: string;

  /** The available scopes for the OAuth2 security scheme. */
  scopes: Record<string, string>;

  /**
   * Indicates if PKCE (RFC 7636) is required for this flow. 
   * PKCE should always be used for public clients and is recommended for all clients.
   */
  pkceRequired?: boolean;
}

/**
 * OAuth 2.0 Client Credentials flow.
 *
 * @see Section 4.5.9
 */
export interface ClientCredentialsOAuthFlow {
  /** The token URL to be used for this flow. */
  tokenUrl: string;

  /** The URL to be used for obtaining refresh tokens. */
  refreshUrl?: string;

  /** The available scopes for the OAuth2 security scheme. */
  scopes: Record<string, string>;
}

/**
 * OAuth 2.0 Device Code flow.
 *
 * @see Section 4.5.10
 */
export interface DeviceCodeOAuthFlow {
  /** Device authorization endpoint URL. */
  deviceAuthorizationUrl: string;

  /** The token URL to be used for this flow. */
  tokenUrl: string;

  /**
   * The URL to be used for obtaining refresh tokens.
   */
  refreshUrl?: string;

  /** The available scopes for the OAuth2 security scheme. */
  scopes: Record<string, string>;
}