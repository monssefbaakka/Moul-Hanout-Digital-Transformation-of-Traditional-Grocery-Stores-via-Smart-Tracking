import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(shopId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        shopRoles: {
          some: {
            shopId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        shopRoles: {
          where: {
            shopId,
          },
          select: { role: true, shopId: true },
        },
        isActive: true,
        createdAt: true,
      },
    });

    return users.map((user) => this.toAdminUser(user));
  }

  async deactivate(shopId: string, currentUserId: string, userId: string) {
    if (currentUserId === userId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        shopRoles: {
          some: {
            shopId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        shopRoles: { select: { role: true } },
        isActive: true,
        createdAt: true,
      },
    });

    return this.toAdminUser(updatedUser);
  }

  async reactivate(shopId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        shopRoles: {
          some: {
            shopId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        shopRoles: { select: { role: true } },
        isActive: true,
        createdAt: true,
      },
    });

    return this.toAdminUser(updatedUser);
  }

  private toAdminUser(user: {
    id: string;
    email: string;
    name: string;
    shopRoles: { role: string }[];
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.shopRoles[0]?.role ?? Role.CASHIER,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
