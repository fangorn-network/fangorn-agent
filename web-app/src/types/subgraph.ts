// types/subgraph.ts
export interface SchemaField {
  id: string;
  name: string;
  fieldType: string;
}

export interface SchemaEntry {
  id: string;
  version: string;
  spec_cid: string;
  agent_id: string | null;
  fields: SchemaField[];
}

export interface Schema {
  id: string;
  schemaId: string;
  owner: string;
  name: string;
  versions: SchemaEntry[];
}

export interface PricingResource {
  id: string;
  owner: string;
  price: string; // BigInt comes as string from GraphQL
  currency: string;
}

export interface Field {
  id: string;
  name: string | null;
  value: string | null;
  atType: string | null;
  acc: string | null;
  price: PricingResource | null;
}

export interface FileEntry {
  id: string;
  fields: Field[];
}

export interface Manifest {
  id: string;
  manifestVersion: string | null;
  schemaId: string | null;
  files: FileEntry[];
}

export interface ManifestState {
  id: string;
  owner: string;
  schema_id: string;
  schema_name: string;
  manifest_cid: string;
  manifest: Manifest | null;
  version: string;
  lastUpdated: string;
}