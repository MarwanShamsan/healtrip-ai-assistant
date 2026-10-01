export type ToolErrorCode =
  | "INVALID_TOOL_ARGUMENTS"
  | "PROVIDER_SEARCH_UNAVAILABLE"
  | "PROVIDER_NOT_FOUND";

export type ToolError = {
  code: ToolErrorCode;
  message: string;
};

export type ToolResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ToolError;
    };