declare module '@modelcontextprotocol/sdk' {
  // Common exports used by this project. Provide "any" to simplify typing.
  export const Server: any;
  export const StdioServerTransport: any;
  export const createStdioTransport: any;
  export const Tool: any;
  export const defineMcpServer: any;
  export const defineMcpTool: any;
  export const McpServer: any;
  export const types: any;
  export const ListToolsRequestSchema: any;
  export const CallToolRequestSchema: any;
  const _default: any;
  export default _default;
}

declare module '@modelcontextprotocol/sdk/*' {
  const sdk: any;
  export = sdk;
}
