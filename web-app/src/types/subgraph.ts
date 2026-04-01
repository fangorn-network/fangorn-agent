// types/subgraph.ts

export interface PricingResource {
  id: string;
  owner: string;
  price: string;
  currency: string;
}

export interface Field {
  id: string;
  name: string;
  value: string;
  atType: string;
  acc: string;
  manifestState: { id: string };
  fileEntry: { id: string } | null;
  price: PricingResource | null;
}

export interface FileEntry {
  id: string;
  tag: string | null;
  manifest: { id: string };
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
  schema: { id: string };
  schema_name: string;
  manifest_cid: string;
  manifest: Manifest | null;
  version: string;
  lastUpdated: string;
}

export interface SchemaField {
  id: string;
  name: string;
  fieldType: string;
}

export interface SchemaEntries {
  id: string;
  version: string;
  spec_cid: string;
  agent_id: string | null;
  fields: SchemaField[];
}

export interface Schema {
  id: string;
  name: string;
  schemaId: string;
  owner: string;
  versions: SchemaEntries[];
}