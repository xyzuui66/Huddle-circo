// Quick TypeScript check
import { ReactNode } from 'react';

interface GiftModalProps {
  streamId: string;
  hostWalletInfo?: {
    bank_name?: string;
    bank_account?: string;
    account_holder?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const testGift: GiftModalProps = {
  streamId: "test",
  isOpen: true,
  onClose: () => {},
};

console.log("✅ Types OK");
