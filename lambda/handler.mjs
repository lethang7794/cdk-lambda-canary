export async function handler(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    body: `Hello from CDK! You've hit ${event.path}\n`,
  };
}
