export async function handler(event) {
  console.log('request:', JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    body: `Hello from CDK v2 and AWS CodePipeline! You've hit ${event.path}\n`,
  };
}
