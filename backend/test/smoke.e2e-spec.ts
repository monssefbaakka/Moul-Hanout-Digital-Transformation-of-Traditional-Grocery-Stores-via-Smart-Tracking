import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Smoke', () => {
  it('should load AppModule', async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();
    expect(moduleFixture).toBeDefined();
  });
});
