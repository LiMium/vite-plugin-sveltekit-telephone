export async function makeRpcCall(filePath: string, functionName: string, args: any[]) {
  const response = await fetch('/_telephone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: filePath, functionName, args }),
  });

  const data = await response.json();
  // console.log(data)

  if (!response.ok) {
    const errorMessage = data?.error?.message || `RPC call to '${functionName}' failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  if (data.hasOwnProperty('error') && data.error !== null && data.error !== undefined) {
    const errorMessage = data?.error?.message || `RPC call to '${functionName}' returned an error structure unexpectedly`;
    throw new Error(errorMessage);
  }
  return data.result;
}