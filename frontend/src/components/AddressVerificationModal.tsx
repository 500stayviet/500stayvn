'use client';

import { useAddressVerificationModalState } from '@/components/address-verification/useAddressVerificationModalState';
import { AddressVerificationModalView } from '@/components/address-verification/AddressVerificationModalView';
import type { AddressVerificationModalProps } from '@/components/address-verification/types';

export type { AddressVerificationModalProps } from '@/components/address-verification/types';

export default function AddressVerificationModal(props: AddressVerificationModalProps) {
  const vm = useAddressVerificationModalState(props);
  return <AddressVerificationModalView {...vm} />;
}
