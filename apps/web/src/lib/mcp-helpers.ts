export async function withMcpErrorHandling<T>(
  operation: () => Promise<T>,
  fallbackMessage: string = "Failed to communicate with the email server."
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: any) {
    console.error("MCP Tool Call Failed:", error);
    return { 
      success: false, 
      error: error.message || fallbackMessage 
    };
  }
}
