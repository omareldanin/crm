import { Prisma } from "@prisma/client";

export const orderSelect = {
  id: true,
  total: true,
  paidAmount: true,
  notes: true,
  status: true,
  quantity: true,
  delivery: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
    },
  },
  vendor: {
    select: {
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
    },
  },
  products: {
    select: {
      quantity: true,
      category: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

export const orderSelectReform = (
  order: Prisma.OrderGetPayload<{
    select: typeof orderSelect;
  }> | null
) => {
  if (!order) {
    throw new Error("لم يتم العثور على الطلب");
  }
  return {
    ...order,
    vendor: {
      id: order.vendor.user.id,
      name: order.vendor.user.name,
      avatar: order.vendor.user.avatar,
      address: order.vendor.address,
      phone: order.vendor.user.phone,
    },
    delivery: order.delivery
      ? {
          id: order.delivery?.user.id,
          name: order.delivery?.user.name,
          avatar: order.delivery?.user.avatar,
          phone: order.delivery?.user.phone,
        }
      : null,
  };
};
