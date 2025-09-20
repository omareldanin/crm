import { Prisma } from "@prisma/client";

export const transactionSelect = {
  id: true,
  paidAmount: true,
  confirmed: true,
  createdAt: true,
  vendor: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  delivery: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.TransactionSelect;

export const transactionSelectReform = (
  transaction: Prisma.TransactionGetPayload<{
    select: typeof transactionSelect;
  }> | null
) => {
  if (!transaction) {
    throw new Error("لم يتم العثور على الطلب");
  }
  return {
    ...transaction,
    vendor: {
      id: transaction.vendor.user.id,
      name: transaction.vendor.user.name,
    },
    delivery: transaction.delivery
      ? {
          id: transaction.delivery?.user.id,
          name: transaction.delivery?.user.name,
        }
      : null,
  };
};
