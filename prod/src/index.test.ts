import { describe, it, expect } from 'vitest';
import { validateArgs, TelephoneValidationError } from './index.js';

describe('validateArgs', () => {
    const filePath = 'test.ts';
    const functionName = 'testFunc';

    it('should not throw error for valid arguments', () => {
        const params = [{ name: 'a', type: 'string', optional: false }];
        const args = ['hello'];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    it('should not throw error for user defined types', () => {
        const params = [{ name: 'a', type: 'UserDefinedType', optional: false }];
        const args = ['hello'];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    it('should not throw error for nullable types', () => {
        const params = [{ name: 'a', type: 'string | null', optional: false }];
        const args = [null];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    it('should throw error for missing required argument', () => {
        const params = [{ name: 'a', type: 'string', optional: false }];
        const args: any[] = [];
        expect(() => validateArgs(filePath, functionName, args, params)).toThrowError(TelephoneValidationError);
    });

    it('should not throw error for missing optional argument', () => {
        const params = [{ name: 'a', type: 'string', optional: true }];
        const args: any[] = [];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    it('should throw error for wrong type', () => {
        const params = [{ name: 'a', type: 'string', optional: false }];
        const args = [123];
        expect(() => validateArgs(filePath, functionName, args, params)).toThrowError(TelephoneValidationError);
    });

    it('should not throw error for valid array type', () => {
        const params = [{ name: 'a', type: 'string[]', optional: false }];
        const args = [['hello', 'world']];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    it('should throw error for invalid array type', () => {
        const params = [{ name: 'a', type: 'string[]', optional: false }];
        const args = [['hello', 123]];
        expect(() => validateArgs(filePath, functionName, args, params)).toThrowError(TelephoneValidationError);
    });

    it('should not throw error for valid object type', () => {
        const params = [{ name: 'a', type: {"key": "string"}, optional: false }];
        const args = [{ key: 'value' }];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    /*
    it('should throw error for invalid object type', () => {
        const params = [{ name: 'a', type: 'object', optional: false }];
        const args = ['not an object'];
        expect(() => validateArgs(filePath, functionName, args, params)).toThrowError(TelephoneValidationError);
    });
    */

    it('should handle nested arrays correctly', () => {
        const params = [{ name: 'a', type: 'string[][]', optional: false }];
        const args = [[['a'], ['b']]];
        expect(() => validateArgs(filePath, functionName, args, params)).not.toThrow();
    });

    it('should throw error for invalid nested array', () => {
        const params = [{ name: 'a', type: 'string[][]', optional: false }];
        const args = [[['a'], [1]]];
        expect(() => validateArgs(filePath, functionName, args, params)).toThrowError(TelephoneValidationError);
    });
});
