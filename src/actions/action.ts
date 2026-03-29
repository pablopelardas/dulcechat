export interface Action {
  name: string;
  description: string;
  execute(params: Record<string, unknown>, authToken: string): Promise<string>;
}
