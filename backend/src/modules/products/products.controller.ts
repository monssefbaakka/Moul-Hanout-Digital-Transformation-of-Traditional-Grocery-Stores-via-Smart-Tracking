import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProductDto, GenerateImageDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly configService: ConfigService,
  ) {}

  @Roles(Role.OWNER)
  @Get('manage')
  @ApiOkResponse({
    description: 'Returns all products for the authenticated shop owner.',
  })
  findAllForOwner(@CurrentUser('shopId') shopId: string) {
    return this.productsService.findAllByShop(shopId);
  }

  @Get()
  @ApiOkResponse({
    description: 'Returns active products for the authenticated shop.',
  })
  findAll(@CurrentUser('shopId') shopId: string) {
    return this.productsService.findActiveByShop(shopId);
  }

  @Roles(Role.OWNER)
  @Post()
  @ApiCreatedResponse({
    description: 'Creates a product for the authenticated shop.',
  })
  @ApiConflictResponse({
    description: 'RG07 duplicate barcode within the shop.',
  })
  @ApiUnprocessableEntityResponse({ description: 'RG08 invalid pricing rule.' })
  create(@CurrentUser('shopId') shopId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(shopId, dto);
  }

  @Roles(Role.OWNER)
  @Post('generate-image')
  @ApiCreatedResponse({ description: 'Generates a product image via Gemini and returns its URL.' })
  async generateImage(@Body() dto: GenerateImageDto, @Req() req: any) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured');
    }

    const prompt =
      `Professional product photography of "${dto.name}", isolated on pure white background, ` +
      `studio lighting, sharp focus, photorealistic, high resolution, no shadows, product centered`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      throw new BadRequestException(
        (err as any)?.error?.message ?? 'Gemini image generation failed',
      );
    }

    const result = (await geminiResponse.json()) as {
      predictions: { bytesBase64Encoded: string; mimeType: string }[];
    };

    const prediction = result.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
      throw new BadRequestException('No image returned from Gemini');
    }

    const ext = prediction.mimeType === 'image/png' ? '.png' : '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const dir = './uploads/products';
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${filename}`, Buffer.from(prediction.bytesBase64Encoded, 'base64'));

    const protocol: string = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host: string = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:4000';
    return { url: `${protocol}://${host}/uploads/products/${filename}` };
  }

  @Roles(Role.OWNER)
  @Post('upload-image')
  @ApiCreatedResponse({ description: 'Uploads a product image and returns its URL.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = './uploads/products';
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const protocol: string = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host: string = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:4000';
    return { url: `${protocol}://${host}/uploads/products/${file.filename}` };
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  @ApiOkResponse({
    description: 'Updates a product for the authenticated shop.',
  })
  @ApiConflictResponse({
    description: 'RG07 duplicate barcode within the shop.',
  })
  @ApiUnprocessableEntityResponse({ description: 'RG08 invalid pricing rule.' })
  update(
    @CurrentUser('shopId') shopId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(shopId, productId, dto);
  }
}
