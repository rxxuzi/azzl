export type ModelType = 'durian' | 'guava';

export interface Model {
  id: ModelType;
  label: string;
  description: string;
}

export const models: Model[] = [
  {
    id: 'durian',
    label: 'Durian',
    description: 'General-purpose,balanced model'
  },
  {
    id: 'guava',
    label: 'Guava',
    description: 'Optimized for coding'
  }
];

export function getModelValue(modelId: ModelType): string {
  return `azzl:${modelId}`;
}