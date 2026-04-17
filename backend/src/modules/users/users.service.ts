import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        shopRoles: { select: { role: true, shopId: true } },
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deactivate(shopId: string, userId: string) {
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

    return this.prisma.user.update({
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
        isActive: true,
      },
    });
  }
}
