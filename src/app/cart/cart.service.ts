import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(
    userId: number,
    data: { productId: number; quantity: number; categoryId?: number }
  ) {
    let total = 0,
      subtotal = 0,
      quantity = 0;

    let cart = await this.prisma.cart.findFirst({
      where: {
        userId: +userId,
      },
    });
    //check if no cart for user and create it if true---
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          user: {
            connect: {
              id: +userId,
            },
          },
        },
      });
    }

    total += +cart.total;
    subtotal += +cart.subtotal;
    quantity += +cart.quantity;

    const product = await this.prisma.product.findUnique({
      where: {
        id: +data.productId,
      },
      select: {
        id: true,
        available: true,
        price: true,
        categories: data.categoryId
          ? {
              where: {
                id: +data.categoryId,
              },
              select: {
                id: true,
                price: true,
                quantity: true,
              },
            }
          : undefined,
      },
    });

    if (!product || !product.available) {
      throw new BadRequestException("هذا المنتج غير متاح");
    }

    if (data.categoryId) {
      subtotal += +product.categories[0].price * +data.quantity;

      total += +product.categories[0].price * +data.quantity;
    } else {
      subtotal += +product.price * +data.quantity;

      total += +product.price * +data.quantity;
    }

    quantity += +data.quantity;

    await this.prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        total: total,
        subtotal,
        quantity,
      },
    });

    const cartProduct = await this.prisma.cartProduct.create({
      data: {
        product: {
          connect: {
            id: +product.id,
          },
        },
        Cart: {
          connect: {
            id: cart.id,
          },
        },
        quantity: +data.quantity,
        subtotal: data.categoryId
          ? +product.categories[0].price
          : +product.price,
        total: data.categoryId
          ? +product.categories[0].price * +data.quantity
          : +product.price * +data.quantity,
        category: data.categoryId
          ? {
              connect: {
                id: +data.categoryId,
              },
            }
          : undefined,
      },
    });

    return cartProduct;
  }

  async getUserCart(userId: number) {
    let cart = await this.prisma.cart.findFirst({
      where: {
        userId: +userId,
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        quantity: true,
        products: {
          where: {
            ordered: false,
          },
          select: {
            id: true,
            total: true,
            quantity: true,
            subtotal: true,
            product: {
              select: {
                id: true,
                image: true,
                name: true,
                price: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          user: {
            connect: {
              id: +userId,
            },
          },
        },
        select: {
          id: true,
          total: true,
          subtotal: true,
          quantity: true,
          products: {
            select: {
              id: true,
              total: true,
              quantity: true,
              subtotal: true,
              product: {
                select: {
                  id: true,
                  image: true,
                  name: true,
                  price: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  async deleteCartProduct(cartProductId: number) {
    const cartProduct = await this.prisma.cartProduct.findUnique({
      where: {
        id: +cartProductId,
      },
      select: {
        total: true,
        quantity: true,
        Cart: {
          select: {
            id: true,
            total: true,
            subtotal: true,
            quantity: true,
            products: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.cart.update({
      where: {
        id: cartProduct.Cart.id,
      },
      data: {
        total:
          cartProduct.Cart.products.length === 1
            ? 0
            : cartProduct.Cart.total - cartProduct.total,
        subtotal: cartProduct.Cart.subtotal - cartProduct.total,
        quantity: cartProduct.Cart.quantity - cartProduct.quantity,
      },
    });

    await this.prisma.cartProduct.delete({
      where: {
        id: +cartProductId,
      },
    });
    return { message: "success" };
  }

  async updateCartProduct(cartProductId: number, data: { quantity: number }) {
    let total = 0,
      subtotal = 0,
      quantity = 0;

    if (+data.quantity === 0) {
      const result = await this.deleteCartProduct(cartProductId);
      return result;
    }

    const cartProduct = await this.prisma.cartProduct.findUnique({
      where: {
        id: +cartProductId,
      },
      select: {
        id: true,
        subtotal: true,
        total: true,
        quantity: true,
        category: {
          select: {
            id: true,
            price: true,
          },
        },
        product: {
          select: {
            id: true,
            price: true,
          },
        },
        Cart: {
          select: {
            id: true,
            total: true,
            subtotal: true,
            quantity: true,
            products: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    total = cartProduct.Cart.total - cartProduct.total;
    subtotal = cartProduct.Cart.subtotal - cartProduct.total;
    quantity = cartProduct.Cart.quantity - cartProduct.quantity;

    if (cartProduct.category) {
      subtotal += +cartProduct.category.price * +data.quantity;

      total += +cartProduct.category.price * +data.quantity;
    } else {
      subtotal += +cartProduct.product.price * +data.quantity;

      total += +cartProduct.product.price * +data.quantity;
    }

    quantity += +data.quantity;

    await this.prisma.cart.update({
      where: {
        id: cartProduct.Cart.id,
      },
      data: {
        total: total,
        subtotal,
        quantity,
      },
    });

    const updatedCartProduct = await this.prisma.cartProduct.update({
      where: {
        id: +cartProductId,
      },
      data: {
        quantity: +data.quantity,
        subtotal: cartProduct.category
          ? +cartProduct.category.price
          : +cartProduct.product.price,
        total: cartProduct.category
          ? +cartProduct.category.price * +data.quantity
          : +cartProduct.product.price * +data.quantity,
      },
    });

    return updatedCartProduct;
  }
}
