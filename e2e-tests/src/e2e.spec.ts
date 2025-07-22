import axios, { AxiosResponse } from 'axios';
import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:5173'; // Default Vite port
const RPC_ENDPOINT = `${BASE_URL}/_telephone`;
const TEST_FILE_PATH = 'src/lib/tele/e2e.telephone.ts';

describe('E2E RPC Tests', () => {
  const callRpc = async (functionName: string, args: any[]) => {
    try {
      return await axios.post(RPC_ENDPOINT, {
        filePath: TEST_FILE_PATH,
        functionName,
        args,
      }).catch((error) => {;
        return error.response;
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error; // Re-throw to handle in the test
      } else {
        throw new Error('Unexpected error during RPC call');
      }
    }
  };

  it('should call hello function and get a greeting', async () => {
    const response = await callRpc('hello', ['Tester']);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Hello, Tester!');
  });

  it('should call add function and get the sum', async () => {
    const response = await callRpc('add', [5, 7]);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe(12);
  });

  it('should call functionWithNoArgs and get the correct string', async () => {
    const response = await callRpc('functionWithNoArgs', []);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('No arguments here!');
  });

  it('should call functionWithOptionalArg with argument and get personalized greeting', async () => {
    const response = await callRpc('functionWithOptionalArg', ['User']);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Hello, User!');
  });

  it('should call functionWithOptionalArg without argument and get default greeting', async () => {
    const response = await callRpc('functionWithOptionalArg', []);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Hello, world!');
  });

  it('should call functionWithOptionalArg with null arg and get an error', async () => {
    const response = await callRpc('functionWithOptionalArg', [null]);
    expect(response.status).toBe(500);
    expect(response.data.message).toBe('Error:Unexpected type of name:null');
  });

  it('should handle errors from the RPC function', async () => {
    try {
      await callRpc('errorFunction', []);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      const response: AxiosResponse = error.response;
      expect(response.status).toBeGreaterThanOrEqual(400); // Or specifically 500 if that's what prod returns
      expect(response.data).toBeDefined();
      expect(response.data.message).toMatch(/^Error:This is a test error$/);
    }
  });

  it('should handle calling a non-existent function', async () => {
    try {
      await callRpc('nonExistentFunction', []);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      const response: AxiosResponse = error.response;
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toBeDefined();
      console.log("data", response.data);
      expect(response.data.message).toMatch(/^Error:.*not found or is not a function.$/)
    }
  });

  it('should handle incorrect argument types for "hello" function', async () => {
    try {
      // Sending a number instead of a string for the 'name' argument
      await callRpc('hello', [123]);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      const response: AxiosResponse = error.response;
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toBeDefined();
      console.log("data", response.data);
      expect(response.data.message).toMatch(/^Error:.*Argument 'name' expected type 'string' but got 'number'.$/)
    }
  });

  it('should handle incorrect argument types for "add" function', async () => {
    try {
      // Sending a string for the second argument
      await callRpc('add', [5, 'world']);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      const response: AxiosResponse = error.response;
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toBeDefined();
      console.log("data", response.data);
      expect(response.data.message).toMatch(/^Error:.*Argument 'b' expected type 'number' but got 'string'.$/)
    }
  });

   it('should handle missing arguments for "add" function', async () => {
    try {
      await callRpc('add', [5]);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      const response: AxiosResponse = error.response;
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toBeDefined();
      console.log("data", response.data);
      expect(response.data.message).toMatch(/^Error:.* Expected 2 arguments, but got 1./)
    }
  });

  it('should handle object arguments', async () => {
    const response = await callRpc('processObject', [{ name: 'John Doe', age: 30 }]);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Received object for John Doe who is 30 years old.');
  });

  it('should handle array arguments', async () => {
    const response = await callRpc('processArray', [['apple', 'banana', 'cherry']]);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Received array with items: apple, banana, cherry.');
  });

  it('should handle mixed object and array arguments', async () => {
    const response = await callRpc('processMixed', [{ user: { name: 'Jane Doe' }, roles: ['admin', 'editor'] }]);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('User Jane Doe has roles: admin, editor.');
  });

  it('should handle invalid object structure', async () => {
    const response = await callRpc('processObject', [{ wrongField: 'John Doe' }]);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.data.message).toMatch(/^Error:.* Missing property 'name' in argument.*$/);
  });

  it('should handle non-object argument for object function', async () => {
    const response = await callRpc('processObject', ["not an object"]);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.data.message).toMatch(/^Error:/);
  });

  it('should handle non-array argument for array function', async () => {
    const response = await callRpc('processArray', [{ notAnArray: true }]);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.data.message).toMatch(/^Error:/);
  });

  it('should handle invalid mixed object structure', async () => {
    const response = await callRpc('processMixed', [{ user: 'not an object', roles: 'not an array' }]);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.data.message).toMatch(/^Error:/);
  });
});
