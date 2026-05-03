import type { PaymentConfig } from "@/types";
import { settingService } from "@/services/setting-service";
import type { PaymentProviderInterface } from "./types";
import { stripeProvider } from "./stripe-provider";
// import { woocommerceProvider } from "./woocommerce-provider";

const providers: Record<string, PaymentProviderInterface> = {
  stripe: stripeProvider,
  // woocommerce: woocommerceProvider,
};

export function getPaymentProvider(name: string): PaymentProviderInterface {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${name}`);
  }
  return provider;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  return settingService.getPaymentConfig();
}
