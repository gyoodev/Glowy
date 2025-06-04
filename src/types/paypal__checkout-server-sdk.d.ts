
// src/types/paypal__checkout-server-sdk.d.ts

/**
 * Minimal type declaration for the deprecated '@paypal/checkout-server-sdk' package.
 * This is to satisfy TypeScript during the build process as official types are not available.
 * It's recommended to migrate to the newer '@paypal/paypal-server-sdk' package.
 */
declare module '@paypal/checkout-server-sdk' {
  // You can expand these types if needed, but `any` will resolve the build error.
  // For a quick fix, just declaring the module is often enough.
  export namespace core {
    class PayPalHttpClient {
      constructor(environment: any);
      execute(request: any): Promise<any>;
    }
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }
  export namespace orders {
    class OrdersCreateRequest {
      constructor();
      prefer(prefer: string): void;
      requestBody(orderRequest: any): void; // Define more specific type if known
    }
    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(captureRequest: any): void; // Define more specific type if known
    }
    class OrdersGetRequest {
      constructor(orderId: string);
    }
  }
  // Add other namespaces and classes as needed, or leave as a simple module declaration:
  // declare module '@paypal/checkout-server-sdk';
}
