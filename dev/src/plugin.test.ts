import { describe, it, expect } from 'vitest';
import { transformTypeToJson } from './plugin.js';

describe('transformTypeToJson', () => {
  it('should handle basic types', () => {
    expect(transformTypeToJson('string')).toBe('string');
    expect(transformTypeToJson('number')).toBe('number');
    expect(transformTypeToJson('boolean')).toBe('boolean');
  });

  it('should handle simple object types', () => {
    const result = transformTypeToJson('{ name: string }');
    expect(result).toEqual({ name: 'string' });
  });

  it('should handle multiple properties', () => {
    const result = transformTypeToJson('{ name: string; age: number }');
    expect(result).toEqual({
      name: 'string',
      age: 'number'
    });
  });

  it('should handle nested object types', () => {
    const result = transformTypeToJson('{ user: { name: string; age: number } }');
    expect(result).toEqual({
      user: {
        name: 'string',
        age: 'number'
      }
    });
  });

  it('should handle deeply nested object types', () => {
    const result = transformTypeToJson(`{
      user: {
        profile: {
          name: string;
          details: {
            age: number;
          }
        }
      }
    }`);
    expect(result).toEqual({
      user: {
        profile: {
          name: 'string',
          details: {
            age: 'number'
          }
        }
      }
    });
  });

  it('should handle whitespace variations', () => {
    const inputs = [
      '{ name:string }',
      '{name: string}',
      '{   name   :   string   }',
      '{ name : string }'
    ];
    
    inputs.forEach(input => {
      expect(transformTypeToJson(input)).toEqual({ name: 'string' });
    });
  });

  it('should preserve original type for non-object types', () => {
    const inputs = [
      'string[]',
      'Array<string>',
      'Map<string, number>',
      'Promise<void>',
      'Record<string, any>'
    ];

    inputs.forEach(input => {
      expect(transformTypeToJson(input)).toBe(input);
    });
  });

  it('should handle empty objects', () => {
    expect(transformTypeToJson('{}')).toEqual({});
  });

  it('should handle null/undefined type annotations', () => {
    const result = transformTypeToJson('{ nullable: null; optional: undefined }');
    expect(result).toEqual({
      nullable: 'null',
      optional: 'undefined'
    });
  });

  it('should handle union types by preserving them as strings', () => {
    const result = transformTypeToJson('{ status: "active" | "inactive" }');
    expect(result).toEqual({
      status: '"active" | "inactive"'
    });
  });

  it('should handle intersection types by preserving them as strings', () => {
    const result = transformTypeToJson('{ props: BaseProps & ExtraProps }');
    expect(result).toEqual({
      props: 'BaseProps & ExtraProps'
    });
  });

  it('should handle malformed input gracefully', () => {
    const malformedInputs = [
      '{',
      '}',
      '{ name: }',
      '{ : string }',
      '{ name: string',
      'name: string }',
    ];

    malformedInputs.forEach(input => {
      expect(() => transformTypeToJson(input)).not.toThrow();
    });
  });

  it('should handle object types with semicolons', () => {
    const result = transformTypeToJson('{ name: string; age: number; active: boolean; }');
    expect(result).toEqual({
      name: 'string',
      age: 'number',
      active: 'boolean'
    });
  });

  it('should handle object types with commas', () => {
    const result = transformTypeToJson('{ name: string, age: number, active: boolean }');
    expect(result).toEqual({
      name: 'string',
      age: 'number',
      active: 'boolean'
    });
  });
});